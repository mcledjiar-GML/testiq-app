/**
 * 📊 SLO MONITORING API
 * ====================
 * 
 * API REST pour la gestion des SLO et alertes
 */

const express = require('express');
const AdminAuth = require('../middleware/admin-auth');
const SLOMonitoring = require('../middleware/slo-monitoring');

const router = express.Router();

/**
 * GET /api/slo/status
 * État actuel des SLO
 */
router.get('/status', 
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const sloMonitoring = global.sloMonitoring || new SLOMonitoring();
            const evaluation = sloMonitoring.evaluateSLOs();
            
            res.json({
                success: true,
                evaluation
            });
            
        } catch (error) {
            console.error('❌ Erreur statut SLO:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erreur récupération statut SLO'
            });
        }
    }
);

/**
 * GET /api/slo/report
 * Rapport SLO détaillé
 */
router.get('/report',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const { period = '24h' } = req.query;
            
            const validPeriods = ['1h', '24h', '7d', '30d'];
            if (!validPeriods.includes(period)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: `Période invalide. Périodes valides: ${validPeriods.join(', ')}`
                });
            }
            
            const sloMonitoring = global.sloMonitoring || new SLOMonitoring();
            const report = sloMonitoring.getSLOReport(period);
            
            res.json({
                success: true,
                report
            });
            
        } catch (error) {
            console.error('❌ Erreur rapport SLO:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erreur génération rapport SLO'
            });
        }
    }
);

/**
 * GET /api/slo/budgets
 * État des budgets d'erreur
 */
router.get('/budgets',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const sloMonitoring = global.sloMonitoring || new SLOMonitoring();
            const budgets = Object.fromEntries(sloMonitoring.errorBudgets);
            
            // Enrichir avec les configurations SLO
            const enrichedBudgets = {};
            Object.entries(budgets).forEach(([sloName, budget]) => {
                const sloConfig = sloMonitoring.config.slos[sloName];
                enrichedBudgets[sloName] = {
                    ...budget,
                    target: sloConfig?.target,
                    window: sloConfig?.window,
                    thresholds: {
                        warning: sloConfig?.warningThreshold,
                        critical: sloConfig?.criticalThreshold
                    }
                };
            });
            
            res.json({
                success: true,
                budgets: enrichedBudgets
            });
            
        } catch (error) {
            console.error('❌ Erreur budgets SLO:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erreur récupération budgets'
            });
        }
    }
);

/**
 * POST /api/slo/reset-budget
 * Reset manuel d'un budget d'erreur
 */
