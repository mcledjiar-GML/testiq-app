#!/usr/bin/env node
/**
 * 🔤 UNIFICATION DES ALPHABETS - 1 SEUL PAR ITEM
 * ===============================================
 * 
 * Règle : un seul alphabet par item (dot | semicircle | arrow | shape | number | letter)
 * Si mismatch → basculer l'énoncé OU les options sur l'alphabet le plus cohérent
 */

const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');
const QuestionValidator = require('../middleware/question-validation');
require('dotenv').config();

class AlphabetUnifier {
    constructor() {
        this.stats = {
            processed: 0,
            unified: 0,
            issues: []
        };
    }

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
     * Détecter l'alphabet depuis le contenu
     */
    detectAlphabetFromContent(content) {
        if (!content) return 'unknown';

        if (/[◼◻▦▪⬛⬜□■]/.test(content)) return 'shape';
        if (/[◐◑◒◓]/.test(content)) return 'semicircle';
        if (/[↑↓←→⬆⬇⬅➡]/.test(content)) return 'arrow';
        if (/[●○⚫⚪]/.test(content)) return 'dot';
        if (/\b[0-9]+\b/.test(content)) return 'number';
        if (/\b[A-Z]\b/.test(content)) return 'letter';

        return 'unknown';
    }

    /**
     * Analyser tous les alphabets présents dans une question
     */
    analyzeQuestionAlphabets(question) {
        const analysis = {
            declared: question.alphabet,
            contentAlphabet: this.detectAlphabetFromContent(question.content + ' ' + (question.stimulus || '')),
            optionAlphabets: {},
            alphabetCounts: {},
            recommendation: null
        };

        // Analyser les options
        if (question.options) {
            question.options.forEach(option => {
                const optAlphabet = this.detectAlphabetFromContent(option.text || '');
                analysis.optionAlphabets[option.key] = optAlphabet;
                
                if (optAlphabet !== 'unknown') {
                    analysis.alphabetCounts[optAlphabet] = (analysis.alphabetCounts[optAlphabet] || 0) + 1;
                }
            });
        }

        // Ajouter l'alphabet du contenu
        if (analysis.contentAlphabet !== 'unknown') {
            analysis.alphabetCounts[analysis.contentAlphabet] = (analysis.alphabetCounts[analysis.contentAlphabet] || 0) + 1;
        }

        // Déterminer l'alphabet majoritaire
        const sortedAlphabets = Object.entries(analysis.alphabetCounts)
            .sort(([,a], [,b]) => b - a);

        if (sortedAlphabets.length > 0) {
            const [majorityAlphabet, count] = sortedAlphabets[0];
            analysis.recommendation = majorityAlphabet;
        }

        return analysis;
    }

    /**
     * Unifier l'alphabet d'une question
     */
    async unifyQuestionAlphabet(question) {
        const analysis = this.analyzeQuestionAlphabets(question);
        
        console.log(`\n📋 Q${question.questionIndex} (${question.qid})`);
        console.log(`   Déclaré: ${analysis.declared}`);
        console.log(`   Contenu: ${analysis.contentAlphabet}`);
        console.log(`   Options: ${JSON.stringify(analysis.optionAlphabets)}`);
        console.log(`   Counts: ${JSON.stringify(analysis.alphabetCounts)}`);
        console.log(`   Recommandé: ${analysis.recommendation}`);

        // Si pas de problème, passer
        if (analysis.declared === analysis.recommendation && 
            analysis.contentAlphabet === analysis.declared &&
            Object.values(analysis.optionAlphabets).every(opt => opt === 'unknown' || opt === analysis.declared)) {
            console.log(`   ✅ Alphabet déjà unifié`);
            return false;
        }

        // Stratégie d'unification
        let targetAlphabet = analysis.recommendation || analysis.declared;
        let hasChanged = false;

        // Cas 1: L'alphabet déclaré est différent de la recommandation
        if (analysis.declared !== targetAlphabet) {
            console.log(`   🔄 Changement alphabet: ${analysis.declared} → ${targetAlphabet}`);
            question.alphabet = targetAlphabet;
            hasChanged = true;
        }

        // Cas 2: Options avec alphabets incohérents
        if (question.options) {
            for (const option of question.options) {
                const optAlphabet = analysis.optionAlphabets[option.key];
                
                if (optAlphabet !== 'unknown' && optAlphabet !== targetAlphabet) {
                    console.log(`   🔧 Option ${option.key}: conversion ${optAlphabet} → ${targetAlphabet}`);
                    
                    // Convertir l'option vers l'alphabet cible
                    const convertedText = this.convertToTargetAlphabet(option.text, optAlphabet, targetAlphabet);
                    if (convertedText !== option.text) {
                        option.text = convertedText;
                        hasChanged = true;
                        console.log(`     '${option.text}' → '${convertedText}'`);
                    }
                }
            }
        }

        if (hasChanged) {
            await question.save();
            console.log(`   ✅ Unifié vers alphabet '${targetAlphabet}'`);
            return true;
        }

        return false;
    }

