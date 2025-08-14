/**
 * 📊 SLO MONITORING & ALERTING
 * ============================
 * 
 * Système de Service Level Objectives avec seuils d'alertes concrets :
 * - Disponibilité, latence, taux d'erreur
 * - Budget d'erreur et burn rate
 * - Alertes multi-niveaux avec escalade
 * - Reporting SLI/SLO automatique
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class SLOMonitoring extends EventEmitter {
    
    constructor() {
        super();
        
        this.config = {
            // SLO Objectives (Service Level Objectives)
            slos: {
                availability: {
                    target: 99.9,                    // 99.9% uptime
                    window: '30d',                   // Sur 30 jours
                    budget: 0.1,                     // 0.1% budget erreur
                    criticalThreshold: 0.05,         // Alerte critique si <0.05% budget restant
                    warningThreshold: 0.2            // Alerte warning si <0.2% budget restant
                },
                latency: {
                    target: 95,                      // 95% des requêtes < seuil
                    threshold: 500,                  // 500ms
                    window: '24h',
                    budget: 5,                       // 5% peuvent être > 500ms
                    criticalThreshold: 1,            // <1% budget restant
                    warningThreshold: 3              // <3% budget restant
                },
                errorRate: {
                    target: 99.95,                   // 99.95% succès
                    window: '24h',
                    budget: 0.05,                    // 0.05% budget erreur
                    criticalThreshold: 0.01,         // <0.01% budget restant
                    warningThreshold: 0.03           // <0.03% budget restant
                },
                throughput: {
                    target: 100,                     // Min 100 RPS en moyenne
                    window: '1h',
                    warningThreshold: 80,            // Alerte si <80 RPS
                    criticalThreshold: 50            // Critique si <50 RPS
                }
            },
            
            // Configuration des alertes
            alerting: {
                channels: ['email', 'slack', 'webhook'],
                escalation: {
                    warning: { delay: 300, channels: ['slack'] },           // 5min
                    critical: { delay: 60, channels: ['email', 'slack'] },  // 1min
                    emergency: { delay: 0, channels: ['email', 'slack', 'webhook'] }
                },
                cooldown: 900,                       // 15min entre alertes similaires
                maxAlertsPerHour: 10
            }
        };
        
        this.metrics = {
            availability: { uptime: 0, downtime: 0, incidents: [] },
            latency: { samples: [], percentiles: {} },
            errors: { total: 0, rate: 0, budget: 100 },
            throughput: { rps: 0, samples: [] }
        };
        
        this.sliHistory = []; // Service Level Indicators history
        this.alerts = new Map();
        this.errorBudgets = new Map();
        
        this.initializeSLOTracking();
        console.log('📊 SLO Monitoring initialisé');
    }
    
    /**
     * Initialiser le tracking SLO
     */
    initializeSLOTracking() {
        // Calculer les budgets d'erreur initiaux
        Object.entries(this.config.slos).forEach(([slo, config]) => {
            this.errorBudgets.set(slo, {
                total: config.budget,
                remaining: config.budget,
                consumed: 0,
                resetAt: this.calculateResetTime(config.window)
            });
        });
        
        // Démarrer la collecte de métriques
        this.startMetricsCollection();
        
        // Planifier l'évaluation SLO toutes les minutes
        setInterval(() => {
            this.evaluateSLOs();
        }, 60000);
        
        // Planifier le reset des budgets
        this.schedulebudgetResets();
    }
    
    /**
     * Calculer le temps de reset du budget
     */
    calculateResetTime(window) {
        const now = new Date();
        
        switch (window) {
            case '1h':
                return new Date(now.getTime() + 60 * 60 * 1000);
            case '24h':
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
            case '30d':
                return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Limiter à 7 jours pour éviter overflow
            default:
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }
    }
    
    /**
     * Démarrer la collecte de métriques
     */
    startMetricsCollection() {
        // Collecte toutes les 30 secondes
        setInterval(() => {
            this.collectSLIMetrics();
        }, 30000);
        
        // Nettoyage des anciennes métriques toutes les heures
        setInterval(() => {
            this.cleanupOldMetrics();
        }, 3600000);
    }
    
    /**
     * Collecter les métriques SLI (Service Level Indicators)
     */
    collectSLIMetrics() {
        const timestamp = new Date().toISOString();
        
        // Collecter depuis le système de monitoring global
        const monitoringSystem = global.monitoringSystem;
        
        if (monitoringSystem) {
            const metrics = monitoringSystem.getMetrics();
            
            const sli = {
                timestamp,
                availability: this.calculateAvailability(metrics),
                latency: this.calculateLatencyMetrics(metrics),
                errorRate: this.calculateErrorRate(metrics),
                throughput: this.calculateThroughput(metrics)
            };
            
            this.sliHistory.push(sli);
            
            // Garder seulement les 24h dernières
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            this.sliHistory = this.sliHistory.filter(s => 
                new Date(s.timestamp) > oneDayAgo
            );
            
            this.emit('sli_collected', sli);
        }
    }
    
    /**
     * Calculer la disponibilité
     */
    calculateAvailability(metrics) {
        // Basé sur l'absence d'erreurs critiques
        const criticalErrors = metrics.metrics?.uniqueSolutionFail?.total || 0;
        const totalRequests = this.estimateRequestCount();
        
        if (totalRequests === 0) return 100;
        
        const availability = ((totalRequests - criticalErrors) / totalRequests) * 100;
        return Math.max(0, Math.min(100, availability));
    }
    
    /**
     * Calculer les métriques de latence
     */
    calculateLatencyMetrics(metrics) {
        const latencySamples = metrics.metrics?.latency?.samples || [];
        
        if (latencySamples.length === 0) {
            return { p50: 0, p95: 0, p99: 0, overThreshold: 0 };
        }
        
        const durations = latencySamples.map(s => s.duration).sort((a, b) => a - b);
        const len = durations.length;
        
        const p50 = durations[Math.floor(len * 0.50)];
        const p95 = durations[Math.floor(len * 0.95)];
        const p99 = durations[Math.floor(len * 0.99)];
        
        const threshold = this.config.slos.latency.threshold;
        const overThreshold = (durations.filter(d => d > threshold).length / len) * 100;
        
        return { p50, p95, p99, overThreshold };
    }
    
    /**
     * Calculer le taux d'erreur
     */
    calculateErrorRate(metrics) {
        const errors = (metrics.metrics?.frontendErrors?.total || 0) + 
                      (metrics.metrics?.uniqueSolutionFail?.total || 0);
        const totalRequests = this.estimateRequestCount();
        
        if (totalRequests === 0) return 0;
        
        return (errors / totalRequests) * 100;
    }
    
    /**
     * Calculer le throughput
     */
    calculateThroughput(metrics) {
        // Estimer le RPS basé sur les échantillons de latence récents
        const latencySamples = metrics.metrics?.latency?.samples || [];
        const recentSamples = latencySamples.filter(s => 
            Date.now() - s.timestamp < 60000 // Dernière minute
        );
        
        return recentSamples.length; // Approximation RPS
    }
    
    /**
     * Estimer le nombre total de requêtes
     */
    estimateRequestCount() {
        // Basé sur les métriques de monitoring
        const monitoringSystem = global.monitoringSystem;
        if (!monitoringSystem) return 1000; // Valeur par défaut
        
        const metrics = monitoringSystem.getMetrics();
        const latencySamples = metrics.metrics?.latency?.samples?.length || 0;
        
        // Extrapolation basée sur les échantillons
        return Math.max(100, latencySamples * 10);
    }
    
    /**
     * Évaluer les SLOs et déclencher des alertes
     */
    evaluateSLOs() {
        const evaluation = {
            timestamp: new Date().toISOString(),
            slos: {},
            alerts: []
        };
        
        // Évaluer chaque SLO
        Object.entries(this.config.slos).forEach(([sloName, sloConfig]) => {
            const sloResult = this.evaluateSingleSLO(sloName, sloConfig);
            evaluation.slos[sloName] = sloResult;
            
            // Vérifier les seuils d'alerte
            const alerts = this.checkAlertThresholds(sloName, sloResult, sloConfig);
            evaluation.alerts.push(...alerts);
        });
        
        // Déclencher les alertes
        evaluation.alerts.forEach(alert => {
            this.triggerAlert(alert);
        });
        
        this.emit('slo_evaluation', evaluation);
        return evaluation;
    }
    
    /**
     * Évaluer un SLO individuel
     */
    evaluateSingleSLO(sloName, sloConfig) {
        const recentSLIs = this.getRecentSLIs(sloConfig.window);
        const budget = this.errorBudgets.get(sloName);
        
        let currentValue = 0;
        let budgetConsumption = 0;
        
        switch (sloName) {
            case 'availability':
                currentValue = this.calculateAverageAvailability(recentSLIs);
                budgetConsumption = Math.max(0, sloConfig.target - currentValue);
                break;
                
            case 'latency':
                const latencyCompliance = this.calculateLatencyCompliance(recentSLIs, sloConfig);
                currentValue = latencyCompliance;
                budgetConsumption = Math.max(0, sloConfig.target - latencyCompliance);
                break;
                
            case 'errorRate':
                const successRate = this.calculateSuccessRate(recentSLIs);
                currentValue = successRate;
                budgetConsumption = Math.max(0, sloConfig.target - successRate);
                break;
                
            case 'throughput':
                currentValue = this.calculateAverageThroughput(recentSLIs);
                // Pour throughput, pas de budget d'erreur classique
                break;
        }
        
        // Mettre à jour le budget d'erreur
        if (budget && sloName !== 'throughput') {
            budget.consumed = Math.min(budget.total, budget.consumed + budgetConsumption);
            budget.remaining = Math.max(0, budget.total - budget.consumed);
        }
        
        return {
            slo: sloName,
            target: sloConfig.target,
            current: currentValue,
            compliant: currentValue >= sloConfig.target,
            budget: budget ? {
                total: budget.total,
                remaining: budget.remaining,
                consumed: budget.consumed,
                burnRate: this.calculateBurnRate(sloName, budgetConsumption)
            } : null
        };
    }
    
    /**
     * Obtenir les SLIs récents selon la fenêtre
     */
    getRecentSLIs(window) {
        let cutoff;
        const now = new Date();
        
        switch (window) {
            case '1h':
                cutoff = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '24h':
                cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '30d':
                cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        
        return this.sliHistory.filter(sli => new Date(sli.timestamp) > cutoff);
    }
    
    /**
     * Calculer la disponibilité moyenne
     */
    calculateAverageAvailability(slis) {
        if (slis.length === 0) return 100;
        
        const sum = slis.reduce((acc, sli) => acc + sli.availability, 0);
        return sum / slis.length;
    }
    
    /**
     * Calculer la conformité de latence
     */
    calculateLatencyCompliance(slis, config) {
        if (slis.length === 0) return 100;
        
        const compliantSamples = slis.filter(sli => 
            sli.latency.overThreshold <= (100 - config.target)
        ).length;
        
        return (compliantSamples / slis.length) * 100;
    }
    
    /**
     * Calculer le taux de succès
     */
    calculateSuccessRate(slis) {
        if (slis.length === 0) return 100;
        
        const avgErrorRate = slis.reduce((acc, sli) => acc + sli.errorRate, 0) / slis.length;
        return Math.max(0, 100 - avgErrorRate);
    }
    
    /**
     * Calculer le throughput moyen
     */
    calculateAverageThroughput(slis) {
        if (slis.length === 0) return 0;
        
        const sum = slis.reduce((acc, sli) => acc + sli.throughput, 0);
        return sum / slis.length;
    }
    
    /**
     * Calculer le burn rate du budget
     */
    calculateBurnRate(sloName, currentConsumption) {
        // Burn rate = vitesse de consommation du budget
        // Si on continue à ce rythme, en combien de temps le budget sera épuisé
        
        if (currentConsumption === 0) return 0;
        
        const budget = this.errorBudgets.get(sloName);
        if (!budget || budget.remaining === 0) return Infinity;
        
        // Burn rate en %/heure
        const hoursUntilExhaustion = budget.remaining / currentConsumption;
        return 1 / hoursUntilExhaustion;
    }
    
    /**
     * Vérifier les seuils d'alerte
     */
    checkAlertThresholds(sloName, sloResult, sloConfig) {
        const alerts = [];
        const budget = sloResult.budget;
        
        // Alertes basées sur le budget d'erreur
        if (budget) {
            const remainingPercent = (budget.remaining / budget.total) * 100;
            
            if (remainingPercent <= sloConfig.criticalThreshold) {
                alerts.push({
                    level: 'critical',
                    slo: sloName,
                    message: `SLO ${sloName} : Budget d'erreur critique (${remainingPercent.toFixed(2)}% restant)`,
                    value: remainingPercent,
                    threshold: sloConfig.criticalThreshold,
                    burnRate: budget.burnRate
                });
            } else if (remainingPercent <= sloConfig.warningThreshold) {
                alerts.push({
                    level: 'warning',
                    slo: sloName,
                    message: `SLO ${sloName} : Budget d'erreur faible (${remainingPercent.toFixed(2)}% restant)`,
                    value: remainingPercent,
                    threshold: sloConfig.warningThreshold,
                    burnRate: budget.burnRate
                });
            }
        }
        
        // Alertes spécifiques au throughput
        if (sloName === 'throughput') {
            if (sloResult.current <= sloConfig.criticalThreshold) {
                alerts.push({
                    level: 'critical',
                    slo: sloName,
                    message: `Throughput critique : ${sloResult.current.toFixed(1)} RPS < ${sloConfig.criticalThreshold} RPS`,
                    value: sloResult.current,
                    threshold: sloConfig.criticalThreshold
                });
            } else if (sloResult.current <= sloConfig.warningThreshold) {
                alerts.push({
                    level: 'warning',
                    slo: sloName,
                    message: `Throughput faible : ${sloResult.current.toFixed(1)} RPS < ${sloConfig.warningThreshold} RPS`,
                    value: sloResult.current,
                    threshold: sloConfig.warningThreshold
                });
            }
        }
        
        // Alerte burn rate élevé
        if (budget && budget.burnRate > 1.0) {
            alerts.push({
                level: budget.burnRate > 5.0 ? 'emergency' : 'critical',
                slo: sloName,
                message: `Burn rate élevé pour ${sloName} : ${budget.burnRate.toFixed(2)}x`,
                value: budget.burnRate,
                threshold: 1.0
            });
        }
        
        return alerts;
    }
    
    /**
     * Déclencher une alerte
     */
    triggerAlert(alert) {
        const alertKey = `${alert.slo}_${alert.level}`;
        const now = Date.now();
        
        // Vérifier cooldown
        const lastAlert = this.alerts.get(alertKey);
        if (lastAlert && (now - lastAlert.timestamp) < this.config.alerting.cooldown * 1000) {
            return; // Encore en cooldown
        }
        
        // Enrichir l'alerte
        const enrichedAlert = {
            ...alert,
            id: this.generateAlertId(),
            timestamp: new Date().toISOString(),
            escalation: this.config.alerting.escalation[alert.level] || {},
            channels: this.config.alerting.escalation[alert.level]?.channels || ['slack']
        };
        
        // Sauvegarder l'alerte
        this.alerts.set(alertKey, enrichedAlert);
        
        // Envoyer l'alerte
        this.sendAlert(enrichedAlert);
        
        console.log(`🚨 ALERTE SLO [${alert.level.toUpperCase()}]: ${alert.message}`);
        
        this.emit('alert_triggered', enrichedAlert);
    }
    
    /**
     * Envoyer une alerte via les canaux configurés
     */
    async sendAlert(alert) {
        const promises = alert.channels.map(channel => {
            return this.sendAlertToChannel(alert, channel);
        });
        
        try {
            await Promise.all(promises);
            console.log(`📤 Alerte envoyée via ${alert.channels.join(', ')}`);
        } catch (error) {
            console.error('❌ Erreur envoi alerte:', error.message);
        }
    }
    
    /**
     * Envoyer alerte vers un canal spécifique
     */
    async sendAlertToChannel(alert, channel) {
        switch (channel) {
            case 'slack':
                return this.sendSlackAlert(alert);
            case 'email':
                return this.sendEmailAlert(alert);
            case 'webhook':
                return this.sendWebhookAlert(alert);
            default:
                console.log(`📱 Alert ${channel}: ${alert.message}`);
        }
    }
    
    /**
     * Envoyer alerte Slack
     */
    async sendSlackAlert(alert) {
        // Simulation d'envoi Slack
        const slackMessage = {
            text: `🚨 SLO Alert - ${alert.level.toUpperCase()}`,
            attachments: [{
                color: this.getAlertColor(alert.level),
                title: `SLO: ${alert.slo}`,
                text: alert.message,
                fields: [
                    { title: 'Valeur', value: alert.value?.toFixed(2), short: true },
                    { title: 'Seuil', value: alert.threshold?.toString(), short: true }
                ],
                ts: Math.floor(Date.now() / 1000)
            }]
        };
        
        console.log(`💬 Slack: ${JSON.stringify(slackMessage, null, 2)}`);
        
        // En production, envoyer via webhook Slack
        /*
        const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slackMessage)
        });
        */
    }
    
    /**
     * Envoyer alerte email
     */
    async sendEmailAlert(alert) {
        const emailContent = {
            to: process.env.ALERT_EMAIL || 'admin@testiq.com',
            subject: `🚨 SLO Alert: ${alert.slo} - ${alert.level}`,
            html: `
                <h2>SLO Alert - ${alert.level.toUpperCase()}</h2>
                <p><strong>Service:</strong> ${alert.slo}</p>
                <p><strong>Message:</strong> ${alert.message}</p>
                <p><strong>Valeur actuelle:</strong> ${alert.value?.toFixed(2)}</p>
                <p><strong>Seuil:</strong> ${alert.threshold}</p>
                <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
                ${alert.burnRate ? `<p><strong>Burn Rate:</strong> ${alert.burnRate.toFixed(2)}x</p>` : ''}
            `
        };
        
        console.log(`📧 Email: ${emailContent.subject}`);
        
        // En production, utiliser un service d'email (SendGrid, SES, etc.)
    }
    
    /**
     * Envoyer alerte webhook
     */
    async sendWebhookAlert(alert) {
        const webhookPayload = {
            event: 'slo_alert',
            alert,
            timestamp: alert.timestamp
        };
        
        console.log(`🔗 Webhook: ${JSON.stringify(webhookPayload)}`);
        
        // En production, envoyer vers webhook configuré
        /*
        if (process.env.ALERT_WEBHOOK_URL) {
            await fetch(process.env.ALERT_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(webhookPayload)
            });
        }
        */
    }
    
    /**
     * Obtenir la couleur d'alerte
     */
    getAlertColor(level) {
        const colors = {
            warning: '#FFA500',
            critical: '#FF4500',
            emergency: '#FF0000'
        };
        return colors[level] || '#808080';
    }
    
    /**
     * Générer un ID d'alerte unique
     */
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Programmer les resets de budget
     */
    schedulebudgetResets() {
        Object.entries(this.config.slos).forEach(([sloName, sloConfig]) => {
            this.scheduleNextBudgetReset(sloName, sloConfig);
        });
    }
    
    /**
     * Programmer le prochain reset de budget
     */
    scheduleNextBudgetReset(sloName, sloConfig) {
        const budget = this.errorBudgets.get(sloName);
        if (!budget) return;
        
        const now = Date.now();
        const resetTime = new Date(budget.resetAt).getTime();
        const delay = resetTime - now;
        
        if (delay > 0) {
            setTimeout(() => {
                this.resetErrorBudget(sloName, sloConfig);
                this.scheduleNextBudgetReset(sloName, sloConfig);
            }, delay);
        }
    }
    
    /**
     * Reset du budget d'erreur
     */
    resetErrorBudget(sloName, sloConfig) {
        const budget = this.errorBudgets.get(sloName);
        if (budget) {
            budget.remaining = sloConfig.budget;
            budget.consumed = 0;
            budget.resetAt = this.calculateResetTime(sloConfig.window);
            
            console.log(`🔄 Budget d'erreur reset pour ${sloName}: ${sloConfig.budget}%`);
            
            this.emit('budget_reset', { slo: sloName, budget: sloConfig.budget });
        }
    }
    
    /**
     * Nettoyer les anciennes métriques
     */
    cleanupOldMetrics() {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        // Nettoyer l'historique SLI
        const originalCount = this.sliHistory.length;
        this.sliHistory = this.sliHistory.filter(sli => 
            new Date(sli.timestamp) > sevenDaysAgo
        );
        
        // Nettoyer les alertes anciennes
        const activeAlerts = new Map();
        for (const [key, alert] of this.alerts.entries()) {
            if (new Date(alert.timestamp) > sevenDaysAgo) {
                activeAlerts.set(key, alert);
            }
        }
        this.alerts = activeAlerts;
        
        if (originalCount !== this.sliHistory.length) {
            console.log(`🧹 Nettoyage métriques: ${originalCount} → ${this.sliHistory.length} SLIs`);
        }
    }
    
    /**
     * Obtenir le rapport SLO
     */
    getSLOReport(period = '24h') {
        const evaluation = this.evaluateSLOs();
        const recentAlerts = Array.from(this.alerts.values())
            .filter(alert => {
                const alertTime = new Date(alert.timestamp);
                const cutoff = new Date(Date.now() - (period === '24h' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000));
                return alertTime > cutoff;
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return {
            timestamp: new Date().toISOString(),
            period,
            slos: evaluation.slos,
            alerts: {
                recent: recentAlerts,
                summary: {
                    total: recentAlerts.length,
                    byLevel: this.groupAlertsByLevel(recentAlerts),
                    bySLO: this.groupAlertsBySLO(recentAlerts)
                }
            },
            budgets: Object.fromEntries(this.errorBudgets),
            recommendations: this.generateSLORecommendations(evaluation)
        };
    }
    
    /**
     * Grouper alertes par niveau
     */
    groupAlertsByLevel(alerts) {
        return alerts.reduce((acc, alert) => {
            acc[alert.level] = (acc[alert.level] || 0) + 1;
            return acc;
        }, {});
    }
    
    /**
     * Grouper alertes par SLO
     */
    groupAlertsBySLO(alerts) {
        return alerts.reduce((acc, alert) => {
            acc[alert.slo] = (acc[alert.slo] || 0) + 1;
            return acc;
        }, {});
    }
    
    /**
     * Générer des recommandations SLO
     */
    generateSLORecommendations(evaluation) {
        const recommendations = [];
        
        Object.values(evaluation.slos).forEach(slo => {
            if (!slo.compliant) {
                recommendations.push({
                    priority: 'HIGH',
                    slo: slo.slo,
                    issue: `SLO ${slo.slo} non respecté (${slo.current.toFixed(2)}% < ${slo.target}%)`,
                    action: this.getSLORecommendation(slo.slo, slo.current, slo.target)
                });
            }
            
            if (slo.budget && slo.budget.remaining < slo.budget.total * 0.1) {
                recommendations.push({
                    priority: 'MEDIUM',
                    slo: slo.slo,
                    issue: `Budget d'erreur faible (${slo.budget.remaining.toFixed(2)}% restant)`,
                    action: 'Réduire le taux d\'erreur ou ajuster les objectifs SLO'
                });
            }
        });
        
        return recommendations;
    }
    
    /**
     * Obtenir une recommandation spécifique pour un SLO
     */
    getSLORecommendation(sloName, current, target) {
        const recommendations = {
            availability: 'Identifier et résoudre les causes d\'indisponibilité. Vérifier l\'infrastructure.',
            latency: 'Optimiser les performances backend, ajouter du cache, dimensionner les ressources.',
            errorRate: 'Analyser les logs d\'erreur, améliorer la gestion d\'exceptions, tests supplémentaires.',
            throughput: 'Augmenter la capacité serveur, optimiser les requêtes, load balancing.'
        };
        
        return recommendations[sloName] || 'Analyser les causes de la dégradation et appliquer les corrections appropriées.';
    }
}

const sloMonitoring = new SLOMonitoring();
global.sloMonitoring = sloMonitoring;

module.exports = SLOMonitoring;