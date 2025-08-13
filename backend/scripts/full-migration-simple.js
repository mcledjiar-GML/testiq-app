#!/usr/bin/env node
/**
 * 🚀 MIGRATION COMPLÈTE SIMPLE - 60 QUESTIONS
 * ===========================================
 * 
 * Migration directe et propre vers V2 sans conflit de modèles
 */

const mongoose = require('mongoose');
const { ulid } = require('ulid');
const QuestionV2 = require('../models/QuestionV2');
require('dotenv').config();

async function fullMigrationSimple() {
    try {
        console.log('🚀 === MIGRATION COMPLÈTE 60 QUESTIONS ===');
        
        // Connexion
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connecté à MongoDB');
        
        // Supprimer les questions V2 existantes pour repartir proprement
        const deletedCount = await QuestionV2.deleteMany({});
        console.log(`🗑️  ${deletedCount.deletedCount} questions V2 supprimées (nettoyage)`);
        
        // Lire toutes les questions legacy
        const db = mongoose.connection.db;
        const questionsCollection = db.collection('questions');
        const allLegacyQuestions = await questionsCollection.find({}).toArray();
        
        console.log(`📊 ${allLegacyQuestions.length} questions legacy trouvées`);
        console.log('🔄 Début de la migration...\n');
        
        const results = {
            total: allLegacyQuestions.length,
            migrated: 0,
            errors: 0,
            errorDetails: []
        };
        
        // Migrer chaque question
        for (const [index, legacyQ] of allLegacyQuestions.entries()) {
            try {
                const qid = ulid();
                
                // Affichage du progrès
                if ((index + 1) % 10 === 0 || index === 0) {
                    console.log(`🔄 Migration ${index + 1}/${allLegacyQuestions.length}...`);
                }
                
                // Transformer vers V2
                const questionV2 = new QuestionV2({
                    qid,
                    version: 1,
                    state: 'published',
                    publishedAt: legacyQ.createdAt || new Date(),
                    
                    type: legacyQ.type || 'raven',
                    series: legacyQ.series,
                    alphabet: detectAlphabet(legacyQ),
                    difficulty: legacyQ.difficulty || 1,
                    
                    content: legacyQ.content,
                    stimulus: legacyQ.stimulus,
                    options: transformOptions(legacyQ.options, legacyQ.correctAnswer),
                    correctAnswer: legacyQ.correctAnswer || 0,
                    
                    category: legacyQ.category || 'spatial',
                    timeLimit: legacyQ.timeLimit || 60,
                    
                    assets: generateAssets(legacyQ, qid),
                    visualPattern: legacyQ.visualPattern,
                    explanation: legacyQ.explanation,
                    
                    questionIndex: legacyQ.questionIndex,
                    
                    createdBy: 'full-migration-simple',
                    stats: {
                        totalAttempts: 0,
                        correctAttempts: 0,
                        averageTime: 0
                    }
                });
                
                await questionV2.save();
                results.migrated++;
                
            } catch (error) {
                results.errors++;
                results.errorDetails.push({
                    questionIndex: legacyQ.questionIndex,
                    legacyId: legacyQ._id,
                    error: error.message
                });
                console.error(`❌ Erreur question ${index + 1}:`, error.message);
            }
        }
        
        // Résumé final
        console.log('\n🎯 === RÉSUMÉ DE LA MIGRATION ===');
        console.log(`📊 Total questions: ${results.total}`);
        console.log(`✅ Migrées avec succès: ${results.migrated}`);
        console.log(`❌ Erreurs: ${results.errors}`);
        
        if (results.errors > 0) {
            console.log('\n❌ Détails des erreurs:');
            results.errorDetails.forEach(error => {
                console.log(`   Question ${error.questionIndex}: ${error.error}`);
            });
        }
        
        // Vérification finale
        const finalCountV2 = await QuestionV2.countDocuments();
        console.log(`\n📊 Vérification: ${finalCountV2} questions V2 en base`);
        
        const successRate = ((results.migrated / results.total) * 100).toFixed(1);
        console.log(`🎯 Taux de réussite: ${successRate}%`);
        
        if (results.migrated === results.total) {
            console.log('\n🎉 MIGRATION COMPLÈTE RÉUSSIE !');
        } else {
            console.log('\n⚠️  Migration partiellement réussie');
        }
        
        return results;
        
    } catch (error) {
        console.error('💥 Erreur fatale:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('📌 Connexion fermée');
    }
}

function detectAlphabet(question) {
    const content = (question.content || '') + ' ' + (question.stimulus || '');
    
    if (/[◼◻▦▪⬛⬜□■]/.test(content)) return 'shape';
    if (/[◐◑◒◓]/.test(content)) return 'semicircle';
    if (/[↑↓←→⬆⬇⬅➡]/.test(content)) return 'arrow';
    if (/[●○⚫⚪]/.test(content)) return 'dot';
    if (/\b[0-9]+\b/.test(content)) return 'number';
    if (/\b[A-Z]\b/.test(content)) return 'letter';
    
    return 'shape';
}

function transformOptions(options, correctAnswer) {
    if (!Array.isArray(options)) return [];
    
    return options.map((option, index) => {
        const key = String.fromCharCode(65 + index); // A, B, C, D
        
        if (typeof option === 'string') {
            return {
                key,
                text: option,
                alt: `Option ${key}`,
                isCorrect: index === correctAnswer
            };
        } else if (option && typeof option === 'object') {
            return {
                key,
                text: option.text || '',
                alt: option.alt || `Option ${key}`,
                isCorrect: index === correctAnswer,
                metadata: option.rotation ? { rotation: option.rotation } : undefined
            };
        } else {
            return {
                key,
                text: `Option ${key}`,
                alt: `Option ${key}`,
                isCorrect: false
            };
        }
    });
}

function generateAssets(question, qid) {
    const assets = [];
    
    // Asset stimulus si présent
    if (question.stimulus) {
        assets.push({
            type: 'stimulus',
            slot: 'stimulus',
            path: `questions/${qid}/1/stimulus.svg`,
            hash: require('crypto').createHash('sha256').update(question.stimulus).digest('hex'),
            locale: 'fr',
            mimeType: 'image/svg+xml'
        });
    }
    
    // Asset visual pattern si présent
    if (question.visualPattern) {
        assets.push({
            type: 'visual',
            slot: 'visual',
            path: `questions/${qid}/1/visual.svg`,
            hash: require('crypto').createHash('sha256').update(question.visualPattern).digest('hex'),
            locale: 'fr',
            mimeType: 'image/svg+xml'
        });
    }
    
    return assets;
}

// Exécuter
if (require.main === module) {
    fullMigrationSimple()
        .then((results) => {
            if (results.migrated === results.total) {
                console.log('🎉 Migration terminée avec succès !');
                process.exit(0);
            } else {
                console.log('⚠️  Migration partiellement réussie');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('💥 Migration échouée:', error.message);
            process.exit(1);
        });
}

module.exports = { fullMigrationSimple };