#!/usr/bin/env node
/**
 * 🔧 CORRECTION RÉPONSES CORRECTES
 * ===============================
 * 
 * Corriger les 14 questions où correctAnswer ne correspond pas
 * à l'option marquée isCorrect = true
 */

const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');
require('dotenv').config();

class CorrectAnswerFixer {
    async connect() {
        const mongoUri = process.env.MONGODB_URI?.replace('mongo:', 'localhost:') || 'mongodb://localhost:27017/iq_test_db';
        await mongoose.connect(mongoUri);
        console.log('✅ Connecté à MongoDB');
    }

    async disconnect() {
        await mongoose.disconnect();
        console.log('📌 Connexion fermée');
    }

    /**
     * Diagnostiquer et corriger les problèmes de réponses correctes
     */
    async fixCorrectAnswers() {
        console.log('🔧 === CORRECTION RÉPONSES CORRECTES ===\n');

        try {
            await this.connect();

            const questions = await QuestionV2.find({ state: 'published' });
            const problematicQuestions = [];

            // Identifier les questions problématiques
            for (const question of questions) {
                const correctOptions = question.options.filter(opt => opt.isCorrect);
                const correctIndex = question.options.findIndex(opt => opt.isCorrect);
                
                const issues = [];
                
                if (correctOptions.length === 0) {
                    issues.push('Aucune option marquée correcte');
                } else if (correctOptions.length > 1) {
                    issues.push(`${correctOptions.length} options marquées correctes`);
                }
                
                if (correctIndex !== question.correctAnswer) {
                    issues.push(`correctAnswer (${question.correctAnswer}) ≠ option correcte (${correctIndex})`);
                }

                if (issues.length > 0) {
                    problematicQuestions.push({
                        question,
                        issues,
                        correctIndex,
                        correctOptions: correctOptions.length
                    });
                }
            }

            console.log(`📊 Questions problématiques trouvées: ${problematicQuestions.length}`);

            // Corriger chaque question
            let fixed = 0;
            for (const { question, issues, correctIndex } of problematicQuestions) {
                console.log(`\n🔧 Q${question.questionIndex} (${question.qid})`);
                console.log(`   Issues: ${issues.join(', ')}`);
                console.log(`   correctAnswer actuel: ${question.correctAnswer}`);
                
                // Stratégie de correction
                let needsSave = false;

                // Cas 1: Aucune option marquée correcte
                if (correctIndex === -1) {
                    // Marquer l'option indiquée par correctAnswer comme correcte
                    if (question.correctAnswer >= 0 && question.correctAnswer < question.options.length) {
                        question.options[question.correctAnswer].isCorrect = true;
                        console.log(`   ✅ Option ${question.correctAnswer} marquée correcte`);
                        needsSave = true;
                    } else {
                        // Si correctAnswer invalide, prendre la première option
                        question.options[0].isCorrect = true;
                        question.correctAnswer = 0;
                        console.log(`   ✅ Option 0 marquée correcte (fallback)`);
                        needsSave = true;
                    }
                }
                // Cas 2: Multiple options correctes
                else if (issues.some(i => i.includes('options marquées correctes'))) {
                    // Démarquer toutes sauf celle indiquée par correctAnswer
                    question.options.forEach((opt, idx) => {
                        opt.isCorrect = (idx === question.correctAnswer);
                    });
                    console.log(`   ✅ Seule option ${question.correctAnswer} marquée correcte`);
                    needsSave = true;
                }
                // Cas 3: Discordance correctAnswer vs option correcte
                else if (correctIndex !== question.correctAnswer) {
                    // Aligner correctAnswer sur l'option marquée correcte
                    question.correctAnswer = correctIndex;
                    console.log(`   ✅ correctAnswer aligné sur ${correctIndex}`);
                    needsSave = true;
                }

                if (needsSave) {
                    await question.save();
                    fixed++;
                    console.log(`   💾 Sauvegardé`);
                } else {
                    console.log(`   ⚪ Aucune correction possible`);
                }
            }

            console.log(`\n🎯 === RÉSUMÉ ===`);
            console.log(`📊 Questions problématiques: ${problematicQuestions.length}`);
            console.log(`✅ Questions corrigées: ${fixed}`);
            console.log(`📈 Taux de réussite: ${((fixed / problematicQuestions.length) * 100).toFixed(1)}%`);

            return fixed;

        } finally {
            await this.disconnect();
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const fixer = new CorrectAnswerFixer();
    
    fixer.fixCorrectAnswers()
        .then(count => {
            console.log(`\n🎉 ${count} questions corrigées !`);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Erreur:', error);
            process.exit(1);
        });
}

module.exports = CorrectAnswerFixer;