#!/usr/bin/env node
/**
 * 🔧 CORRECTION AUTOMATIQUE DES INCOHÉRENCES D'ALPHABET
 * ====================================================
 * 
 * Corrige les 23 questions avec alphabets incohérents identifiées
 * dans le rapport de tests. Met à jour l'alphabet déclaré pour 
 * correspondre au contenu réel.
 */

const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');
const QuestionValidator = require('../middleware/question-validation');

// Charger la configuration
require('dotenv').config();

class AlphabetFixer {
    constructor() {
        this.fixedCount = 0;
        this.errors = [];
    }

    async connect() {
        try {
            const mongoUri = process.env.MONGODB_URI?.replace('mongo:', 'localhost:') || 'mongodb://localhost:27017/iq_test_db';
            await mongoose.connect(mongoUri, {
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
     * Détection d'alphabet améliorée
     */
    detectAlphabetEnhanced(content, stimulus = '', options = []) {
        const fullContent = (content || '') + ' ' + (stimulus || '') + ' ' + 
                           (options.map(opt => opt.text || '').join(' '));

        // Formes géométriques
        if (/[◼◻▦▪⬛⬜□■▲▼◆◇★☆]/.test(fullContent) || 
            fullContent.includes('<rect') || 
            fullContent.includes('<circle') ||
            fullContent.includes('<polygon') ||
            fullContent.includes('triangle') ||
            fullContent.includes('carré') ||
            fullContent.includes('hexagone') ||
            fullContent.includes('forme')) {
            return 'shape';
        }

        // Demi-cercles et rotations
        if (/[◐◑◒◓]/.test(fullContent) || 
            fullContent.includes('rotation') ||
            fullContent.includes('semi') ||
            fullContent.includes('demi') ||
            fullContent.includes('arc')) {
            return 'semicircle';
        }

        // Flèches et directions
        if (/[↑↓←→⬆⬇⬅➡]/.test(fullContent) ||
            fullContent.includes('direction') ||
            fullContent.includes('flèche')) {
            return 'arrow';
        }

        // Points et cercles
        if (/[●○⚫⚪]/.test(fullContent) ||
            fullContent.includes('point') ||
            fullContent.includes('cercle')) {
            return 'dot';
        }

        // Nombres et suites numériques
        if (/\b[0-9]+\b/.test(fullContent) ||
            fullContent.includes('suite') ||
            fullContent.includes('numérique') ||
            fullContent.includes('nombre') ||
            fullContent.includes('progression') ||
            fullContent.includes('Fibonacci') ||
            fullContent.includes('prime') ||
            fullContent.includes('terme')) {
            return 'number';
        }

        // Lettres de l'alphabet
        if (/\b[A-Z]\b/.test(fullContent) ||
            fullContent.includes('alphabet') ||
            fullContent.includes('lettre')) {
            return 'letter';
        }

        return 'unknown';
    }

    /**
     * Corriger une question spécifique
     */
    async fixQuestion(qid) {
        try {
            const question = await QuestionV2.findOne({ qid, state: 'published' });
            if (!question) {
                console.log(`⚠️  Question ${qid} non trouvée ou non publiée`);
                return;
            }

            const currentAlphabet = question.alphabet;
            const detectedAlphabet = this.detectAlphabetEnhanced(
                question.content,
                question.stimulus,
                question.options
            );

            if (detectedAlphabet === 'unknown') {
                console.log(`⚠️  ${qid}: Impossible de détecter l'alphabet (reste '${currentAlphabet}')`);
                return;
            }

            if (detectedAlphabet === currentAlphabet) {
                console.log(`✅ ${qid}: Alphabet déjà cohérent ('${currentAlphabet}')`);
                return;
            }

            // Mettre à jour l'alphabet
            await QuestionV2.updateOne(
                { qid },
                { 
                    $set: { 
                        alphabet: detectedAlphabet,
                        updatedAt: new Date()
                    }
                }
            );

            console.log(`🔧 ${qid}: '${currentAlphabet}' → '${detectedAlphabet}'`);
            this.fixedCount++;

        } catch (error) {
            const errorMsg = `Erreur lors de la correction de ${qid}: ${error.message}`;
            console.error(`❌ ${errorMsg}`);
            this.errors.push(errorMsg);
        }
    }

    /**
     * Corriger toutes les questions avec incohérences d'alphabet
     */
    async fixAllInconsistencies() {
        console.log('🔧 === CORRECTION DES INCOHÉRENCES D\'ALPHABET ===\n');

        // Liste des QIDs avec incohérences identifiées dans le rapport
        const inconsistentQids = [
            '01K2G2QNY5J3MGFR8GK33HMW8G',
            '01K2G2QP3SWZBECZW1HGZKF4CC',
            '01K2G2QP4BJDK4RH7T7S23B6W1',
            '01K2G2QP4H1Q0GMFS48TRH84YK',
            '01K2G2QP58R4J1GSRB5A5W78DZ',
            '01K2G2QP5N9ETRSEZY8PYY23XX',
            '01K2G2QP5XBCHXR1FNGAFCET8S',
            '01K2G2QP63XJEZG5ZQ9P5P6TBQ',
            '01K2G2QP6J5AXQ307Z5WAWGW9Q',
            '01K2G2QP6P4ADSKHETH2H6B43Q',
            '01K2G2QP6S6NRWA3EJMPT3K1TB',
            '01K2G2QP6ZDZJ0G63VF3GHWX1P',
            '01K2G2QP7BT4B62GM28KPACFBP',
            '01K2G2QP7EW0Z49VSNXCW6C6X0',
            '01K2G2QP85766SFMF17DXWQDYQ',
            '01K2G2QP8BTTSN1DEBYPHW40FP',
            '01K2G2QP8DRGDCS4JZN7J3RF86',
            '01K2G2QP8K2Y29SHETJ8HKNJM3',
            '01K2G2QP8T6DT67NSCERTNXGV2',
            '01K2G2QP8Z5P2BJAJ5F9Q3WFQB',
            '01K2G2QP91WZDW95YH5TBEZQRN',
            '01K2G2QP93F8PCVGHTK9BNSP4R',
            '01K2G2QP96S1164NE023CTXC0G'
        ];

        console.log(`📊 ${inconsistentQids.length} questions à corriger\n`);

        for (const qid of inconsistentQids) {
            await this.fixQuestion(qid);
        }

        console.log('\n🎯 === RÉSUMÉ ===');
        console.log(`✅ Questions corrigées: ${this.fixedCount}`);
        console.log(`❌ Erreurs: ${this.errors.length}`);

        if (this.errors.length > 0) {
            console.log('\n📋 Erreurs détaillées:');
            this.errors.forEach(error => console.log(`   • ${error}`));
        }

        return {
            fixed: this.fixedCount,
            errors: this.errors.length,
            success: this.errors.length === 0
        };
    }

    /**
     * Mode scan : vérifier toutes les questions publiées
     */
    async scanAllQuestions() {
        console.log('🔍 === SCAN COMPLET DES ALPHABETS ===\n');

        const questions = await QuestionV2.find({ state: 'published' }).lean();
        const inconsistencies = [];

        for (const question of questions) {
            const declared = question.alphabet;
            const detected = this.detectAlphabetEnhanced(
                question.content,
                question.stimulus,
                question.options
            );

            if (detected !== 'unknown' && detected !== declared) {
                inconsistencies.push({
                    qid: question.qid,
                    declared,
                    detected,
                    content: question.content.substring(0, 60) + '...'
                });
            }
        }

        console.log(`📊 ${inconsistencies.length} incohérences détectées sur ${questions.length} questions\n`);

        if (inconsistencies.length > 0) {
            console.log('📋 Incohérences détectées:');
            inconsistencies.forEach(inc => {
                console.log(`   ${inc.qid}: '${inc.declared}' → '${inc.detected}'`);
                console.log(`      ${inc.content}`);
            });
        }

        return inconsistencies;
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const fixer = new AlphabetFixer();
    
    const mode = process.argv[2] || 'fix';
    
    switch (mode) {
        case 'scan':
            fixer.connect()
                .then(() => fixer.scanAllQuestions())
                .then(inconsistencies => {
                    console.log(`\n✅ Scan terminé: ${inconsistencies.length} incohérences`);
                    process.exit(0);
                })
                .catch(error => {
                    console.error('💥 Erreur:', error);
                    process.exit(1);
                })
                .finally(() => fixer.disconnect());
            break;
            
        case 'fix':
        default:
            fixer.connect()
                .then(() => fixer.fixAllInconsistencies())
                .then(results => {
                    console.log(`\n✅ Correction terminée: ${results.fixed} fixées`);
                    process.exit(results.success ? 0 : 1);
                })
                .catch(error => {
                    console.error('💥 Erreur:', error);
                    process.exit(1);
                })
                .finally(() => fixer.disconnect());
            break;
    }
}

module.exports = AlphabetFixer;