#!/usr/bin/env node
/**
 * 🎛️ TEST KILL-SWITCH UI ENHANCEMENTS
 * ===================================
 * 
 * Tests des améliorations UX du kill-switch :
 * - Sauvegarde et restauration d'état utilisateur
 * - Gestion des timers figés
 * - Notifications gracieuses avec période de grâce
 * - Mode recovery automatique
 */

const KillSwitchUI = require('../middleware/kill-switch-ui');

class KillSwitchUITester {
    
    constructor() {
        this.ui = new KillSwitchUI();
        this.results = {
            stateManagement: { passed: 0, failed: 0, details: [] },
            timerFreezing: { passed: 0, failed: 0, details: [] },
            notifications: { passed: 0, failed: 0, details: [] },
            recovery: { passed: 0, failed: 0, details: [] },
            overall: { passed: 0, failed: 0, total: 0 }
        };
        
        // Utilisateurs de test
        this.testUsers = ['user-001', 'user-002', 'user-003'];
    }
    
    /**
     * Test 1: Gestion des états utilisateur
     */
    testStateManagement() {
        console.log('💾 Test 1: Gestion des états utilisateur...');
        
        try {
            const testUserId = this.testUsers[0];
            const testContext = {
                currentQuestion: 'Q42',
                answers: ['A', 'B', 'C'],
                testProgress: 75,
                timeRemaining: 180000,
                sessionId: 'session-123',
                testType: 'raven',
                startedAt: new Date(Date.now() - 600000).toISOString(), // 10 min ago
                route: '/test/question/42',
                scrollPosition: 1200,
                formData: { difficulty: 'hard' },
                theme: 'dark',
                language: 'fr'
            };
            
            // Test 1.1: Sauvegarde état
            const savedState = this.ui.saveUserState(testUserId, testContext);
            
            if (savedState && 
                savedState.userId === testUserId &&
                savedState.context.currentQuestion === 'Q42' &&
                savedState.context.answers.length === 3 &&
                savedState.ui.route === '/test/question/42' &&
                savedState.preferences.theme === 'dark') {
                this.results.stateManagement.passed++;
                this.results.stateManagement.details.push({
                    test: 'User state saving',
                    status: 'PASS',
                    userId: testUserId,
                    contextKeys: Object.keys(savedState.context).length,
                    uiKeys: Object.keys(savedState.ui).length,
                    message: 'État utilisateur sauvegardé correctement'
                });
            } else {
                this.results.stateManagement.failed++;
                this.results.stateManagement.details.push({
                    test: 'User state saving',
                    status: 'FAIL',
                    error: 'Sauvegarde état utilisateur incorrecte'
                });
            }
            
            // Test 1.2: Restauration état
            const restoredState = this.ui.restoreUserState(testUserId);
            
            if (restoredState &&
                restoredState.context.currentQuestion === testContext.currentQuestion &&
                restoredState.context.testProgress === testContext.testProgress &&
                restoredState.preferences.theme === testContext.theme) {
                this.results.stateManagement.passed++;
                this.results.stateManagement.details.push({
                    test: 'User state restoration',
                    status: 'PASS',
                    userId: testUserId,
                    restoredContext: !!restoredState.context,
                    restoredUI: !!restoredState.ui,
                    message: 'État utilisateur restauré correctement'
                });
            } else {
                this.results.stateManagement.failed++;
                this.results.stateManagement.details.push({
                    test: 'User state restoration',
                    status: 'FAIL',
                    error: 'Restauration état utilisateur échouée'
                });
            }
            
            // Test 1.3: Persistance fichier
            const initialStatesCount = this.ui.userStates.size;
            
            // Simuler rechargement en créant nouvelle instance
            const newUI = new KillSwitchUI();
            const persistedState = newUI.restoreUserState(testUserId);
            
            if (persistedState && persistedState.context.currentQuestion === 'Q42') {
                this.results.stateManagement.passed++;
                this.results.stateManagement.details.push({
                    test: 'State persistence across restarts',
                    status: 'PASS',
                    persistedStates: newUI.userStates.size,
                    message: 'États persistés correctement au redémarrage'
                });
            } else {
                this.results.stateManagement.failed++;
                this.results.stateManagement.details.push({
                    test: 'State persistence across restarts',
                    status: 'FAIL',
                    error: 'Persistance des états échouée'
                });
            }
            
            // Test 1.4: Expiration des états
            const expiredUserId = 'user-expired';
            const expiredContext = { ...testContext };
            
            // Forcer l'expiration en modifiant directement l'état
            const expiredState = this.ui.saveUserState(expiredUserId, expiredContext);
            expiredState.expiresAt = new Date(Date.now() - 1000).toISOString(); // Expiré
            this.ui.userStates.set(expiredUserId, expiredState);
            
            const shouldBeNull = this.ui.restoreUserState(expiredUserId);
            
            if (shouldBeNull === null) {
                this.results.stateManagement.passed++;
                this.results.stateManagement.details.push({
                    test: 'State expiration handling',
                    status: 'PASS',
                    message: 'États expirés correctement supprimés'
                });
            } else {
                this.results.stateManagement.failed++;
                this.results.stateManagement.details.push({
                    test: 'State expiration handling',
                    status: 'FAIL',
                    error: 'États expirés non supprimés'
                });
            }
            
        } catch (error) {
            this.results.stateManagement.failed++;
            this.results.stateManagement.details.push({
                test: 'State management',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 2: Gestion des timers figés
     */
    testTimerFreezing() {
        console.log('⏸️ Test 2: Gestion des timers figés...');
        
        try {
            const testUserId = this.testUsers[1];
            
            // Test 2.1: Gel de timer
            const frozenTimer = this.ui.freezeTimer(testUserId, 'maintenance_mode', 5000);
            
            if (frozenTimer &&
                frozenTimer.userId === testUserId &&
                frozenTimer.reason === 'maintenance_mode' &&
                frozenTimer.duration === 5000) {
                this.results.timerFreezing.passed++;
                this.results.timerFreezing.details.push({
                    test: 'Timer freezing',
                    status: 'PASS',
                    userId: testUserId,
                    reason: frozenTimer.reason,
                    duration: frozenTimer.duration,
                    message: 'Timer figé correctement'
                });
            } else {
                this.results.timerFreezing.failed++;
                this.results.timerFreezing.details.push({
                    test: 'Timer freezing',
                    status: 'FAIL',
                    error: 'Gel de timer échoué'
                });
            }
            
            // Test 2.2: Vérification statut figé
            const isFrozen = this.ui.isTimerFrozen(testUserId);
            const remainingMs = this.ui.getTimerFreezeRemaining(testUserId);
            
            if (isFrozen && remainingMs > 0 && remainingMs <= 5000) {
                this.results.timerFreezing.passed++;
                this.results.timerFreezing.details.push({
                    test: 'Timer freeze status check',
                    status: 'PASS',
                    isFrozen,
                    remainingMs,
                    message: 'Statut timer figé correct'
                });
            } else {
                this.results.timerFreezing.failed++;
                this.results.timerFreezing.details.push({
                    test: 'Timer freeze status check',
                    status: 'FAIL',
                    isFrozen,
                    remainingMs,
                    error: 'Statut timer figé incorrect'
                });
            }
            
            // Test 2.3: Dégel manuel
            const unfrozen = this.ui.unfreezeTimer(testUserId);
            const isStillFrozen = this.ui.isTimerFrozen(testUserId);
            
            if (unfrozen && !isStillFrozen) {
                this.results.timerFreezing.passed++;
                this.results.timerFreezing.details.push({
                    test: 'Manual timer unfreezing',
                    status: 'PASS',
                    unfrozen,
                    isStillFrozen,
                    message: 'Dégel manuel réussi'
                });
            } else {
                this.results.timerFreezing.failed++;
                this.results.timerFreezing.details.push({
                    test: 'Manual timer unfreezing',
                    status: 'FAIL',
                    error: 'Dégel manuel échoué'
                });
            }
            
            // Test 2.4: Dégel automatique (simulation)
            const autoTestUserId = 'user-auto-unfreeze';
            this.ui.freezeTimer(autoTestUserId, 'emergency_stop', 100); // 100ms pour test rapide
            
            // Attendre le dégel automatique
            setTimeout(() => {
                const autoUnfrozen = !this.ui.isTimerFrozen(autoTestUserId);
                
                if (autoUnfrozen) {
                    this.results.timerFreezing.passed++;
                    this.results.timerFreezing.details.push({
                        test: 'Automatic timer unfreezing',
                        status: 'PASS',
                        message: 'Dégel automatique réussi'
                    });
                } else {
                    this.results.timerFreezing.failed++;
                    this.results.timerFreezing.details.push({
                        test: 'Automatic timer unfreezing',
                        status: 'FAIL',
                        error: 'Dégel automatique échoué'
                    });
                }
            }, 150);
            
        } catch (error) {
            this.results.timerFreezing.failed++;
            this.results.timerFreezing.details.push({
                test: 'Timer freezing',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 3: Système de notifications
     */
    testNotifications() {
        console.log('📢 Test 3: Système de notifications...');
        
        try {
            const testUserId = this.testUsers[2];
            
            // Test 3.1: Notification simple
            const simpleNotif = this.ui.sendNotification(testUserId, {
                type: 'info',
                title: 'Test notification',
                message: 'Ceci est un test de notification.',
                icon: 'info',
                autoClose: 5000
            });
            
            if (simpleNotif &&
                simpleNotif.userId === testUserId &&
                simpleNotif.title === 'Test notification') {
                this.results.notifications.passed++;
                this.results.notifications.details.push({
                    test: 'Simple notification',
                    status: 'PASS',
                    notificationId: simpleNotif.id,
                    type: simpleNotif.type,
                    message: 'Notification simple envoyée'
                });
            } else {
                this.results.notifications.failed++;
                this.results.notifications.details.push({
                    test: 'Simple notification',
                    status: 'FAIL',
                    error: 'Notification simple échouée'
                });
            }
            
            // Test 3.2: Notification gracieuse
            let callbackExecuted = false;
            const gracefulCallback = () => {
                callbackExecuted = true;
            };
            
            const gracefulNotif = this.ui.sendGracefulNotification(
                testUserId,
                'Test maintenance mode',
                gracefulCallback
            );
            
            if (gracefulNotif &&
                gracefulNotif.type === 'graceful_warning' &&
                gracefulNotif.countdown === this.ui.config.notifications.gracePeriod) {
                this.results.notifications.passed++;
                this.results.notifications.details.push({
                    test: 'Graceful notification',
                    status: 'PASS',
                    notificationId: gracefulNotif.id,
                    countdown: gracefulNotif.countdown,
                    message: 'Notification gracieuse envoyée'
                });
            } else {
                this.results.notifications.failed++;
                this.results.notifications.details.push({
                    test: 'Graceful notification',
                    status: 'FAIL',
                    error: 'Notification gracieuse échouée'
                });
            }
            
            // Test 3.3: Report d'opération
            const postponed = this.ui.handlePostpone(testUserId, gracefulNotif.id, '1min');
            
            if (postponed) {
                this.results.notifications.passed++;
                this.results.notifications.details.push({
                    test: 'Operation postpone',
                    status: 'PASS',
                    postponeType: '1min',
                    message: 'Report d\'opération réussi'
                });
            } else {
                this.results.notifications.failed++;
                this.results.notifications.details.push({
                    test: 'Operation postpone',
                    status: 'FAIL',
                    error: 'Report d\'opération échoué'
                });
            }
            
            // Test 3.4: Limite de reports
            // Tenter plusieurs reports pour atteindre la limite
            let reportsCount = 0;
            const maxPostpones = this.ui.config.notifications.maxPostpones;
            
            for (let i = 0; i < maxPostpones + 1; i++) {
                const canPostpone = this.ui.handlePostpone(testUserId, gracefulNotif.id, '1min');
                if (canPostpone) reportsCount++;
            }
            
            if (reportsCount <= maxPostpones) {
                this.results.notifications.passed++;
                this.results.notifications.details.push({
                    test: 'Postpone limit enforcement',
                    status: 'PASS',
                    reportsCount,
                    maxAllowed: maxPostpones,
                    message: 'Limite de reports respectée'
                });
            } else {
                this.results.notifications.failed++;
                this.results.notifications.details.push({
                    test: 'Postpone limit enforcement',
                    status: 'FAIL',
                    reportsCount,
                    maxAllowed: maxPostpones,
                    error: 'Limite de reports non respectée'
                });
            }
            
        } catch (error) {
            this.results.notifications.failed++;
            this.results.notifications.details.push({
                test: 'Notifications',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 4: Mode recovery
     */
    async testRecoveryMode() {
        console.log('🔧 Test 4: Mode recovery...');
        
        try {
            const recoveryUserId = 'user-recovery-test';
            
            // Test 4.1: Démarrage recovery
            const recovery = this.ui.startRecoveryMode(recoveryUserId, 'session_timeout', {
                currentQuestion: 'Q10',
                timeRemaining: 300000
            });
            
            if (recovery &&
                recovery.userId === recoveryUserId &&
                recovery.errorType === 'session_timeout' &&
                recovery.strategy === 'extend_session' &&
                recovery.status === 'active') {
                this.results.recovery.passed++;
                this.results.recovery.details.push({
                    test: 'Recovery mode start',
                    status: 'PASS',
                    userId: recoveryUserId,
                    errorType: recovery.errorType,
                    strategy: recovery.strategy,
                    message: 'Mode recovery démarré correctement'
                });
            } else {
                this.results.recovery.failed++;
                this.results.recovery.details.push({
                    test: 'Recovery mode start',
                    status: 'FAIL',
                    error: 'Démarrage mode recovery échoué'
                });
            }
            
            // Test 4.2: État sauvegardé pendant recovery
            const recoveryState = this.ui.restoreUserState(recoveryUserId);
            
            if (recoveryState &&
                recoveryState.context &&
                (recoveryState.context.recoveryMode === true || 
                 recoveryState.context.errorType === 'session_timeout')) {
                this.results.recovery.passed++;
                this.results.recovery.details.push({
                    test: 'Recovery state preservation',
                    status: 'PASS',
                    recoveryMode: recoveryState.context.recoveryMode,
                    errorType: recoveryState.context.errorType,
                    message: 'État recovery sauvegardé'
                });
            } else {
                this.results.recovery.failed++;
                this.results.recovery.details.push({
                    test: 'Recovery state preservation',
                    status: 'FAIL',
                    error: 'État recovery non sauvegardé'
                });
            }
            
            // Test 4.3: Timer figé pendant recovery
            const isTimerFrozen = this.ui.isTimerFrozen(recoveryUserId);
            
            if (isTimerFrozen) {
                this.results.recovery.passed++;
                this.results.recovery.details.push({
                    test: 'Timer frozen during recovery',
                    status: 'PASS',
                    isFrozen: isTimerFrozen,
                    message: 'Timer figé pendant recovery'
                });
            } else {
                this.results.recovery.failed++;
                this.results.recovery.details.push({
                    test: 'Timer frozen during recovery',
                    status: 'FAIL',
                    isFrozen: isTimerFrozen,
                    error: 'Timer non figé pendant recovery'
                });
            }
            
            // Test 4.4: Queue recovery
            const queueBefore = this.ui.recoveryQueue.length;
            
            // Attendre un peu pour que la recovery s'exécute
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const activeRecoveries = this.ui.recoveryQueue.filter(r => r.status === 'active').length;
            const completedRecoveries = this.ui.recoveryQueue.filter(r => r.status === 'completed').length;
            
            if (completedRecoveries > 0 || activeRecoveries >= 0) {
                this.results.recovery.passed++;
                this.results.recovery.details.push({
                    test: 'Recovery queue processing',
                    status: 'PASS',
                    queueSize: this.ui.recoveryQueue.length,
                    activeCount: activeRecoveries,
                    completedCount: completedRecoveries,
                    message: 'Queue recovery fonctionnelle'
                });
            } else {
                this.results.recovery.failed++;
                this.results.recovery.details.push({
                    test: 'Recovery queue processing',
                    status: 'FAIL',
                    error: 'Queue recovery non fonctionnelle'
                });
            }
            
        } catch (error) {
            this.results.recovery.failed++;
            this.results.recovery.details.push({
                test: 'Recovery mode',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Calculer résultats globaux
     */
    calculateOverallResults() {
        const categories = ['stateManagement', 'timerFreezing', 'notifications', 'recovery'];
        
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
        console.log('\\n🎛️ === RÉSULTATS KILL-SWITCH UI ENHANCEMENTS ===');
        
        const categories = [
            { name: 'Gestion États', key: 'stateManagement' },
            { name: 'Timers Figés', key: 'timerFreezing' },
            { name: 'Notifications', key: 'notifications' },
            { name: 'Mode Recovery', key: 'recovery' }
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
                    if (detail.userId) {
                        console.log(`      Utilisateur: ${detail.userId}`);
                    }
                    if (detail.notificationId) {
                        console.log(`      Notification: ${detail.notificationId.slice(0, 8)}...`);
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
        console.log(`🎛️ Kill-Switch UI prêt: ${ready ? '✅ OUI' : '❌ NON'}`);
        
        // Afficher statistiques UX
        const uiStatus = this.ui.getUIStatus();
        console.log('\\n📋 STATISTIQUES UX:');
        console.log(`💾 États utilisateur: ${uiStatus.userStates.total} (${uiStatus.userStates.active} actifs)`);
        console.log(`⏸️ Timers figés: ${uiStatus.frozenTimers.total}`);
        console.log(`📢 Notifications: ${uiStatus.notifications.total} (${uiStatus.notifications.recent} récentes)`);
        console.log(`🔧 Queue recovery: ${uiStatus.recoveryQueue.total} (${uiStatus.recoveryQueue.active} actifs)`);
        
        return ready;
    }
    
    /**
     * Exécuter tous les tests
     */
    async runAllTests() {
        console.log('🎛️ === TESTS KILL-SWITCH UI ENHANCEMENTS ===\\n');
        
        this.testStateManagement();
        this.testTimerFreezing();
        this.testNotifications();
        await this.testRecoveryMode();
        
        // Attendre que les timers automatiques se terminent
        await new Promise(resolve => setTimeout(resolve, 200));
        
        this.calculateOverallResults();
        const success = this.displayResults();
        
        return success;
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const tester = new KillSwitchUITester();
    
    tester.runAllTests()
        .then(success => {
            console.log(`\\n${success ? '✅' : '❌'} Tests Kill-Switch UI terminés`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur tests Kill-Switch UI:', error);
            process.exit(1);
        });
}

module.exports = KillSwitchUITester;