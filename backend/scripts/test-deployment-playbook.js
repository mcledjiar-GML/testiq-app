#!/usr/bin/env node
/**
 * 📋 TEST DEPLOYMENT PLAYBOOK & RUNBOOK
 * =====================================
 * 
 * Tests du système de déploiement canary et rollback :
 * - Orchestration déploiement multi-étapes
 * - Validations automatiques et critères rollback
 * - Rollback automatique en cas d'échec
 * - Runbook documenté et historique
 */

const DeploymentPlaybook = require('../middleware/deployment-playbook');

class DeploymentPlaybookTester {
    
    constructor() {
        this.playbook = new DeploymentPlaybook();
        this.results = {
            playbookConfig: { passed: 0, failed: 0, details: [] },
            canaryDeployment: { passed: 0, failed: 0, details: [] },
            rollbackSystem: { passed: 0, failed: 0, details: [] },
            validationSystem: { passed: 0, failed: 0, details: [] },
            overall: { passed: 0, failed: 0, total: 0 }
        };
    }
    
    /**
     * Test 1: Configuration du playbook
     */
    testPlaybookConfiguration() {
        console.log('📋 Test 1: Configuration du playbook...');
        
        try {
            // Test 1.1: Étapes canary configurées
            const canarySteps = this.playbook.config.canarySteps;
            const requiredSteps = [
                'pre-deployment-checks',
                'feature-flag-setup', 
                'canary-deployment',
                'canary-validation-5',
                'canary-expansion-25',
                'canary-validation-25',
                'full-deployment',
                'post-deployment-validation'
            ];
            
            const hasAllSteps = requiredSteps.every(step => 
                canarySteps.some(s => s.name === step)
            );
            const stepsHaveValidConfig = canarySteps.every(step => 
                step.name && step.description && step.timeout > 0
            );
            
            if (hasAllSteps && stepsHaveValidConfig) {
                this.results.playbookConfig.passed++;
                this.results.playbookConfig.details.push({
                    test: 'Canary steps configuration',
                    status: 'PASS',
                    stepsCount: canarySteps.length,
                    requiredSteps: requiredSteps.length,
                    message: 'Étapes canary complètement configurées'
                });
            } else {
                this.results.playbookConfig.failed++;
                this.results.playbookConfig.details.push({
                    test: 'Canary steps configuration',
                    status: 'FAIL',
                    error: 'Configuration étapes canary incomplète'
                });
            }
            
            // Test 1.2: Étapes de rollback configurées
            const rollbackSteps = this.playbook.config.rollbackSteps;
            const requiredRollbackSteps = [
                'emergency-assessment',
                'traffic-redirect',
                'cache-invalidation',
                'system-verification',
                'post-rollback-analysis'
            ];
            
            const hasAllRollbackSteps = requiredRollbackSteps.every(step => 
                rollbackSteps.some(s => s.name === step)
            );
            const rollbackStepsValid = rollbackSteps.every(step => 
                step.name && step.description && step.actions?.length > 0
            );
            
            if (hasAllRollbackSteps && rollbackStepsValid) {
                this.results.playbookConfig.passed++;
                this.results.playbookConfig.details.push({
                    test: 'Rollback steps configuration',
                    status: 'PASS',
                    rollbackSteps: rollbackSteps.length,
                    requiredSteps: requiredRollbackSteps.length,
                    message: 'Étapes rollback complètement configurées'
                });
            } else {
                this.results.playbookConfig.failed++;
                this.results.playbookConfig.details.push({
                    test: 'Rollback steps configuration',
                    status: 'FAIL',
                    error: 'Configuration étapes rollback incomplète'
                });
            }
            
            // Test 1.3: Critères de rollback configurés
            const rollbackCriteria = this.playbook.config.rollbackCriteria;
            const requiredCriteria = [
                'errorRateThreshold',
                'latencyThreshold',
                'availabilityThreshold',
                'alertThreshold',
                'userComplaintThreshold',
                'timeoutThreshold'
            ];
            
            const hasAllCriteria = requiredCriteria.every(criteria => 
                rollbackCriteria.hasOwnProperty(criteria) &&
                typeof rollbackCriteria[criteria] === 'number'
            );
            
            if (hasAllCriteria) {
                this.results.playbookConfig.passed++;
                this.results.playbookConfig.details.push({
                    test: 'Rollback criteria configuration',
                    status: 'PASS',
                    criteriaCount: Object.keys(rollbackCriteria).length,
                    message: 'Critères rollback configurés'
                });
            } else {
                this.results.playbookConfig.failed++;
                this.results.playbookConfig.details.push({
                    test: 'Rollback criteria configuration',
                    status: 'FAIL',
                    error: 'Critères rollback incomplets'
                });
            }
            
        } catch (error) {
            this.results.playbookConfig.failed++;
            this.results.playbookConfig.details.push({
                test: 'Playbook configuration',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 2: Déploiement canary
     */
    async testCanaryDeployment() {
        console.log('🚀 Test 2: Déploiement canary...');
        
        try {
            // Test 2.1: Démarrage déploiement
            const testDeployment = {
                version: 'v1.0.0-test',
                features: ['testFeature1', 'testFeature2'],
                startedBy: 'test-user',
                metadata: { test: true }
            };
            
            // Réduire les timeouts pour les tests
            const originalTimeouts = this.playbook.config.canarySteps.map(step => ({
                name: step.name,
                timeout: step.timeout,
                waitTime: step.waitTime
            }));
            
            // Configurer timeouts courts pour test
            this.playbook.config.canarySteps.forEach(step => {
                step.timeout = 1000; // 1s
                if (step.waitTime) step.waitTime = 500; // 0.5s
            });
            
            const deployment = await this.playbook.startCanaryDeployment(testDeployment);
            
            // Restaurer timeouts originaux
            originalTimeouts.forEach(original => {
                const step = this.playbook.config.canarySteps.find(s => s.name === original.name);
                if (step) {
                    step.timeout = original.timeout;
                    step.waitTime = original.waitTime;
                }
            });
            
            if (deployment &&
                deployment.id &&
                deployment.version === testDeployment.version &&
                deployment.features.length === testDeployment.features.length) {
                this.results.canaryDeployment.passed++;
                this.results.canaryDeployment.details.push({
                    test: 'Canary deployment start',
                    status: 'PASS',
                    deploymentId: deployment.id,
                    version: deployment.version,
                    featuresCount: deployment.features.length,
                    message: 'Déploiement canary démarré avec succès'
                });
            } else {
                this.results.canaryDeployment.failed++;
                this.results.canaryDeployment.details.push({
                    test: 'Canary deployment start',
                    status: 'FAIL',
                    error: 'Démarrage déploiement canary échoué'
                });
            }
            
            // Test 2.2: Progression des étapes
            if (deployment && deployment.steps) {
                const completedSteps = deployment.steps.filter(step => step.success).length;
                const totalSteps = this.playbook.config.canarySteps.length;
                const progressionRate = (completedSteps / totalSteps) * 100;
                
                if (completedSteps > 0) {
                    this.results.canaryDeployment.passed++;
                    this.results.canaryDeployment.details.push({
                        test: 'Deployment step progression',
                        status: 'PASS',
                        completedSteps,
                        totalSteps,
                        progressionRate: `${progressionRate.toFixed(1)}%`,
                        message: 'Progression des étapes fonctionnelle'
                    });
                } else {
                    this.results.canaryDeployment.failed++;
                    this.results.canaryDeployment.details.push({
                        test: 'Deployment step progression',
                        status: 'FAIL',
                        completedSteps,
                        totalSteps,
                        error: 'Aucune étape complétée'
                    });
                }
            }
            
            // Test 2.3: Gestion des états de déploiement
            const deploymentStatus = this.playbook.getDeploymentStatus(deployment.id);
            
            if (deploymentStatus &&
                deploymentStatus.id === deployment.id &&
                ['running', 'completed', 'failed', 'rolled_back', 'rolling_back'].includes(deploymentStatus.status)) {
                this.results.canaryDeployment.passed++;
                this.results.canaryDeployment.details.push({
                    test: 'Deployment status tracking',
                    status: 'PASS',
                    deploymentStatus: deploymentStatus.status,
                    message: 'Suivi état déploiement fonctionnel'
                });
            } else {
                this.results.canaryDeployment.failed++;
                this.results.canaryDeployment.details.push({
                    test: 'Deployment status tracking',
                    status: 'FAIL',
                    error: 'Suivi état déploiement défaillant'
                });
            }
            
            this.testDeploymentId = deployment.id; // Pour les tests suivants
            
        } catch (error) {
            this.results.canaryDeployment.failed++;
            this.results.canaryDeployment.details.push({
                test: 'Canary deployment',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 3: Système de rollback
     */
    async testRollbackSystem() {
        console.log('🔄 Test 3: Système de rollback...');
        
        try {
            // Test 3.1: Vérification critères rollback
            const rollbackCheck = await this.playbook.checkRollbackCriteria('test-deployment');
            
            if (rollbackCheck &&
                typeof rollbackCheck.required === 'boolean' &&
                rollbackCheck.timestamp) {
                this.results.rollbackSystem.passed++;
                this.results.rollbackSystem.details.push({
                    test: 'Rollback criteria check',
                    status: 'PASS',
                    rollbackRequired: rollbackCheck.required,
                    issuesCount: rollbackCheck.allIssues?.length || 0,
                    message: 'Vérification critères rollback fonctionnelle'
                });
            } else {
                this.results.rollbackSystem.failed++;
                this.results.rollbackSystem.details.push({
                    test: 'Rollback criteria check',
                    status: 'FAIL',
                    error: 'Vérification critères rollback défaillante'
                });
            }
            
            // Test 3.2: Déclenchement rollback automatique
            if (this.testDeploymentId) {
                const rollback = await this.playbook.triggerAutomaticRollback(
                    this.testDeploymentId,
                    'Test rollback automatique',
                    { test: true }
                );
                
                if (rollback &&
                    rollback.id &&
                    rollback.deploymentId === this.testDeploymentId &&
                    rollback.reason === 'Test rollback automatique') {
                    this.results.rollbackSystem.passed++;
                    this.results.rollbackSystem.details.push({
                        test: 'Automatic rollback trigger',
                        status: 'PASS',
                        rollbackId: rollback.id,
                        reason: rollback.reason,
                        message: 'Rollback automatique déclenché'
                    });
                } else {
                    this.results.rollbackSystem.failed++;
                    this.results.rollbackSystem.details.push({
                        test: 'Automatic rollback trigger',
                        status: 'FAIL',
                        error: 'Déclenchement rollback automatique échoué'
                    });
                }
                
                this.testRollbackId = rollback?.id;
            }
            
            // Test 3.3: Exécution étapes rollback
            if (this.testRollbackId) {
                const rollbackStatus = this.playbook.getRollbackStatus(this.testRollbackId);
                
                if (rollbackStatus &&
                    rollbackStatus.steps &&
                    rollbackStatus.steps.length > 0) {
                    const completedRollbackSteps = rollbackStatus.steps.filter(step => step.success).length;
                    const totalRollbackSteps = this.playbook.config.rollbackSteps.length;
                    
                    if (completedRollbackSteps > 0) {
                        this.results.rollbackSystem.passed++;
                        this.results.rollbackSystem.details.push({
                            test: 'Rollback step execution',
                            status: 'PASS',
                            completedSteps: completedRollbackSteps,
                            totalSteps: totalRollbackSteps,
                            message: 'Exécution étapes rollback fonctionnelle'
                        });
                    } else {
                        this.results.rollbackSystem.failed++;
                        this.results.rollbackSystem.details.push({
                            test: 'Rollback step execution',
                            status: 'FAIL',
                            error: 'Aucune étape rollback complétée'
                        });
                    }
                } else {
                    this.results.rollbackSystem.failed++;
                    this.results.rollbackSystem.details.push({
                        test: 'Rollback step execution',
                        status: 'FAIL',
                        error: 'Statut rollback non disponible'
                    });
                }
            }
            
            // Test 3.4: Historique rollbacks
            const rollbacksList = this.playbook.listRollbacks();
            
            if (Array.isArray(rollbacksList) && rollbacksList.length > 0) {
                this.results.rollbackSystem.passed++;
                this.results.rollbackSystem.details.push({
                    test: 'Rollback history tracking',
                    status: 'PASS',
                    rollbackCount: rollbacksList.length,
                    message: 'Historique rollbacks maintenu'
                });
            } else {
                this.results.rollbackSystem.failed++;
                this.results.rollbackSystem.details.push({
                    test: 'Rollback history tracking',
                    status: 'FAIL',
                    error: 'Historique rollbacks non maintenu'
                });
            }
            
        } catch (error) {
            this.results.rollbackSystem.failed++;
            this.results.rollbackSystem.details.push({
                test: 'Rollback system',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 4: Système de validation
     */
    async testValidationSystem() {
        console.log('✅ Test 4: Système de validation...');
        
        try {
            // Test 4.1: Validations individuelles
            const testValidations = [
                'health_check',
                'dependency_check',
                'resource_availability',
                'slo_compliance',
                'error_rate_acceptable',
                'latency_within_slo'
            ];
            
            let successfulValidations = 0;
            const validationResults = [];
            
            for (const validation of testValidations) {
                try {
                    const result = await this.playbook.performValidation(validation, 'test');
                    validationResults.push({
                        name: validation,
                        passed: result.passed,
                        message: result.message
                    });
                    if (result.passed) successfulValidations++;
                } catch (error) {
                    validationResults.push({
                        name: validation,
                        passed: false,
                        error: error.message
                    });
                }
            }
            
            if (successfulValidations === testValidations.length) {
                this.results.validationSystem.passed++;
                this.results.validationSystem.details.push({
                    test: 'Individual validations',
                    status: 'PASS',
                    successfulValidations,
                    totalValidations: testValidations.length,
                    message: 'Toutes les validations fonctionnelles'
                });
            } else {
                this.results.validationSystem.failed++;
                this.results.validationSystem.details.push({
                    test: 'Individual validations',
                    status: 'FAIL',
                    successfulValidations,
                    totalValidations: testValidations.length,
                    error: 'Certaines validations échouées'
                });
            }
            
            // Test 4.2: Validation des étapes
            const testStep = {
                name: 'test-step',
                validations: ['health_check', 'dependency_check']
            };
            
            const stepValidations = await this.playbook.runStepValidations('test', testStep);
            
            if (Array.isArray(stepValidations) &&
                stepValidations.length === testStep.validations.length &&
                stepValidations.every(v => v.hasOwnProperty('passed'))) {
                this.results.validationSystem.passed++;
                this.results.validationSystem.details.push({
                    test: 'Step validation execution',
                    status: 'PASS',
                    validationsCount: stepValidations.length,
                    passedCount: stepValidations.filter(v => v.passed).length,
                    message: 'Validations d\'étape fonctionnelles'
                });
            } else {
                this.results.validationSystem.failed++;
                this.results.validationSystem.details.push({
                    test: 'Step validation execution',
                    status: 'FAIL',
                    error: 'Validations d\'étape défaillantes'
                });
            }
            
            // Test 4.3: Actions de rollback
            const testRollbackActions = [
                'assess_impact',
                'notify_team',
                'update_feature_flags',
                'invalidate_canary_cache',
                'health_check_stable'
            ];
            
            let successfulActions = 0;
            
            for (const action of testRollbackActions) {
                try {
                    const result = await this.playbook.performRollbackAction(action, 'test-rollback');
                    if (result.success) successfulActions++;
                } catch (error) {
                    // Action échouée
                }
            }
            
            if (successfulActions === testRollbackActions.length) {
                this.results.validationSystem.passed++;
                this.results.validationSystem.details.push({
                    test: 'Rollback actions execution',
                    status: 'PASS',
                    successfulActions,
                    totalActions: testRollbackActions.length,
                    message: 'Actions rollback fonctionnelles'
                });
            } else {
                this.results.validationSystem.failed++;
                this.results.validationSystem.details.push({
                    test: 'Rollback actions execution',
                    status: 'FAIL',
                    successfulActions,
                    totalActions: testRollbackActions.length,
                    error: 'Certaines actions rollback échouées'
                });
            }
            
            // Test 4.4: Génération d'IDs uniques
            const deploymentId1 = this.playbook.generateDeploymentId();
            const deploymentId2 = this.playbook.generateDeploymentId();
            const rollbackId1 = this.playbook.generateRollbackId();
            const rollbackId2 = this.playbook.generateRollbackId();
            
            const idsAreUnique = deploymentId1 !== deploymentId2 &&
                                rollbackId1 !== rollbackId2 &&
                                deploymentId1 !== rollbackId1;
            
            const idsHaveCorrectFormat = deploymentId1.startsWith('deploy_') &&
                                       rollbackId1.startsWith('rollback_');
            
            if (idsAreUnique && idsHaveCorrectFormat) {
                this.results.validationSystem.passed++;
                this.results.validationSystem.details.push({
                    test: 'Unique ID generation',
                    status: 'PASS',
                    message: 'Génération IDs uniques fonctionnelle'
                });
            } else {
                this.results.validationSystem.failed++;
                this.results.validationSystem.details.push({
                    test: 'Unique ID generation',
                    status: 'FAIL',
                    error: 'Génération IDs uniques défaillante'
                });
            }
            
        } catch (error) {
            this.results.validationSystem.failed++;
            this.results.validationSystem.details.push({
                test: 'Validation system',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Calculer résultats globaux
     */
    calculateOverallResults() {
        const categories = ['playbookConfig', 'canaryDeployment', 'rollbackSystem', 'validationSystem'];
        
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
        console.log('\\n📋 === RÉSULTATS DEPLOYMENT PLAYBOOK & RUNBOOK ===');
        
        const categories = [
            { name: 'Configuration Playbook', key: 'playbookConfig' },
            { name: 'Déploiement Canary', key: 'canaryDeployment' },
            { name: 'Système Rollback', key: 'rollbackSystem' },
            { name: 'Système Validation', key: 'validationSystem' }
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
                    if (detail.deploymentId) {
                        console.log(`      Déploiement: ${detail.deploymentId.slice(0, 16)}...`);
                    }
                    if (detail.progressionRate) {
                        console.log(`      Progression: ${detail.progressionRate}`);
                    }
                    if (detail.rollbackId) {
                        console.log(`      Rollback: ${detail.rollbackId.slice(0, 16)}...`);
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
        console.log(`📋 Playbook prêt: ${ready ? '✅ OUI' : '❌ NON'}`);
        
        // Afficher état actuel
        console.log('\\n📋 ÉTAT ACTUEL:');
        const deployments = this.playbook.listDeployments();
        const rollbacks = this.playbook.listRollbacks();
        console.log(`🚀 Déploiements: ${deployments.length} (${deployments.filter(d => d.status === 'completed').length} réussis)`);
        console.log(`🔄 Rollbacks: ${rollbacks.length} (${rollbacks.filter(r => r.automatic).length} automatiques)`);
        
        const canaryStepsCount = this.playbook.config.canarySteps.length;
        const rollbackStepsCount = this.playbook.config.rollbackSteps.length;
        console.log(`📋 Étapes canary: ${canaryStepsCount}, Étapes rollback: ${rollbackStepsCount}`);
        
        return ready;
    }
    
    /**
     * Exécuter tous les tests
     */
    async runAllTests() {
        console.log('📋 === TESTS DEPLOYMENT PLAYBOOK & RUNBOOK ===\\n');
        
        this.testPlaybookConfiguration();
        await this.testCanaryDeployment();
        await this.testRollbackSystem();
        await this.testValidationSystem();
        
        this.calculateOverallResults();
        const success = this.displayResults();
        
        return success;
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const tester = new DeploymentPlaybookTester();
    
    tester.runAllTests()
        .then(success => {
            console.log(`\\n${success ? '✅' : '❌'} Tests Deployment Playbook terminés`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur tests Deployment Playbook:', error);
            process.exit(1);
        });
}

module.exports = DeploymentPlaybookTester;