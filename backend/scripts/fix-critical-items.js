#!/usr/bin/env node
/**
 * 🚨 CORRECTION IMMÉDIATE DES ITEMS CRITIQUES
 * ===========================================
 */

const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');
const QuestionValidator = require('../middleware/question-validation');
require('dotenv').config();

async function fixCriticalItems() {
    try {
        const mongoUri = process.env.MONGODB_URI?.replace('mongo:', 'localhost:') || 'mongodb://localhost:27017/iq_test_db';
        await mongoose.connect(mongoUri);
        console.log('✅ Connecté à MongoDB');

        let fixedCount = 0;

        // FIX 1: Q3 - Corriger la réponse déclarée
        console.log('🔧 Correction Q3 - Réponse incorrecte...');
        const q3 = await QuestionV2.findOne({ 
            qid: '01K2G2QP2W97KTF3AQBAVHFN5Q',
            version: 1
        });

        if (q3) {
            console.log(`   Avant: correctAnswer = ${q3.correctAnswer}`);
            console.log(`   Pattern: ${q3.content}`);
            console.log(`   Options: ${q3.options.map(opt => opt.text).join(', ')}`);
            
            // La série ●○●○ devrait continuer avec ● (index 0)
            // Vérifier si c'est bien l'option A
            if (q3.options[0] && q3.options[0].text === '●') {
                // La réponse est correcte, mais marquons option A comme correcte
                q3.options.forEach((opt, idx) => {
                    opt.isCorrect = (idx === 0); // A = true, autres = false
                });
                q3.correctAnswer = 0; // Index de l'option A
                
                await q3.save();
                console.log(`   ✅ Corrigé: correctAnswer = 0 (Option A: '●')`);
                fixedCount++;
            } else {
                console.log(`   ⚠️ Structure inattendue, vérification manuelle requise`);
            }
        }

        // FIX 2: Q38 - Nettoyer formule et revoir logique
        console.log('\n🔧 Correction Q38 - Formule visible...');
        const q38 = await QuestionV2.findOne({ 
            qid: '01K2G2QP7EW0Z49VSNXCW6C6X0',
            version: 1
        });

        if (q38) {
            console.log(`   Avant: ${q38.content}`);
            
            // Nettoyer la formule mathématique visible
            let cleanedContent = q38.content;
            
            // Remplacer les formules par des points d'interrogation
            cleanedContent = cleanedContent.replace(/n!/g, 'n?');
            cleanedContent = cleanedContent.replace(/1,2,3,4,5/g, '1,2,3,4,?');
            cleanedContent = cleanedContent.replace(/= /g, '');
            cleanedContent = cleanedContent.replace(/donc \?/g, 'donc ?');
            
            // Rendre plus générique
            if (cleanedContent.includes('Suite:')) {
                cleanedContent = 'Trouvez le terme suivant dans cette suite numérique.';
            }
            
            q38.content = cleanedContent;
            
            // Vérifier les options pour la factorielle 5! = 120
            console.log(`   Options: ${q38.options.map(opt => `${opt.key}:${opt.text}`).join(', ')}`);
            
            // Si une option est 120, c'est la bonne réponse
            let correctOptionIndex = q38.options.findIndex(opt => 
                opt.text === '120' || opt.text.includes('120')
            );
            
            if (correctOptionIndex !== -1) {
                q38.options.forEach((opt, idx) => {
                    opt.isCorrect = (idx === correctOptionIndex);
                });
                q38.correctAnswer = correctOptionIndex;
                console.log(`   ✅ Option correcte: ${q38.options[correctOptionIndex].key} (120)`);
            } else {
                // Si pas d'option 120, ajouter la bonne option
                if (q38.options.length === 4) {
                    q38.options[3].text = '120';
                    q38.options[3].isCorrect = true;
                    q38.options.forEach((opt, idx) => {
                        opt.isCorrect = (idx === 3);
                    });
                    q38.correctAnswer = 3;
                    console.log(`   ✅ Option D modifiée pour 120`);
                }
            }
            
            await q38.save();
            console.log(`   Après: ${q38.content}`);
            fixedCount++;
        }

        console.log(`\n🎉 ${fixedCount} items critiques corrigés !`);
        
        // Vérification post-correction
        console.log('\n🔍 Vérification post-correction...');
        
        const verification = [
            '01K2G2QP2W97KTF3AQBAVHFN5Q', // Q3
            '01K2G2QP7EW0Z49VSNXCW6C6X0'  // Q38
        ];
        
        for (const qid of verification) {
            const question = await QuestionV2.findOne({ qid, version: 1 }).lean();
            if (question) {
                const validation = QuestionValidator.validate(question);
                console.log(`   Q${question.questionIndex}: ${validation.isValid ? '✅ Validé' : '❌ Toujours problématique'}`);
                if (!validation.isValid) {
                    console.log(`     Issues restantes: ${validation.issues.join(', ')}`);
                }
            }
        }

        await mongoose.disconnect();
        return fixedCount;

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    fixCriticalItems();
}

module.exports = { fixCriticalItems };