    /**
     * Convertir un texte vers l'alphabet cible
     */
    convertToTargetAlphabet(text, fromAlphabet, toAlphabet) {
        // Mappings de conversion
        const conversions = {
            'semicircle_to_shape': {
                '◐': '◼', '◑': '◻', '◒': '▦', '◓': '▪'
            },
            'dot_to_shape': {
                '●': '◼', '○': '◻', '⚫': '■', '⚪': '□'
            },
            'arrow_to_shape': {
                '↑': '▲', '↓': '▼', '←': '◀', '→': '▶',
                '⬆': '▲', '⬇': '▼', '⬅': '◀', '➡': '▶'
            },
            'number_to_letter': {
                '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E'
            },
            'letter_to_number': {
                'A': '1', 'B': '2', 'C': '3', 'D': '4', 'E': '5'
            }
        };

        const conversionKey = `${fromAlphabet}_to_${toAlphabet}`;
        const mapping = conversions[conversionKey];

        if (mapping) {
            let converted = text;
            for (const [from, to] of Object.entries(mapping)) {
                converted = converted.replace(new RegExp(from, 'g'), to);
            }
            return converted;
        }

        // Si pas de conversion directe, garder le texte original
        return text;
    }

    /**
     * Exécuter l'unification sur toutes les questions
     */
    async runUnification() {
        console.log('🔤 === UNIFICATION DES ALPHABETS ===\n');

        try {
            await this.connect();

            // Trouver toutes les questions avec problèmes d'alphabet
            const questions = await QuestionV2.find({ state: 'published' });
            console.log(`📊 Analyse de ${questions.length} questions...`);

            for (const question of questions) {
                this.stats.processed++;
                
                const validation = QuestionValidator.validate(question.toObject());
                const hasAlphabetIssue = validation.issues.some(issue => 
                    issue.includes('alphabet') || issue.includes('Alphabet')
                );

                if (hasAlphabetIssue) {
                    const wasUnified = await this.unifyQuestionAlphabet(question);
                    if (wasUnified) {
                        this.stats.unified++;
                    }
                }
            }

            // Rapport final
            console.log('\n🎯 === RÉSUMÉ UNIFICATION ===');
            console.log(`📊 Questions traitées: ${this.stats.processed}`);
            console.log(`✅ Questions unifiées: ${this.stats.unified}`);
            
            if (this.stats.unified > 0) {
                console.log('\n🔍 Vérification post-unification...');
                
                // Re-tester quelques questions
                const sampleQuestions = await QuestionV2.find({ state: 'published' }).limit(10).lean();
                let stillProblematic = 0;
                
                for (const q of sampleQuestions) {
                    const validation = QuestionValidator.validate(q);
                    const hasAlphabetIssue = validation.issues.some(issue => 
                        issue.includes('alphabet') || issue.includes('Alphabet')
                    );
                    if (hasAlphabetIssue) stillProblematic++;
                }
                
                console.log(`📊 Échantillon testé: ${sampleQuestions.length} questions`);
                console.log(`⚠️ Encore problématiques: ${stillProblematic}`);
            }

            return this.stats;

        } finally {
            await this.disconnect();
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const unifier = new AlphabetUnifier();
    
    unifier.runUnification()
        .then(stats => {
            console.log('\n🎉 Unification terminée !');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Erreur unification:', error);
            process.exit(1);
        });
}

module.exports = AlphabetUnifier;