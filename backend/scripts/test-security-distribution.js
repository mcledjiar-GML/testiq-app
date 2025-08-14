#!/usr/bin/env node
/**
 * 🧪 TESTS SÉCURITÉ ET RÉPARTITION
 * ===============================
 * 
 * Tests rapides pour validation pré-déploiement :
 * - Auth/RBAC monitoring endpoints  
 * - Répartition positions A/B/C/D (10k sessions)
 * - Audit log fonctionnel
 */

const AdminAuth = require('../middleware/admin-auth');
const SeededRandomization = require('../utils/seeded-randomization');

class SecurityDistributionTester {
    
    constructor() {
        this.adminAuth = new AdminAuth();
        this.results = {
            auth: { passed: 0, failed: 0, details: [] },
            distribution: { passed: 0, failed: 0, details: [] },
            audit: { passed: 0, failed: 0, details: [] },
            overall: { passed: 0, failed: 0, total: 0 }
        };
    }
    
    /**
     * Test 1: Auth/RBAC et sécurité
     */
    testAuthSecurity() {
        console.log('🔐 Test 1: Auth/RBAC et sécurité...');
        
        try {
            // Test 1.1: IP allowlist
            const allowedIP = this.adminAuth.isIPAllowed('127.0.0.1');
            const blockedIP = this.adminAuth.isIPAllowed('192.168.1.100');
            
            if (allowedIP && !blockedIP) {
                this.results.auth.passed++;
                this.results.auth.details.push({
                    test: 'IP allowlist',
                    status: 'PASS',
                    message: 'Localhost allowed, external blocked'
                });
            } else {
                this.results.auth.failed++;
                this.results.auth.details.push({
                    test: 'IP allowlist',
                    status: 'FAIL',
                    error: `Allowed: ${allowedIP}, Blocked: ${blockedIP}`
                });
            }
            
            // Test 1.2: Rate limiting
            let rateLimitWorking = true;
            const testIP = '192.168.1.1';
            
            // Faire 35 requêtes (limite = 30)
            for (let i = 0; i < 35; i++) {
                const allowed = this.adminAuth.checkRateLimit(testIP);
                if (i >= 30 && allowed) {
                    rateLimitWorking = false;
                    break;
                }
            }
            
            if (rateLimitWorking) {
                this.results.auth.passed++;
                this.results.auth.details.push({
                    test: 'Rate limiting',
                    status: 'PASS',
                    message: 'Blocks after 30 requests/minute'
                });
            } else {
                this.results.auth.failed++;
                this.results.auth.details.push({
                    test: 'Rate limiting',
                    status: 'FAIL',
                    error: 'Rate limit not working correctly'
                });
            }
            
            // Test 1.3: Token validation
            const validKey = 'admin-key-monitoring';
            const invalidKey = 'fake-key-12345';
            
            const validKeyInfo = this.adminAuth.adminKeys.get(validKey);
            const invalidKeyInfo = this.adminAuth.adminKeys.get(invalidKey);
            
            if (validKeyInfo && !invalidKeyInfo) {
                this.results.auth.passed++;
                this.results.auth.details.push({
                    test: 'Token validation',
                    status: 'PASS',
                    permissions: validKeyInfo.permissions.length,
                    role: validKeyInfo.role
                });
            } else {
                this.results.auth.failed++;
                this.results.auth.details.push({
                    test: 'Token validation',
                    status: 'FAIL',
                    error: 'Token validation not working'
                });
            }
            
            // Test 1.4: Permission check
            const adminKey = this.adminAuth.adminKeys.get('admin-key-monitoring');
            const viewerKey = this.adminAuth.adminKeys.get('readonly-key-monitoring');
            
            const adminCanWrite = adminKey.permissions.includes('killswitch:write');
            const viewerCanWrite = viewerKey.permissions.includes('killswitch:write');
            
            if (adminCanWrite && !viewerCanWrite) {
                this.results.auth.passed++;
                this.results.auth.details.push({
                    test: 'Permission control',
                    status: 'PASS',
                    message: 'Admin can write, viewer cannot'
                });
            } else {
                this.results.auth.failed++;
                this.results.auth.details.push({
                    test: 'Permission control',
                    status: 'FAIL',
                    error: `Admin: ${adminCanWrite}, Viewer: ${viewerCanWrite}`
                });
            }
            
        } catch (error) {
            this.results.auth.failed++;
            this.results.auth.details.push({
                test: 'Auth security',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 2: Répartition positions A/B/C/D (10k sessions)
     */
    testPositionDistribution() {
        console.log('📊 Test 2: Répartition positions (10k sessions)...');
        
        try {
            const sampleSize = 10000;
            const positions = { A: 0, B: 0, C: 0, D: 0 };
            
            // Question test avec réponse correcte en position B (index 1)
            const testQuestion = {
                qid: 'distribution-test',
                options: [
                    { key: 'A', text: 'Option A', isCorrect: false },
                    { key: 'B', text: 'Option B', isCorrect: true },
                    { key: 'C', text: 'Option C', isCorrect: false },
                    { key: 'D', text: 'Option D', isCorrect: false }
                ]
            };
            
            console.log(`   Génération ${sampleSize} sessions...`);
            
            // Simuler 10k sessions différentes
            for (let i = 0; i < sampleSize; i++) {
                const sessionId = `test-session-${i}`;
                const randomized = SeededRandomization.randomizeQuestionOptions(
                    testQuestion, 
                    sessionId, 
                    { logPermutation: false }
                );
                
                // Trouver où est la bonne réponse
                const correctIndex = randomized.options.findIndex(opt => opt.isCorrect);
                const correctKey = String.fromCharCode(65 + correctIndex); // A, B, C, D
                
                positions[correctKey]++;
                
                // Progress indicator
                if (i > 0 && i % 2000 === 0) {
                    process.stdout.write('.');
                }
            }
            
            console.log('\n   Analyse statistique...');
            
            // Calculer pourcentages
            const percentages = {};
            Object.keys(positions).forEach(key => {
                percentages[key] = (positions[key] / sampleSize) * 100;
            });
            
            // Test chi-carré (distribution uniforme attendue = 25% chacun)
            const expected = sampleSize / 4; // 25% de 10k = 2500
            let chiSquare = 0;
            
            Object.values(positions).forEach(observed => {
                chiSquare += Math.pow(observed - expected, 2) / expected;
            });
            
            // Degrés de liberté = 3 (4 positions - 1)
            // Seuil critique pour p > 0.05 avec df=3 : 7.815
            const criticalValue = 7.815;
            const isUniform = chiSquare < criticalValue;
            
            // Test tolérance ±2%
            const tolerance = 2.0;
            const allWithinTolerance = Object.values(percentages).every(pct => 
                Math.abs(pct - 25) <= tolerance
            );
            
            if (isUniform && allWithinTolerance) {
                this.results.distribution.passed++;
                this.results.distribution.details.push({
                    test: 'Position distribution uniformity',
                    status: 'PASS',
                    sampleSize,
                    percentages,
                    chiSquare: chiSquare.toFixed(3),
                    pValue: chiSquare < criticalValue ? '>0.05' : '<0.05',
                    message: 'Distribution is uniform (p > 0.05)'
                });
            } else {
                this.results.distribution.failed++;
                this.results.distribution.details.push({
                    test: 'Position distribution uniformity',
                    status: 'FAIL',
                    sampleSize,
                    percentages,
                    chiSquare: chiSquare.toFixed(3),
                    error: `Chi-square: ${chiSquare.toFixed(3)} ${isUniform ? '' : '(>7.815)'}, Tolerance: ${allWithinTolerance ? 'OK' : 'FAIL'}`
                });
            }
            
            // Test pas de biais évident (aucune position >30% ou <20%)
            const maxPct = Math.max(...Object.values(percentages));
            const minPct = Math.min(...Object.values(percentages));
            
            if (maxPct <= 30 && minPct >= 20) {
                this.results.distribution.passed++;
                this.results.distribution.details.push({
                    test: 'No obvious bias',
                    status: 'PASS',
                    range: `${minPct.toFixed(1)}% - ${maxPct.toFixed(1)}%`,
                    message: 'All positions between 20-30%'
                });
            } else {
                this.results.distribution.failed++;
                this.results.distribution.details.push({
                    test: 'No obvious bias',
                    status: 'FAIL',
                    range: `${minPct.toFixed(1)}% - ${maxPct.toFixed(1)}%`,
                    error: 'Some positions outside 20-30% range'
                });
            }
            
        } catch (error) {
            this.results.distribution.failed++;
            this.results.distribution.details.push({
                test: 'Position distribution',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 3: Audit log fonctionnel
     */
    testAuditLog() {
        console.log('📋 Test 3: Audit log...');
        
        try {
            // Test logging événement
            this.adminAuth.logAuditEvent('TEST_ACTION', 'test-user', 'POST', '/api/test', {
                testData: 'sample'
            });
            
            this.adminAuth.logSecurityEvent('INVALID_TOKEN', '192.168.1.1', 'hacker', 'Attempted access');
            
            // Vérifier les logs
            const auditLogs = this.adminAuth.getAuditLogs({ limit: 10 });
            
            if (auditLogs.logs.length >= 2) {
                this.results.audit.passed++;
                this.results.audit.details.push({
                    test: 'Audit logging',
                    status: 'PASS',
                    logCount: auditLogs.logs.length,
                    message: 'Events logged successfully'
                });
            } else {
                this.results.audit.failed++;
                this.results.audit.details.push({
                    test: 'Audit logging',
                    status: 'FAIL',
                    logCount: auditLogs.logs.length,
                    error: 'Not enough audit events logged'
                });
            }
            
            // Test anonymisation
            const testEvent = {
                ip: '192.168.1.100',
                user: 'test-user',
                details: { userAgent: 'Mozilla/5.0...' }
            };
            
            const anonymized = this.adminAuth.anonymizeEvent(testEvent);
            
            if (anonymized.ip !== testEvent.ip && anonymized.ip.length === 8) {
                this.results.audit.passed++;
                this.results.audit.details.push({
                    test: 'GDPR anonymization',
                    status: 'PASS',
                    originalIP: testEvent.ip,
                    anonymizedIP: anonymized.ip,
                    message: 'IP properly anonymized'
                });
            } else {
                this.results.audit.failed++;
                this.results.audit.details.push({
                    test: 'GDPR anonymization',
                    status: 'FAIL',
                    error: 'IP not properly anonymized'
                });
            }
            
            // Test rapport audit
            const report = this.adminAuth.generateAuditReport();
            
            if (report.summary && report.recentLogs && report.recommendations) {
                this.results.audit.passed++;
                this.results.audit.details.push({
                    test: 'Audit reporting',
                    status: 'PASS',
                    totalEvents: report.summary.totalEvents,
                    message: 'Audit report generated'
                });
            } else {
                this.results.audit.failed++;
                this.results.audit.details.push({
                    test: 'Audit reporting',
                    status: 'FAIL',
                    error: 'Incomplete audit report'
                });
            }
            
        } catch (error) {
            this.results.audit.failed++;
            this.results.audit.details.push({
                test: 'Audit log',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Calculer résultats globaux
     */
    calculateOverallResults() {
        const categories = ['auth', 'distribution', 'audit'];
        
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
        console.log('\n🎯 === RÉSULTATS SÉCURITÉ ET RÉPARTITION ===');
        
        const categories = [
            { name: 'Auth/RBAC', key: 'auth' },
            { name: 'Répartition A/B/C/D', key: 'distribution' },
            { name: 'Audit Log', key: 'audit' }
        ];
        
        categories.forEach(({ name, key }) => {
            const result = this.results[key];
            const total = result.passed + result.failed;
            const status = result.failed === 0 ? '✅' : '❌';
            
            console.log(`\n${status} ${name}: ${result.passed}/${total} tests passés`);
            
            // Afficher détails importants
            result.details.forEach(detail => {
                if (detail.status === 'PASS' && (key === 'distribution' || key === 'auth')) {
                    console.log(`   ✅ ${detail.test}: ${detail.message || 'OK'}`);
                    if (detail.percentages) {
                        console.log(`      A: ${detail.percentages.A.toFixed(1)}%, B: ${detail.percentages.B.toFixed(1)}%, C: ${detail.percentages.C.toFixed(1)}%, D: ${detail.percentages.D.toFixed(1)}%`);
                        console.log(`      Chi²: ${detail.chiSquare}, p-value: ${detail.pValue}`);
                    }
                } else if (detail.status !== 'PASS') {
                    console.log(`   ❌ ${detail.test}: ${detail.error || detail.message}`);
                }
            });
        });
        
        console.log('\n📊 STATISTIQUES GLOBALES:');
        console.log(`✅ Tests réussis: ${this.results.overall.passed}`);
        console.log(`❌ Tests échoués: ${this.results.overall.failed}`);
        console.log(`📋 Total: ${this.results.overall.total}`);
        
        const successRate = (this.results.overall.passed / this.results.overall.total) * 100;
        console.log(`🎯 Taux de réussite: ${successRate.toFixed(1)}%`);
        
        const ready = this.results.overall.failed === 0;
        console.log(`🚀 Prêt pour déploiement: ${ready ? '✅ OUI' : '❌ NON'}`);
        
        return ready;
    }
    
    /**
     * Exécuter tous les tests
     */
    async runAllTests() {
        console.log('🧪 === TESTS SÉCURITÉ ET RÉPARTITION ===\n');
        
        this.testAuthSecurity();
        this.testPositionDistribution();
        this.testAuditLog();
        
        this.calculateOverallResults();
        const success = this.displayResults();
        
        return success;
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const tester = new SecurityDistributionTester();
    
    tester.runAllTests()
        .then(success => {
            console.log(`\n${success ? '✅' : '❌'} Tests sécurité terminés`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur tests sécurité:', error);
            process.exit(1);
        });
}

module.exports = SecurityDistributionTester;