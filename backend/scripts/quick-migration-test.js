#!/usr/bin/env node
/**
 * 🚀 TEST RAPIDE DE MIGRATION - 5 QUESTIONS SEULEMENT
 * ===================================================
 * 
 * Script simple pour migrer quelques questions vers V2 et tester notre système
 */

const mongoose = require('mongoose');
const { ulid } = require('ulid');
const QuestionV2 = require('../models/QuestionV2');
require('dotenv').config();

async function quickMigrationTest() {
    try {
        // Connexion
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connecté à MongoDB');
        
        // Lire directement depuis la collection questions
        const db = mongoose.connection.db;
        const questionsCollection = db.collection('questions');
        
        // Prendre seulement les 5 premières questions
        const legacyQuestions = await questionsCollection.find({}).limit(5).toArray();
        console.log(`📊 ${legacyQuestions.length} questions legacy trouvées`);
        
        // Migrer chaque question
        for (const [index, legacyQ] of legacyQuestions.entries()) {
            try {
                console.log(`🔄 Migration question ${index + 1}...`);
                
                const qid = ulid();
                
                // Transformer vers V2
                const questionV2 = new QuestionV2({
                    qid,
                    version: 1,
                    state: 'published',
                    publishedAt: new Date(),
                    
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
                    
                    assets: [],
                    visualPattern: legacyQ.visualPattern,
                    explanation: legacyQ.explanation,
                    
                    questionIndex: legacyQ.questionIndex,
                    
                    createdBy: 'quick-migration-test',
                    stats: {
                        totalAttempts: 0,
                        correctAttempts: 0,
                        averageTime: 0
                    }
                });
                
                await questionV2.save();
                console.log(`✅ Question ${index + 1} migrée: ${qid}`);
                
            } catch (error) {
                console.error(`❌ Erreur migration question ${index + 1}:`, error.message);
            }
        }
        
        // Compter les questions V2
        const countV2 = await QuestionV2.countDocuments();
        console.log(`🎯 ${countV2} questions V2 au total`);
        
        console.log('✅ Migration test terminée !');
        
    } catch (error) {
        console.error('💥 Erreur:', error);
    } finally {
        await mongoose.disconnect();
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

// Exécuter
quickMigrationTest().then(() => {
    console.log('🎉 Script terminé');
    process.exit(0);
}).catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
});