#!/usr/bin/env node
/**
 * 📊 VÉRIFICATION DU SEUIL DE VALIDATION
 * =====================================
 * 
 * Vérifie que ≥95% des items sont "validés" avec 0 erreurs "major"
 * selon les critères de qualité définis.
 * 
 * Critères de validation :
 * - Exactement 4 options avec 1 réponse correcte ✅
 * - Alphabet cohérent ✅
 * - Solution unique vérifiée ✅
 * - Aucun indice visible ✅
 * - Homogénéité des options ✅
 * - Accessibilité OK ✅
 */

const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');
const QuestionValidator = require('../middleware/question-validation');
const QualityGate = require('../middleware/quality-gate');
const fs = require('fs').promises;
const path = require('path');

// Charger la configuration
require('dotenv').config();

class ValidationThresholdChecker {
    constructor() {
        this.results = {
            total: 0,
            validated: 0,
            validationRate: 0,
            meets95Threshold: false,
            majorIssues: 0,
            criticalIssues: 0,
            breakdown: {
                optionsValid: 0,
                alphabetValid: 0,
                solutionValid: 0,
                hintsValid: 0,
                homogeneous: 0,
                accessible: 0
            },
            issues: []
        };
    }

    async connect() {
        try {
            const mongoUri = process.env.MONGODB_URI?.replace('mongo:', 'localhost:') || 'mongodb://localhost:27017/iq_test_db';
            await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('✅ Connecté à MongoDB');
        } catch (error) {
            console.error('❌ Erreur de connexion MongoDB:', error);
            process.exit(1);
        }
    }

    async disconnect() {
        await mongoose.disconnect();
        console.log('📌 Connexion MongoDB fermée');
    }

    /**
     * Valider une question selon tous les critères
     */
    async validateQuestion(question) {
        const validation = {
            qid: question.qid,
            version: question.version,
            isValid: true,
            issues: [],
            majorIssues: [],
            criticalIssues: [],
            checks: {
                optionsValid: false,
                alphabetValid: false,
                solutionValid: false,
                hintsValid: false,
                homogeneous: false,
                accessible: false
            }
        };

        try {
            // Utiliser le QualityGate pour la validation complète
            const gateResult = await QualityGate.runQualityChecks(question);
            
            // Analyser les résultats
            for (const check of gateResult.results) {
                switch (check.name) {
                    case 'Options Count':
                    case 'Exactly One Correct':
                        validation.checks.optionsValid = check.passed;
                        if (!check.passed) {
                            validation.issues.push(`Options: ${check.message}`);
                            if (check.severity === 'blocker') {
                                validation.criticalIssues.push(check.message);
                            }
                        }
                        break;
                        
                    case 'Alphabet Consistent':
                        validation.checks.alphabetValid = check.passed;
                        if (!check.passed) {
                            validation.issues.push(`Alphabet: ${check.message}`);
                            if (check.severity === 'blocker' || check.severity === 'major') {
                                validation.majorIssues.push(check.message);
                            }
                        }
                        break;
                        
                    case 'Solution Unique':
                        validation.checks.solutionValid = check.passed;
                        if (!check.passed) {
                            validation.issues.push(`Solution: ${check.message}`);
                            if (check.severity === 'blocker') {
                                validation.criticalIssues.push(check.message);
                            }
                        }
                        break;
                        
                    case 'No Visible Hints':
                        validation.checks.hintsValid = check.passed;
                        if (!check.passed) {
                            validation.issues.push(`Indices: ${check.message}`);
                            if (check.severity === 'major') {
                                validation.majorIssues.push(check.message);
                            }
                        }
                        break;
                        
                    case 'Options Homogeneous':
                        validation.checks.homogeneous = check.passed;
                        if (!check.passed) {
                            validation.issues.push(`Homogénéité: ${check.message}`);
                        }
                        break;
                        
                    case 'Options Alt Text':
                        validation.checks.accessible = check.passed;
                        if (!check.passed) {
                            validation.issues.push(`Accessibilité: ${check.message}`);
                            if (check.severity === 'major') {
                                validation.majorIssues.push(check.message);
                            }
                        }
                        break;
                }
            }

            // Question validée si :
            // 1. Tous les checks critiques passent (options, solution)
            // 2. Aucune erreur major bloquante
            validation.isValid = gateResult.passed && validation.majorIssues.length === 0;

        } catch (error) {
            validation.isValid = false;
            validation.criticalIssues.push(`Erreur validation: ${error.message}`);
        }

        return validation;
    }

    /**
     * Analyser toutes les questions publiées
     */
    async analyzeAllQuestions() {
        console.log('📊 === ANALYSE DU SEUIL DE VALIDATION ===\n');

        const questions = await QuestionV2.find({ state: 'published' }).lean();
        console.log(`📋 ${questions.length} questions publiées à analyser\n`);

        this.results.total = questions.length;

        for (const question of questions) {
            const validation = await this.validateQuestion(question);
            
            if (validation.isValid) {
                this.results.validated++;
                
                // Compter les succès par catégorie
                if (validation.checks.optionsValid) this.results.breakdown.optionsValid++;
                if (validation.checks.alphabetValid) this.results.breakdown.alphabetValid++;
                if (validation.checks.solutionValid) this.results.breakdown.solutionValid++;
                if (validation.checks.hintsValid) this.results.breakdown.hintsValid++;
                if (validation.checks.homogeneous) this.results.breakdown.homogeneous++;
                if (validation.checks.accessible) this.results.breakdown.accessible++;
            } else {
                // Ajouter aux problèmes
                this.results.issues.push({
                    qid: validation.qid,
                    version: validation.version,
                    content: question.content.substring(0, 80) + '...',
                    issues: validation.issues,
                    majorIssues: validation.majorIssues,
                    criticalIssues: validation.criticalIssues,
                    checks: validation.checks
                });

                this.results.majorIssues += validation.majorIssues.length;
                this.results.criticalIssues += validation.criticalIssues.length;
            }
        }

        // Calculer le taux de validation
        this.results.validationRate = this.results.total > 0 
            ? (this.results.validated / this.results.total) * 100 
            : 0;
        
        this.results.meets95Threshold = this.results.validationRate >= 95;

        return this.results;
    }

