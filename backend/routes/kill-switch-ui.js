/**
 * 🎛️ KILL-SWITCH UI API
 * =====================
 * 
 * API pour la gestion UX du kill-switch avec états sauvegardés
 */

const express = require('express');
const AdminAuth = require('../middleware/admin-auth');
const KillSwitchUI = require('../middleware/kill-switch-ui');

const router = express.Router();

/**
 * GET /api/kill-switch-ui/status
 * Statut UX du kill-switch
 */
router.get('/status', 
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const ui = global.killSwitchUI || new KillSwitchUI();
            const status = ui.getUIStatus();
            
            res.json({
                success: true,
                ui: status
            });
            
        } catch (error) {
            console.error('❌ Erreur statut UX kill-switch:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: 'Erreur récupération statut UX'
            });
        }
    }
);

/**
 * POST /api/kill-switch-ui/save-state
 * Sauvegarder l'état utilisateur
 */
router.post('/save-state', (req, res) => {
    try {
        const { userId, context } = req.body;
        
        if (!userId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'userId requis'
            });
        }
        
        const ui = global.killSwitchUI || new KillSwitchUI();
        const savedState = ui.saveUserState(userId, context || {});
        
        res.json({
            success: true,
            state: {
                userId: savedState.userId,
                timestamp: savedState.timestamp,
                expiresAt: savedState.expiresAt,
                contextKeys: Object.keys(savedState.context),
                uiKeys: Object.keys(savedState.ui)
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde état:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

/**
 * GET /api/kill-switch-ui/restore-state/:userId
 * Restaurer l'état utilisateur
 */
router.get('/restore-state/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        
        const ui = global.killSwitchUI || new KillSwitchUI();
        const restoredState = ui.restoreUserState(userId);
        
        if (!restoredState) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Aucun état sauvegardé trouvé ou état expiré'
            });
        }
        
        res.json({
            success: true,
            state: restoredState,
            restored: true
        });
        
    } catch (error) {
        console.error('❌ Erreur restauration état:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

/**
 * POST /api/kill-switch-ui/freeze-timer
 * Figer le timer d'un utilisateur
 */
router.post('/freeze-timer', 
    AdminAuth.requireAuth('killswitch:write'),
    (req, res) => {
        try {
            const { userId, reason, duration } = req.body;
            
            if (!userId || !reason) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'userId et reason requis'
                });
            }
            
            const ui = global.killSwitchUI || new KillSwitchUI();
            const frozenTimer = ui.freezeTimer(userId, reason, duration);
            
            global.adminAuth?.logAuditEvent(
                'TIMER_FROZEN',
                req.admin?.name,
                'POST',
                '/api/kill-switch-ui/freeze-timer',
                {
                    userId,
                    reason,
                    duration: frozenTimer.duration,
                    unfreezeAt: frozenTimer.unfreezeAt
                }
            );
            
            res.json({
                success: true,
                timer: {
                    userId: frozenTimer.userId,
                    reason: frozenTimer.reason,
                    frozenAt: frozenTimer.frozenAt,
                    unfreezeAt: frozenTimer.unfreezeAt,
                    duration: frozenTimer.duration
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur gel timer:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * POST /api/kill-switch-ui/unfreeze-timer
 * Dégeler le timer d'un utilisateur
 */
router.post('/unfreeze-timer',
    AdminAuth.requireAuth('killswitch:write'),
    (req, res) => {
        try {
            const { userId } = req.body;
            
            if (!userId) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'userId requis'
                });
            }
            
            const ui = global.killSwitchUI || new KillSwitchUI();
            const unfrozen = ui.unfreezeTimer(userId);
            
            if (!unfrozen) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: 'Aucun timer figé trouvé pour cet utilisateur'
                });
            }
            
            global.adminAuth?.logAuditEvent(
                'TIMER_UNFROZEN',
                req.admin?.name,
                'POST',
                '/api/kill-switch-ui/unfreeze-timer',
                { userId }
            );
            
            res.json({
                success: true,
                unfrozen: true,
                userId
            });
            
        } catch (error) {
            console.error('❌ Erreur dégel timer:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/kill-switch-ui/timer-status/:userId
 * Statut du timer d'un utilisateur
 */
router.get('/timer-status/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        
        const ui = global.killSwitchUI || new KillSwitchUI();
        const isFrozen = ui.isTimerFrozen(userId);
        const remainingMs = ui.getTimerFreezeRemaining(userId);
        
        const status = {
            userId,
            isFrozen,
            remainingMs,
            remainingSeconds: Math.ceil(remainingMs / 1000),
            timestamp: new Date().toISOString()
        };
        
        if (isFrozen) {
            const frozenTimer = ui.frozenTimers.get(userId);
            status.reason = frozenTimer?.reason;
            status.frozenAt = frozenTimer?.frozenAt;
            status.unfreezeAt = frozenTimer?.unfreezeAt;
        }
        
        res.json({
            success: true,
            timer: status
        });
        
    } catch (error) {
        console.error('❌ Erreur statut timer:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

/**
 * POST /api/kill-switch-ui/send-notification
 * Envoyer une notification à un utilisateur
 */
router.post('/send-notification',
    AdminAuth.requireAuth('monitoring:write'),
    (req, res) => {
        try {
            const { userId, notification } = req.body;
            
            if (!userId || !notification) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'userId et notification requis'
                });
            }
            
            const ui = global.killSwitchUI || new KillSwitchUI();
            const sentNotification = ui.sendNotification(userId, notification);
            
            global.adminAuth?.logAuditEvent(
                'NOTIFICATION_SENT',
                req.admin?.name,
                'POST',
                '/api/kill-switch-ui/send-notification',
                {
                    userId,
                    notificationId: sentNotification.id,
                    type: notification.type,
                    title: notification.title
                }
            );
            
            res.json({
                success: true,
                notification: {
                    id: sentNotification.id,
                    userId: sentNotification.userId,
                    timestamp: sentNotification.timestamp,
                    type: sentNotification.type,
                    title: sentNotification.title
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur envoi notification:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * POST /api/kill-switch-ui/graceful-notification
 * Envoyer une notification avec période de grâce
 */
router.post('/graceful-notification',
    AdminAuth.requireAuth('killswitch:write'),
    (req, res) => {
        try {
            const { userId, operation, callback } = req.body;
            
            if (!userId || !operation) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'userId et operation requis'
                });
            }
            
            const ui = global.killSwitchUI || new KillSwitchUI();
            const notification = ui.sendGracefulNotification(userId, operation, callback);
            
            global.adminAuth?.logAuditEvent(
                'GRACEFUL_NOTIFICATION_SENT',
                req.admin?.name,
                'POST',
                '/api/kill-switch-ui/graceful-notification',
                {
                    userId,
                    operation,
                    notificationId: notification.id,
                    gracePeriod: ui.config.notifications.gracePeriod
                }
            );
            
            res.json({
                success: true,
                notification: {
                    id: notification.id,
                    operation,
                    gracePeriod: ui.config.notifications.gracePeriod,
                    allowPostpone: notification.allowPostpone
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur notification gracieuse:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * POST /api/kill-switch-ui/postpone
 * Reporter une opération
 */
router.post('/postpone', (req, res) => {
    try {
        const { userId, notificationId, postponeType = '1min' } = req.body;
        
        if (!userId || !notificationId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'userId et notificationId requis'
            });
        }
        
        const ui = global.killSwitchUI || new KillSwitchUI();
        const postponed = ui.handlePostpone(userId, notificationId, postponeType);
        
        if (!postponed) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Report impossible (limite atteinte ou notification inexistante)'
            });
        }
        
        global.adminAuth?.logAuditEvent(
            'OPERATION_POSTPONED',
            userId,
            'POST',
            '/api/kill-switch-ui/postpone',
            {
                userId,
                notificationId,
                postponeType
            }
        );
        
        res.json({
            success: true,
            postponed: true,
            postponeType
        });
        
    } catch (error) {
        console.error('❌ Erreur report opération:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

/**
 * POST /api/kill-switch-ui/start-recovery
 * Démarrer le mode recovery pour un utilisateur
 */
router.post('/start-recovery',
    AdminAuth.requireAuth('killswitch:write'),
    (req, res) => {
        try {
            const { userId, errorType, context = {} } = req.body;
            
            if (!userId || !errorType) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'userId et errorType requis'
                });
            }
            
            const ui = global.killSwitchUI || new KillSwitchUI();
            const recovery = ui.startRecoveryMode(userId, errorType, context);
            
            global.adminAuth?.logAuditEvent(
                'RECOVERY_STARTED',
                req.admin?.name,
                'POST',
                '/api/kill-switch-ui/start-recovery',
                {
                    userId,
                    errorType,
                    strategy: recovery.strategy,
                    recoveryId: recovery.startedAt
                }
            );
            
            res.json({
                success: true,
                recovery: {
                    userId: recovery.userId,
                    errorType: recovery.errorType,
                    strategy: recovery.strategy,
                    startedAt: recovery.startedAt,
                    status: recovery.status
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur démarrage recovery:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

/**
 * GET /api/kill-switch-ui/notifications/:userId
 * Obtenir les notifications d'un utilisateur
 */
router.get('/notifications/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, offset = 0 } = req.query;
        
        const ui = global.killSwitchUI || new KillSwitchUI();
        
        let userNotifications = ui.notifications.filter(n => n.userId === userId);
        
        // Trier par timestamp décroissant
        userNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Pagination
        const total = userNotifications.length;
        const paginated = userNotifications.slice(
            parseInt(offset),
            parseInt(offset) + parseInt(limit)
        );
        
        res.json({
            success: true,
            notifications: paginated,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < total
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur récupération notifications:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
});

/**
 * GET /api/kill-switch-ui/recovery-queue
 * État de la queue de recovery
 */
router.get('/recovery-queue',
    AdminAuth.requireAuth('monitoring:read'),
    (req, res) => {
        try {
            const ui = global.killSwitchUI || new KillSwitchUI();
            
            const queue = ui.recoveryQueue.map(recovery => ({
                userId: recovery.userId,
                errorType: recovery.errorType,
                strategy: recovery.strategy,
                startedAt: recovery.startedAt,
                status: recovery.status,
                attempts: recovery.attempts,
                maxAttempts: recovery.maxAttempts,
                lastError: recovery.lastError,
                completedAt: recovery.completedAt,
                failedAt: recovery.failedAt
            }));
            
            res.json({
                success: true,
                recoveryQueue: queue,
                summary: {
                    total: queue.length,
                    active: queue.filter(r => r.status === 'active').length,
                    completed: queue.filter(r => r.status === 'completed').length,
                    failed: queue.filter(r => r.status === 'failed').length
                }
            });
            
        } catch (error) {
            console.error('❌ Erreur queue recovery:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
    }
);

module.exports = router;