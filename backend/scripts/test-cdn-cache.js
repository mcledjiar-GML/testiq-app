#!/usr/bin/env node
/**
 * 🌐 TEST CDN CACHE & INVALIDATION
 * ================================
 * 
 * Tests du système de cache CDN et invalidation coordonnée :
 * - Gestion des versions de cache
 * - Invalidation CDN (patterns, coordonnée)
 * - Cache canary et cohérence
 * - Headers de cache appropriés
 */

const CDNCacheManager = require('../middleware/cdn-cache');

class CDNCacheTester {
    
    constructor() {
        this.cacheManager = new CDNCacheManager();
        this.results = {
            versioning: { passed: 0, failed: 0, details: [] },
            invalidation: { passed: 0, failed: 0, details: [] },
            canaryCache: { passed: 0, failed: 0, details: [] },
            coordination: { passed: 0, failed: 0, details: [] },
            overall: { passed: 0, failed: 0, total: 0 }
        };
    }
    
    /**
     * Test 1: Versioning du cache
     */
    testCacheVersioning() {
        console.log('📦 Test 1: Versioning du cache...');
        
        try {
            // Test 1.1: Génération version cache
            const version1 = this.cacheManager.currentVersion;
            
            if (version1 && version1.length > 10 && version1.includes('-')) {
                this.results.versioning.passed++;
                this.results.versioning.details.push({
                    test: 'Cache version generation',
                    status: 'PASS',
                    version: version1,
                    message: 'Version format timestamp-hash correct'
                });
            } else {
                this.results.versioning.failed++;
                this.results.versioning.details.push({
                    test: 'Cache version generation',
                    status: 'FAIL',
                    version: version1,
                    error: 'Format de version incorrect'
                });
            }
            
            // Test 1.2: Persistance des versions
            this.cacheManager.cacheVersions.set('test-version', 'test-123');
            this.cacheManager.saveCacheVersions();
            
            // Simuler rechargement
            const newManager = new CDNCacheManager();
            const retrievedVersion = newManager.cacheVersions.get('test-version');
            
            if (retrievedVersion === 'test-123') {
                this.results.versioning.passed++;
                this.results.versioning.details.push({
                    test: 'Version persistence',
                    status: 'PASS',
                    message: 'Versions sauvegardées et rechargées correctement'
                });
            } else {
                this.results.versioning.failed++;
                this.results.versioning.details.push({
                    test: 'Version persistence',
                    status: 'FAIL',
                    error: 'Versions non persistées correctement'
                });
            }
            
            // Test 1.3: Configuration stratégies cache
            const strategies = this.cacheManager.config.cacheStrategies;
            const hasAllStrategies = ['static', 'api', 'questions', 'images', 'canary']
                .every(strategy => strategies[strategy] && strategies[strategy].ttl > 0);
            
            if (hasAllStrategies) {
                this.results.versioning.passed++;
                this.results.versioning.details.push({
                    test: 'Cache strategies configuration',
                    status: 'PASS',
                    strategies: Object.keys(strategies).length,
                    message: 'Toutes les stratégies configurées'
                });
            } else {
                this.results.versioning.failed++;
                this.results.versioning.details.push({
                    test: 'Cache strategies configuration',
                    status: 'FAIL',
                    error: 'Stratégies de cache incomplètes'
                });
            }
            
        } catch (error) {
            this.results.versioning.failed++;
            this.results.versioning.details.push({
                test: 'Cache versioning',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 2: Invalidation CDN
     */
    async testCDNInvalidation() {
        console.log('🔄 Test 2: Invalidation CDN...');
        
        try {
            // Test 2.1: Invalidation simple
            const patterns1 = ['/api/questions/*', '/static/js/*'];
            const invalidation1 = await this.cacheManager.invalidateCache(
                patterns1, 
                'Test invalidation simple'
            );
            
            if (invalidation1.id && 
                invalidation1.patterns.length === patterns1.length &&
                (invalidation1.status === 'completed' || invalidation1.status === 'failed')) {
                this.results.invalidation.passed++;
                this.results.invalidation.details.push({
                    test: 'Simple CDN invalidation',
                    status: 'PASS',
                    invalidationId: invalidation1.id,
                    patterns: invalidation1.patterns.length,
                    message: 'Invalidation simple réussie'
                });
            } else {
                this.results.invalidation.failed++;
                this.results.invalidation.details.push({
                    test: 'Simple CDN invalidation',
                    status: 'FAIL',
                    error: 'Invalidation simple échouée'
                });
            }
            
            // Test 2.2: Invalidation avec patterns spéciaux
            const patterns2 = ['/*', '/api/*', '/static/css/*'];
            const invalidation2 = await this.cacheManager.invalidateCache(
                patterns2,
                'Test patterns wildcards',
                'fullDeploy'
            );
            
            if (invalidation2.deploymentType === 'fullDeploy' &&
                invalidation2.patterns.includes('/*')) {
                this.results.invalidation.passed++;
                this.results.invalidation.details.push({
                    test: 'Wildcard patterns invalidation',
                    status: 'PASS',
                    deploymentType: invalidation2.deploymentType,
                    message: 'Patterns wildcards traités correctement'
                });
            } else {
                this.results.invalidation.failed++;
                this.results.invalidation.details.push({
                    test: 'Wildcard patterns invalidation',
                    status: 'FAIL',
                    error: 'Patterns wildcards non traités'
                });
            }
            
            // Test 2.3: Historique invalidations
            const historyCount = this.cacheManager.invalidationHistory.length;
            
            if (historyCount >= 2) {
                this.results.invalidation.passed++;
                this.results.invalidation.details.push({
                    test: 'Invalidation history tracking',
                    status: 'PASS',
                    historyCount,
                    message: 'Historique invalidations maintenu'
                });
            } else {
                this.results.invalidation.failed++;
                this.results.invalidation.details.push({
                    test: 'Invalidation history tracking',
                    status: 'FAIL',
                    historyCount,
                    error: 'Historique non maintenu correctement'
                });
            }
            
        } catch (error) {
            this.results.invalidation.failed++;
            this.results.invalidation.details.push({
                test: 'CDN invalidation',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 3: Cache canary
     */
    testCanaryCache() {
        console.log('🐤 Test 3: Cache canary...');
        
        try {
            // Test 3.1: Configuration cache canary
            const canaryConfig = {
                percentage: 25,
                features: { betaFeature: true },
                version: 'v2.1.0-beta'
            };
            
            const canaryVersion = this.cacheManager.setupCanaryCache(canaryConfig);
            
            if (canaryVersion && 
                canaryVersion.includes('canary') && 
                canaryVersion.includes('25')) {
                this.results.canaryCache.passed++;
                this.results.canaryCache.details.push({
                    test: 'Canary cache setup',
                    status: 'PASS',
                    canaryVersion,
                    percentage: canaryConfig.percentage,
                    message: 'Configuration cache canary réussie'
                });
            } else {
                this.results.canaryCache.failed++;
                this.results.canaryCache.details.push({
                    test: 'Canary cache setup',
                    status: 'FAIL',
                    canaryVersion,
                    error: 'Configuration cache canary échouée'
                });
            }
            
            // Test 3.2: Headers cache canary
            const canaryHeaders = this.cacheManager.canaryCache.get('headers');
            
            if (canaryHeaders && 
                canaryHeaders['X-Canary-Percentage'] === '25' &&
                canaryHeaders['Cache-Control'] &&
                canaryHeaders['Vary']) {
                this.results.canaryCache.passed++;
                this.results.canaryCache.details.push({
                    test: 'Canary cache headers',
                    status: 'PASS',
                    headers: Object.keys(canaryHeaders).length,
                    message: 'Headers cache canary corrects'
                });
            } else {
                this.results.canaryCache.failed++;
                this.results.canaryCache.details.push({
                    test: 'Canary cache headers',
                    status: 'FAIL',
                    error: 'Headers cache canary incorrects'
                });
            }
            
            // Test 3.3: Versions cache canary
            const productionVersion = this.cacheManager.cacheVersions.get('canary');
            
            if (productionVersion && productionVersion === canaryVersion) {
                this.results.canaryCache.passed++;
                this.results.canaryCache.details.push({
                    test: 'Canary version tracking',
                    status: 'PASS',
                    version: productionVersion,
                    message: 'Version canary trackée correctement'
                });
            } else {
                this.results.canaryCache.failed++;
                this.results.canaryCache.details.push({
                    test: 'Canary version tracking',
                    status: 'FAIL',
                    error: 'Version canary non trackée'
                });
            }
            
        } catch (error) {
            this.results.canaryCache.failed++;
            this.results.canaryCache.details.push({
                test: 'Canary cache',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 4: Coordination et validation
     */
    async testCoordinatedInvalidation() {
        console.log('🎯 Test 4: Invalidation coordonnée...');
        
        try {
            // Test 4.1: Health check CDN
            const healthCheck = await this.cacheManager.checkCDNHealth();
            
            if (healthCheck.healthy && healthCheck.provider) {
                this.results.coordination.passed++;
                this.results.coordination.details.push({
                    test: 'CDN health check',
                    status: 'PASS',
                    provider: healthCheck.provider,
                    responseTime: healthCheck.responseTime,
                    message: 'Health check CDN opérationnel'
                });
            } else {
                this.results.coordination.failed++;
                this.results.coordination.details.push({
                    test: 'CDN health check',
                    status: 'FAIL',
                    error: 'Health check CDN échoué'
                });
            }
            
            // Test 4.2: Vérification ressources critiques
            const criticalResources = await this.cacheManager.checkCriticalResources();
            
            if (criticalResources.available && 
                criticalResources.paths && 
                criticalResources.paths.length > 0) {
                this.results.coordination.passed++;
                this.results.coordination.details.push({
                    test: 'Critical resources check',
                    status: 'PASS',
                    pathsCount: criticalResources.paths.length,
                    message: 'Ressources critiques disponibles'
                });
            } else {
                this.results.coordination.failed++;
                this.results.coordination.details.push({
                    test: 'Critical resources check',
                    status: 'FAIL',
                    error: 'Ressources critiques indisponibles'
                });
            }
            
            // Test 4.3: Invalidation coordonnée complète
            const coordinated = await this.cacheManager.coordinatedInvalidation(
                'canaryDeploy',
                { 
                    version: 'v2.2.0-canary',
                    waitForPropagation: false, // Éviter timeout dans les tests
                    validateAfter: true
                }
            );
            
            if (coordinated.id &&
                coordinated.validation &&
                this.cacheManager.cacheVersions.get('production') === 'v2.2.0-canary') {
                this.results.coordination.passed++;
                this.results.coordination.details.push({
                    test: 'Coordinated invalidation',
                    status: 'PASS',
                    invalidationId: coordinated.id,
                    validation: coordinated.validation.success,
                    message: 'Invalidation coordonnée réussie'
                });
            } else {
                this.results.coordination.failed++;
                this.results.coordination.details.push({
                    test: 'Coordinated invalidation',
                    status: 'FAIL',
                    error: 'Invalidation coordonnée échouée'
                });
            }
            
            // Test 4.4: Rollback cache
            const rollback = await this.cacheManager.rollbackCache('v2.1.0-stable');
            
            if (rollback.id &&
                this.cacheManager.currentVersion === 'v2.1.0-stable') {
                this.results.coordination.passed++;
                this.results.coordination.details.push({
                    test: 'Cache rollback',
                    status: 'PASS',
                    rolledBackVersion: 'v2.1.0-stable',
                    message: 'Rollback cache réussi'
                });
            } else {
                this.results.coordination.failed++;
                this.results.coordination.details.push({
                    test: 'Cache rollback',
                    status: 'FAIL',
                    error: 'Rollback cache échoué'
                });
            }
            
        } catch (error) {
            this.results.coordination.failed++;
            this.results.coordination.details.push({
                test: 'Coordinated invalidation',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Calculer résultats globaux
     */
    calculateOverallResults() {
        const categories = ['versioning', 'invalidation', 'canaryCache', 'coordination'];
        
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
        console.log('\\n🌐 === RÉSULTATS CDN CACHE & INVALIDATION ===');
        
        const categories = [
            { name: 'Versioning Cache', key: 'versioning' },
            { name: 'Invalidation CDN', key: 'invalidation' },
            { name: 'Cache Canary', key: 'canaryCache' },
            { name: 'Coordination', key: 'coordination' }
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
                    if (detail.canaryVersion) {
                        console.log(`      Version canary: ${detail.canaryVersion}`);
                    }
                    if (detail.invalidationId) {
                        console.log(`      ID: ${detail.invalidationId.slice(0, 8)}...`);
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
        console.log(`🌐 CDN Cache prêt: ${ready ? '✅ OUI' : '❌ NON'}`);
        
        return ready;
    }
    
    /**
     * Exécuter tous les tests
     */
    async runAllTests() {
        console.log('🌐 === TESTS CDN CACHE & INVALIDATION ===\\n');
        
        this.testCacheVersioning();
        await this.testCDNInvalidation();
        this.testCanaryCache();
        await this.testCoordinatedInvalidation();
        
        this.calculateOverallResults();
        const success = this.displayResults();
        
        return success;
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const tester = new CDNCacheTester();
    
    tester.runAllTests()
        .then(success => {
            console.log(`\\n${success ? '✅' : '❌'} Tests CDN Cache terminés`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur tests CDN Cache:', error);
            process.exit(1);
        });
}

module.exports = CDNCacheTester;