    /**
     * Générer un rapport détaillé
     */
    generateReport() {
        console.log('🎯 === RÉSULTATS DE VALIDATION ===');
        console.log(`📊 Questions validées: ${this.results.validated}/${this.results.total} (${this.results.validationRate.toFixed(1)}%)`);
        console.log(`🎯 Seuil 95%: ${this.results.meets95Threshold ? '✅ ATTEINT' : '❌ NON ATTEINT'}`);
        console.log(`🚨 Erreurs major: ${this.results.majorIssues}`);
        console.log(`💥 Erreurs critiques: ${this.results.criticalIssues}`);

        console.log('\n📋 Détail par catégorie:');
        Object.entries(this.results.breakdown).forEach(([category, count]) => {
            const percentage = this.results.total > 0 ? (count / this.results.total) * 100 : 0;
            console.log(`   ${category}: ${count}/${this.results.total} (${percentage.toFixed(1)}%)`);
        });

        if (this.results.issues.length > 0) {
            console.log(`\n📋 ${this.results.issues.length} questions avec problèmes:`);
            this.results.issues.slice(0, 10).forEach((issue, idx) => {
                console.log(`\n${idx + 1}. ${issue.qid}:`);
                console.log(`   Content: ${issue.content}`);
                if (issue.criticalIssues.length > 0) {
                    console.log(`   🚨 Critiques: ${issue.criticalIssues.join(', ')}`);
                }
                if (issue.majorIssues.length > 0) {
                    console.log(`   ⚠️  Majeures: ${issue.majorIssues.join(', ')}`);
                }
            });

            if (this.results.issues.length > 10) {
                console.log(`   ... et ${this.results.issues.length - 10} autres`);
            }
        }

        return this.results;
    }

    /**
     * Sauvegarder le rapport
     */
    async saveReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.total,
                validated: this.results.validated,
                validationRate: `${this.results.validationRate.toFixed(1)}%`,
                meets95Threshold: this.results.meets95Threshold,
                majorIssues: this.results.majorIssues,
                criticalIssues: this.results.criticalIssues
            },
            breakdown: this.results.breakdown,
            issues: this.results.issues,
            readyForProduction: this.results.meets95Threshold && this.results.majorIssues === 0
        };

        const filePath = path.join(__dirname, 'validation-threshold-report.json');
        await fs.writeFile(filePath, JSON.stringify(report, null, 2));
        console.log(`\n💾 Rapport sauvegardé: ${filePath}`);

        return report;
    }

    /**
     * Action prioritaire : identifier les quick wins
     */
    identifyQuickWins() {
        if (this.results.issues.length === 0) return;

        console.log('\n🚀 === QUICK WINS IDENTIFIÉS ===');
        
        const quickWins = {
            alphabetFixes: [],
            optionFixes: [],
            accessibilityFixes: []
        };

        for (const issue of this.results.issues) {
            // Problèmes d'alphabet (fix automatique possible)
            if (issue.majorIssues.some(msg => msg.includes('alphabet'))) {
                quickWins.alphabetFixes.push(issue.qid);
            }
            
            // Problèmes d'options (review requise)
            if (issue.criticalIssues.some(msg => msg.includes('option'))) {
                quickWins.optionFixes.push(issue.qid);
            }
            
            // Problèmes d'accessibilité (alt-text manquant)
            if (issue.majorIssues.some(msg => msg.includes('alt-text'))) {
                quickWins.accessibilityFixes.push(issue.qid);
            }
        }

        if (quickWins.alphabetFixes.length > 0) {
            console.log(`🔧 ${quickWins.alphabetFixes.length} questions avec alphabet à corriger (automatique)`);
            console.log('   Action: node scripts/fix-alphabet-inconsistencies.js');
        }

        if (quickWins.accessibilityFixes.length > 0) {
            console.log(`♿ ${quickWins.accessibilityFixes.length} questions sans alt-text (ajout requis)`);
        }

        if (quickWins.optionFixes.length > 0) {
            console.log(`⚠️  ${quickWins.optionFixes.length} questions avec problèmes d'options (review manuelle)`);
        }

        return quickWins;
    }

    /**
     * Exécution complète
     */
    async run() {
        try {
            await this.connect();
            await this.analyzeAllQuestions();
            this.generateReport();
            await this.saveReport();
            this.identifyQuickWins();

            console.log('\n🎯 === RECOMMANDATIONS ===');
            if (this.results.meets95Threshold) {
                console.log('✅ Seuil de 95% atteint - Prêt pour production !');
                if (this.results.majorIssues > 0) {
                    console.log(`⚠️  Attention: ${this.results.majorIssues} erreurs major à corriger`);
                }
            } else {
                const missing = Math.ceil(this.results.total * 0.95) - this.results.validated;
                console.log(`❌ ${missing} questions supplémentaires doivent être validées`);
                console.log('🔧 Prioriser la correction des quick wins identifiés ci-dessus');
            }

            return this.results;

        } finally {
            await this.disconnect();
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const checker = new ValidationThresholdChecker();
    
    checker.run()
        .then(results => {
            const success = results.meets95Threshold && results.majorIssues === 0;
            console.log(`\n${success ? '✅' : '❌'} Validation threshold check completed`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur:', error);
            process.exit(1);
        });
}

module.exports = ValidationThresholdChecker;