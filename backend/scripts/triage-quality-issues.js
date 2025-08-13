#!/usr/bin/env node
/**
 * 🔍 TRIAGE AUTOMATIQUE DES PROBLÈMES DE QUALITÉ
 * ===============================================
 * 
 * Système de classification automatique des 52 questions non-uniques
 * avec étiquetage précis pour workflow d'assainissement systématique.
 * 
 * Tags d'erreur implémentés :
 * - alphabet_mismatch : énoncé/stimulus/options différents
 * - options_count_invalid : ≠4 options
 * - multiple_solutions : ≥2 options satisfont la règle
 * - no_solution : 0 option correcte
 * - symmetry_ambiguous : formes symétriques mal lisibles
 * - visible_hint : indice affiché par défaut
 * - decorative_colors : bruit couleurs en matrices
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const QuestionV2 = require('../models/QuestionV2');
const RuleEngine = require('./rule-engine');
require('dotenv').config();

class QualityTriage {
    constructor() {
        this.stats = {
            total: 0,
            issues: 0,
            clean: 0,
            tagCounts: {
                alphabet_mismatch: 0,
                options_count_invalid: 0,
                multiple_solutions: 0,
                no_solution: 0,
                symmetry_ambiguous: 0,
                visible_hint: 0,
                decorative_colors: 0
            }
        };
        this.issues = [];
    }

    async connect() {
        // URI pour exécution locale (hors container)
        const mongoUri = process.env.MONGODB_URI?.replace('mongo:', 'localhost:') || 'mongodb://localhost:27017/iq_test_db';
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connecté à MongoDB');
    }

    async disconnect() {
        await mongoose.disconnect();
        console.log('📌 Connexion fermée');
    }

    /**
     * Exécuter le triage complet
     */
    async runTriage() {
        console.log('🔍 === TRIAGE AUTOMATIQUE DES PROBLÈMES DE QUALITÉ ===\n');

        try {
            await this.connect();

            // Charger toutes les questions V2
            const questions = await QuestionV2.find({}).lean();
            this.stats.total = questions.length;

            console.log(`📊 ${questions.length} questions à analyser\n`);

            // Analyser chaque question
            for (const [index, question] of questions.entries()) {
                if ((index + 1) % 10 === 0) {
                    console.log(`🔄 Analyse ${index + 1}/${questions.length}...`);
                }

                const analysis = await this.analyzeQuestion(question);
                
                if (analysis.hasIssues) {
                    this.stats.issues++;
                    this.issues.push(analysis);
                    
                    // Compter les tags
                    analysis.tags.forEach(tag => {
                        if (this.stats.tagCounts[tag] !== undefined) {
                            this.stats.tagCounts[tag]++;
                        }
                    });
                } else {
                    this.stats.clean++;
                }
            }

            // Générer les rapports
            await this.generateReports();
            this.displaySummary();

            return {
                stats: this.stats,
                issues: this.issues
            };

        } finally {
            await this.disconnect();
        }
    }

    /**
     * Analyser une question individuelle
     */
    async analyzeQuestion(question) {
        const analysis = {
            qid: question.qid,
            version: question.version,
            questionIndex: question.questionIndex,
            content: question.content?.substring(0, 50) + '...',
            tags: [],
            reasons: [],
            hasIssues: false,
            severity: 'low'
        };

        // 1. Vérifier le nombre d'options
        if (!question.options || question.options.length !== 4) {
            analysis.tags.push('options_count_invalid');
            analysis.reasons.push(`${question.options?.length || 0} options au lieu de 4`);
            analysis.severity = 'high';
        }

        // 2. Vérifier la cohérence de l'alphabet
        const alphabetIssues = this.checkAlphabetConsistency(question);
        if (alphabetIssues.length > 0) {
            analysis.tags.push('alphabet_mismatch');
            analysis.reasons.push(...alphabetIssues);
            analysis.severity = 'medium';
        }

        // 3. Vérifier l'unicité de la solution avec le moteur de règles
        try {
            const ruleAnalysis = RuleEngine.analyzeQuestion(question);
            if (ruleAnalysis.analysis) {
                const validOptionsCount = ruleAnalysis.validOptions?.length || 0;
                const expectedAnswer = ruleAnalysis.expectedAnswer;
                
                if (validOptionsCount > 1) {
                    analysis.tags.push('multiple_solutions');
                    analysis.reasons.push(`${validOptionsCount} options satisfont la règle`);
                    analysis.severity = 'high';
                } else if (validOptionsCount === 0) {
                    analysis.tags.push('no_solution');
                    analysis.reasons.push('Aucune option ne satisfait la règle');
                    analysis.severity = 'high';
                } else if (validOptionsCount === 1 && question.correctAnswer !== expectedAnswer) {
                    analysis.tags.push('multiple_solutions');
                    analysis.reasons.push(`Réponse correcte incohérente (attendue: ${expectedAnswer}, déclarée: ${question.correctAnswer})`);
                    analysis.severity = 'high';
                }
            }
        } catch (error) {
            // Si l'analyse échoue, on considère que c'est un problème de règle non détectée
            analysis.tags.push('no_solution');
            analysis.reasons.push(`Règle non détectée: ${error.message}`);
            analysis.severity = 'medium';
        }

        // 4. Détecter les formes symétriques ambiguës
        const symmetryIssues = this.checkSymmetryAmbiguity(question);
        if (symmetryIssues.length > 0) {
            analysis.tags.push('symmetry_ambiguous');
            analysis.reasons.push(...symmetryIssues);
            analysis.severity = Math.max(analysis.severity, 'medium');
        }

        // 5. Détecter les indices visibles
        const hintIssues = this.checkVisibleHints(question);
        if (hintIssues.length > 0) {
            analysis.tags.push('visible_hint');
            analysis.reasons.push(...hintIssues);
            analysis.severity = 'medium';
        }

        // 6. Détecter les couleurs décoratives parasites
        const colorIssues = this.checkDecorativeColors(question);
        if (colorIssues.length > 0) {
            analysis.tags.push('decorative_colors');
            analysis.reasons.push(...colorIssues);
            analysis.severity = 'low';
        }

        analysis.hasIssues = analysis.tags.length > 0;
        return analysis;
    }

    /**
     * Vérifier la cohérence de l'alphabet
     */
    checkAlphabetConsistency(question) {
        const issues = [];
        const declaredAlphabet = question.alphabet;
        
        // Détecter l'alphabet depuis le contenu
        const contentAlphabet = this.detectAlphabetFromContent(question.content + ' ' + (question.stimulus || ''));
        
        if (declaredAlphabet !== contentAlphabet) {
            issues.push(`Alphabet déclaré '${declaredAlphabet}' ≠ détecté '${contentAlphabet}'`);
        }

        // Vérifier la cohérence avec les options
        if (question.options && question.options.length > 0) {
            for (const [idx, option] of question.options.entries()) {
                const optionAlphabet = this.detectAlphabetFromContent(option.text || '');
                if (optionAlphabet !== 'unknown' && optionAlphabet !== declaredAlphabet) {
                    issues.push(`Option ${option.key}: alphabet '${optionAlphabet}' ≠ '${declaredAlphabet}'`);
                }
            }
        }

        return issues;
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
     * Détecter les ambiguïtés de symétrie
     */
    checkSymmetryAmbiguity(question) {
        const issues = [];
        const content = (question.content || '') + ' ' + (question.stimulus || '');

        // Formes symétriques problématiques pour les rotations
        const symmetricShapes = [
            { pattern: /carré|□|■/, name: 'carré' },
            { pattern: /cercle|○|●/, name: 'cercle' },
            { pattern: /pentagone/i, name: 'pentagone' },
            { pattern: /heptagone/i, name: 'heptagone' }
        ];

        // Si question implique rotation et contient des formes symétriques
        const hasRotation = /rotation|tour|sens|horaire|degré|°/.test(content.toLowerCase());
        
        if (hasRotation) {
            for (const shape of symmetricShapes) {
                if (shape.pattern.test(content)) {
                    issues.push(`Rotation + ${shape.name} ambigu (pas de repère d'orientation)`);
                }
            }
        }

        // Matrices avec formes identiques mais orientation supposée différente
        if (question.type === 'raven' && /matrice|3×3|grille/.test(content.toLowerCase())) {
            const identicalShapePattern = /([◼◻▦▪⬛⬜□■●○⚫⚪])\s*\1\s*\1/;
            if (identicalShapePattern.test(content)) {
                issues.push('Matrice avec formes identiques (orientation ambiguë)');
            }
        }

        return issues;
    }

    /**
     * Détecter les indices visibles par défaut
     */
    checkVisibleHints(question) {
        const issues = [];
        const content = (question.content || '') + ' ' + (question.stimulus || '');

        // Mots-clés d'indices explicites
        const hintKeywords = [
            'indice', 'astuce', 'conseil', 'aide', 'solution',
            'méthode', 'technique', 'remarque', 'note',
            'attention', 'observez', 'notez que'
        ];

        for (const keyword of hintKeywords) {
            if (content.toLowerCase().includes(keyword)) {
                issues.push(`Indice visible : "${keyword}"`);
            }
        }

        // Explications trop détaillées dans l'énoncé
        if (content.includes('car ') || content.includes('parce que')) {
            issues.push('Explication causale dans énoncé (spoiler)');
        }

        // Formules mathématiques dans l'énoncé
        if (/\+\d|\-\d|\×\d|÷\d|=\d/.test(content)) {
            issues.push('Formule mathématique visible (indice calculation)');
        }

        return issues;
    }

    /**
     * Détecter les couleurs décoratives parasites
     */
    checkDecorativeColors(question) {
        const issues = [];
        const content = (question.content || '') + ' ' + (question.stimulus || '');

        // SVG avec couleurs multiples non fonctionnelles
        if (question.stimulus && question.stimulus.includes('<svg')) {
            const colorMatches = question.stimulus.match(/fill="[^"]*"/g) || [];
            const uniqueColors = new Set(colorMatches);
            
            if (uniqueColors.size > 2) {
                issues.push(`${uniqueColors.size} couleurs dans stimulus (distraction visuelle)`);
            }

            // Gradients décoratifs
            if (question.stimulus.includes('gradient') || question.stimulus.includes('linearGradient')) {
                issues.push('Gradients décoratifs (bruit visuel)');
            }
        }

        // Mention de couleurs non pertinentes dans énoncé
        const colorWords = ['rouge', 'bleu', 'vert', 'jaune', 'violet', 'orange', 'rose'];
        for (const color of colorWords) {
            if (content.toLowerCase().includes(color) && !content.toLowerCase().includes('couleur')) {
                issues.push(`Couleur "${color}" mentionnée (distraction)`);
            }
        }

        return issues;
    }

    /**
     * Générer les rapports CSV et JSON
     */
    async generateReports() {
        const timestamp = new Date().toISOString().split('T')[0];
        
        // Rapport CSV détaillé
        await this.generateCSVReport(timestamp);
        
        // Rapport JSON complet
        await this.generateJSONReport(timestamp);
        
        // Rapport de synthèse markdown
        await this.generateSummaryReport(timestamp);
    }

    /**
     * Générer le rapport CSV
     */
    async generateCSVReport(timestamp) {
        let csvContent = 'QID,Version,QuestionIndex,Tags,ShortReason,Severity,Content\n';
        
        for (const issue of this.issues) {
            const tagsStr = issue.tags.join(';');
            const reasonStr = issue.reasons.join(' | ').replace(/"/g, '""');
            const contentStr = (issue.content || '').replace(/"/g, '""');
            
            csvContent += `"${issue.qid}",${issue.version},${issue.questionIndex || 'N/A'},"${tagsStr}","${reasonStr}","${issue.severity}","${contentStr}"\n`;
        }
        
        const filePath = path.join(__dirname, `quality-issues-${timestamp}.csv`);
        await fs.writeFile(filePath, csvContent);
        console.log(`📊 Rapport CSV généré: ${filePath}`);
    }

    /**
     * Générer le rapport JSON complet
     */
    async generateJSONReport(timestamp) {
        const report = {
            metadata: {
                generatedAt: new Date().toISOString(),
                totalQuestions: this.stats.total,
                questionsWithIssues: this.stats.issues,
                cleanQuestions: this.stats.clean,
                version: '1.0'
            },
            tagStatistics: this.stats.tagCounts,
            severityDistribution: this.getSeverityDistribution(),
            issues: this.issues
        };
        
        const filePath = path.join(__dirname, `quality-report-${timestamp}.json`);
        await fs.writeFile(filePath, JSON.stringify(report, null, 2));
        console.log(`📋 Rapport JSON généré: ${filePath}`);
    }

    /**
     * Générer le rapport de synthèse
     */
    async generateSummaryReport(timestamp) {
        const severityDist = this.getSeverityDistribution();
        
        let markdownContent = `# 🔍 Rapport de Qualité des Questions - ${timestamp}\n\n`;
        markdownContent += `## 📊 Statistiques Générales\n\n`;
        markdownContent += `- **Total questions analysées**: ${this.stats.total}\n`;
        markdownContent += `- **Questions avec problèmes**: ${this.stats.issues} (${((this.stats.issues/this.stats.total)*100).toFixed(1)}%)\n`;
        markdownContent += `- **Questions propres**: ${this.stats.clean} (${((this.stats.clean/this.stats.total)*100).toFixed(1)}%)\n\n`;
        
        markdownContent += `## 🏷️ Répartition des Tags d'Erreur\n\n`;
        for (const [tag, count] of Object.entries(this.stats.tagCounts)) {
            if (count > 0) {
                markdownContent += `- **${tag}**: ${count} questions\n`;
            }
        }
        
        markdownContent += `\n## ⚠️ Répartition par Sévérité\n\n`;
        markdownContent += `- **Critique (high)**: ${severityDist.high} questions\n`;
        markdownContent += `- **Moyenne (medium)**: ${severityDist.medium} questions\n`;
        markdownContent += `- **Faible (low)**: ${severityDist.low} questions\n\n`;
        
        markdownContent += `## 🎯 Actions Prioritaires\n\n`;
        markdownContent += `1. **Traiter les ${severityDist.high} problèmes critiques** (multiple_solutions, no_solution, options_count_invalid)\n`;
        markdownContent += `2. **Corriger les ${this.stats.tagCounts.alphabet_mismatch} incohérences d'alphabet**\n`;
        markdownContent += `3. **Ajouter repères sur ${this.stats.tagCounts.symmetry_ambiguous} formes symétriques**\n`;
        markdownContent += `4. **Auto-fix ${this.stats.tagCounts.decorative_colors + this.stats.tagCounts.visible_hint} problèmes mineurs**\n`;
        
        const filePath = path.join(__dirname, `quality-summary-${timestamp}.md`);
        await fs.writeFile(filePath, markdownContent);
        console.log(`📝 Synthèse markdown générée: ${filePath}`);
    }

    /**
     * Calculer la distribution par sévérité
     */
    getSeverityDistribution() {
        const dist = { high: 0, medium: 0, low: 0 };
        for (const issue of this.issues) {
            dist[issue.severity]++;
        }
        return dist;
    }

    /**
     * Afficher le résumé en console
     */
    displaySummary() {
        console.log('\n🎯 === RÉSUMÉ DU TRIAGE ===');
        console.log(`📊 Total questions: ${this.stats.total}`);
        console.log(`❌ Avec problèmes: ${this.stats.issues}`);
        console.log(`✅ Propres: ${this.stats.clean}`);
        
        console.log('\n🏷️ Tags d\'erreur détectés:');
        for (const [tag, count] of Object.entries(this.stats.tagCounts)) {
            if (count > 0) {
                console.log(`   ${tag}: ${count}`);
            }
        }
        
        const severityDist = this.getSeverityDistribution();
        console.log('\n⚠️ Par sévérité:');
        console.log(`   Critique: ${severityDist.high}`);
        console.log(`   Moyenne: ${severityDist.medium}`);
        console.log(`   Faible: ${severityDist.low}`);
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const triage = new QualityTriage();
    
    triage.runTriage()
        .then(results => {
            console.log('\n🎉 Triage terminé avec succès !');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Erreur lors du triage:', error);
            process.exit(1);
        });
}

module.exports = QualityTriage;