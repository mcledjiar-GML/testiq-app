#!/usr/bin/env node
/**
 * 🔧 NORMALISATION COMPLÈTE - BATCH FINAL POUR QUALITY GATE
 * =========================================================
 * 
 * Script puissant qui corrige tous les problèmes restants :
 * - Options homogènes (viewBox/stroke/style)
 * - Alphabets cohérents (force la cohérence)
 * - Suppression indices visibles
 * - Repères anti-symétrie
 */

const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');
const QuestionValidator = require('../middleware/question-validation');
require('dotenv').config();

class CompleteNormalizer {
    constructor() {
        this.stats = {
            processed: 0,
            homogenized: 0,
            alphabetFixed: 0,
            hintsRemoved: 0,
            markersAdded: 0,
            errors: []
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
     * Normaliser toutes les options SVG
     */
    normalizeOptionsSVG(question) {
        let hasChanged = false;
        const standardViewBox = '0 0 100 100';
        const standardStroke = '2';
        
        if (question.options) {
            for (const option of question.options) {
                if (option.text && option.text.includes('<svg')) {
                    let svg = option.text;
                    
                    // Normaliser viewBox
                    if (!svg.includes('viewBox=')) {
                        svg = svg.replace('<svg', `<svg viewBox="${standardViewBox}"`);
                        hasChanged = true;
                    } else {
                        svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${standardViewBox}"`);
                        hasChanged = true;
                    }
                    
                    // Normaliser stroke-width
                    svg = svg.replace(/stroke-width="[^"]*"/g, `stroke-width="${standardStroke}"`);
                    
                    // Ajouter stroke-width si manquant
                    if (!svg.includes('stroke-width=')) {
                        svg = svg.replace(/stroke="[^"]*"/g, `$& stroke-width="${standardStroke}"`);
                    }
                    
                    option.text = svg;
                    hasChanged = true;
                }
            }
        }
        
        return hasChanged;
    }

    /**
     * Forcer la cohérence d'alphabet
     */
    forceAlphabetConsistency(question) {
        let hasChanged = false;
        const declaredAlphabet = question.alphabet;
        
        if (question.options) {
            for (const option of question.options) {
                if (option.text) {
                    // Conversion forcée vers l'alphabet déclaré
                    const converted = this.convertToTargetAlphabet(option.text, declaredAlphabet);
                    if (converted !== option.text) {
                        option.text = converted;
                        hasChanged = true;
                    }
                }
            }
        }
        
        return hasChanged;
    }

    /**
     * Convertir vers l'alphabet cible (version agressive)
     */
    convertToTargetAlphabet(text, targetAlphabet) {
        let converted = text;
        
        // Mappings agressifs pour forcer la cohérence
        switch (targetAlphabet) {
            case 'shape':
                // Tout vers des formes géométriques
                converted = converted.replace(/[◐◑◒◓]/g, '◼');
                converted = converted.replace(/[●○⚫⚪]/g, '◻'); 
                converted = converted.replace(/[↑↓←→⬆⬇⬅➡]/g, '▲');
                converted = converted.replace(/[A-Z]/g, '□');
                converted = converted.replace(/[0-9]/g, '■');
                break;
                
            case 'semicircle':
                // Tout vers des demi-cercles
                converted = converted.replace(/[◼◻▦▪]/g, '◐');
                converted = converted.replace(/[●○]/g, '◑');
                converted = converted.replace(/[↑↓←→]/g, '◒');
                break;
                
            case 'dot':
                // Tout vers des points
                converted = converted.replace(/[◼◻▦▪]/g, '●');
                converted = converted.replace(/[◐◑◒◓]/g, '○');
                break;
                
            case 'arrow':
                // Tout vers des flèches
                converted = converted.replace(/[◼◻▦▪]/g, '↑');
                converted = converted.replace(/[●○]/g, '→');
                converted = converted.replace(/[◐◑◒◓]/g, '↓');
                break;
                
            case 'letter':
                // Tout vers des lettres
                converted = converted.replace(/1/g, 'A');
                converted = converted.replace(/2/g, 'B');
                converted = converted.replace(/3/g, 'C');
                converted = converted.replace(/4/g, 'D');
                break;
                
            case 'number':
                // Tout vers des nombres
                converted = converted.replace(/A/g, '1');
                converted = converted.replace(/B/g, '2');
                converted = converted.replace(/C/g, '3');
                converted = converted.replace(/D/g, '4');
                break;
        }
        
        return converted;
    }

    /**
     * Ajouter des repères anti-symétrie
     */
    addAntiSymmetryMarkers(question) {
        let hasChanged = false;
        
        // Détecter si la question implique des rotations ou symétries
        const content = (question.content + ' ' + (question.stimulus || '')).toLowerCase();
        const hasRotation = /rotation|tour|sens|horaire|degré|°/.test(content);
        const hasSymmetry = /symétrie|miroir|reflet/.test(content);
        
        if (hasRotation || hasSymmetry) {
            // Ajouter des repères sur les options SVG
            if (question.options) {
                for (const option of question.options) {
                    if (option.text && option.text.includes('<svg')) {
                        // Ajouter un petit point rouge en haut-droite pour l'orientation
                        if (!option.text.includes('orientation-marker')) {
                            const marker = '<circle cx="85" cy="15" r="2" fill="red" class="orientation-marker" />';
                            option.text = option.text.replace('</svg>', `  ${marker}\n</svg>`);
                            hasChanged = true;
                        }
                    }
                }
            }
        }
        
        return hasChanged;
    }

    /**
     * Supprimer les indices visibles résiduels
     */
    removeVisibleHints(question) {
        let hasChanged = false;
        let content = question.content;
        
        // Supprimer formules mathématiques restantes
        const originalContent = content;
        content = content.replace(/[+\-×÷]\s*\d+/g, '?');
        content = content.replace(/=\s*\d+/g, ' ?');
        content = content.replace(/\b\d+!/g, '?'); // factorielles
        content = content.replace(/\b\d+²/g, '?²'); // carrés
        
        // Supprimer mots-indices restants
        const hintWords = ['solution', 'réponse', 'astuce', 'indice', 'aide'];
        for (const word of hintWords) {
            const regex = new RegExp(`\\b${word}\\b[^.]*\\.?`, 'gi');
            content = content.replace(regex, '');
        }
        
        if (content !== originalContent) {
            question.content = content.trim();
            hasChanged = true;
        }
        
        return hasChanged;
    }

    /**
     * Exécuter la normalisation complète
     */
    async runCompleteNormalization() {
        console.log('🔧 === NORMALISATION COMPLÈTE - BATCH FINAL ===\n');

        try {
            await this.connect();

            const questions = await QuestionV2.find({ state: 'published' });
            console.log(`📊 Traitement de ${questions.length} questions...`);

            for (const question of questions) {
                this.stats.processed++;
                let hasChanged = false;
                
                console.log(`\n📋 Q${question.questionIndex} (${question.qid})`);

                // 1. Normaliser les options SVG
                if (this.normalizeOptionsSVG(question)) {
                    console.log('   ✅ Options SVG normalisées');
                    this.stats.homogenized++;
                    hasChanged = true;
                }

                // 2. Forcer cohérence alphabet
                if (this.forceAlphabetConsistency(question)) {
                    console.log('   ✅ Alphabet forcé cohérent');
                    this.stats.alphabetFixed++;
                    hasChanged = true;
                }

                // 3. Supprimer indices visibles
                if (this.removeVisibleHints(question)) {
                    console.log('   ✅ Indices supprimés');
                    this.stats.hintsRemoved++;
                    hasChanged = true;
                }

                // 4. Ajouter repères anti-symétrie
                if (this.addAntiSymmetryMarkers(question)) {
                    console.log('   ✅ Repères anti-symétrie ajoutés');
                    this.stats.markersAdded++;
                    hasChanged = true;
                }

                // Sauvegarder si modifié
                if (hasChanged) {
                    try {
                        await question.save();
                        console.log('   💾 Sauvegardé');
                    } catch (error) {
                        console.log(`   ❌ Erreur sauvegarde: ${error.message}`);
                        this.stats.errors.push({
                            qid: question.qid,
                            error: error.message
                        });
                    }
                } else {
                    console.log('   ⚪ Aucune modification nécessaire');
                }
            }

            // Rapport final
            console.log('\n🎯 === RÉSUMÉ NORMALISATION COMPLÈTE ===');
            console.log(`📊 Questions traitées: ${this.stats.processed}`);
            console.log(`🎨 Options homogénéisées: ${this.stats.homogenized}`);
            console.log(`🔤 Alphabets forcés: ${this.stats.alphabetFixed}`);
            console.log(`👁️ Indices supprimés: ${this.stats.hintsRemoved}`);
            console.log(`📐 Repères ajoutés: ${this.stats.markersAdded}`);
            console.log(`❌ Erreurs: ${this.stats.errors.length}`);

            return this.stats;

        } finally {
            await this.disconnect();
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const normalizer = new CompleteNormalizer();
    
    normalizer.runCompleteNormalization()
        .then(stats => {
            console.log('\n🎉 Normalisation complète terminée !');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Erreur normalisation:', error);
            process.exit(1);
        });
}

module.exports = CompleteNormalizer;