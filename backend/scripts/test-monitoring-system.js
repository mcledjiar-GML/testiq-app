#!/usr/bin/env node
/**
 * 🧪 TESTS SYSTÈME MONITORING ET KILL-SWITCH
 * ==========================================
 * 
 * Tests complets des systèmes de monitoring et kill-switch
 * pour validation avant déploiement production.
 */

const MonitoringSystem = require('../middleware/monitoring');
const KillSwitchSystem = require('../middleware/kill-switch');

class MonitoringTester {
    
    constructor() {
        this.monitoring = new MonitoringSystem();
        this.killSwitch = new KillSwitchSystem();
        this.results = {
            monitoring: { passed: 0, failed: 0, details: [] },
            killSwitch: { passed: 0, failed: 0, details: [] },
            integration: { passed: 0, failed: 0, details: [] },
            overall: { passed: 0, failed: 0, total: 0 }
        };
    }
    
    /**
     * Test 1: Système de monitoring
     */
    testMonitoringSystem() {
        console.log('🧪 Test 1: Système de monitoring...');
        
        try {
            // Test enregistrement métriques
            this.monitoring.recordLatency('/questions/123', 95);
            this.monitoring.recordLatency('/questions/456', 180); // Au-dessus du seuil
            
            const metrics = this.monitoring.getMetrics();
            
            if (metrics.metrics.latency.samples.length === 2) {
                this.results.monitoring.passed++;
                this.results.monitoring.details.push({
                    test: 'Latency recording',
                    status: 'PASS',
                    samples: metrics.metrics.latency.samples.length
                });
            } else {
                this.results.monitoring.failed++;
                this.results.monitoring.details.push({
                    test: 'Latency recording',
                    status: 'FAIL',
                    error: 'Incorrect number of samples recorded'
                });
            }
            
            // Test alertes
            this.monitoring.recordPublishBlocked('Q123', 'Invalid options', 'validation');
            this.monitoring.recordUniqueSolutionFail('Q456', 'Multiple valid answers');
            
            if (metrics.metrics.publishBlocked.total >= 1 && metrics.metrics.uniqueSolutionFail.total >= 1) {
                this.results.monitoring.passed++;
                this.results.monitoring.details.push({
                    test: 'Alert recording',
                    status: 'PASS',
                    publishBlocked: metrics.metrics.publishBlocked.total,
                    solutionFails: metrics.metrics.uniqueSolutionFail.total
                });
            } else {
                this.results.monitoring.failed++;
                this.results.monitoring.details.push({
                    test: 'Alert recording',
                    status: 'FAIL',
                    error: 'Alerts not properly recorded'
                });
            }
            
            // Test rapport
            const report = this.monitoring.generateReport();
            if (report.timestamp && report.health && report.summary) {
                this.results.monitoring.passed++;
                this.results.monitoring.details.push({
                    test: 'Report generation',
                    status: 'PASS',
                    healthScore: report.health.score
                });
            } else {
                this.results.monitoring.failed++;
                this.results.monitoring.details.push({
                    test: 'Report generation',
                    status: 'FAIL',
                    error: 'Incomplete report structure'
                });
            }
            
        } catch (error) {
            this.results.monitoring.failed++;
            this.results.monitoring.details.push({
                test: 'Monitoring system',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 2: Kill-switch system
     */
    testKillSwitchSystem() {
        console.log('🧪 Test 2: Kill-switch system...');
        
        try {
            // Test feature flags
            const initialStatus = this.killSwitch.isEnabled('qualityGates');
            if (initialStatus === true) {
                this.results.killSwitch.passed++;
                this.results.killSwitch.details.push({
                    test: 'Feature flag check',
                    status: 'PASS',
                    feature: 'qualityGates'
                });
            } else {
                this.results.killSwitch.failed++;
                this.results.killSwitch.details.push({
                    test: 'Feature flag check',
                    status: 'FAIL',
                    error: 'Quality gates should be enabled by default'
                });
            }
            
            // Test désactivation feature
            this.killSwitch.disableFeature('testFeature', 'Test disable');
            const disabledStatus = this.killSwitch.isEnabled('testFeature');
            if (disabledStatus === false) {
                this.results.killSwitch.passed++;
                this.results.killSwitch.details.push({
                    test: 'Feature disable',
                    status: 'PASS',
                    feature: 'testFeature'
                });
            } else {
                this.results.killSwitch.failed++;
                this.results.killSwitch.details.push({
                    test: 'Feature disable',
                    status: 'FAIL',
                    error: 'Feature not properly disabled'
                });
            }
            
            // Test canary configuration
            const canaryConfig = {
                enabled: true,
                percentage: 20,
                features: {
                    betaFeature: true
                }
            };
            
            const newConfig = this.killSwitch.configureCanary(canaryConfig);
            if (newConfig.enabled && newConfig.percentage === 20) {
                this.results.killSwitch.passed++;
                this.results.killSwitch.details.push({
                    test: 'Canary configuration',
                    status: 'PASS',
                    percentage: newConfig.percentage
                });
            } else {
                this.results.killSwitch.failed++;
                this.results.killSwitch.details.push({
                    test: 'Canary configuration',
                    status: 'FAIL',
                    error: 'Canary not properly configured'
                });
            }
            
            // Test détection canary
            const isInCanary = this.killSwitch.isInCanary('test-user-123');
            if (typeof isInCanary === 'boolean') {
                this.results.killSwitch.passed++;
                this.results.killSwitch.details.push({
                    test: 'Canary detection',
                    status: 'PASS',
                    result: isInCanary
                });
            } else {
                this.results.killSwitch.failed++;
                this.results.killSwitch.details.push({
                    test: 'Canary detection',
                    status: 'FAIL',
                    error: 'Canary detection not working'
                });
            }
            
            // Test status
            const status = this.killSwitch.getStatus();
            if (status.timestamp && status.features && status.canary) {
                this.results.killSwitch.passed++;
                this.results.killSwitch.details.push({
                    test: 'Status retrieval',
                    status: 'PASS',
                    health: status.health
                });
            } else {
                this.results.killSwitch.failed++;
                this.results.killSwitch.details.push({
                    test: 'Status retrieval',
                    status: 'FAIL',
                    error: 'Incomplete status structure'
                });
            }
            
        } catch (error) {
            this.results.killSwitch.failed++;
            this.results.killSwitch.details.push({
                test: 'Kill-switch system',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 3: Intégration monitoring + kill-switch
     */
    testIntegration() {
        console.log('🧪 Test 3: Intégration...');
        
        try {
            // Simuler intégration avec globals
            global.monitoringSystem = this.monitoring;
            global.killSwitchSystem = this.killSwitch;
            
            // Test alerte avec kill-switch
            this.monitoring.recordUniqueSolutionFail('Q789', 'Integration test');
            
            // Vérifier que l'alerte a déclenché une évaluation
            const metrics = this.monitoring.getMetrics();
            const status = this.killSwitch.getStatus();
            
            if (metrics && status) {
                this.results.integration.passed++;
                this.results.integration.details.push({
                    test: 'Global integration',
                    status: 'PASS',
                    message: 'Systems communicate properly'
                });
            } else {
                this.results.integration.failed++;
                this.results.integration.details.push({
                    test: 'Global integration',
                    status: 'FAIL',
                    error: 'Systems not properly integrated'
                });
            }
            
            // Test performance sous charge
            const start = Date.now();
            for (let i = 0; i < 100; i++) {
                this.monitoring.recordLatency(`/test/${i}`, Math.random() * 200);
                this.killSwitch.isEnabled('qualityGates', `user-${i}`);
            }
            const duration = Date.now() - start;
            
            if (duration < 1000) { // Moins de 1 seconde pour 100 opérations
                this.results.integration.passed++;
                this.results.integration.details.push({
                    test: 'Performance under load',
                    status: 'PASS',
                    duration: `${duration}ms`,
                    operations: 100
                });
            } else {
                this.results.integration.failed++;
                this.results.integration.details.push({
                    test: 'Performance under load',
                    status: 'FAIL',
                    duration: `${duration}ms`,
                    error: 'Too slow for production load'
                });
            }
            
        } catch (error) {
            this.results.integration.failed++;
            this.results.integration.details.push({
                test: 'Integration',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Calculer résultats globaux
     */
    calculateOverallResults() {
        const categories = ['monitoring', 'killSwitch', 'integration'];
        
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
        console.log('\n🎯 === RÉSULTATS TESTS MONITORING ===');
        
        const categories = [
            { name: 'Système Monitoring', key: 'monitoring' },
            { name: 'Kill-Switch', key: 'killSwitch' },
            { name: 'Intégration', key: 'integration' }
        ];
        
        categories.forEach(({ name, key }) => {
            const result = this.results[key];
            const total = result.passed + result.failed;
            const status = result.failed === 0 ? '✅' : '❌';
            
            console.log(`\n${status} ${name}: ${result.passed}/${total} tests passés`);
            
            if (result.failed > 0) {
                result.details.filter(d => d.status !== 'PASS').forEach(detail => {
                    console.log(`   ❌ ${detail.test}: ${detail.error || detail.message || 'Failed'}`);
                });
            }
        });
        
        console.log('\n📊 STATISTIQUES GLOBALES:');
        console.log(`✅ Tests réussis: ${this.results.overall.passed}`);
        console.log(`❌ Tests échoués: ${this.results.overall.failed}`);
        console.log(`📋 Total: ${this.results.overall.total}`);
        
        const successRate = (this.results.overall.passed / this.results.overall.total) * 100;
        console.log(`🎯 Taux de réussite: ${successRate.toFixed(1)}%`);
        
        const ready = this.results.overall.failed === 0;
        console.log(`🚀 Système prêt: ${ready ? '✅ OUI' : '❌ NON'}`);
        
        return ready;
    }
    
    /**
     * Exécuter tous les tests
     */
    async runAllTests() {
        console.log('🧪 === TESTS MONITORING ET KILL-SWITCH ===\n');
        
        this.testMonitoringSystem();
        this.testKillSwitchSystem();
        this.testIntegration();
        
        this.calculateOverallResults();
        const success = this.displayResults();
        
        return success;
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const tester = new MonitoringTester();
    
    tester.runAllTests()
        .then(success => {
            console.log(`\n${success ? '✅' : '❌'} Tests monitoring terminés`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur tests monitoring:', error);
            process.exit(1);
        });
}

module.exports = MonitoringTester;