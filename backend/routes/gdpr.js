/**
 * 🛡️ GDPR API ENDPOINTS
 * =====================
 * 
 * API REST pour les demandes GDPR et gestion des droits des sujets de données
 */

const express = require('express');
const AdminAuth = require('../middleware/admin-auth');
const GDPRCompliance = require('../middleware/gdpr-compliance');

const router = express.Router();

/**
 * GET /api/gdpr/compliance-report
 * Rapport de conformité GDPR (admin seulement)
 */
router.get('/compliance-report', 
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const gdpr = global.gdprCompliance || new GDPRCompliance();
            const report = gdpr.generateComplianceReport();
            
            res.json({
                success: true,
                report
            });
            
        } catch (error) {
            console.error('❌ Erreur génération rapport GDPR:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erreur génération rapport conformité'
            });
        }
    }
);

/**
 * POST /api/gdpr/data-subject-request
 * Traiter une demande de droits GDPR
 */
router.post('/data-subject-request',
    AdminAuth.requireAuth('monitoring:write'),
    (req, res) => {
        try {
            const { type, userId, email, data } = req.body;
            
            // Validation des paramètres
            if (!type || (!userId && !email)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Type et (userId ou email) requis'
                });
            }
            
            const validTypes = ['access', 'erasure', 'rectification', 'portability'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: `Type invalide. Types valides: ${validTypes.join(', ')}`
                });
            }
            
            const gdpr = global.gdprCompliance || new GDPRCompliance();
            const result = gdpr.handleDataSubjectRequest({
                type,
                userId,
                email,
                data
            });
            
            // Logger l'action dans l'audit
            global.adminAuth?.logAuditEvent(
                'GDPR_DATA_SUBJECT_REQUEST',
                req.admin?.name,
                'POST',
                '/api/gdpr/data-subject-request',
                {
                    requestType: type,
                    targetUserId: userId,
                    targetEmail: email,
                    result: result.status || 'completed'
                }
            );
            
            res.json({
                success: true,
                request: {
                    type,
                    userId,
                    email,
                    processedAt: new Date().toISOString(),
                    processedBy: req.admin?.name
                },
                result
            });
            
        } catch (error) {
            console.error('❌ Erreur traitement demande GDPR:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * POST /api/gdpr/anonymize-data
 * Anonymiser des données spécifiques
 */
router.post('/anonymize-data',
    AdminAuth.requireAuth('monitoring:write'),
    (req, res) => {
        try {
            const { data, options = {} } = req.body;
            
            if (!data) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Données à anonymiser requises'
                });
            }
            
            const gdpr = global.gdprCompliance || new GDPRCompliance();
            const anonymized = gdpr.anonymizeData(data, options);
            
            global.adminAuth?.logAuditEvent(
                'GDPR_MANUAL_ANONYMIZATION',
                req.admin?.name,
                'POST',
                '/api/gdpr/anonymize-data',
                {
                    originalDataType: typeof data,
                    optionsUsed: options
                }
            );
            
            res.json({
                success: true,
                original: data,
                anonymized,
                processedAt: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Erreur anonymisation manuelle:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * POST /api/gdpr/cleanup
 * Déclencher un nettoyage GDPR manuel
 */
router.post('/cleanup',
    AdminAuth.requireAuth('monitoring:write'),
    (req, res) => {
        try {
            const { lightCleanup = false } = req.body;
            
            const gdpr = global.gdprCompliance || new GDPRCompliance();
            
            // Exécuter le nettoyage
            gdpr.performScheduledCleanup(lightCleanup);
            
            global.adminAuth?.logAuditEvent(
                'GDPR_MANUAL_CLEANUP',
                req.admin?.name,
                'POST',
                '/api/gdpr/cleanup',
                {
                    type: lightCleanup ? 'light' : 'full',
                    triggeredAt: new Date().toISOString()
                }
            );
            
            res.json({
                success: true,
                cleanup: {
                    type: lightCleanup ? 'light' : 'full',
                    triggeredAt: new Date().toISOString(),
                    triggeredBy: req.admin?.name
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur nettoyage GDPR manuel:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/gdpr/retention-status
 * État de la rétention des données
 */
router.get('/retention-status',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const gdpr = global.gdprCompliance || new GDPRCompliance();
            
            const auditLogs = global.adminAuth?.auditLog || [];
            const monitoringMetrics = global.monitoringSystem?.metrics;
            
            const status = {
                timestamp: new Date().toISOString(),
                auditLogs: {
                    total: auditLogs.length,
                    anonymized: auditLogs.filter(log => log._gdpr?.anonymized).length,
                    toDelete: auditLogs.filter(log => 
                        gdpr.shouldDelete(log.timestamp, 'auditLogs')
                    ).length,
                    toAnonymize: auditLogs.filter(log => 
                        gdpr.shouldAnonymize(log.timestamp) && !log._gdpr?.anonymized
                    ).length
                },
                monitoring: {
                    frontendErrors: monitoringMetrics?.frontendErrors?.lastWindow?.length || 0,
                    uniqueSolutionFails: monitoringMetrics?.uniqueSolutionFail?.details?.length || 0
                },
                retentionPolicy: gdpr.config.retention,
                nextCleanup: 'Quotidien à 02:00 UTC'
            };
            
            res.json({
                success: true,
                retentionStatus: status
            });
            
        } catch (error) {
            console.error('❌ Erreur état rétention:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/gdpr/download/:userId
 * Télécharger les données d'un utilisateur (portabilité)
 */
router.get('/download/:userId',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const { userId } = req.params;
            const { format = 'json' } = req.query;
            
            const gdpr = global.gdprCompliance || new GDPRCompliance();
            const userData = gdpr.handleRightToAccess(userId);
            
            global.adminAuth?.logAuditEvent(
                'GDPR_DATA_DOWNLOAD',
                req.admin?.name,
                'GET',
                `/api/gdpr/download/${userId}`,
                {
                    userId,
                    format,
                    downloadedBy: req.admin?.name
                }
            );
            
            // Définir headers pour téléchargement
            res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.${format}"`);
            res.setHeader('Content-Type', 'application/json');
            
            res.json({
                export: {
                    userId,
                    exportedAt: new Date().toISOString(),
                    exportedBy: req.admin?.name,
                    format
                },
                userData
            });
            
        } catch (error) {
            console.error('❌ Erreur téléchargement données utilisateur:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

module.exports = router;