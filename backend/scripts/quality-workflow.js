#!/usr/bin/env node
/**
 * 📋 WORKFLOW COMPLET D'ASSAINISSEMENT QUALITÉ
 * ============================================
 * 
 * Pipeline automatisé pour améliorer la qualité des questions :
 * 1. Triage initial → identification des problèmes
 * 2. Auto-fix → corrections automatiques
 * 3. Triage final → mesure d'amélioration
 * 4. Rapport de progression
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const QualityTriage = require('./triage-quality-issues');
const QualityAutoFix = require('./auto-fix-quality');
require('dotenv').config();

class QualityWorkflow {
    constructor() {
        this.results = {
            initial: null,
            autoFix: null,
            final: null,
            improvement: {}
        };
    }

    async connect() {
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
     * Exécuter le workflow complet d'assainissement
     */
    async runCompleteWorkflow() {
        console.log('📋 === WORKFLOW COMPLET D\'ASSAINISSEMENT QUALITÉ ===\n');

        try {
            await this.connect();

            // Étape 1: Triage initial
            console.log('1️⃣ TRIAGE INITIAL - Identification des problèmes');
            console.log('=' .repeat(50));
            const initialTriage = new QualityTriage();
            this.results.initial = await initialTriage.runTriage();
            console.log('✅ Triage initial terminé\n');

            // Étape 2: Auto-fix
            console.log('2️⃣ AUTO-FIX - Corrections automatiques');
            console.log('=' .repeat(50));
            const autoFix = new QualityAutoFix();
            this.results.autoFix = await autoFix.runAutoFix({ all: true });
            console.log('✅ Auto-fix terminé\n');

            // Étape 3: Triage final pour mesurer l'amélioration
            console.log('3️⃣ TRIAGE FINAL - Mesure d\'amélioration');
            console.log('=' .repeat(50));
            const finalTriage = new QualityTriage();
            this.results.final = await finalTriage.runTriage();
            console.log('✅ Triage final terminé\n');

            // Étape 4: Calcul des améliorations
            this.calculateImprovements();

            // Étape 5: Rapport final
            await this.generateComprehensiveReport();
            this.displayFinalSummary();

            return this.results;

        } finally {
            await this.disconnect();
        }
    }

    /**
     * Calculer les améliorations entre avant/après
     */
    calculateImprovements() {
        const initial = this.results.initial.stats;
        const final = this.results.final.stats;

        this.results.improvement = {
            questionsFixed: initial.issues - final.issues,
            percentageImprovement: ((initial.issues - final.issues) / initial.issues * 100).toFixed(1),
            tagImprovements: {}
        };

        // Amélioration par tag
        for (const [tag, initialCount] of Object.entries(initial.tagCounts)) {
            const finalCount = final.tagCounts[tag] || 0;
            const improvement = initialCount - finalCount;
            
            if (improvement > 0) {
                this.results.improvement.tagImprovements[tag] = {
                    before: initialCount,
                    after: finalCount,
                    fixed: improvement,
                    percentageFixed: ((improvement / initialCount) * 100).toFixed(1)
                };
            }
        }
    }

    /**
     * Générer un rapport complet de progression
     */
    async generateComprehensiveReport() {
        const timestamp = new Date().toISOString().split('T')[0];
        
        // Rapport markdown détaillé
        let report = `# 📋 Rapport Complet d'Assainissement Qualité - ${timestamp}\n\n`;
        
        // Section 1: Vue d'ensemble
        report += `## 🎯 Vue d'Ensemble\n\n`;
        report += `### Résultats Globaux\n`;
        report += `- **Questions traitées**: ${this.results.initial.stats.total}\n`;
        report += `- **Problèmes initiaux**: ${this.results.initial.stats.issues}\n`;
        report += `- **Problèmes restants**: ${this.results.final.stats.issues}\n`;
        report += `- **Questions corrigées**: ${this.results.improvement.questionsFixed}\n`;
        report += `- **Amélioration**: ${this.results.improvement.percentageImprovement}%\n\n`;

        // Section 2: Détail des corrections automatiques
        report += `### 🛠️ Corrections Automatiques Appliquées\n`;
        const autoFixStats = this.results.autoFix.fixes;
        for (const [fix, count] of Object.entries(autoFixStats)) {
            if (count > 0) {
                report += `- **${fix}**: ${count} corrections\n`;
            }
        }
        report += `\n`;

        // Section 3: Amélioration par catégorie
        report += `## 📊 Amélioration par Catégorie de Problème\n\n`;
        for (const [tag, improvement] of Object.entries(this.results.improvement.tagImprovements)) {
            report += `### ${tag}\n`;
            report += `- **Avant**: ${improvement.before} questions\n`;
            report += `- **Après**: ${improvement.after} questions\n`;
            report += `- **Corrigées**: ${improvement.fixed} (${improvement.percentageFixed}%)\n\n`;
        }

        // Section 4: Problèmes restants prioritaires
        report += `## ⚠️ Problèmes Restants (Action Manuelle Requise)\n\n`;
        const finalTagCounts = this.results.final.stats.tagCounts;
        const criticalTags = ['multiple_solutions', 'no_solution', 'options_count_invalid'];
        
        for (const tag of criticalTags) {
            const count = finalTagCounts[tag] || 0;
            if (count > 0) {
                report += `### 🚨 ${tag} (${count} questions)\n`;
                report += `**Action requise**: Révision manuelle et correction par un expert.\n\n`;
            }
        }

        // Section 5: Prochaines étapes recommandées
        report += `## 🚀 Prochaines Étapes Recommandées\n\n`;
        report += `1. **Révision manuelle** des ${this.results.final.stats.issues} questions restantes\n`;
        report += `2. **Implémentation DSL** pour construction règles → grilles\n`;
        report += `3. **Validation API** pour empêcher nouvelles incohérences\n`;
        report += `4. **Tests automatisés** intégrés au pipeline CI/CD\n`;
        report += `5. **Monitoring qualité** en temps réel\n\n`;

        // Section 6: Métriques de performance
        report += `## 📈 Métriques de Performance\n\n`;
        report += `- **Taux de questions propres**: ${((this.results.final.stats.clean / this.results.final.stats.total) * 100).toFixed(1)}%\n`;
        report += `- **Questions avec problèmes critiques**: ${(finalTagCounts.multiple_solutions || 0) + (finalTagCounts.no_solution || 0)}\n`;
        report += `- **Questions avec problèmes moyens**: ${Object.entries(finalTagCounts).filter(([tag, count]) => !criticalTags.includes(tag) && count > 0).reduce((sum, [, count]) => sum + count, 0)}\n`;

        const filePath = path.join(__dirname, `quality-workflow-report-${timestamp}.md`);
        await fs.writeFile(filePath, report);
        console.log(`📋 Rapport complet généré: ${filePath}`);
    }

    /**
     * Afficher le résumé final en console
     */
    displayFinalSummary() {
        console.log('\n🎉 === RÉSUMÉ FINAL DU WORKFLOW ===');
        console.log(`📊 Questions analysées: ${this.results.initial.stats.total}`);
        console.log(`❌ Problèmes initiaux: ${this.results.initial.stats.issues}`);
        console.log(`✅ Problèmes corrigés: ${this.results.improvement.questionsFixed}`);
        console.log(`🎯 Amélioration: ${this.results.improvement.percentageImprovement}%`);
        console.log(`⚠️  Problèmes restants: ${this.results.final.stats.issues}`);
        
        console.log('\n🛠️ Corrections appliquées:');
        for (const [fix, count] of Object.entries(this.results.autoFix.fixes)) {
            if (count > 0) {
                console.log(`   ${fix}: ${count}`);
            }
        }

        console.log('\n📊 Top améliorations par catégorie:');
        const topImprovements = Object.entries(this.results.improvement.tagImprovements)
            .sort(([, a], [, b]) => b.fixed - a.fixed)
            .slice(0, 3);
        
        for (const [tag, improvement] of topImprovements) {
            console.log(`   ${tag}: ${improvement.fixed} questions corrigées (${improvement.percentageFixed}%)`);
        }

        if (this.results.final.stats.issues === 0) {
            console.log('\n🎉 PARFAIT ! Toutes les questions sont maintenant propres !');
        } else {
            console.log(`\n🎯 Objectif: Corriger les ${this.results.final.stats.issues} questions restantes`);
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const workflow = new QualityWorkflow();
    
    workflow.runCompleteWorkflow()
        .then(() => {
            console.log('\n🎉 Workflow complet terminé avec succès !');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Erreur dans le workflow:', error);
            process.exit(1);
        });
}

module.exports = QualityWorkflow;