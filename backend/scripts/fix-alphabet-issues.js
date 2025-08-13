#!/usr/bin/env node
/**
 * 🔧 CORRECTION URGENTE - 4 QUESTIONS ALPHABET INCOHÉRENT
 * =====================================================
 * 
 * Correction ciblée des 4 questions identifiées dans le rapport:
 * Q12, Q28, Q36, Q45 - options avec mauvais alphabets
 */

const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');
require('dotenv').config();

class AlphabetIssueFixer {
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
     * Convertir texte vers alphabet cible
     */
    convertToTargetAlphabet(text, targetAlphabet) {
        let converted = text;
        
        switch (targetAlphabet) {
            case 'letter':
                // Convertir nombres et symboles vers lettres
                converted = converted.replace(/1/g, 'A');
                converted = converted.replace(/2/g, 'B');
                converted = converted.replace(/3/g, 'C');
                converted = converted.replace(/4/g, 'D');
                converted = converted.replace(/5/g, 'E');
                converted = converted.replace(/→/g, 'A');
                converted = converted.replace(/↑/g, 'B');
                converted = converted.replace(/↓/g, 'C');
                converted = converted.replace(/←/g, 'D');
                converted = converted.replace(/●/g, 'A');
                converted = converted.replace(/○/g, 'B');
                break;
                
            case 'number':
                // Convertir lettres et symboles vers nombres
                converted = converted.replace(/A/g, '1');
                converted = converted.replace(/B/g, '2');
                converted = converted.replace(/C/g, '3');
                converted = converted.replace(/D/g, '4');
                converted = converted.replace(/E/g, '5');
                converted = converted.replace(/◼/g, '1');
                converted = converted.replace(/◻/g, '2');
                break;
        }
        
        return converted;
    }

    /**
     * Corriger une question spécifique
     */
    async fixQuestion(qid, corrections) {
        const question = await QuestionV2.findOne({ qid, version: 1 });
        if (!question) {
            console.log(`❌ Question ${qid} introuvable`);
            return false;
        }

        console.log(`\n🔧 Q${question.questionIndex} (${qid})`);
        console.log(`   Alphabet: ${question.alphabet}`);
        
        let hasChanged = false;

        // Appliquer les corrections
        for (const correction of corrections) {
            if (correction.type === 'option') {
                const option = question.options.find(opt => opt.key === correction.key);
                if (option) {
                    const oldText = option.text;
                    option.text = correction.newText;
                    console.log(`   Option ${correction.key}: "${oldText}" → "${correction.newText}"`);
                    hasChanged = true;
                }
            }
        }

        if (hasChanged) {
            await question.save();
            console.log(`   ✅ Sauvegardé`);
            return true;
        }

        return false;
    }

    /**
     * Corriger toutes les questions problématiques
     */
    async fixAllAlphabetIssues() {
        console.log('🔧 === CORRECTION ALPHABET INCOHÉRENT ===\n');

        try {
            await this.connect();

            const fixes = [
                // Q12 - alphabet letter, mais options arrow
                {
                    qid: '01K2G2QP4TNGE626JTRGGWN29T',
                    corrections: [
                        { type: 'option', key: 'A', newText: 'I' },
                        { type: 'option', key: 'B', newText: 'J' },
                        { type: 'option', key: 'C', newText: 'K' },
                        { type: 'option', key: 'D', newText: 'L' }
                    ]
                },
                // Q28 - alphabet number, mais option B shape
                {
                    qid: '01K2G2QP6CWP5R9CY8HDR57K94',
                    corrections: [
                        { type: 'option', key: 'B', newText: '8' }
                    ]
                },
                // Q36 - alphabet letter, mais option D dot
                {
                    qid: '01K2G2QP78FCF49QQZZDB2WV3T',
                    corrections: [
                        { type: 'option', key: 'D', newText: 'M' }
                    ]
                },
                // Q45 - alphabet letter, mais options A,B number
                {
                    qid: '01K2G2QP89JY304PQ3N6D7A157',
                    corrections: [
                        { type: 'option', key: 'A', newText: 'N' },
                        { type: 'option', key: 'B', newText: 'O' }
                    ]
                }
            ];

            let totalFixed = 0;
            for (const fix of fixes) {
                const wasFixed = await this.fixQuestion(fix.qid, fix.corrections);
                if (wasFixed) totalFixed++;
            }

            console.log(`\n🎯 === RÉSUMÉ ===`);
            console.log(`✅ Questions corrigées: ${totalFixed}/${fixes.length}`);

            return totalFixed;

        } finally {
            await this.disconnect();
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const fixer = new AlphabetIssueFixer();
    
    fixer.fixAllAlphabetIssues()
        .then(count => {
            console.log(`\n🎉 ${count} questions corrigées !`);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Erreur:', error);
            process.exit(1);
        });
}

module.exports = AlphabetIssueFixer;