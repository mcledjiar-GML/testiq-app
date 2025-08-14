/**
 * 🔍 ROUTES MONITORING ET KILL-SWITCH
 * ==================================
 * 
 * Endpoints pour surveillance production et contrôle des features.
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/monitoring/health
 * Status de santé du système
 */
router.get('/health', (req, res) => {
    try {
        const monitoring = global.monitoringSystem;
        const killSwitch = global.killSwitchSystem;
        
        if (!monitoring) {
            return res.status(503).json({
                status: 'unhealthy',
                error: 'Monitoring system not initialized'
            });
        }
        
        const metrics = monitoring.getMetrics();
        const killSwitchStatus = killSwitch?.getStatus() || { health: 'UNKNOWN' };
        
        const overallHealth = {
            status: metrics.health.status === 'healthy' && killSwitchStatus.health === 'OPERATIONAL' 
                ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            monitoring: metrics.health,
            killSwitch: killSwitchStatus.health,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0'
        };
        
        res.json(overallHealth);
        
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

/**
 * GET /api/monitoring/metrics
 * Métriques détaillées
 */
router.get('/metrics', (req, res) => {
    try {
        const monitoring = global.monitoringSystem;
        
        if (!monitoring) {
            return res.status(503).json({
                error: 'Monitoring system not available'
            });
        }
        
        const metrics = monitoring.getMetrics();
        res.json(metrics);
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get metrics',
            message: error.message
        });
    }
});

/**
 * GET /api/monitoring/report
 * Rapport de monitoring complet
 */
router.get('/report', (req, res) => {
    try {
        const monitoring = global.monitoringSystem;
        
        if (!monitoring) {
            return res.status(503).json({
                error: 'Monitoring system not available'
            });
        }
        
        const report = monitoring.generateReport();
        res.json(report);
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to generate report',
            message: error.message
        });
    }
});

/**
 * POST /api/monitoring/alert
 * Endpoint pour recevoir les erreurs frontend
 */
router.post('/alert', (req, res) => {
    try {
        const { type, error, userAgent, url, metadata } = req.body;
        const monitoring = global.monitoringSystem;
        
        if (!monitoring) {
            return res.status(503).json({
                error: 'Monitoring system not available'
            });
        }
        
        switch (type) {
            case 'frontend_error':
                monitoring.recordFrontendError(error, userAgent, url);
                break;
            case 'render_blocked':
                monitoring.recordRenderBlocked(metadata.qid, metadata.reason);
                break;
            default:
                return res.status(400).json({
                    error: 'Unknown alert type',
                    supportedTypes: ['frontend_error', 'render_blocked']
                });
        }
        
        res.json({
            success: true,
            message: 'Alert recorded',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to record alert',
            message: error.message
        });
    }
});

/**
 * GET /api/monitoring/kill-switch/status
 * Statut du kill-switch et feature flags
 */
router.get('/kill-switch/status', (req, res) => {
    try {
        const killSwitch = global.killSwitchSystem;
        
        if (!killSwitch) {
            return res.status(503).json({
                error: 'Kill-switch system not available'
            });
        }
        
        const status = killSwitch.getStatus();
        res.json(status);
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get kill-switch status',
            message: error.message
        });
    }
});

/**
 * POST /api/monitoring/kill-switch/emergency
 * KILL SWITCH D'URGENCE
 */
router.post('/kill-switch/emergency', (req, res) => {
    try {
        const { reason, operator } = req.body;
        const killSwitch = global.killSwitchSystem;
        
        if (!killSwitch) {
            return res.status(503).json({
                error: 'Kill-switch system not available'
            });
        }
        
        const success = killSwitch.emergencyKillSwitch(reason || 'Emergency stop via API');
        
        res.json({
            success,
            message: 'Emergency kill switch activated',
            reason,
            operator: operator || 'api',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to activate emergency kill switch',
            message: error.message
        });
    }
});

