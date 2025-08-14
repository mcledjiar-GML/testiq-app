/**
 * 🎛️ KILL-SWITCH UX ENHANCEMENTS
 * ==============================
 * 
 * Améliorations UX pour le kill-switch :
 * - Timer figé pendant les opérations
 * - Sauvegarde d'état utilisateur
 * - Notifications gracieuses
 * - Recovery automatique
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class KillSwitchUI {
    
    constructor() {
        this.userStates = new Map();
        this.frozenTimers = new Map();
        this.notifications = [];
        this.recoveryQueue = [];
        
        this.config = {
            // Durées de freeze des timers (en ms)
            timerFreezeDurations: {
                'feature_disabled': 30000,     // 30s pour désactivation feature
                'maintenance_mode': 120000,    // 2min pour maintenance
                'emergency_stop': 300000,      // 5min pour arrêt d'urgence
                'canary_rollback': 60000       // 1min pour rollback canary
            },
            
            // Configuration des notifications
            notifications: {
                gracePeriod: 10000,           // 10s avant application
                showProgress: true,
                allowUserPostpone: true,
                maxPostpones: 2
            },
            
            // Stratégies de recovery
            recoveryStrategies: {
                'session_timeout': 'extend_session',
                'network_error': 'retry_operation',
                'feature_disabled': 'fallback_mode',
                'maintenance': 'read_only_mode'
            }
        };
        
        this.initializeStateManager();
        console.log('🎛️ Kill-Switch UI Manager initialisé');
    }
    
    /**
     * Initialiser le gestionnaire d'état
     */
    initializeStateManager() {
        this.stateFile = path.join(__dirname, '../config/user-states.json');
        this.loadUserStates();
        
        // Nettoyer les états expirés toutes les 5 minutes
        setInterval(() => {
            this.cleanupExpiredStates();
        }, 300000);
    }
    
    /**
     * Charger les états utilisateur sauvegardés
     */
    loadUserStates() {
        try {
            if (fs.existsSync(this.stateFile)) {
                const states = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                Object.entries(states).forEach(([userId, state]) => {
                    // Vérifier si l'état n'est pas expiré
                    if (state.expiresAt && new Date(state.expiresAt) > new Date()) {
                        this.userStates.set(userId, state);
                    }
                });
                
                console.log(`📂 ${this.userStates.size} états utilisateur chargés`);
            }
        } catch (error) {
            console.warn('⚠️ Erreur chargement états utilisateur:', error.message);
        }
    }
    
    /**
     * Sauvegarder les états utilisateur
     */
    saveUserStates() {
        try {
            const dir = path.dirname(this.stateFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            const states = Object.fromEntries(this.userStates);
            fs.writeFileSync(this.stateFile, JSON.stringify(states, null, 2));
            
        } catch (error) {
            console.error('❌ Erreur sauvegarde états:', error.message);
        }
    }
    
    /**
     * Sauvegarder l'état utilisateur avant interruption
     */
    saveUserState(userId, context = {}) {
        const state = {
            userId,
            timestamp: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
            context: {
                currentQuestion: context.currentQuestion || null,
                answers: context.answers || [],
                testProgress: context.testProgress || 0,
                timeRemaining: context.timeRemaining || null,
                sessionId: context.sessionId || null,
                testType: context.testType || null,
                startedAt: context.startedAt || null,
                lastActivity: new Date().toISOString()
            },
            ui: {
                route: context.route || '/',
                scrollPosition: context.scrollPosition || 0,
                formData: context.formData || {},
                notifications: context.notifications || []
            },
            preferences: {
                theme: context.theme || 'default',
                language: context.language || 'fr',
                accessibility: context.accessibility || {}
            }
        };
        
        this.userStates.set(userId, state);
        this.saveUserStates();
        
        console.log(`💾 État sauvegardé pour utilisateur ${userId}`);
        return state;
    }
    
    /**
     * Restaurer l'état utilisateur après recovery
     */
    restoreUserState(userId) {
        const state = this.userStates.get(userId);
        
        if (!state) {
            return null;
        }
        
        // Vérifier si l'état n'est pas expiré
        if (state.expiresAt && new Date(state.expiresAt) < new Date()) {
            this.userStates.delete(userId);
            this.saveUserStates();
            return null;
        }
        
        console.log(`📂 État restauré pour utilisateur ${userId}`);
        return state;
    }
    
    /**
     * Figer le timer pour un utilisateur
     */
    freezeTimer(userId, reason, duration = null) {
        const freezeDuration = duration || this.config.timerFreezeDurations[reason] || 60000;
        const unfreezeTime = Date.now() + freezeDuration;
        
        const frozenTimer = {
            userId,
            reason,
            frozenAt: new Date().toISOString(),
            unfreezeAt: new Date(unfreezeTime).toISOString(),
            originalTimeRemaining: null, // À définir par l'appelant
            duration: freezeDuration
        };
        
        this.frozenTimers.set(userId, frozenTimer);
        
        console.log(`⏸️ Timer figé pour ${userId}: ${reason} (${freezeDuration/1000}s)`);
        
        // Programmer le dégel automatique
        setTimeout(() => {
            this.unfreezeTimer(userId);
        }, freezeDuration);
        
        return frozenTimer;
    }
    
    /**
     * Dégeler le timer d'un utilisateur
     */
    unfreezeTimer(userId) {
        const frozenTimer = this.frozenTimers.get(userId);
        
        if (!frozenTimer) {
            return false;
        }
        
        this.frozenTimers.delete(userId);
        console.log(`▶️ Timer dégeler pour ${userId}`);
        
        // Notifier le frontend du dégel
        this.sendNotification(userId, {
            type: 'timer_unfrozen',
            title: 'Timer restauré',
            message: 'Le timer de votre test a été restauré.',
            autoClose: 5000
        });
        
        return true;
    }
    
    /**
     * Vérifier si le timer d'un utilisateur est figé
     */
    isTimerFrozen(userId) {
        const frozenTimer = this.frozenTimers.get(userId);
        
        if (!frozenTimer) {
            return false;
        }
        
        // Vérifier si le dégel automatique n'a pas encore eu lieu
        const now = new Date();
        const unfreezeTime = new Date(frozenTimer.unfreezeAt);
        
        if (now >= unfreezeTime) {
            this.unfreezeTimer(userId);
            return false;
        }
        
        return true;
    }
    
    /**
     * Obtenir le temps restant de gel du timer
     */
    getTimerFreezeRemaining(userId) {
        const frozenTimer = this.frozenTimers.get(userId);
        
        if (!frozenTimer) {
            return 0;
        }
        
        const now = Date.now();
        const unfreezeTime = new Date(frozenTimer.unfreezeAt).getTime();
        
        return Math.max(0, unfreezeTime - now);
    }
    
    /**
     * Envoyer une notification gracieuse
     */
    sendNotification(userId, notification) {
        const notif = {
            id: this.generateNotificationId(),
            userId,
            timestamp: new Date().toISOString(),
            ...notification
        };
        
        this.notifications.push(notif);
        
        // Garder seulement les 100 dernières notifications
        if (this.notifications.length > 100) {
            this.notifications = this.notifications.slice(-100);
        }
        
        console.log(`📢 Notification envoyée à ${userId}: ${notification.title}`);
        
        // En production, envoyer via WebSocket ou SSE
        if (global.webSocketManager) {
            global.webSocketManager.sendToUser(userId, {
                type: 'notification',
                data: notif
            });
        }
        
        return notif;
    }
    
    /**
     * Notification avec période de grâce
     */
    sendGracefulNotification(userId, operation, callback) {
        const gracePeriod = this.config.notifications.gracePeriod;
        
        // Sauvegarder l'état avant l'opération
        this.saveUserState(userId, {
            operation,
            savedAt: new Date().toISOString()
        });
        
        // Envoyer notification avec compte à rebours
        const notification = this.sendNotification(userId, {
            type: 'graceful_warning',
            title: 'Opération système imminente',
            message: `${operation} dans ${gracePeriod/1000} secondes. Votre progression est sauvegardée.`,
            countdown: gracePeriod,
            allowPostpone: this.config.notifications.allowUserPostpone,
            actions: [
                { id: 'postpone', label: 'Reporter (1min)', icon: 'clock' },
                { id: 'continue', label: 'Continuer maintenant', icon: 'play' }
            ]
        });
        
        // Programmer l'exécution après la période de grâce
        setTimeout(() => {
            if (callback && typeof callback === 'function') {
                callback(userId);
            }
        }, gracePeriod);
        
        return notification;
    }
    
    /**
     * Gérer le report d'une opération
     */
    handlePostpone(userId, notificationId, postponeType = '1min') {
        const notification = this.notifications.find(n => n.id === notificationId);
        
        if (!notification) {
            return false;
        }
        
        // Vérifier le nombre de reports autorisés
        const userPostpones = notification.postpones || 0;
        if (userPostpones >= this.config.notifications.maxPostpones) {
            this.sendNotification(userId, {
                type: 'error',
                title: 'Report impossible',
                message: 'Nombre maximum de reports atteint.'
            });
            return false;
        }
        
        // Calculer la nouvelle durée
        const postponeDurations = {
            '1min': 60000,
            '5min': 300000,
            '10min': 600000
        };
        
        const postponeDuration = postponeDurations[postponeType] || 60000;
        
        // Mettre à jour la notification
        notification.postpones = userPostpones + 1;
        notification.postponedAt = new Date().toISOString();
        notification.newCountdown = postponeDuration;
        
        this.sendNotification(userId, {
            type: 'operation_postponed',
            title: 'Opération reportée',
            message: `Opération reportée de ${postponeType}. Report ${notification.postpones}/${this.config.notifications.maxPostpones}.`,
            countdown: postponeDuration
        });
        
        console.log(`⏰ Opération reportée pour ${userId}: ${postponeType}`);
        return true;
    }
    
    /**
     * Mode recovery automatique
     */
    startRecoveryMode(userId, errorType, context = {}) {
        console.log(`🔧 Mode recovery démarré pour ${userId}: ${errorType}`);
        
        const recoveryStrategy = this.config.recoveryStrategies[errorType] || 'fallback_mode';
        
        const recovery = {
            userId,
            errorType,
            strategy: recoveryStrategy,
            startedAt: new Date().toISOString(),
            context,
            attempts: 0,
            maxAttempts: 3,
            status: 'active'
        };
        
        this.recoveryQueue.push(recovery);
        
        // Sauvegarder l'état utilisateur
        this.saveUserState(userId, {
            ...context,
            recoveryMode: true,
            errorType
        });
        
        // Figer le timer pendant la recovery
        this.freezeTimer(userId, 'recovery_mode', 120000); // 2 minutes
        
        // Exécuter la stratégie de recovery
        this.executeRecoveryStrategy(recovery);
        
        return recovery;
    }
    
    /**
     * Exécuter une stratégie de recovery
     */
    async executeRecoveryStrategy(recovery) {
        const { userId, strategy, attempts, maxAttempts } = recovery;
        
        try {
            console.log(`🔧 Exécution stratégie recovery: ${strategy} (tentative ${attempts + 1}/${maxAttempts})`);
            
            switch (strategy) {
                case 'extend_session':
                    await this.extendUserSession(userId);
                    break;
                    
                case 'retry_operation':
                    await this.retryFailedOperation(userId, recovery.context);
                    break;
                    
                case 'fallback_mode':
                    await this.enableFallbackMode(userId);
                    break;
                    
                case 'read_only_mode':
                    await this.enableReadOnlyMode(userId);
                    break;
                    
                default:
                    throw new Error(`Stratégie recovery inconnue: ${strategy}`);
            }
            
            // Recovery réussie
            recovery.status = 'completed';
            recovery.completedAt = new Date().toISOString();
            
            this.sendNotification(userId, {
                type: 'recovery_success',
                title: 'Récupération réussie',
                message: 'Votre session a été restaurée avec succès.',
                icon: 'check-circle'
            });
            
            // Dégeler le timer
            this.unfreezeTimer(userId);
            
            console.log(`✅ Recovery réussie pour ${userId}`);
            
        } catch (error) {
            recovery.attempts++;
            recovery.lastError = error.message;
            
            if (recovery.attempts < maxAttempts) {
                // Réessayer avec backoff exponentiel
                const retryDelay = Math.pow(2, recovery.attempts) * 1000;
                setTimeout(() => {
                    this.executeRecoveryStrategy(recovery);
                }, retryDelay);
                
                console.log(`⏳ Recovery échouée, retry dans ${retryDelay}ms`);
            } else {
                // Recovery échouée définitivement
                recovery.status = 'failed';
                recovery.failedAt = new Date().toISOString();
                
                this.sendNotification(userId, {
                    type: 'recovery_failed',
                    title: 'Récupération échouée',
                    message: 'Impossible de restaurer votre session. Contactez le support.',
                    icon: 'alert-circle',
                    persistent: true
                });
                
                console.error(`❌ Recovery définitivement échouée pour ${userId}`);
            }
        }
    }
    
    /**
     * Étendre la session utilisateur
     */
    async extendUserSession(userId) {
        // Simulation d'extension de session
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(`🔄 Session étendue pour ${userId}`);
        
        // En production, étendre réellement la session JWT/OAuth
        /*
        const newToken = await authService.extendSession(userId);
        return { success: true, newToken };
        */
        
        return { success: true };
    }
    
    /**
     * Réessayer une opération échouée
     */
    async retryFailedOperation(userId, context) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`🔄 Opération retentée pour ${userId}`);
        
        // Simuler le succès de l'opération
        return { success: true, retried: true };
    }
    
    /**
     * Activer le mode fallback
     */
    async enableFallbackMode(userId) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log(`🔄 Mode fallback activé pour ${userId}`);
        
        // Configurer les fallbacks appropriés
        return { success: true, mode: 'fallback' };
    }
    
    /**
     * Activer le mode lecture seule
     */
    async enableReadOnlyMode(userId) {
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log(`📖 Mode lecture seule activé pour ${userId}`);
        
        return { success: true, mode: 'readonly' };
    }
    
    /**
     * Nettoyer les états expirés
     */
    cleanupExpiredStates() {
        const now = new Date();
        let cleanedCount = 0;
        
        // Nettoyer les états utilisateur expirés
        for (const [userId, state] of this.userStates.entries()) {
            if (state.expiresAt && new Date(state.expiresAt) < now) {
                this.userStates.delete(userId);
                cleanedCount++;
            }
        }
        
        // Nettoyer les timers expirés
        for (const [userId, timer] of this.frozenTimers.entries()) {
            if (new Date(timer.unfreezeAt) < now) {
                this.unfreezeTimer(userId);
            }
        }
        
        // Nettoyer les notifications anciennes
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        this.notifications = this.notifications.filter(n => 
            new Date(n.timestamp) > oneHourAgo
        );
        
        // Nettoyer les recoveries terminées
        this.recoveryQueue = this.recoveryQueue.filter(r => 
            r.status === 'active' || new Date(r.startedAt) > oneHourAgo
        );
        
        if (cleanedCount > 0) {
            this.saveUserStates();
            console.log(`🧹 Nettoyage: ${cleanedCount} états expirés supprimés`);
        }
    }
    
    /**
     * Générer un ID de notification
     */
    generateNotificationId() {
        return crypto.randomBytes(8).toString('hex');
    }
    
    /**
     * Middleware pour la gestion UX du kill-switch
     */
    static uiMiddleware() {
        return (req, res, next) => {
            const ui = global.killSwitchUI || new KillSwitchUI();
            
            // Ajouter les helpers UX à la requête
            req.killSwitchUI = {
                saveState: (context) => ui.saveUserState(req.user?.id || req.sessionID, context),
                restoreState: () => ui.restoreUserState(req.user?.id || req.sessionID),
                freezeTimer: (reason, duration) => ui.freezeTimer(req.user?.id || req.sessionID, reason, duration),
                isTimerFrozen: () => ui.isTimerFrozen(req.user?.id || req.sessionID),
                sendNotification: (notification) => ui.sendNotification(req.user?.id || req.sessionID, notification),
                startRecovery: (errorType, context) => ui.startRecoveryMode(req.user?.id || req.sessionID, errorType, context)
            };
            
            next();
        };
    }
    
    /**
     * Obtenir le statut UX du kill-switch
     */
    getUIStatus() {
        return {
            timestamp: new Date().toISOString(),
            userStates: {
                total: this.userStates.size,
                active: Array.from(this.userStates.values()).filter(s => 
                    new Date(s.expiresAt) > new Date()
                ).length
            },
            frozenTimers: {
                total: this.frozenTimers.size,
                byReason: this.getFrozenTimersByReason()
            },
            notifications: {
                total: this.notifications.length,
                recent: this.notifications.filter(n => 
                    Date.now() - new Date(n.timestamp).getTime() < 300000 // 5 min
                ).length
            },
            recoveryQueue: {
                total: this.recoveryQueue.length,
                active: this.recoveryQueue.filter(r => r.status === 'active').length,
                failed: this.recoveryQueue.filter(r => r.status === 'failed').length
            }
        };
    }
    
    /**
     * Obtenir les timers figés par raison
     */
    getFrozenTimersByReason() {
        const byReason = {};
        for (const timer of this.frozenTimers.values()) {
            byReason[timer.reason] = (byReason[timer.reason] || 0) + 1;
        }
        return byReason;
    }
}

const killSwitchUI = new KillSwitchUI();
global.killSwitchUI = killSwitchUI;

module.exports = KillSwitchUI;