router.post('/reset-budget',
    AdminAuth.requireAuth('monitoring:write'),
    (req, res) => {
        try {
            const { slo } = req.body;
            
            if (!slo) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Nom du SLO requis'
                });
            }
            
            const sloMonitoring = global.sloMonitoring || new SLOMonitoring();
            const sloConfig = sloMonitoring.config.slos[slo];
            
            if (!sloConfig) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `SLO '${slo}' non trouvé`
                });
            }
            
            sloMonitoring.resetErrorBudget(slo, sloConfig);
            
            global.adminAuth?.logAuditEvent(
                'SLO_BUDGET_RESET',
                req.admin?.name,
                'POST',
                '/api/slo/reset-budget',
                { slo, budget: sloConfig.budget }
            );
            
            const newBudget = sloMonitoring.errorBudgets.get(slo);
            
            res.json({
                success: true,
                reset: {
                    slo,
                    budget: newBudget,
                    resetBy: req.admin?.name,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur reset budget:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/slo/alerts
 * Historique des alertes SLO
 */
router.get('/alerts',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const { limit = 50, offset = 0, level, slo } = req.query;
            
            const sloMonitoring = global.sloMonitoring || new SLOMonitoring();
            let alerts = Array.from(sloMonitoring.alerts.values());
            
            // Filtres
            if (level) {
                alerts = alerts.filter(alert => alert.level === level);
            }
            if (slo) {
                alerts = alerts.filter(alert => alert.slo === slo);
            }
            
            // Tri par timestamp décroissant
            alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Pagination
            const total = alerts.length;
            const paginated = alerts.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
            
            res.json({
                success: true,
                alerts: paginated,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: parseInt(offset) + parseInt(limit) < total
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur alertes SLO:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erreur récupération alertes'
            });
        }
    }
);

/**
 * POST /api/slo/test-alert
 * Déclencher une alerte de test
 */
router.post('/test-alert',
    AdminAuth.requireAuth('monitoring:write'),
    (req, res) => {
        try {
            const { level = 'warning', slo = 'availability', message } = req.body;
            
            const validLevels = ['warning', 'critical', 'emergency'];
            if (!validLevels.includes(level)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: `Niveau invalide. Niveaux valides: ${validLevels.join(', ')}`
                });
            }
            
            const sloMonitoring = global.sloMonitoring || new SLOMonitoring();
            
            const testAlert = {
                level,
                slo,
                message: message || `Alerte de test ${level} pour ${slo}`,
                value: Math.random() * 100,
                threshold: 95,
                test: true
            };
            
            sloMonitoring.triggerAlert(testAlert);
            
            global.adminAuth?.logAuditEvent(
                'SLO_TEST_ALERT',
                req.admin?.name,
                'POST',
                '/api/slo/test-alert',
                { level, slo, message: testAlert.message }
            );
            
            res.json({
                success: true,
                testAlert: {
                    level: testAlert.level,
                    slo: testAlert.slo,
                    message: testAlert.message,
                    triggeredBy: req.admin?.name,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur test alerte:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/slo/metrics
 * Métriques SLI (Service Level Indicators)
 */
router.get('/metrics',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const { window = '1h', limit = 100 } = req.query;
            
            const sloMonitoring = global.sloMonitoring || new SLOMonitoring();
            const recentSLIs = sloMonitoring.getRecentSLIs(window);
            
            // Limiter les résultats
            const limitedSLIs = recentSLIs.slice(-parseInt(limit));
            
            // Calculer des statistiques
            const stats = {
                count: limitedSLIs.length,
                availability: {
                    min: Math.min(...limitedSLIs.map(s => s.availability)),
                    max: Math.max(...limitedSLIs.map(s => s.availability)),
                    avg: limitedSLIs.reduce((sum, s) => sum + s.availability, 0) / limitedSLIs.length || 0
                },
                latency: {
                    p50: this.calculatePercentile(limitedSLIs.map(s => s.latency.p50), 0.5),
                    p95: this.calculatePercentile(limitedSLIs.map(s => s.latency.p95), 0.95),
                    p99: this.calculatePercentile(limitedSLIs.map(s => s.latency.p99), 0.99)
                },
                errorRate: {
                    min: Math.min(...limitedSLIs.map(s => s.errorRate)),
                    max: Math.max(...limitedSLIs.map(s => s.errorRate)),
                    avg: limitedSLIs.reduce((sum, s) => sum + s.errorRate, 0) / limitedSLIs.length || 0
                },
                throughput: {
                    min: Math.min(...limitedSLIs.map(s => s.throughput)),
                    max: Math.max(...limitedSLIs.map(s => s.throughput)),
                    avg: limitedSLIs.reduce((sum, s) => sum + s.throughput, 0) / limitedSLIs.length || 0
                }
            };
            
            res.json({
                success: true,
                metrics: {
                    window,
                    data: limitedSLIs,
                    statistics: stats
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur métriques SLI:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erreur récupération métriques'
            });
        }
    }
);

/**
 * PUT /api/slo/config
 * Mettre à jour la configuration SLO
 */
router.put('/config',
    AdminAuth.requireAuth('monitoring:write'),
    (req, res) => {
        try {
            const { slo, target, warningThreshold, criticalThreshold } = req.body;
            
            if (!slo) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Nom du SLO requis'
                });
            }
            
            const sloMonitoring = global.sloMonitoring || new SLOMonitoring();
            const currentConfig = sloMonitoring.config.slos[slo];
            
            if (!currentConfig) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: `SLO '${slo}' non trouvé`
                });
            }
            
            // Valider les nouvelles valeurs
            if (target !== undefined) {
                if (target < 0 || target > 100) {
                    return res.status(400).json({
                        error: 'Bad Request',
                        message: 'Target doit être entre 0 et 100'
                    });
                }
                currentConfig.target = target;
            }
            
            if (warningThreshold !== undefined) {
                currentConfig.warningThreshold = warningThreshold;
            }
            
            if (criticalThreshold !== undefined) {
                currentConfig.criticalThreshold = criticalThreshold;
            }
            
            global.adminAuth?.logAuditEvent(
                'SLO_CONFIG_UPDATE',
                req.admin?.name,
                'PUT',
                '/api/slo/config',
                {
                    slo,
                    newConfig: { target, warningThreshold, criticalThreshold },
                    previousTarget: currentConfig.target
                }
            );
            
            res.json({
                success: true,
                config: {
                    slo,
                    target: currentConfig.target,
                    warningThreshold: currentConfig.warningThreshold,
                    criticalThreshold: currentConfig.criticalThreshold,
                    updatedBy: req.admin?.name,
                    timestamp: new Date().toISOString()
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur config SLO:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/slo/dashboard
 * Données pour dashboard SLO
 */
router.get('/dashboard',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const sloMonitoring = global.sloMonitoring || new SLOMonitoring();
            
            // Évaluation actuelle
            const evaluation = sloMonitoring.evaluateSLOs();
            
            // Alertes récentes
            const recentAlerts = Array.from(sloMonitoring.alerts.values())
                .filter(alert => Date.now() - new Date(alert.timestamp).getTime() < 24 * 60 * 60 * 1000)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Métriques récentes pour graphiques
            const recentMetrics = sloMonitoring.getRecentSLIs('24h');
            
            // Statistiques globales
            const overallHealth = {
                compliantSLOs: Object.values(evaluation.slos).filter(slo => slo.compliant).length,
                totalSLOs: Object.keys(evaluation.slos).length,
                activeAlerts: recentAlerts.filter(alert => 
                    Date.now() - new Date(alert.timestamp).getTime() < 60 * 60 * 1000 // 1h
                ).length,
                budgetHealth: this.calculateBudgetHealth(evaluation.slos)
            };
            
            const dashboard = {
                timestamp: new Date().toISOString(),
                health: overallHealth,
                slos: evaluation.slos,
                alerts: {
                    recent: recentAlerts.slice(0, 10),
                    summary: {
                        total: recentAlerts.length,
                        critical: recentAlerts.filter(a => a.level === 'critical').length,
                        warning: recentAlerts.filter(a => a.level === 'warning').length,
                        emergency: recentAlerts.filter(a => a.level === 'emergency').length
                    }
                },
                metrics: {
                    dataPoints: recentMetrics.length,
                    timeRange: '24h',
                    latest: recentMetrics[recentMetrics.length - 1] || null
                }
            };
            
            res.json({
                success: true,
                dashboard
            });
            
        } catch (error) {
            console.error('❌ Erreur dashboard SLO:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erreur génération dashboard'
            });
        }
    }
);

/**
 * Calculer la santé globale des budgets
 */
function calculateBudgetHealth(slos) {
    const budgets = Object.values(slos)
        .filter(slo => slo.budget)
        .map(slo => (slo.budget.remaining / slo.budget.total) * 100);
    
    if (budgets.length === 0) return 100;
    
    const avgBudgetRemaining = budgets.reduce((sum, budget) => sum + budget, 0) / budgets.length;
    return Math.round(avgBudgetRemaining);
}

/**
 * Calculer un percentile
 */
function calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.floor(sorted.length * percentile);
    return sorted[index] || 0;
}

module.exports = router;