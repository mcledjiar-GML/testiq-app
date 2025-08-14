/**
 * 📋 DEPLOYMENT & ROLLBACK API
 * ============================
 * 
 * API REST pour orchestration des déploiements et rollbacks
 */

const express = require('express');
const AdminAuth = require('../middleware/admin-auth');
const DeploymentPlaybook = require('../middleware/deployment-playbook');

const router = express.Router();

/**
 * POST /api/deployment/canary
 * Démarrer un déploiement canary
 */
router.post('/canary',
    AdminAuth.requireAuth('killswitch:write'),
    async (req, res) => {
        try {
            const { version, features = [], metadata = {} } = req.body;
            
            if (!version) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Version requise pour le déploiement'
                });
            }
            
            const playbook = global.deploymentPlaybook || new DeploymentPlaybook();
            
            const deployment = await playbook.startCanaryDeployment({
                version,
                features,
                metadata,
                startedBy: req.admin?.name
            });
            
            global.adminAuth?.logAuditEvent(
                'CANARY_DEPLOYMENT_STARTED',
                req.admin?.name,
                'POST',
                '/api/deployment/canary',
                {
                    deploymentId: deployment.id,
                    version,
                    features,
                    metadata
                }
            );
            
            res.json({
                success: true,
                deployment: {
                    id: deployment.id,
                    version: deployment.version,
                    features: deployment.features,
                    status: deployment.status,
                    startedAt: deployment.startedAt,
                    startedBy: deployment.startedBy,
                    currentStep: deployment.currentStep,
                    totalSteps: playbook.config.canarySteps.length
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur déploiement canary:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * POST /api/deployment/rollback/:deploymentId
 * Déclencher un rollback manuel
 */
router.post('/rollback/:deploymentId',
    AdminAuth.requireAuth('killswitch:write'),
    async (req, res) => {
        try {
            const { deploymentId } = req.params;
            const { reason = 'Rollback manuel' } = req.body;
            
            const playbook = global.deploymentPlaybook || new DeploymentPlaybook();
            const deployment = playbook.getDeploymentStatus(deploymentId);
            
            if (!deployment) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Déploiement non trouvé'
                });
            }
            
            if (deployment.status === 'rolled_back' || deployment.status === 'rolling_back') {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Déploiement déjà en cours de rollback'
                });
            }
            
            const rollback = await playbook.triggerAutomaticRollback(
                deploymentId,
                reason,
                { manual: true, triggeredBy: req.admin?.name }
            );
            
            global.adminAuth?.logAuditEvent(
                'MANUAL_ROLLBACK_TRIGGERED',
                req.admin?.name,
                'POST',
                `/api/deployment/rollback/${deploymentId}`,
                {
                    deploymentId,
                    rollbackId: rollback.id,
                    reason
                }
            );
            
            res.json({
                success: true,
                rollback: {
                    id: rollback.id,
                    deploymentId: rollback.deploymentId,
                    reason: rollback.reason,
                    status: rollback.status,
                    startedAt: rollback.startedAt,
                    automatic: rollback.automatic
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur rollback manuel:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/deployment/status/:deploymentId
 * État d'un déploiement
 */
router.get('/status/:deploymentId',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const { deploymentId } = req.params;
            
            const playbook = global.deploymentPlaybook || new DeploymentPlaybook();
            const deployment = playbook.getDeploymentStatus(deploymentId);
            
            if (!deployment) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Déploiement non trouvé'
                });
            }
            
            res.json({
                success: true,
                deployment
            });
            
        } catch (error) {
            console.error('❌ Erreur statut déploiement:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/deployment/rollback-status/:rollbackId
 * État d'un rollback
 */
router.get('/rollback-status/:rollbackId',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const { rollbackId } = req.params;
            
            const playbook = global.deploymentPlaybook || new DeploymentPlaybook();
            const rollback = playbook.getRollbackStatus(rollbackId);
            
            if (!rollback) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Rollback non trouvé'
                });
            }
            
            res.json({
                success: true,
                rollback
            });
            
        } catch (error) {
            console.error('❌ Erreur statut rollback:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/deployment/list
 * Liste des déploiements
 */
router.get('/list',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const { limit = 20, offset = 0, status } = req.query;
            
            const playbook = global.deploymentPlaybook || new DeploymentPlaybook();
            let deployments = playbook.listDeployments();
            
            // Filtrer par statut si spécifié
            if (status) {
                deployments = deployments.filter(d => d.status === status);
            }
            
            // Pagination
            const total = deployments.length;
            const paginated = deployments.slice(
                parseInt(offset),
                parseInt(offset) + parseInt(limit)
            );
            
            res.json({
                success: true,
                deployments: paginated.map(d => ({
                    id: d.id,
                    version: d.version,
                    status: d.status,
                    startedAt: d.startedAt,
                    startedBy: d.startedBy,
                    completedAt: d.completedAt,
                    failedAt: d.failedAt,
                    currentStep: d.currentStep,
                    totalSteps: d.steps?.length || 0,
                    rollbackId: d.rollbackId
                })),
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: parseInt(offset) + parseInt(limit) < total
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur liste déploiements:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/deployment/rollbacks
 * Liste des rollbacks
 */
router.get('/rollbacks',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const { limit = 20, offset = 0 } = req.query;
            
            const playbook = global.deploymentPlaybook || new DeploymentPlaybook();
            const rollbacks = playbook.listRollbacks();
            
            // Pagination
            const total = rollbacks.length;
            const paginated = rollbacks.slice(
                parseInt(offset),
                parseInt(offset) + parseInt(limit)
            );
            
            res.json({
                success: true,
                rollbacks: paginated.map(r => ({
                    id: r.id,
                    deploymentId: r.deploymentId,
                    reason: r.reason,
                    status: r.status,
                    startedAt: r.startedAt,
                    completedAt: r.completedAt,
                    failedAt: r.failedAt,
                    automatic: r.automatic,
                    stepsCount: r.steps?.length || 0
                })),
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: parseInt(offset) + parseInt(limit) < total
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur liste rollbacks:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/deployment/playbook
 * Configuration du playbook
 */
router.get('/playbook',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const playbook = global.deploymentPlaybook || new DeploymentPlaybook();
            
            res.json({
                success: true,
                playbook: {
                    canarySteps: playbook.config.canarySteps.map(step => ({
                        name: step.name,
                        description: step.description,
                        timeout: step.timeout,
                        required: step.required,
                        canaryPercentage: step.canaryPercentage,
                        waitTime: step.waitTime,
                        validations: step.validations
                    })),
                    rollbackSteps: playbook.config.rollbackSteps.map(step => ({
                        name: step.name,
                        description: step.description,
                        timeout: step.timeout,
                        actions: step.actions
                    })),
                    rollbackCriteria: playbook.config.rollbackCriteria
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur configuration playbook:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/deployment/dashboard
 * Dashboard déploiements
 */
router.get('/dashboard',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const playbook = global.deploymentPlaybook || new DeploymentPlaybook();
            
            const deployments = playbook.listDeployments();
            const rollbacks = playbook.listRollbacks();
            
            const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const recentDeployments = deployments.filter(d => 
                new Date(d.startedAt) > last24h
            );
            const recentRollbacks = rollbacks.filter(r => 
                new Date(r.startedAt) > last24h
            );
            
            const dashboard = {
                timestamp: new Date().toISOString(),
                summary: {
                    totalDeployments: deployments.length,
                    recentDeployments: recentDeployments.length,
                    successfulDeployments: deployments.filter(d => d.status === 'completed').length,
                    failedDeployments: deployments.filter(d => d.status === 'failed').length,
                    rolledBackDeployments: deployments.filter(d => d.status === 'rolled_back').length,
                    totalRollbacks: rollbacks.length,
                    recentRollbacks: recentRollbacks.length,
                    automaticRollbacks: rollbacks.filter(r => r.automatic).length
                },
                recent: {
                    deployments: recentDeployments.slice(0, 5),
                    rollbacks: recentRollbacks.slice(0, 5)
                },
                currentDeployments: deployments.filter(d => 
                    d.status === 'running' || d.status === 'rolling_back'
                ),
                metrics: {
                    deploymentSuccessRate: deployments.length > 0 ? 
                        (deployments.filter(d => d.status === 'completed').length / deployments.length) * 100 : 0,
                    averageDeploymentTime: this.calculateAverageDeploymentTime(deployments),
                    rollbackRate: deployments.length > 0 ? 
                        (rollbacks.length / deployments.length) * 100 : 0
                }
            };
            
            res.json({
                success: true,
                dashboard
            });
            
        } catch (error) {
            console.error('❌ Erreur dashboard déploiement:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * POST /api/deployment/simulate
 * Simulation de déploiement pour tests
 */
router.post('/simulate',
    AdminAuth.requireAuth('monitoring:write'),
    async (req, res) => {
        try {
            const { 
                version = 'v1.0.0-test', 
                features = ['testFeature'], 
                simulateFailure = false,
                failAtStep = null 
            } = req.body;
            
            // Créer un playbook de test avec étapes réduites
            const playbook = global.deploymentPlaybook || new DeploymentPlaybook();
            
            // Modifier temporairement les timeouts pour la simulation
            const originalSteps = [...playbook.config.canarySteps];
            playbook.config.canarySteps.forEach(step => {
                step.timeout = 5000; // 5s pour simulation
                if (step.waitTime) step.waitTime = 2000; // 2s pour simulation
            });
            
            const deployment = await playbook.startCanaryDeployment({
                version,
                features,
                metadata: { simulation: true, simulateFailure, failAtStep },
                startedBy: req.admin?.name
            });
            
            // Restaurer les timeouts originaux
            playbook.config.canarySteps = originalSteps;
            
            global.adminAuth?.logAuditEvent(
                'DEPLOYMENT_SIMULATION',
                req.admin?.name,
                'POST',
                '/api/deployment/simulate',
                {
                    deploymentId: deployment.id,
                    version,
                    simulateFailure,
                    failAtStep
                }
            );
            
            res.json({
                success: true,
                simulation: {
                    id: deployment.id,
                    version: deployment.version,
                    status: deployment.status,
                    simulateFailure,
                    message: 'Simulation de déploiement démarrée'
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur simulation déploiement:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * Calculer le temps moyen de déploiement
 */
function calculateAverageDeploymentTime(deployments) {
    const completedDeployments = deployments.filter(d => 
        d.status === 'completed' && d.completedAt
    );
    
    if (completedDeployments.length === 0) return 0;
    
    const totalTime = completedDeployments.reduce((sum, deployment) => {
        const start = new Date(deployment.startedAt).getTime();
        const end = new Date(deployment.completedAt).getTime();
        return sum + (end - start);
    }, 0);
    
    return Math.round(totalTime / completedDeployments.length / 1000); // en secondes
}

module.exports = router;