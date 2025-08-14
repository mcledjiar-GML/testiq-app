#!/usr/bin/env node
/**
 * 📊 POST-CANARY CHECK (48h)
 * ==========================
 * 
 * Vérifications post-déploiement 48h après canary 100% :
 * - Zéro indice visible détecté
 * - Répartition positions A/B/C/D ≈ 25% ±2%
 * - Disponibilité ≥ 99.9%
 * - Rapport canary 1 page
 */

const QuestionV2 = require('../models/QuestionV2');

class PostCanaryChecker {
    
    constructor() {
        this.results = {
            visibleHints: { detected: 0, issues: [] },
            positionDistribution: { balanced: false, distribution: {} },
            availability: { percentage: 0, compliant: false },
            alerts: { critical: 0, recurring: [] },
            summary: { allGreen: false, recommendations: [] }
        };
    }
    
    /**
     * Vérifier zéro indice visible en production
     */
    async checkVisibleHints() {
        console.log('🔍 Vérification indices visibles...');
        
        const questions = await QuestionV2.find({ 
            state: 'published',
            updatedAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) } // 48h
        }).lean();
        
        const hintPatterns = [
            /\b(réponse|solution|correct)\b/gi,
            /^\s*[A-D]\s*[:.]|\([A-D]\)/gm,
            /\b[A-D]\s+(est|=)\s+(correct|vrai|faux)/gi,
            /(attention|note|indice|hint)\s*:/gi,
            /bonne\s+réponse/gi
        ];
        
        let detectedCount = 0;
        
        questions.forEach(question => {
            let hasHint = false;
            
            // Vérifier contenu principal
            if (question.content) {
                hintPatterns.forEach(pattern => {
                    if (pattern.test(question.content)) {
                        hasHint = true;
                    }
                });
            }
            
            // Vérifier options
            if (question.options) {
                question.options.forEach((option, index) => {
                    if (option.content) {
                        hintPatterns.forEach(pattern => {
                            if (pattern.test(option.content)) {
                                hasHint = true;
                            }
                        });
                    }
                });
            }
            
            if (hasHint) {
                detectedCount++;
                this.results.visibleHints.issues.push({
                    qid: question.qid,
                    version: question.version,
                    locale: question.locale
                });
            }
        });
        
        this.results.visibleHints.detected = detectedCount;
        
        console.log(`${detectedCount === 0 ? '✅' : '❌'} Indices visibles: ${detectedCount} détectés`);
        
        return detectedCount === 0;
    }
    
    /**
     * Vérifier répartition positions A/B/C/D
     */
    async checkPositionDistribution() {
        console.log('📊 Vérification répartition positions...');
        
        const questions = await QuestionV2.find({ 
            state: 'published' 
        }).lean();
        
        const positionCounts = { A: 0, B: 0, C: 0, D: 0 };
        let totalWithCorrect = 0;
        
        questions.forEach(question => {
            if (question.options && question.options.length === 4) {
                const correctIndex = question.options.findIndex(opt => opt.isCorrect);
                if (correctIndex !== -1) {
                    const position = ['A', 'B', 'C', 'D'][correctIndex];
                    positionCounts[position]++;
                    totalWithCorrect++;
                }
            }
        });
        
        const distribution = {};
        let isBalanced = true;
        
        ['A', 'B', 'C', 'D'].forEach(pos => {
            const percentage = totalWithCorrect > 0 ? (positionCounts[pos] / totalWithCorrect) * 100 : 0;
            distribution[pos] = {
                count: positionCounts[pos],
                percentage: parseFloat(percentage.toFixed(1))
            };
            
            // Vérifier ±2% de 25%
            if (Math.abs(percentage - 25) > 2) {
                isBalanced = false;
            }
        });
        
        this.results.positionDistribution = {
            balanced: isBalanced,
            distribution,
            totalQuestions: totalWithCorrect
        };
        
        console.log(`${isBalanced ? '✅' : '❌'} Répartition équilibrée: ${isBalanced ? 'OUI' : 'NON'}`);
        console.log(`   A: ${distribution.A.percentage}% B: ${distribution.B.percentage}% C: ${distribution.C.percentage}% D: ${distribution.D.percentage}%`);
        
        return isBalanced;
    }
    
    /**
     * Vérifier disponibilité ≥ 99.9%
     */
    async checkAvailability() {
        console.log('📈 Vérification disponibilité...');
        
        try {
            const sloMonitoring = global.sloMonitoring;
            if (!sloMonitoring) {
                console.log('⚠️ SLO monitoring non disponible');
                return false;
            }
            
            const evaluation = sloMonitoring.evaluateSLOs();
            const availabilitySLO = evaluation.slos.availability;
            
            const percentage = availabilitySLO ? availabilitySLO.current : 0;
            const compliant = percentage >= 99.9;
            
            this.results.availability = {
                percentage: parseFloat(percentage.toFixed(3)),
                compliant,
                target: 99.9
            };
            
            console.log(`${compliant ? '✅' : '❌'} Disponibilité: ${percentage.toFixed(3)}% (≥99.9% requis)`);
            
            return compliant;
            
        } catch (error) {
            console.error('❌ Erreur vérification disponibilité:', error.message);
            this.results.availability = { error: error.message };
            return false;
        }
    }
    
    /**
     * Vérifier alertes critiques récurrentes
     */
    async checkCriticalAlerts() {
        console.log('🚨 Vérification alertes critiques...');
        
        try {
            const monitoringSystem = global.monitoringSystem;
            if (!monitoringSystem) {
                console.log('⚠️ Monitoring system non disponible');
                return true; // Pas d'alertes = OK
            }
            
            const activeAlerts = Array.from(monitoringSystem.alerts?.activeAlerts || []);
            const criticalAlerts = activeAlerts.filter(alert => 
                alert.severity === 'critical' || alert.severity === 'emergency'
            );
            
            // Identifier alertes récurrentes (> 3 occurrences en 48h)
            const alertCounts = {};
            criticalAlerts.forEach(alert => {
                const key = alert.type || alert.message;
                alertCounts[key] = (alertCounts[key] || 0) + 1;
            });
            
            const recurringAlerts = Object.entries(alertCounts)
                .filter(([_, count]) => count > 3)
                .map(([type, count]) => ({ type, count }));
            
            this.results.alerts = {
                critical: criticalAlerts.length,
                recurring: recurringAlerts,
                total: activeAlerts.length
            };
            
            const hasRecurring = recurringAlerts.length > 0;
            console.log(`${!hasRecurring ? '✅' : '❌'} Alertes récurrentes: ${recurringAlerts.length}`);
            
            if (hasRecurring) {
                recurringAlerts.forEach(alert => {
                    console.log(`   • ${alert.type}: ${alert.count} occurrences`);
                });
            }
            
            return !hasRecurring;
            
        } catch (error) {
            console.error('❌ Erreur vérification alertes:', error.message);
            return false;
        }
    }
    
    /**
     * Générer rapport canary 1 page
     */
    generateCanaryReport() {
        const checks = [
            { name: 'Indices visibles', passed: this.results.visibleHints.detected === 0 },
            { name: 'Répartition positions', passed: this.results.positionDistribution.balanced },
            { name: 'Disponibilité ≥99.9%', passed: this.results.availability.compliant },
            { name: 'Pas d\'alertes récurrentes', passed: this.results.alerts.recurring.length === 0 }
        ];
        
        const allGreen = checks.every(check => check.passed);
        
        const report = {
            timestamp: new Date().toISOString(),
            deployment: 'TestIQ v5.0 Canary → Production',
            duration: '48h post-deployment',
            status: allGreen ? 'SUCCESS' : 'ISSUES_DETECTED',
            
            summary: {
                allChecks: allGreen,
                totalChecks: checks.length,
                passedChecks: checks.filter(c => c.passed).length
            },
            
            checks: checks.map(check => ({
                name: check.name,
                status: check.passed ? 'PASS' : 'FAIL',
                passed: check.passed
            })),
            
            details: {
                visibleHints: this.results.visibleHints,
                positionDistribution: this.results.positionDistribution,
                availability: this.results.availability,
                alerts: this.results.alerts
            },
            
            recommendations: this.generateRecommendations(allGreen, checks),
            
            nextSteps: allGreen ? [
                'Déploiement canary considéré comme réussi',
                'Surveillance continue recommandée',
                'Planifier prochaine release dans 2-4 semaines'
            ] : [
                'Investiguer problèmes identifiés',
                'Corriger avant prochaine release', 
                'Renforcer tests pré-déploiement'
            ]
        };
        
        this.results.summary = {
            allGreen,
            report,
            recommendations: report.recommendations
        };
        
        return report;
    }
    
    /**
     * Générer recommandations
     */
    generateRecommendations(allGreen, checks) {
        const recommendations = [];
        
        if (allGreen) {
            recommendations.push('✅ Déploiement canary réussi - Tous critères respectés');
            recommendations.push('🎯 Maintenir surveillance continue des métriques');
            recommendations.push('📊 Analyser les patterns d\'usage après 1 semaine');
        } else {
            checks.forEach(check => {
                if (!check.passed) {
                    switch (check.name) {
                        case 'Indices visibles':
                            recommendations.push('🔧 Nettoyer indices visibles détectés');
                            break;
                        case 'Répartition positions':
                            recommendations.push('🎲 Réajuster randomisation positions correctes');
                            break;
                        case 'Disponibilité ≥99.9%':
                            recommendations.push('⚡ Optimiser performance pour atteindre SLO');
                            break;
                        case 'Pas d\'alertes récurrentes':
                            recommendations.push('🚨 Investiguer causes alertes récurrentes');
                            break;
                    }
                }
            });
        }
        
        return recommendations;
    }
    
    /**
     * Afficher résultats console
     */
    displayResults() {
        console.log('\n📊 === RAPPORT POST-CANARY 48H ===');
        
        const report = this.results.summary.report;
        
        console.log(`\n🎯 Status: ${report.status}`);
        console.log(`✅ Checks réussis: ${report.summary.passedChecks}/${report.summary.totalChecks}`);
        
        console.log('\n📋 DÉTAILS:');
        report.checks.forEach(check => {
            const icon = check.passed ? '✅' : '❌';
            console.log(`${icon} ${check.name}: ${check.status}`);
        });
        
        if (this.results.visibleHints.detected > 0) {
            console.log(`\n⚠️ Indices visibles: ${this.results.visibleHints.detected} détectés`);
            this.results.visibleHints.issues.slice(0, 3).forEach(issue => {
                console.log(`   • Q${issue.qid} (${issue.locale})`);
            });
        }
        
        if (!this.results.positionDistribution.balanced) {
            console.log('\n⚠️ Déséquilibre positions:');
            Object.entries(this.results.positionDistribution.distribution).forEach(([pos, data]) => {
                const deviation = Math.abs(data.percentage - 25);
                if (deviation > 2) {
                    console.log(`   • Position ${pos}: ${data.percentage}% (±${deviation.toFixed(1)}% de 25%)`);
                }
            });
        }
        
        console.log('\n💡 RECOMMANDATIONS:');
        report.recommendations.forEach(rec => {
            console.log(`   ${rec}`);
        });
        
        console.log('\n🚀 PROCHAINES ÉTAPES:');
        report.nextSteps.forEach(step => {
            console.log(`   • ${step}`);
        });
        
        return this.results.summary.allGreen;
    }
    
    /**
     * Exécution complète
     */
    async run() {
        console.log('📊 === POST-CANARY CHECK 48H ===\n');
        
        try {
            await this.checkVisibleHints();
            await this.checkPositionDistribution();
            await this.checkAvailability();
            await this.checkCriticalAlerts();
            
            this.generateCanaryReport();
            const success = this.displayResults();
            
            return { success, results: this.results };
            
        } catch (error) {
            console.error('💥 Erreur post-canary check:', error.message);
            throw error;
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const checker = new PostCanaryChecker();
    
    checker.run()
        .then(({ success }) => {
            console.log(`\n🎯 ${success ? '✅ CANARY VALIDÉ' : '❌ PROBLÈMES DÉTECTÉS'}`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur:', error);
            process.exit(1);
        });
}

module.exports = PostCanaryChecker;