/**
 * POST /api/monitoring/kill-switch/feature/:feature/disable
 * Désactiver une feature spécifique
 */
router.post('/kill-switch/feature/:feature/disable', (req, res) => {
    try {
        const { feature } = req.params;
        const { reason } = req.body;
        const killSwitch = global.killSwitchSystem;
        
        if (!killSwitch) {
            return res.status(503).json({
                error: 'Kill-switch system not available'
            });
        }
        
        const success = killSwitch.disableFeature(feature, reason);
        
        res.json({
            success,
            feature,
            message: `Feature '${feature}' disabled`,
            reason,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to disable feature',
            message: error.message
        });
    }
});

/**
 * POST /api/monitoring/kill-switch/canary/configure
 * Configurer le canary release
 */
router.post('/kill-switch/canary/configure', (req, res) => {
    try {
        const config = req.body;
        const killSwitch = global.killSwitchSystem;
        
        if (!killSwitch) {
            return res.status(503).json({
                error: 'Kill-switch system not available'
            });
        }
        
        const newConfig = killSwitch.configureCanary(config);
        
        res.json({
            success: true,
            message: 'Canary configuration updated',
            config: newConfig,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to configure canary',
            message: error.message
        });
    }
});

/**
 * POST /api/monitoring/kill-switch/rollback
 * Rollback vers version stable
 */
router.post('/kill-switch/rollback', (req, res) => {
    try {
        const { reason } = req.body;
        const killSwitch = global.killSwitchSystem;
        
        if (!killSwitch) {
            return res.status(503).json({
                error: 'Kill-switch system not available'
            });
        }
        
        const success = killSwitch.rollbackToStable();
        
        res.json({
            success,
            message: 'Rollback to stable version executed',
            reason,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to execute rollback',
            message: error.message
        });
    }
});

/**
 * POST /api/monitoring/kill-switch/readonly
 * Activer le mode lecture seule
 */
router.post('/kill-switch/readonly', (req, res) => {
    try {
        const { reason } = req.body;
        const killSwitch = global.killSwitchSystem;
        
        if (!killSwitch) {
            return res.status(503).json({
                error: 'Kill-switch system not available'
            });
        }
        
        const success = killSwitch.enableReadOnlyMode(reason);
        
        res.json({
            success,
            message: 'Read-only mode activated',
            reason,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to activate read-only mode',
            message: error.message
        });
    }
});

/**
 * GET /api/monitoring/dashboard
 * Dashboard de monitoring simple
 */
router.get('/dashboard', (req, res) => {
    try {
        const monitoring = global.monitoringSystem;
        const killSwitch = global.killSwitchSystem;
        
        if (!monitoring) {
            return res.status(503).json({
                error: 'Monitoring system not available'
            });
        }
        
        const metrics = monitoring.getMetrics();
        const killSwitchStatus = killSwitch?.getStatus() || {};
        
        const dashboard = {
            timestamp: new Date().toISOString(),
            overview: {
                status: metrics.health.status,
                healthScore: metrics.health.score,
                activeAlerts: metrics.alerts.active.length,
                canaryEnabled: killSwitchStatus.canary?.enabled || false
            },
            keyMetrics: {
                latencyP95: metrics.metrics.latency.p95,
                errorRate: metrics.metrics.frontendErrors.rate,
                publishBlocked: metrics.metrics.publishBlocked.total,
                renderBlocked: metrics.metrics.renderBlocked.total
            },
            alerts: metrics.alerts.active,
            killSwitch: {
                globalStatus: killSwitchStatus.globalKillSwitch ? 'DISABLED' : 'ACTIVE',
                maintenanceMode: killSwitchStatus.maintenanceMode,
                readOnlyMode: killSwitchStatus.readOnlyMode
            },
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            }
        };
        
        res.json(dashboard);
        
    } catch (error) {
        res.status(500).json({
            error: 'Failed to generate dashboard',
            message: error.message
        });
    }
});

module.exports = router;