/**
 * 🌐 CDN & CACHE MANAGEMENT API
 * =============================
 * 
 * API REST pour la gestion du cache CDN et l'invalidation coordonnée
 */

const express = require('express');
const AdminAuth = require('../middleware/admin-auth');
const CDNCacheManager = require('../middleware/cdn-cache');

const router = express.Router();

/**
 * GET /api/cdn/status
 * État du cache CDN
 */
router.get('/status', 
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const cacheManager = global.cdnCacheManager || new CDNCacheManager();
            const status = cacheManager.getCacheStatus();
            
            res.json({
                success: true,
                cache: status
            });
            
        } catch (error) {
            console.error('❌ Erreur statut CDN:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erreur récupération statut cache'
            });
        }
    }
);

/**
 * POST /api/cdn/invalidate
 * Invalider le cache CDN
 */
router.post('/invalidate',
    AdminAuth.requireAuth('monitoring:write'),
    async (req, res) => {
        try {
            const { patterns, reason, deploymentType = 'manual' } = req.body;
            
            if (!patterns || !Array.isArray(patterns) || patterns.length === 0) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Patterns d\'invalidation requis (array)'
                });
            }
            
            const cacheManager = global.cdnCacheManager || new CDNCacheManager();
            const invalidation = await cacheManager.invalidateCache(
                patterns, 
                reason || `Manuel par ${req.admin?.name}`,
                deploymentType
            );
            
            // Logger l'action dans l'audit
            global.adminAuth?.logAuditEvent(
                'CDN_INVALIDATION',
                req.admin?.name,
                'POST',
                '/api/cdn/invalidate',
                {
                    patterns,
                    reason,
                    deploymentType,
                    invalidationId: invalidation.id
                }
            );
            
            res.json({
                success: true,
                invalidation: {
                    id: invalidation.id,
                    patterns: invalidation.patterns,
                    status: invalidation.status,
                    timestamp: invalidation.timestamp,
                    deploymentType: invalidation.deploymentType
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur invalidation CDN:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * POST /api/cdn/coordinated-invalidation
 * Invalidation coordonnée pour déploiement
 */
router.post('/coordinated-invalidation',
    AdminAuth.requireAuth('monitoring:write'),
    async (req, res) => {
        try {
            const { 
                deploymentType, 
                version, 
                rollbackVersion, 
                waitForPropagation = true,
                validateAfter = true 
            } = req.body;
            
            if (!deploymentType) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Type de déploiement requis'
                });
            }
            
            const validTypes = ['fullDeploy', 'canaryDeploy', 'hotfix', 'assets'];
            if (!validTypes.includes(deploymentType)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: `Type invalide. Types valides: ${validTypes.join(', ')}`
                });
            }
            
            const cacheManager = global.cdnCacheManager || new CDNCacheManager();
            const invalidation = await cacheManager.coordinatedInvalidation(
                deploymentType,
                { version, rollbackVersion, waitForPropagation, validateAfter }
            );
            
            global.adminAuth?.logAuditEvent(
                'CDN_COORDINATED_INVALIDATION',
                req.admin?.name,
                'POST',
                '/api/cdn/coordinated-invalidation',
                {
                    deploymentType,
                    version,
                    rollbackVersion,
                    invalidationId: invalidation.id,
                    success: invalidation.status === 'completed'
                }
            );
            
            res.json({
                success: true,
                deployment: {
                    type: deploymentType,
                    version,
                    invalidation,
                    coordinatedBy: req.admin?.name,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur invalidation coordonnée:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * POST /api/cdn/setup-canary-cache
 * Configurer le cache pour canary release
 */
router.post('/setup-canary-cache',
    AdminAuth.requireAuth('killswitch:write'),
    (req, res) => {
        try {
            const { percentage, features, version } = req.body;
            
            if (!percentage || !version) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Percentage et version requis pour canary'
                });
            }
            
            if (percentage < 0 || percentage > 100) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Percentage doit être entre 0 et 100'
                });
            }
            
            const cacheManager = global.cdnCacheManager || new CDNCacheManager();
            const canaryVersion = cacheManager.setupCanaryCache({
                percentage,
                features: features || {},
                version
            });
            
            global.adminAuth?.logAuditEvent(
                'CANARY_CACHE_SETUP',
                req.admin?.name,
                'POST',
                '/api/cdn/setup-canary-cache',
                {
                    percentage,
                    version,
                    canaryVersion,
                    features
                }
            );
            
            res.json({
                success: true,
                canary: {
                    percentage,
                    version: canaryVersion,
                    features,
                    setupBy: req.admin?.name,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur setup cache canary:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * POST /api/cdn/rollback
 * Rollback du cache vers une version antérieure
 */
router.post('/rollback',
    AdminAuth.requireAuth('killswitch:write'),
    async (req, res) => {
        try {
            const { targetVersion, reason } = req.body;
            
            if (!targetVersion) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Version cible requise pour rollback'
                });
            }
            
            const cacheManager = global.cdnCacheManager || new CDNCacheManager();
            const rollbackResult = await cacheManager.rollbackCache(targetVersion);
            
            global.adminAuth?.logAuditEvent(
                'CDN_ROLLBACK',
                req.admin?.name,
                'POST',
                '/api/cdn/rollback',
                {
                    targetVersion,
                    reason: reason || 'Rollback manuel',
                    invalidationId: rollbackResult.id,
                    success: rollbackResult.status === 'completed'
                }
            );
            
            res.json({
                success: true,
                rollback: {
                    targetVersion,
                    reason: reason || 'Rollback manuel',
                    invalidation: rollbackResult,
                    rolledBackBy: req.admin?.name,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur rollback CDN:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/cdn/invalidation-history
 * Historique des invalidations CDN
 */
router.get('/invalidation-history',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const { limit = 50, offset = 0, deploymentType } = req.query;
            
            const cacheManager = global.cdnCacheManager || new CDNCacheManager();
            let history = cacheManager.invalidationHistory;
            
            // Filtrer par type de déploiement si spécifié
            if (deploymentType) {
                history = history.filter(inv => inv.deploymentType === deploymentType);
            }
            
            // Pagination
            const total = history.length;
            const paginatedHistory = history
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(offset, offset + parseInt(limit));
            
            res.json({
                success: true,
                invalidations: paginatedHistory,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: offset + parseInt(limit) < total
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur historique invalidations:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erreur récupération historique'
            });
        }
    }
);

/**
 * GET /api/cdn/invalidation/:id
 * Détails d'une invalidation spécifique
 */
router.get('/invalidation/:id',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const { id } = req.params;
            
            const cacheManager = global.cdnCacheManager || new CDNCacheManager();
            const invalidation = cacheManager.invalidationHistory.find(inv => inv.id === id);
            
            if (!invalidation) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Invalidation non trouvée'
                });
            }
            
            res.json({
                success: true,
                invalidation
            });
            
        } catch (error) {
            console.error('❌ Erreur détails invalidation:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erreur récupération invalidation'
            });
        }
    }
);

/**
 * GET /api/cdn/health
 * Health check du système CDN
 */
router.get('/health',
    AdminAuth.requireAuth('monitoring:read'),
    async (req, res) => {
        try {
            const cacheManager = global.cdnCacheManager || new CDNCacheManager();
            
            const health = await cacheManager.checkCDNHealth();
            const criticalResources = await cacheManager.checkCriticalResources();
            
            const overallHealth = {
                status: health.healthy && criticalResources.available ? 'healthy' : 'degraded',
                timestamp: new Date().toISOString(),
                cdn: health,
                resources: criticalResources,
                cache: {
                    currentVersion: cacheManager.currentVersion,
                    provider: cacheManager.config.cdnProvider,
                    recentInvalidations: cacheManager.invalidationHistory.slice(-5).length
                }
            };
            
            res.json({
                success: true,
                health: overallHealth
            });
            
        } catch (error) {
            console.error('❌ Erreur health check CDN:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

module.exports = router;