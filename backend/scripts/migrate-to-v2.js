#!/usr/bin/env node
/**
 * 🔄 SCRIPT DE MIGRATION VERS SCHEMA V2
 * =====================================
 * 
 * Migre les questions legacy vers le nouveau système avec UIDs immuables
 * et versioning. Génère les identifiants uniques et restructure les données.
 */

const mongoose = require('mongoose');
const { ulid } = require('ulid');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Charger la configuration
require('dotenv').config();

// Modèles
const QuestionV2 = require('../models/QuestionV2');

class MigrationV2 {
    constructor() {
        this.stats = {
            total: 0,
            migrated: 0,
            errors: 0,
            collisions: [],
            reports: []
        };
    }

    async connect() {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('✅ Connecté à MongoDB');
        } catch (error) {
            console.error('❌ Erreur de connexion MongoDB:', error);
            process.exit(1);
        }
    }

    async disconnect() {
        await mongoose.disconnect();
        console.log('📌 Connexion MongoDB fermée');
    }

    /**
     * Audit des collisions dans les données existantes
     */
    async auditCollisions() {
        console.log('🔍 === AUDIT DES COLLISIONS ===');
        
        try {
            // Modèle temporaire pour les anciennes questions
            const OldQuestion = mongoose.model('OldQuestion', new mongoose.Schema({}, { strict: false, collection: 'questions' }));
            
            const questions = await OldQuestion.find({}).lean();
            this.stats.total = questions.length;
            
            console.log(`📊 ${questions.length} questions à analyser`);

            // Grouper par contenu pour détecter les doublons
            const contentGroups = {};
            const bundleHashGroups = {};
            
            for (const q of questions) {
                // Grouper par contenu similaire
                const contentKey = this.normalizeContent(q.content);
                if (!contentGroups[contentKey]) contentGroups[contentKey] = [];
                contentGroups[contentKey].push(q);
                
                // Calculer bundle hash pour détecter collisions
                const bundleHash = this.calculateBundleHash(q);
                if (!bundleHashGroups[bundleHash]) bundleHashGroups[bundleHash] = [];
                bundleHashGroups[bundleHash].push(q);
            }

            // Détecter les collisions
            let collisionCount = 0;
            for (const [hash, questions] of Object.entries(bundleHashGroups)) {
                if (questions.length > 1) {
                    collisionCount++;
                    this.stats.collisions.push({
                        bundleHash: hash,
                        count: questions.length,
                        questions: questions.map(q => ({
                            _id: q._id,
                            questionIndex: q.questionIndex,
                            content: q.content.substring(0, 50) + '...'
                        }))
                    });
                }
            }

            console.log(`⚠️  ${collisionCount} collisions de bundle hash détectées`);
            console.log(`📝 ${Object.keys(contentGroups).length} contenus uniques`);

            return {
                totalQuestions: questions.length,
                uniqueContent: Object.keys(contentGroups).length,
                collisions: collisionCount,
                details: this.stats.collisions
            };

        } catch (error) {
            console.error('❌ Erreur lors de l\'audit:', error);
            throw error;
        }
    }

    /**
     * Générer des QIDs pour toutes les questions legacy
     */
    async generateQids() {
        console.log('🆔 === GÉNÉRATION DES QIDs ===');
        
        const OldQuestion = mongoose.model('OldQuestionForQid', new mongoose.Schema({}, { strict: false, collection: 'questions' }));
        const questions = await OldQuestion.find({}).lean();
        
        const qidMapping = {};
        const usedQids = new Set();
        
        for (const question of questions) {
            let qid;
            do {
                qid = ulid();
            } while (usedQids.has(qid));
            
            usedQids.add(qid);
            qidMapping[question._id.toString()] = qid;
        }
        
        console.log(`✅ ${Object.keys(qidMapping).length} QIDs générés`);
        
        // Sauvegarder le mapping
        await this.saveQidMapping(qidMapping);
        
        return qidMapping;
    }

    /**
     * Migrer les questions vers le nouveau schéma
     */
    async migrateQuestions(qidMapping = null) {
        console.log('🔄 === MIGRATION DES QUESTIONS ===');
        
        if (!qidMapping) {
            qidMapping = await this.loadQidMapping();
        }
        
        const OldQuestion = mongoose.model('OldQuestionForMigration', new mongoose.Schema({}, { strict: false, collection: 'questions' }));
        const questions = await OldQuestion.find({}).lean();
        
        const migrationBatch = [];
        const errors = [];
        
        for (const oldQ of questions) {
            try {
                const qid = qidMapping[oldQ._id.toString()];
                if (!qid) {
                    throw new Error(`QID manquant pour question ${oldQ._id}`);
                }
                
                const newQuestion = this.transformToV2(oldQ, qid);
                migrationBatch.push(newQuestion);
                
                // Traiter par batch de 50
                if (migrationBatch.length >= 50) {
                    await this.processBatch(migrationBatch);
                    migrationBatch.length = 0;
                }
                
            } catch (error) {
                errors.push({
                    questionId: oldQ._id,
                    questionIndex: oldQ.questionIndex,
                    error: error.message
                });
                this.stats.errors++;
            }
        }
        
        // Traiter le dernier batch
        if (migrationBatch.length > 0) {
            await this.processBatch(migrationBatch);
        }
        
        console.log(`✅ ${this.stats.migrated} questions migrées`);
        console.log(`❌ ${this.stats.errors} erreurs`);
        
        if (errors.length > 0) {
            await this.saveErrorReport(errors);
        }
        
        return {
            migrated: this.stats.migrated,
            errors: this.stats.errors,
            errorDetails: errors
        };
    }

    /**
     * Transformer une question legacy vers le format V2
     */
    transformToV2(oldQuestion, qid) {
        // Détecter l'alphabet automatiquement
        const alphabet = this.detectAlphabet(oldQuestion);
        
        // Transformer les options
        const options = this.transformOptions(oldQuestion);
        
        // Générer les assets
        const assets = this.generateAssets(oldQuestion, qid);
        
        return {
            qid,
            version: 1,
            state: 'published',
            publishedAt: oldQuestion.createdAt || new Date(),
            
            type: oldQuestion.type || 'raven',
            series: oldQuestion.series,
            alphabet,
            difficulty: oldQuestion.difficulty || 1,
            
            content: oldQuestion.content,
            stimulus: oldQuestion.stimulus,
            options,
            correctAnswer: oldQuestion.correctAnswer || 0,
            
            category: oldQuestion.category || 'spatial',
            timeLimit: oldQuestion.timeLimit || 60,
            
            assets,
            visualPattern: oldQuestion.visualPattern,
            explanation: oldQuestion.explanation,
            
            questionIndex: oldQuestion.questionIndex, // Pour référence legacy
            
            createdBy: 'migration-script',
            stats: {
                totalAttempts: 0,
                correctAttempts: 0,
                averageTime: 0
            }
        };
    }

    /**
     * Détecter l'alphabet d'une question
     */
    detectAlphabet(question) {
        const content = (question.content || '') + ' ' + (question.stimulus || '');
        
        if (/[◼◻▦▪⬛⬜]/.test(content)) return 'shape';
        if (/[◐◑◒◓]/.test(content)) return 'semicircle';
        if (/[↑↓←→⬆⬇⬅➡]/.test(content)) return 'arrow';
        if (/[●○⚫⚪]/.test(content)) return 'dot';
        if (/\b[0-9]+\b/.test(content)) return 'number';
        if (/\b[A-Z]\b/.test(content)) return 'letter';
        
        return 'shape'; // Par défaut
    }

    /**
     * Transformer les options vers le nouveau format
     */
    transformOptions(question) {
        const options = question.options || [];
        const transformed = [];
        
        for (let i = 0; i < Math.max(4, options.length); i++) {
            const option = options[i];
            const key = String.fromCharCode(65 + i); // A, B, C, D...
            
            if (option) {
                transformed.push({
                    key,
                    text: typeof option === 'string' ? option : (option.text || ''),
                    alt: option.alt || `Option ${key}`,
                    isCorrect: i === question.correctAnswer,
                    metadata: option.rotation ? { rotation: option.rotation } : undefined
                });
            } else {
                // Option manquante - ajouter placeholder
                transformed.push({
                    key,
                    text: `Option ${key}`,
                    alt: `Option ${key}`,
                    isCorrect: false
                });
            }
        }
        
        return transformed;
    }

    /**
     * Générer les assets pour une question
     */
    generateAssets(question, qid) {
        const assets = [];
        
        // Asset stimulus si présent
        if (question.stimulus) {
            assets.push({
                type: 'stimulus',
                slot: 'stimulus',
                path: `questions/${qid}/1/stimulus.svg`,
                hash: crypto.createHash('sha256').update(question.stimulus).digest('hex'),
                locale: 'fr',
                mimeType: 'image/svg+xml'
            });
        }
        
        // Assets pour les options avec images
        if (question.options) {
            question.options.forEach((option, idx) => {
                if (option && typeof option === 'object' && option.text) {
                    const key = String.fromCharCode(65 + idx);
                    assets.push({
                        type: 'option',
                        slot: `option${key}`,
                        path: `questions/${qid}/1/options/${key}.svg`,
                        hash: crypto.createHash('sha256').update(option.text).digest('hex'),
                        locale: 'fr',
                        mimeType: 'image/svg+xml'
                    });
                }
            });
        }
        
        // Asset visual pattern si présent
        if (question.visualPattern) {
            assets.push({
                type: 'visual',
                slot: 'visual',
                path: `questions/${qid}/1/visual.svg`,
                hash: crypto.createHash('sha256').update(question.visualPattern).digest('hex'),
                locale: 'fr',
                mimeType: 'image/svg+xml'
            });
        }
        
        return assets;
    }

    /**
     * Calculer le bundle hash d'une question legacy
     */
    calculateBundleHash(question) {
        const hashContent = [
            question.content || '',
            question.stimulus || '',
            JSON.stringify(question.options || []),
            question.type || '',
            question.series || '',
            String(question.difficulty || 1)
        ].join('|');
        
        return crypto.createHash('sha256').update(hashContent).digest('hex');
    }

    /**
     * Normaliser le contenu pour détecter les similitudes
     */
    normalizeContent(content) {
        return (content || '')
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Traiter un batch de questions
     */
    async processBatch(questions) {
        try {
            for (const questionData of questions) {
                const question = new QuestionV2(questionData);
                await question.save();
                this.stats.migrated++;
            }
            console.log(`📦 Batch traité: ${questions.length} questions`);
        } catch (error) {
            console.error(`❌ Erreur batch:`, error);
            throw error;
        }
    }

    /**
     * Sauvegarder le mapping des QIDs
     */
    async saveQidMapping(mapping) {
        const filePath = path.join(__dirname, 'qid-mapping.json');
        await fs.writeFile(filePath, JSON.stringify(mapping, null, 2));
        console.log(`💾 Mapping QID sauvegardé: ${filePath}`);
    }

    /**
     * Charger le mapping des QIDs
     */
    async loadQidMapping() {
        const filePath = path.join(__dirname, 'qid-mapping.json');
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('❌ Impossible de charger le mapping QID:', error);
            return {};
        }
    }

    /**
     * Sauvegarder le rapport d'erreurs
     */
    async saveErrorReport(errors) {
        const filePath = path.join(__dirname, 'migration-errors.json');
        await fs.writeFile(filePath, JSON.stringify(errors, null, 2));
        console.log(`📋 Rapport d'erreurs sauvegardé: ${filePath}`);
    }

    /**
     * Générer un rapport CSV des collisions
     */
    async generateCollisionReport() {
        const auditResults = await this.auditCollisions();
        
        let csvContent = 'BundleHash,Count,Questions\n';
        for (const collision of auditResults.details) {
            const questionsList = collision.questions.map(q => 
                `${q.questionIndex || 'N/A'}:${q._id}`
            ).join(';');
            csvContent += `${collision.bundleHash},${collision.count},"${questionsList}"\n`;
        }
        
        const filePath = path.join(__dirname, 'collision-report.csv');
        await fs.writeFile(filePath, csvContent);
        console.log(`📊 Rapport de collisions: ${filePath}`);
        
        return filePath;
    }

    /**
     * Pipeline complet de migration
     */
    async runFullMigration() {
        console.log('🚀 === MIGRATION COMPLÈTE VERS V2 ===');
        
        try {
            await this.connect();
            
            // 1. Audit des collisions
            console.log('\n1️⃣ Audit des collisions...');
            const auditResults = await this.auditCollisions();
            await this.generateCollisionReport();
            
            // 2. Génération des QIDs
            console.log('\n2️⃣ Génération des QIDs...');
            const qidMapping = await this.generateQids();
            
            // 3. Migration des questions
            console.log('\n3️⃣ Migration des questions...');
            const migrationResults = await this.migrateQuestions(qidMapping);
            
            // 4. Rapport final
            console.log('\n✅ === MIGRATION TERMINÉE ===');
            console.log(`📊 Questions analysées: ${auditResults.totalQuestions}`);
            console.log(`⚠️  Collisions détectées: ${auditResults.collisions}`);
            console.log(`✅ Questions migrées: ${migrationResults.migrated}`);
            console.log(`❌ Erreurs: ${migrationResults.errors}`);
            
            return {
                audit: auditResults,
                migration: migrationResults,
                mapping: qidMapping
            };
            
        } finally {
            await this.disconnect();
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const migration = new MigrationV2();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'audit':
            migration.connect()
                .then(() => migration.auditCollisions())
                .then(() => migration.generateCollisionReport())
                .finally(() => migration.disconnect());
            break;
            
        case 'qids':
            migration.connect()
                .then(() => migration.generateQids())
                .finally(() => migration.disconnect());
            break;
            
        case 'migrate':
            migration.connect()
                .then(() => migration.migrateQuestions())
                .finally(() => migration.disconnect());
            break;
            
        case 'full':
        default:
            migration.runFullMigration()
                .then(results => {
                    console.log('\n🎉 Migration complète terminée!');
                    process.exit(0);
                })
                .catch(error => {
                    console.error('💥 Erreur de migration:', error);
                    process.exit(1);
                });
            break;
    }
}

module.exports = MigrationV2;