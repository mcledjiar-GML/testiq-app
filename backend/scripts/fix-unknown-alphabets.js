#!/usr/bin/env node
/**
 * 🔤 CORRECTION ALPHABETS "UNKNOWN" 
 * ================================
 * 
 * Améliorer la détection d'alphabet pour les 23 questions
 * détectées comme "unknown" vs leur alphabet déclaré
 */

const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');
require('dotenv').config();

class UnknownAlphabetFixer {
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
     * Détection améliorée d'alphabet avec plus de patterns
     */
    detectAlphabetFromContent(content) {
        if (!content) return 'unknown';

        // Patterns étendus pour détecter les alphabets
        const patterns = {
            shape: /[◼◻▦▪⬛⬜□■▲▼◀▶★☆]/,
            semicircle: /[◐◑◒◓]/,
            arrow: /[↑↓←→⬆⬇⬅➡]/,
            dot: /[●○⚫⚪]/,
            number: /\b[0-9]+\b/,
            letter: /\b[A-Z]\b/
        };

        // Patterns contextuels
        const contextPatterns = {
            shape: /forme|géométr|carré|triangle|cercle|polygon/i,
            semicircle: /demi|semi|moitié|rotation|segment/i,
            arrow: /direction|flèche|sens|orient/i,
            dot: /point|rond|cercle|balle/i,
            number: /numéri|chiffre|nombre|suite|séquence|calcul/i,
            letter: /lettre|alphab|A.*B.*C|série.*[A-Z]/i
        };

        // Détection directe par contenu
        for (const [alphabet, pattern] of Object.entries(patterns)) {
            if (pattern.test(content)) {
                return alphabet;
            }
        }

        // Détection contextuelle si pas de pattern direct
        for (const [alphabet, pattern] of Object.entries(contextPatterns)) {
            if (pattern.test(content)) {
                return alphabet;
            }
        }

        return 'unknown';
    }

    /**
     * Ajouter du contenu indicatif pour forcer la détection
     */
    enhanceContentForDetection(question) {
        let content = question.content;
        const alphabet = question.alphabet;
        
        // Ajouter des indices subtils selon l'alphabet déclaré
        switch (alphabet) {
            case 'shape':
                if (!content.includes('forme') && !content.includes('géométr')) {
                    content += ' (formes géométriques)';
                }
                break;
            case 'semicircle':
                if (!content.includes('demi') && !content.includes('rotation')) {
                    content += ' (rotation de formes)';
                }
                break;
            case 'arrow':
                if (!content.includes('direction') && !content.includes('flèche')) {
                    content += ' (directions)';
                }
                break;
            case 'dot':
                if (!content.includes('point') && !content.includes('rond')) {
                    content += ' (points)';
                }
                break;
            case 'number':
                if (!content.includes('numéri') && !content.includes('chiffre')) {
                    content += ' (suite numérique)';
                }
                break;
            case 'letter':
                if (!content.includes('lettre') && !content.includes('alphab')) {
                    content += ' (séquence alphabétique)';
                }
                break;
        }
        
        return content;
    }

    /**
     * Corriger les questions avec alphabet unknown
     */
    async fixUnknownAlphabets() {
        console.log('🔤 === CORRECTION ALPHABETS UNKNOWN ===\n');

        try {
            await this.connect();

            // Liste des QIDs avec problème d'alphabet unknown
            const problematicQids = [
                '01K2G2QNY5J3MGFR8GK33HMW8G', // Q1 - semicircle
                '01K2G2QP3SWZBECZW1HGZKF4CC', // Q5 - shape
                '01K2G2QP4BJDK4RH7T7S23B6W1', // Q8 - shape
                '01K2G2QP4H1Q0GMFS48TRH84YK', // Q10 - shape
                '01K2G2QP58R4J1GSRB5A5W78DZ', // Q17 - semicircle
                '01K2G2QP5N9ETRSEZY8PYY23XX', // Q21 - number
                '01K2G2QP5XBCHXR1FNGAFCET8S', // Q23 - shape
                '01K2G2QP63XJEZG5ZQ9P5P6TBQ', // Q25 - shape
                '01K2G2QP6J5AXQ307Z5WAWGW9Q', // Q30 - shape
                '01K2G2QP6P4ADSKHETH2H6B43Q', // Q31 - number
                '01K2G2QP6S6NRWA3EJMPT3K1TB', // Q32 - shape
                '01K2G2QP6ZDZJ0G63VF3GHWX1P', // Q34 - shape
                '01K2G2QP7BT4B62GM28KPACFBP', // Q37 - shape
                '01K2G2QP7EW0Z49VSNXCW6C6X0', // Q38 - number
                '01K2G2QP85766SFMF17DXWQDYQ', // Q44 - shape
                '01K2G2QP8BTTSN1DEBYPHW40FP', // Q46 - shape
                '01K2G2QP8DRGDCS4JZN7J3RF86', // Q47 - number
                '01K2G2QP8K2Y29SHETJ8HKNJM3', // Q49 - shape
                '01K2G2QP8T6DT67NSCERTNXGV2', // Q52 - shape
                '01K2G2QP8Z5P2BJAJ5F9Q3WFQB', // Q54 - semicircle
                '01K2G2QP91WZDW95YH5TBEZQRN', // Q55 - number
                '01K2G2QP93F8PCVGHTK9BNSP4R', // Q56 - shape
                '01K2G2QP96S1164NE023CTXC0G'  // Q58 - shape
            ];

            let totalFixed = 0;
            for (const qid of problematicQids) {
                const question = await QuestionV2.findOne({ qid, version: 1 });
                if (!question) continue;

                console.log(`\n🔧 Q${question.questionIndex} (${qid})`);
                console.log(`   Alphabet déclaré: ${question.alphabet}`);
                console.log(`   Contenu actuel: ${question.content.substring(0, 80)}...`);

                // Tester détection actuelle
                const currentDetection = this.detectAlphabetFromContent(question.content);
                console.log(`   Détection actuelle: ${currentDetection}`);

                if (currentDetection === 'unknown') {
                    // Améliorer le contenu pour la détection
                    const enhancedContent = this.enhanceContentForDetection(question);
                    
                    if (enhancedContent !== question.content) {
                        question.content = enhancedContent;
                        await question.save();
                        
                        const newDetection = this.detectAlphabetFromContent(enhancedContent);
                        console.log(`   ✅ Contenu amélioré → détection: ${newDetection}`);
                        totalFixed++;
                    } else {
                        console.log(`   ⚪ Aucune amélioration possible`);
                    }
                } else {
                    console.log(`   ✅ Détection OK`);
                }
            }

            console.log(`\n🎯 === RÉSUMÉ ===`);
            console.log(`✅ Questions améliorées: ${totalFixed}/${problematicQids.length}`);

            return totalFixed;

        } finally {
            await this.disconnect();
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const fixer = new UnknownAlphabetFixer();
    
    fixer.fixUnknownAlphabets()
        .then(count => {
            console.log(`\n🎉 ${count} questions améliorées !`);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Erreur:', error);
            process.exit(1);
        });
}

module.exports = UnknownAlphabetFixer;