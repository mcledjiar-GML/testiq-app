#!/usr/bin/env node
/**
 * 🚨 RECHERCHE DES ITEMS CRITIQUES - BLOQUEURS IMMEDIATS
 * ======================================================
 */

const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');
const QuestionValidator = require('../middleware/question-validation');
require('dotenv').config();

async function findCriticalItems() {
    try {
        const mongoUri = process.env.MONGODB_URI?.replace('mongo:', 'localhost:') || 'mongodb://localhost:27017/iq_test_db';
        await mongoose.connect(mongoUri);
        console.log('✅ Connecté à MongoDB');

        const questions = await QuestionV2.find({ state: 'published' }).lean();
        const criticals = [];
        
        console.log(`🔍 Analyse de ${questions.length} questions...`);
        
        for (const q of questions) {
            const validation = QuestionValidator.validate(q);
            if (validation.severity === 'high') {
                criticals.push({
                    qid: q.qid,
                    questionIndex: q.questionIndex,
                    content: q.content.substring(0, 80) + '...',
                    issues: validation.issues,
                    severity: validation.severity,
                    optionsCount: q.options?.length || 0,
                    correctAnswers: q.options?.filter(opt => opt.isCorrect).length || 0
                });
            }
        }
        
        console.log(`\n🚨 ITEMS CRITIQUES TROUVÉS: ${criticals.length}\n`);
        
        criticals.forEach((c, idx) => {
            console.log(`${idx + 1}. Q${c.questionIndex} (QID: ${c.qid})`);
            console.log(`   Content: ${c.content}`);
            console.log(`   Options: ${c.optionsCount}, Correctes: ${c.correctAnswers}`);
            console.log(`   Issues:`);
            c.issues.forEach(issue => console.log(`     - ${issue}`));
            console.log('');
        });
        
        if (criticals.length > 0) {
            console.log('⚠️ ACTIONS REQUISES:');
            criticals.forEach((c, idx) => {
                console.log(`${idx + 1}. Q${c.questionIndex}:`);
                if (c.optionsCount !== 4) {
                    console.log(`   - Corriger nombre d'options: ${c.optionsCount} → 4`);
                }
                if (c.correctAnswers !== 1) {
                    console.log(`   - Corriger réponses correctes: ${c.correctAnswers} → 1`);
                }
                if (c.issues.some(i => i.includes('Formule mathématique'))) {
                    console.log(`   - Supprimer formules mathématiques visibles`);
                }
                if (c.issues.some(i => i.includes('Aucune option ne satisfait'))) {
                    console.log(`   - Revoir la logique de la question`);
                }
                console.log('');
            });
        } else {
            console.log('🎉 Aucun item critique trouvé !');
        }

        await mongoose.disconnect();
        return criticals;

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    findCriticalItems();
}

module.exports = { findCriticalItems };