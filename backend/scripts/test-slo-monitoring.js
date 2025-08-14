#!/usr/bin/env node
/**
 * 📊 TEST SLO MONITORING & ALERTING
 * =================================
 * 
 * Tests du système SLO avec seuils d'alertes :
 * - Configuration et évaluation des SLO
 * - Budget d'erreur et burn rate
 * - Système d'alertes multi-niveaux
 * - Collecte et historique SLI
 */

const SLOMonitoring = require('../middleware/slo-monitoring');

class SLOMonitoringTester {
    
    constructor() {
        this.slo = new SLOMonitoring();
        this.results = {
            sloEvaluation: { passed: 0, failed: 0, details: [] },
            budgetManagement: { passed: 0, failed: 0, details: [] },
            alerting: { passed: 0, failed: 0, details: [] },
            metricsCollection: { passed: 0, failed: 0, details: [] },
            overall: { passed: 0, failed: 0, total: 0 }
        };
    }
    
    /**
     * Test 1: Évaluation des SLO
     */
    testSLOEvaluation() {
        console.log('📊 Test 1: Évaluation des SLO...');
        
        try {
            // Test 1.1: Configuration SLO
            const config = this.slo.config.slos;
            const requiredSLOs = ['availability', 'latency', 'errorRate', 'throughput'];
            const configuredSLOs = Object.keys(config);
            
            const hasAllSLOs = requiredSLOs.every(slo => configuredSLOs.includes(slo));
            const hasValidTargets = Object.values(config).every(slo => 
                slo.target > 0 && slo.target <= 100
            );
            
            if (hasAllSLOs && hasValidTargets) {
                this.results.sloEvaluation.passed++;
                this.results.sloEvaluation.details.push({
                    test: 'SLO configuration',
                    status: 'PASS',
                    sloCount: configuredSLOs.length,
                    requiredSLOs: requiredSLOs.length,
                    message: 'Configuration SLO complète et valide'
                });
            } else {
                this.results.sloEvaluation.failed++;
                this.results.sloEvaluation.details.push({
                    test: 'SLO configuration',
                    status: 'FAIL',
                    error: 'Configuration SLO incomplète ou invalide'
                });
            }
            
            // Test 1.2: Évaluation SLO
            const evaluation = this.slo.evaluateSLOs();
            
            if (evaluation &&
                evaluation.timestamp &&
                evaluation.slos &&
                Object.keys(evaluation.slos).length === requiredSLOs.length) {
                this.results.sloEvaluation.passed++;
                this.results.sloEvaluation.details.push({
                    test: 'SLO evaluation execution',
                    status: 'PASS',
                    evaluatedSLOs: Object.keys(evaluation.slos).length,
                    timestamp: evaluation.timestamp,
                    message: 'Évaluation SLO exécutée correctement'
                });
            } else {
                this.results.sloEvaluation.failed++;
                this.results.sloEvaluation.details.push({
                    test: 'SLO evaluation execution',
                    status: 'FAIL',
                    error: 'Évaluation SLO échouée'
                });
            }
            
            // Test 1.3: Conformité SLO
            const compliantSLOs = Object.values(evaluation.slos).filter(slo => slo.compliant);
            const totalSLOs = Object.values(evaluation.slos);
            
            // Vérifier la structure des résultats
            const hasValidStructure = totalSLOs.every(slo => 
                slo.hasOwnProperty('slo') &&
                slo.hasOwnProperty('target') &&
                slo.hasOwnProperty('current') &&
                slo.hasOwnProperty('compliant')
            );
            
            if (hasValidStructure) {
                this.results.sloEvaluation.passed++;
                this.results.sloEvaluation.details.push({
                    test: 'SLO compliance structure',
                    status: 'PASS',
                    compliantCount: compliantSLOs.length,
                    totalCount: totalSLOs.length,
                    complianceRate: `${((compliantSLOs.length / totalSLOs.length) * 100).toFixed(1)}%`,
                    message: 'Structure des résultats SLO valide'
                });
            } else {
                this.results.sloEvaluation.failed++;
                this.results.sloEvaluation.details.push({
                    test: 'SLO compliance structure',
                    status: 'FAIL',
                    error: 'Structure des résultats SLO invalide'
                });
            }
            
        } catch (error) {
            this.results.sloEvaluation.failed++;
            this.results.sloEvaluation.details.push({
                test: 'SLO evaluation',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 2: Gestion des budgets d'erreur
     */
    testBudgetManagement() {
        console.log('💰 Test 2: Gestion des budgets d\'erreur...');
        
        try {
            // Test 2.1: Initialisation budgets
            const budgets = this.slo.errorBudgets;
            const expectedSLOs = ['availability', 'latency', 'errorRate'];
            
            const hasAllBudgets = expectedSLOs.every(slo => budgets.has(slo));
            const budgetStructureValid = Array.from(budgets.values()).every(budget =>
                budget.hasOwnProperty('total') &&
                budget.hasOwnProperty('remaining') &&
                budget.hasOwnProperty('consumed') &&
                budget.hasOwnProperty('resetAt')
            );
            
            if (hasAllBudgets && budgetStructureValid) {
                this.results.budgetManagement.passed++;
                this.results.budgetManagement.details.push({
                    test: 'Error budget initialization',
                    status: 'PASS',
                    budgetCount: budgets.size,
                    expectedCount: expectedSLOs.length,
                    message: 'Budgets d\'erreur initialisés correctement'
                });
            } else {
                this.results.budgetManagement.failed++;
                this.results.budgetManagement.details.push({
                    test: 'Error budget initialization',
                    status: 'FAIL',
                    error: 'Initialisation budgets échouée'
                });
            }
            
            // Test 2.2: Consommation de budget
            const availabilityBudget = budgets.get('availability');
            const originalRemaining = availabilityBudget.remaining;
            
            // Simuler consommation de budget via évaluation
            const evaluation = this.slo.evaluateSLOs();
            const newRemaining = budgets.get('availability').remaining;
            
            // Le budget peut rester identique ou diminuer, mais pas augmenter sans reset
            if (newRemaining <= originalRemaining) {
                this.results.budgetManagement.passed++;
                this.results.budgetManagement.details.push({
                    test: 'Budget consumption tracking',
                    status: 'PASS',
                    originalBudget: originalRemaining,
                    newBudget: newRemaining,
                    message: 'Consommation budget trackée correctement'
                });
            } else {
                this.results.budgetManagement.failed++;
                this.results.budgetManagement.details.push({
                    test: 'Budget consumption tracking',
                    status: 'FAIL',
                    error: 'Budget augmenté sans reset'
                });
            }
            
            // Test 2.3: Reset de budget
            const testSLOName = 'availability';
            const testSLOConfig = this.slo.config.slos[testSLOName];
            const budgetBeforeReset = budgets.get(testSLOName);
            
            this.slo.resetErrorBudget(testSLOName, testSLOConfig);
            
            const budgetAfterReset = budgets.get(testSLOName);
            
            if (budgetAfterReset.remaining === testSLOConfig.budget &&
                budgetAfterReset.consumed === 0) {
                this.results.budgetManagement.passed++;
                this.results.budgetManagement.details.push({
                    test: 'Budget reset functionality',
                    status: 'PASS',
                    resetBudget: budgetAfterReset.remaining,
                    targetBudget: testSLOConfig.budget,
                    message: 'Reset de budget fonctionnel'
                });
            } else {
                this.results.budgetManagement.failed++;
                this.results.budgetManagement.details.push({
                    test: 'Budget reset functionality',
                    status: 'FAIL',
                    error: 'Reset de budget non fonctionnel'
                });
            }
            
            // Test 2.4: Burn rate calculation
            const burnRate = this.slo.calculateBurnRate('availability', 0.01); // 0.01% consommation
            
            if (typeof burnRate === 'number' && !isNaN(burnRate)) {
                this.results.budgetManagement.passed++;
                this.results.budgetManagement.details.push({
                    test: 'Burn rate calculation',
                    status: 'PASS',
                    burnRate: burnRate.toFixed(3),
                    message: 'Calcul burn rate fonctionnel'
                });
            } else {
                this.results.budgetManagement.failed++;
                this.results.budgetManagement.details.push({
                    test: 'Burn rate calculation',
                    status: 'FAIL',
                    burnRate,
                    error: 'Calcul burn rate défaillant'
                });
            }
            
        } catch (error) {
            this.results.budgetManagement.failed++;
            this.results.budgetManagement.details.push({
                test: 'Budget management',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 3: Système d'alertes
     */
    testAlerting() {
        console.log('🚨 Test 3: Système d\'alertes...');
        
        try {
            // Test 3.1: Configuration alertes
            const alertConfig = this.slo.config.alerting;
            
            const hasRequiredChannels = alertConfig.channels &&
                alertConfig.channels.length > 0;
            const hasEscalation = alertConfig.escalation &&
                alertConfig.escalation.warning &&
                alertConfig.escalation.critical &&
                alertConfig.escalation.emergency;
            
            if (hasRequiredChannels && hasEscalation) {
                this.results.alerting.passed++;
                this.results.alerting.details.push({
                    test: 'Alert configuration',
                    status: 'PASS',
                    channels: alertConfig.channels.length,
                    escalationLevels: Object.keys(alertConfig.escalation).length,
                    message: 'Configuration alertes complète'
                });
            } else {
                this.results.alerting.failed++;
                this.results.alerting.details.push({
                    test: 'Alert configuration',
                    status: 'FAIL',
                    error: 'Configuration alertes incomplète'
                });
            }
            
            // Test 3.2: Déclenchement d'alerte
            const testAlert = {
                level: 'warning',
                slo: 'availability',
                message: 'Test alert message',
                value: 95.5,
                threshold: 99.0
            };
            
            const alertCountBefore = this.slo.alerts.size;
            this.slo.triggerAlert(testAlert);
            const alertCountAfter = this.slo.alerts.size;
            
            if (alertCountAfter > alertCountBefore) {
                this.results.alerting.passed++;
                this.results.alerting.details.push({
                    test: 'Alert triggering',
                    status: 'PASS',
                    alertsBefore: alertCountBefore,
                    alertsAfter: alertCountAfter,
                    message: 'Déclenchement d\'alerte fonctionnel'
                });
            } else {
                this.results.alerting.failed++;
                this.results.alerting.details.push({
                    test: 'Alert triggering',
                    status: 'FAIL',
                    error: 'Déclenchement d\'alerte non fonctionnel'
                });
            }
            
            // Test 3.3: Vérification seuils d'alerte
            const mockSLOResult = {
                slo: 'availability',
                target: 99.9,
                current: 99.85,
                compliant: false,
                budget: {
                    total: 0.1,
                    remaining: 0.02, // 0.02% restant (< 0.05% seuil critique)
                    consumed: 0.08,
                    burnRate: 2.5
                }
            };
            
            const mockSLOConfig = this.slo.config.slos.availability;
            const alerts = this.slo.checkAlertThresholds('availability', mockSLOResult, mockSLOConfig);
            
            // Devrait générer une alerte critique (remaining < criticalThreshold)
            const hasCriticalAlert = alerts.some(alert => alert.level === 'critical');
            
            if (alerts.length > 0 && hasCriticalAlert) {
                this.results.alerting.passed++;
                this.results.alerting.details.push({
                    test: 'Alert threshold checking',
                    status: 'PASS',
                    alertsGenerated: alerts.length,
                    hasCritical: hasCriticalAlert,
                    message: 'Vérification seuils fonctionnelle'
                });
            } else {
                this.results.alerting.failed++;
                this.results.alerting.details.push({
                    test: 'Alert threshold checking',
                    status: 'FAIL',
                    alertsGenerated: alerts.length,
                    error: 'Vérification seuils défaillante'
                });
            }
            
            // Test 3.4: Cooldown des alertes
            const alertKey = 'availability_warning';
            
            // Déclencher deux alertes identiques rapidement
            this.slo.triggerAlert({ ...testAlert, level: 'warning' });
            const alertCount1 = this.slo.alerts.size;
            
            // Immédiatement après (devrait être bloqué par cooldown)
            this.slo.triggerAlert({ ...testAlert, level: 'warning' });
            const alertCount2 = this.slo.alerts.size;
            
            if (alertCount2 === alertCount1) {
                this.results.alerting.passed++;
                this.results.alerting.details.push({
                    test: 'Alert cooldown mechanism',
                    status: 'PASS',
                    message: 'Cooldown des alertes fonctionnel'
                });
            } else {
                this.results.alerting.failed++;
                this.results.alerting.details.push({
                    test: 'Alert cooldown mechanism',
                    status: 'FAIL',
                    error: 'Cooldown des alertes non fonctionnel'
                });
            }
            
        } catch (error) {
            this.results.alerting.failed++;
            this.results.alerting.details.push({
                test: 'Alerting system',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 4: Collecte de métriques
     */
    testMetricsCollection() {
        console.log('📈 Test 4: Collecte de métriques...');
        
        try {
            // Test 4.1: Collection SLI
            const initialSLICount = this.slo.sliHistory.length;
            
            // Déclencher collecte manuelle
            this.slo.collectSLIMetrics();
            
            const newSLICount = this.slo.sliHistory.length;
            
            if (newSLICount > initialSLICount) {
                this.results.metricsCollection.passed++;
                this.results.metricsCollection.details.push({
                    test: 'SLI metrics collection',
                    status: 'PASS',
                    initialCount: initialSLICount,
                    newCount: newSLICount,
                    message: 'Collecte SLI fonctionnelle'
                });
            } else {
                this.results.metricsCollection.failed++;
                this.results.metricsCollection.details.push({
                    test: 'SLI metrics collection',
                    status: 'FAIL',
                    error: 'Collecte SLI non fonctionnelle'
                });
            }
            
            // Test 4.2: Structure SLI
            if (newSLICount > 0) {
                const latestSLI = this.slo.sliHistory[this.slo.sliHistory.length - 1];
                const hasValidStructure = latestSLI.timestamp &&
                    latestSLI.availability !== undefined &&
                    latestSLI.latency &&
                    latestSLI.errorRate !== undefined &&
                    latestSLI.throughput !== undefined;
                
                if (hasValidStructure) {
                    this.results.metricsCollection.passed++;
                    this.results.metricsCollection.details.push({
                        test: 'SLI data structure',
                        status: 'PASS',
                        timestamp: latestSLI.timestamp,
                        availability: latestSLI.availability.toFixed(2),
                        message: 'Structure SLI valide'
                    });
                } else {
                    this.results.metricsCollection.failed++;
                    this.results.metricsCollection.details.push({
                        test: 'SLI data structure',
                        status: 'FAIL',
                        error: 'Structure SLI invalide'
                    });
                }
            }
            
            // Test 4.3: Calculs métriques
            const mockMonitoringMetrics = {
                metrics: {
                    latency: {
                        samples: [
                            { duration: 100, timestamp: Date.now() },
                            { duration: 200, timestamp: Date.now() },
                            { duration: 150, timestamp: Date.now() },
                            { duration: 300, timestamp: Date.now() },
                            { duration: 120, timestamp: Date.now() }
                        ]
                    },
                    frontendErrors: { total: 5 },
                    uniqueSolutionFail: { total: 2 }
                }
            };
            
            const availability = this.slo.calculateAvailability(mockMonitoringMetrics);
            const latencyMetrics = this.slo.calculateLatencyMetrics(mockMonitoringMetrics);
            const errorRate = this.slo.calculateErrorRate(mockMonitoringMetrics);
            const throughput = this.slo.calculateThroughput(mockMonitoringMetrics);
            
            const metricsValid = availability >= 0 && availability <= 100 &&
                latencyMetrics.p95 > 0 &&
                errorRate >= 0 &&
                throughput >= 0;
            
            if (metricsValid) {
                this.results.metricsCollection.passed++;
                this.results.metricsCollection.details.push({
                    test: 'Metrics calculation',
                    status: 'PASS',
                    availability: availability.toFixed(2),
                    latencyP95: latencyMetrics.p95,
                    errorRate: errorRate.toFixed(3),
                    throughput,
                    message: 'Calculs métriques corrects'
                });
            } else {
                this.results.metricsCollection.failed++;
                this.results.metricsCollection.details.push({
                    test: 'Metrics calculation',
                    status: 'FAIL',
                    error: 'Calculs métriques incorrects'
                });
            }
            
            // Test 4.4: Test E2E - CDN invalidation + canary sticky
            const cdnCacheManager = global.cdnCacheManager;
            if (cdnCacheManager) {
                // Simuler déploiement canary 5% → 25% → 100%
                const testVersions = ['v5.0-canary-5', 'v5.0-canary-25', 'v5.0-stable'];
                let cdnTestsPassed = 0;
                
                for (const version of testVersions) {
                    const percentage = version.includes('5') ? 5 : version.includes('25') ? 25 : 100;
                    
                    // Configurer cache canary
                    const cacheConfig = cdnCacheManager.setupCanaryCache({
                        percentage: percentage,
                        version: version,
                        features: ['new-question-engine']
                    });
                    
                    // Invalider cache précédent
                    const invalidated = cdnCacheManager.invalidateCanaryCache();
                    
                    // Vérifier pas de contenu stale
                    const hasStaleContent = cdnCacheManager.hasStaleContent();
                    
                    if (cacheConfig && invalidated && !hasStaleContent) {
                        cdnTestsPassed++;
                    }
                }
                
                if (cdnTestsPassed === testVersions.length) {
                    this.results.metricsCollection.passed++;
                    this.results.metricsCollection.details.push({
                        test: 'CDN invalidation + canary sticky',
                        status: 'PASS',
                        versionsTestsed: testVersions.length,
                        message: 'CDN invalidation sans contenu stale'
                    });
                } else {
                    this.results.metricsCollection.failed++;
                    this.results.metricsCollection.details.push({
                        test: 'CDN invalidation + canary sticky',
                        status: 'FAIL',
                        passedTests: cdnTestsPassed,
                        totalTests: testVersions.length,
                        error: 'CDN invalidation avec contenu stale détecté'
                    });
                }
            } else {
                this.results.metricsCollection.failed++;
                this.results.metricsCollection.details.push({
                    test: 'CDN invalidation + canary sticky',
                    status: 'FAIL',
                    error: 'CDN Cache Manager non disponible'
                });
            }
            
            // Test 4.5: Récupération SLI récents
            const recentSLIs = this.slo.getRecentSLIs('1h');
            
            if (Array.isArray(recentSLIs)) {
                this.results.metricsCollection.passed++;
                this.results.metricsCollection.details.push({
                    test: 'Recent SLI retrieval',
                    status: 'PASS',
                    recentCount: recentSLIs.length,
                    message: 'Récupération SLI récents fonctionnelle'
                });
            } else {
                this.results.metricsCollection.failed++;
                this.results.metricsCollection.details.push({
                    test: 'Recent SLI retrieval',
                    status: 'FAIL',
                    error: 'Récupération SLI récents échouée'
                });
            }
            
        } catch (error) {
            this.results.metricsCollection.failed++;
            this.results.metricsCollection.details.push({
                test: 'Metrics collection',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Calculer résultats globaux
     */
    calculateOverallResults() {
        const categories = ['sloEvaluation', 'budgetManagement', 'alerting', 'metricsCollection'];
        
        categories.forEach(category => {
            this.results.overall.passed += this.results[category].passed;
            this.results.overall.failed += this.results[category].failed;
        });
        
        this.results.overall.total = this.results.overall.passed + this.results.overall.failed;
    }
    
    /**
     * Afficher les résultats
     */
    displayResults() {
        console.log('\\n📊 === RÉSULTATS SLO MONITORING & ALERTING ===');
        
        const categories = [
            { name: 'Évaluation SLO', key: 'sloEvaluation' },
            { name: 'Budgets d\'erreur', key: 'budgetManagement' },
            { name: 'Système d\'alertes', key: 'alerting' },
            { name: 'Collecte métriques', key: 'metricsCollection' }
        ];
        
        categories.forEach(({ name, key }) => {
            const result = this.results[key];
            const total = result.passed + result.failed;
            const status = result.failed === 0 ? '✅' : '❌';
            
            console.log(`\\n${status} ${name}: ${result.passed}/${total} tests passés`);
            
            // Afficher détails importants
            result.details.forEach(detail => {
                if (detail.status === 'PASS') {
                    console.log(`   ✅ ${detail.test}: ${detail.message || 'OK'}`);
                    if (detail.sloCount) {
                        console.log(`      SLOs configurés: ${detail.sloCount}`);
                    }
                    if (detail.complianceRate) {
                        console.log(`      Taux conformité: ${detail.complianceRate}`);
                    }
                    if (detail.burnRate) {
                        console.log(`      Burn rate: ${detail.burnRate}`);
                    }
                } else {
                    console.log(`   ❌ ${detail.test}: ${detail.error || detail.message}`);
                }
            });
        });
        
        console.log('\\n📊 STATISTIQUES GLOBALES:');
        console.log(`✅ Tests réussis: ${this.results.overall.passed}`);
        console.log(`❌ Tests échoués: ${this.results.overall.failed}`);
        console.log(`📋 Total: ${this.results.overall.total}`);
        
        const successRate = (this.results.overall.passed / this.results.overall.total) * 100;
        console.log(`🎯 Taux de réussite: ${successRate.toFixed(1)}%`);
        
        const ready = this.results.overall.failed === 0;
        console.log(`📊 SLO Monitoring prêt: ${ready ? '✅ OUI' : '❌ NON'}`);
        
        // Afficher état actuel des SLO
        console.log('\\n📋 ÉTAT ACTUEL DES SLO:');
        const currentEvaluation = this.slo.evaluateSLOs();
        Object.values(currentEvaluation.slos).forEach(slo => {
            const status = slo.compliant ? '✅' : '❌';
            const current = typeof slo.current === 'number' ? slo.current.toFixed(2) : 'N/A';
            console.log(`${status} ${slo.slo}: ${current}% (objectif: ${slo.target}%)`);
            if (slo.budget && typeof slo.budget.remaining === 'number') {
                console.log(`   Budget restant: ${slo.budget.remaining.toFixed(3)}%`);
            }
        });
        
        return ready;
    }
    
    /**
     * Exécuter tous les tests
     */
    async runAllTests() {
        console.log('📊 === TESTS SLO MONITORING & ALERTING ===\\n');
        
        this.testSLOEvaluation();
        this.testBudgetManagement();
        this.testAlerting();
        this.testMetricsCollection();
        
        this.calculateOverallResults();
        const success = this.displayResults();
        
        return success;
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const tester = new SLOMonitoringTester();
    
    tester.runAllTests()
        .then(success => {
            console.log(`\\n${success ? '✅' : '❌'} Tests SLO Monitoring terminés`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur tests SLO Monitoring:', error);
            process.exit(1);
        });
}

module.exports = SLOMonitoringTester;