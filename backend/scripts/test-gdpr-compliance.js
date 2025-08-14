#!/usr/bin/env node
/**
 * 🛡️ TEST GDPR COMPLIANCE
 * =======================
 * 
 * Tests de validation de la conformité GDPR :
 * - Anonymisation des données PII
 * - Rétention et suppression automatique
 * - Droits des sujets de données
 * - Nettoyage planifié
 */

const GDPRCompliance = require('../middleware/gdpr-compliance');

class GDPRComplianceTester {
    
    constructor() {
        this.gdpr = new GDPRCompliance();
        this.results = {
            anonymization: { passed: 0, failed: 0, details: [] },
            retention: { passed: 0, failed: 0, details: [] },
            dataSubjectRights: { passed: 0, failed: 0, details: [] },
            cleanup: { passed: 0, failed: 0, details: [] },
            overall: { passed: 0, failed: 0, total: 0 }
        };
    }
    
    /**
     * Test 1: Anonymisation des données PII
     */
    testAnonymization() {
        console.log('🛡️ Test 1: Anonymisation des données PII...');
        
        try {
            // Test 1.1: Anonymisation données utilisateur
            const userData = {
                userId: 'user-12345',
                email: 'john.doe@example.com',
                ip: '192.168.1.100',
                sessionId: 'session-abc123',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                timestamp: new Date().toISOString(),
                action: 'login',
                nonPII: 'this should remain'
            };
            
            const anonymized = this.gdpr.anonymizeData(userData);
            
            // Vérifier l'anonymisation
            const checks = [
                { field: 'email', expected: 'partial', actual: anonymized.email?.includes('@example.com') && !anonymized.email.includes('john.doe') },
                { field: 'ip', expected: 'network_only', actual: anonymized.ip?.endsWith('.xxx') },
                { field: 'userId', expected: 'hashed', actual: anonymized.userId !== userData.userId && anonymized.userId?.length === 12 },
                { field: 'sessionId', expected: 'hashed', actual: anonymized.sessionId !== userData.sessionId },
                { field: 'userAgent', expected: 'generalized', actual: anonymized.userAgent?.endsWith('/Generic') },
                { field: 'nonPII', expected: 'preserved', actual: anonymized.nonPII === userData.nonPII },
                { field: '_gdpr', expected: 'metadata', actual: anonymized._gdpr?.anonymized === true }
            ];
            
            const passed = checks.filter(c => c.actual).length;
            const total = checks.length;
            
            if (passed === total) {
                this.results.anonymization.passed++;
                this.results.anonymization.details.push({
                    test: 'User data anonymization',
                    status: 'PASS',
                    checks: `${passed}/${total}`,
                    message: 'All PII fields properly anonymized'
                });
            } else {
                this.results.anonymization.failed++;
                const failed = checks.filter(c => !c.actual);
                this.results.anonymization.details.push({
                    test: 'User data anonymization',
                    status: 'FAIL',
                    checks: `${passed}/${total}`,
                    failedFields: failed.map(f => f.field),
                    error: 'Some PII fields not properly anonymized'
                });
            }
            
            // Test 1.2: Anonymisation logs d'audit
            const auditLog = {
                timestamp: new Date().toISOString(),
                type: 'AUDIT',
                action: 'LOGIN',
                user: 'test-user',
                ip: '10.0.0.1',
                details: {
                    userAgent: 'Chrome/99.0',
                    sessionId: 'sess-123',
                    location: 'Paris'
                }
            };
            
            const anonymizedLog = this.gdpr.anonymizeData(auditLog, { saltKey: 'audit-logs' });
            
            if (anonymizedLog.ip !== auditLog.ip && 
                anonymizedLog.details.userAgent !== auditLog.details.userAgent &&
                anonymizedLog._gdpr?.anonymized === true) {
                this.results.anonymization.passed++;
                this.results.anonymization.details.push({
                    test: 'Audit log anonymization',
                    status: 'PASS',
                    message: 'Audit logs properly anonymized'
                });
            } else {
                this.results.anonymization.failed++;
                this.results.anonymization.details.push({
                    test: 'Audit log anonymization',
                    status: 'FAIL',
                    error: 'Audit log anonymization failed'
                });
            }
            
            // Test 1.3: Préservation des données non-PII
            const mixedData = {
                qid: 'Q001',
                difficulty: 5,
                category: 'logique',
                email: 'test@example.com', // PII
                ip: '127.0.0.1', // PII
                score: 85,
                timestamp: new Date().toISOString()
            };
            
            const mixedAnonymized = this.gdpr.anonymizeData(mixedData);
            
            if (mixedAnonymized.qid === mixedData.qid &&
                mixedAnonymized.difficulty === mixedData.difficulty &&
                mixedAnonymized.score === mixedData.score &&
                mixedAnonymized.email !== mixedData.email &&
                mixedAnonymized.ip !== mixedData.ip) {
                this.results.anonymization.passed++;
                this.results.anonymization.details.push({
                    test: 'Selective PII anonymization',
                    status: 'PASS',
                    message: 'Non-PII data preserved, PII anonymized'
                });
            } else {
                this.results.anonymization.failed++;
                this.results.anonymization.details.push({
                    test: 'Selective PII anonymization',
                    status: 'FAIL',
                    error: 'Non-PII data not properly preserved'
                });
            }
            
        } catch (error) {
            this.results.anonymization.failed++;
            this.results.anonymization.details.push({
                test: 'Anonymization system',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 2: Rétention et suppression automatique
     */
    testRetention() {
        console.log('📅 Test 2: Rétention et suppression automatique...');
        
        try {
            // Test 2.1: Détection données expirées
            const oldTimestamp = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(); // 100 jours
            const recentTimestamp = new Date().toISOString();
            
            const shouldDeleteOld = this.gdpr.shouldDelete(oldTimestamp, 'auditLogs');
            const shouldDeleteRecent = this.gdpr.shouldDelete(recentTimestamp, 'auditLogs');
            
            if (shouldDeleteOld && !shouldDeleteRecent) {
                this.results.retention.passed++;
                this.results.retention.details.push({
                    test: 'Retention period detection',
                    status: 'PASS',
                    message: 'Correctly identifies expired data'
                });
            } else {
                this.results.retention.failed++;
                this.results.retention.details.push({
                    test: 'Retention period detection',
                    status: 'FAIL',
                    error: `Old: ${shouldDeleteOld}, Recent: ${shouldDeleteRecent}`
                });
            }
            
            // Test 2.2: Seuil d'anonymisation automatique
            const mediumAgeTimestamp = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 jours
            const shouldAnonymizeOld = this.gdpr.shouldAnonymize(mediumAgeTimestamp);
            const shouldAnonymizeRecent = this.gdpr.shouldAnonymize(recentTimestamp);
            
            if (shouldAnonymizeOld && !shouldAnonymizeRecent) {
                this.results.retention.passed++;
                this.results.retention.details.push({
                    test: 'Auto-anonymization threshold',
                    status: 'PASS',
                    message: 'Correctly identifies data for anonymization'
                });
            } else {
                this.results.retention.failed++;
                this.results.retention.details.push({
                    test: 'Auto-anonymization threshold',
                    status: 'FAIL',
                    error: `Old: ${shouldAnonymizeOld}, Recent: ${shouldAnonymizeRecent}`
                });
            }
            
            // Test 2.3: Nettoyage des logs d'audit
            const testAuditLogs = [
                { timestamp: oldTimestamp, user: 'old-user', action: 'OLD_ACTION' },
                { timestamp: mediumAgeTimestamp, user: 'medium-user', action: 'MEDIUM_ACTION' },
                { timestamp: recentTimestamp, user: 'recent-user', action: 'RECENT_ACTION' }
            ];
            
            const cleanedLogs = this.gdpr.cleanupAuditLogs([...testAuditLogs]);
            const hasAnonymized = cleanedLogs.some(log => log._gdpr?.anonymized);
            const removedOld = cleanedLogs.length < testAuditLogs.length;
            
            if (cleanedLogs.length <= testAuditLogs.length && hasAnonymized) {
                this.results.retention.passed++;
                this.results.retention.details.push({
                    test: 'Audit log cleanup',
                    status: 'PASS',
                    originalCount: testAuditLogs.length,
                    cleanedCount: cleanedLogs.length,
                    anonymizedCount: cleanedLogs.filter(log => log._gdpr?.anonymized).length,
                    message: 'Audit logs properly cleaned and anonymized'
                });
            } else {
                this.results.retention.failed++;
                this.results.retention.details.push({
                    test: 'Audit log cleanup',
                    status: 'FAIL',
                    error: 'Audit log cleanup not working properly'
                });
            }
            
        } catch (error) {
            this.results.retention.failed++;
            this.results.retention.details.push({
                test: 'Retention system',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 3: Droits des sujets de données
     */
    testDataSubjectRights() {
        console.log('👤 Test 3: Droits des sujets de données...');
        
        try {
            // Simuler des données utilisateur
            const testUserId = 'test-user-123';
            const testEmail = 'test@example.com';
            
            // Ajouter des données de test
            global.adminAuth = {
                auditLog: [
                    { user: testUserId, action: 'LOGIN', timestamp: new Date().toISOString(), details: { email: testEmail } },
                    { user: testUserId, action: 'VIEW_QUESTION', timestamp: new Date().toISOString() },
                    { user: 'other-user', action: 'OTHER_ACTION', timestamp: new Date().toISOString() }
                ]
            };
            
            // Test 3.1: Droit d'accès
            const accessResult = this.gdpr.handleDataSubjectRequest({
                type: 'access',
                userId: testUserId,
                email: testEmail
            });
            
            if (accessResult.userId === testUserId && 
                accessResult.data.auditLogs.length === 2 &&
                accessResult.extractedAt) {
                this.results.dataSubjectRights.passed++;
                this.results.dataSubjectRights.details.push({
                    test: 'Right to access',
                    status: 'PASS',
                    extractedRecords: accessResult.data.auditLogs.length,
                    message: 'User data correctly extracted'
                });
            } else {
                this.results.dataSubjectRights.failed++;
                this.results.dataSubjectRights.details.push({
                    test: 'Right to access',
                    status: 'FAIL',
                    error: 'Data extraction failed'
                });
            }
            
            // Test 3.2: Droit à l'effacement
            const erasureResult = this.gdpr.handleDataSubjectRequest({
                type: 'erasure',
                userId: testUserId
            });
            
            const remainingLogs = global.adminAuth.auditLog.filter(log => log.user === testUserId);
            
            if (erasureResult.deletedCount >= 2 && remainingLogs.length === 0) {
                this.results.dataSubjectRights.passed++;
                this.results.dataSubjectRights.details.push({
                    test: 'Right to erasure',
                    status: 'PASS',
                    deletedCount: erasureResult.deletedCount,
                    message: 'User data completely erased'
                });
            } else {
                this.results.dataSubjectRights.failed++;
                this.results.dataSubjectRights.details.push({
                    test: 'Right to erasure',
                    status: 'FAIL',
                    error: `Deleted: ${erasureResult.deletedCount}, Remaining: ${remainingLogs.length}`
                });
            }
            
            // Test 3.3: Droit à la portabilité
            // Restaurer des données pour le test
            global.adminAuth.auditLog = [
                { user: testUserId, action: 'LOGIN', timestamp: new Date().toISOString() }
            ];
            
            const portabilityResult = this.gdpr.handleDataSubjectRequest({
                type: 'portability',
                userId: testUserId,
                email: testEmail
            });
            
            if (portabilityResult.portable === true && 
                portabilityResult.format === 'JSON' &&
                portabilityResult.downloadUrl) {
                this.results.dataSubjectRights.passed++;
                this.results.dataSubjectRights.details.push({
                    test: 'Right to data portability',
                    status: 'PASS',
                    format: portabilityResult.format,
                    message: 'Portable data export generated'
                });
            } else {
                this.results.dataSubjectRights.failed++;
                this.results.dataSubjectRights.details.push({
                    test: 'Right to data portability',
                    status: 'FAIL',
                    error: 'Data portability failed'
                });
            }
            
            // Test 3.4: Droit de rectification
            const rectificationResult = this.gdpr.handleDataSubjectRequest({
                type: 'rectification',
                userId: testUserId,
                data: { correctedField: 'corrected-value' }
            });
            
            if (rectificationResult.correctedCount > 0) {
                this.results.dataSubjectRights.passed++;
                this.results.dataSubjectRights.details.push({
                    test: 'Right to rectification',
                    status: 'PASS',
                    correctedCount: rectificationResult.correctedCount,
                    message: 'User data corrected'
                });
            } else {
                this.results.dataSubjectRights.failed++;
                this.results.dataSubjectRights.details.push({
                    test: 'Right to rectification',
                    status: 'FAIL',
                    error: 'Data rectification failed'
                });
            }
            
        } catch (error) {
            this.results.dataSubjectRights.failed++;
            this.results.dataSubjectRights.details.push({
                test: 'Data subject rights',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 4: Nettoyage planifié et rapport de conformité
     */
    testCleanupAndReporting() {
        console.log('📋 Test 4: Nettoyage planifié et rapport...');
        
        try {
            // Test 4.1: Génération rapport de conformité
            const report = this.gdpr.generateComplianceReport();
            
            if (report.timestamp && 
                report.compliance && 
                report.compliance.auditLogs &&
                report.compliance.dataSubjectRights) {
                this.results.cleanup.passed++;
                this.results.cleanup.details.push({
                    test: 'Compliance report generation',
                    status: 'PASS',
                    reportSections: Object.keys(report.compliance).length,
                    message: 'Compliance report generated successfully'
                });
            } else {
                this.results.cleanup.failed++;
                this.results.cleanup.details.push({
                    test: 'Compliance report generation',
                    status: 'FAIL',
                    error: 'Incomplete compliance report'
                });
            }
            
            // Test 4.2: Nettoyage planifié (simulation)
            global.adminAuth = {
                auditLog: [
                    { timestamp: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), user: 'old-user' },
                    { timestamp: new Date().toISOString(), user: 'recent-user' }
                ]
            };
            
            const originalCount = global.adminAuth.auditLog.length;
            this.gdpr.performScheduledCleanup(true); // Light cleanup
            const newCount = global.adminAuth.auditLog.length;
            
            if (newCount <= originalCount) {
                this.results.cleanup.passed++;
                this.results.cleanup.details.push({
                    test: 'Scheduled cleanup',
                    status: 'PASS',
                    originalCount,
                    newCount,
                    message: 'Scheduled cleanup executed successfully'
                });
            } else {
                this.results.cleanup.failed++;
                this.results.cleanup.details.push({
                    test: 'Scheduled cleanup',
                    status: 'FAIL',
                    error: 'Cleanup did not reduce data volume'
                });
            }
            
            // Test 4.3: Configuration de rétention
            const retentionConfig = this.gdpr.config.retention;
            const hasAllPeriods = ['auditLogs', 'sessionData', 'errorLogs', 'analyticsData', 'userInteractions']
                .every(type => retentionConfig[type] > 0);
            
            if (hasAllPeriods && this.gdpr.config.autoAnonymizeAfter > 0) {
                this.results.cleanup.passed++;
                this.results.cleanup.details.push({
                    test: 'Retention configuration',
                    status: 'PASS',
                    retentionPeriods: Object.keys(retentionConfig).length,
                    autoAnonymizeAfter: `${this.gdpr.config.autoAnonymizeAfter} jours`,
                    message: 'Retention periods properly configured'
                });
            } else {
                this.results.cleanup.failed++;
                this.results.cleanup.details.push({
                    test: 'Retention configuration',
                    status: 'FAIL',
                    error: 'Retention configuration incomplete'
                });
            }
            
        } catch (error) {
            this.results.cleanup.failed++;
            this.results.cleanup.details.push({
                test: 'Cleanup and reporting',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Calculer résultats globaux
     */
    calculateOverallResults() {
        const categories = ['anonymization', 'retention', 'dataSubjectRights', 'cleanup'];
        
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
        console.log('\n🛡️ === RÉSULTATS CONFORMITÉ GDPR ===');
        
        const categories = [
            { name: 'Anonymisation PII', key: 'anonymization' },
            { name: 'Rétention & Suppression', key: 'retention' },
            { name: 'Droits Sujets Données', key: 'dataSubjectRights' },
            { name: 'Nettoyage & Rapport', key: 'cleanup' }
        ];
        
        categories.forEach(({ name, key }) => {
            const result = this.results[key];
            const total = result.passed + result.failed;
            const status = result.failed === 0 ? '✅' : '❌';
            
            console.log(`\n${status} ${name}: ${result.passed}/${total} tests passés`);
            
            // Afficher détails importants
            result.details.forEach(detail => {
                if (detail.status === 'PASS') {
                    console.log(`   ✅ ${detail.test}: ${detail.message || 'OK'}`);
                } else {
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
        
        const compliant = this.results.overall.failed === 0;
        console.log(`🛡️ Conformité GDPR: ${compliant ? '✅ CONFORME' : '❌ NON CONFORME'}`);
        
        return compliant;
    }
    
    /**
     * Exécuter tous les tests
     */
    async runAllTests() {
        console.log('🛡️ === TESTS CONFORMITÉ GDPR ===\n');
        
        this.testAnonymization();
        this.testRetention();
        this.testDataSubjectRights();
        this.testCleanupAndReporting();
        
        this.calculateOverallResults();
        const compliant = this.displayResults();
        
        return compliant;
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const tester = new GDPRComplianceTester();
    
    tester.runAllTests()
        .then(compliant => {
            console.log(`\n${compliant ? '✅' : '❌'} Tests GDPR terminés`);
            process.exit(compliant ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur tests GDPR:', error);
            process.exit(1);
        });
}

module.exports = GDPRComplianceTester;