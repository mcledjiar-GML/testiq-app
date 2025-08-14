/**
 * 🔍 MONITORING SYSTÈME PRODUCTION
 * ================================
 * 
 * Middleware de monitoring pour les métriques critiques
 */

const EventEmitter = require('events');

class MonitoringSystem extends EventEmitter {
    
    constructor() {
        super();
        this.metrics = {
            publishBlocked: { total: 0, byTag: {} },
            uniqueSolutionFail: { total: 0, details: [] },
            renderBlocked: { total: 0, reasons: {} },
            latency: { samples: [], p95: 0, p99: 0 },
            frontendErrors: { total: 0, rate: 0, lastWindow: [] }
        };
        
        this.config = {
            latencyThreshold: 150,
            errorRateThreshold: 1,
            windowSize: 100,
            alertCooldown: 60000,
            retentionPeriod: 24 * 60 * 60 * 1000
        };
        
        this.alerts = {
            lastSent: {},
            activeAlerts: new Set()
        };
        
        setInterval(() => this.cleanupOldMetrics(), 60000);
    }
    
    recordPublishBlocked(qid, reason, tag = 'unknown') {
        this.metrics.publishBlocked.total++;
        
        if (!this.metrics.publishBlocked.byTag[tag]) {
            this.metrics.publishBlocked.byTag[tag] = 0;
        }
        this.metrics.publishBlocked.byTag[tag]++;
        
        console.log(`🚫 Publication blocked: ${qid} (${tag}: ${reason})`);
        
        this.emit('publish_blocked', {
            qid,
            reason,
            tag,
            timestamp: new Date().toISOString(),
            total: this.metrics.publishBlocked.total
        });
    }
    
    recordUniqueSolutionFail(qid, details) {
        this.metrics.uniqueSolutionFail.total++;
        this.metrics.uniqueSolutionFail.details.push({
            qid,
            details,
            timestamp: new Date().toISOString()
        });
        
        if (this.metrics.uniqueSolutionFail.details.length > 50) {
            this.metrics.uniqueSolutionFail.details = this.metrics.uniqueSolutionFail.details.slice(-50);
        }
        
        console.log(`⚠️ Unique solution fail: ${qid}`);
        
        this.emit('unique_solution_fail', {
            qid,
            details,
            timestamp: new Date().toISOString(),
            total: this.metrics.uniqueSolutionFail.total
        });
        
        this.sendAlert('unique_solution_fail', { qid, details });
    }
    
    recordRenderBlocked(qid, reason) {
        this.metrics.renderBlocked.total++;
        
        if (!this.metrics.renderBlocked.reasons[reason]) {
            this.metrics.renderBlocked.reasons[reason] = 0;
        }
        this.metrics.renderBlocked.reasons[reason]++;
        
        console.log(`🚫 Render blocked: ${qid} (${reason})`);
        
        this.emit('render_blocked', {
            qid,
            reason,
            timestamp: new Date().toISOString(),
            total: this.metrics.renderBlocked.total
        });
    }
    
    recordLatency(endpoint, duration) {
        const sample = {
            endpoint,
            duration,
            timestamp: Date.now()
        };
        
        this.metrics.latency.samples.push(sample);
        
        if (this.metrics.latency.samples.length > this.config.windowSize) {
            this.metrics.latency.samples = this.metrics.latency.samples.slice(-this.config.windowSize);
        }
        
        this.calculateLatencyPercentiles();
    }
    
    recordFrontendError(error, userAgent, url) {
        const errorEvent = {
            error: error.message || error,
            userAgent,
            url,
            timestamp: Date.now()
        };
        
        this.metrics.frontendErrors.total++;
        this.metrics.frontendErrors.lastWindow.push(errorEvent);
        
        if (this.metrics.frontendErrors.lastWindow.length > 100) {
            this.metrics.frontendErrors.lastWindow = this.metrics.frontendErrors.lastWindow.slice(-100);
        }
        
        const errorCount = this.metrics.frontendErrors.lastWindow.length;
        const totalInteractions = 100;
        this.metrics.frontendErrors.rate = (errorCount / totalInteractions) * 100;
        
        console.log(`🚨 Frontend error: ${error.message || error} (rate: ${this.metrics.frontendErrors.rate.toFixed(1)}%)`);
    }
    
    calculateLatencyPercentiles() {
        if (this.metrics.latency.samples.length === 0) return;
        
        const durations = this.metrics.latency.samples
            .map(s => s.duration)
            .sort((a, b) => a - b);
        
        const p95Index = Math.ceil(durations.length * 0.95) - 1;
        const p99Index = Math.ceil(durations.length * 0.99) - 1;
        
        this.metrics.latency.p95 = durations[p95Index] || 0;
        this.metrics.latency.p99 = durations[p99Index] || 0;
    }
    
    sendAlert(type, data) {
        const now = Date.now();
        const lastSent = this.alerts.lastSent[type] || 0;
        
        if (now - lastSent < this.config.alertCooldown) {
            return;
        }
        
        this.alerts.lastSent[type] = now;
        this.alerts.activeAlerts.add(type);
        
        const alert = {
            type,
            data,
            timestamp: new Date().toISOString(),
            severity: this.getAlertSeverity(type)
        };
        
        console.log(`🚨 ALERT [${alert.severity}]: ${type}`);
        this.emit('alert', alert);
    }
    
    getAlertSeverity(type) {
        const severityMap = {
            unique_solution_fail: 'CRITICAL',
            render_blocked_critical: 'CRITICAL',
            frontend_error_rate_high: 'HIGH',
            latency_high: 'MEDIUM',
            publish_blocked_high: 'LOW'
        };
        
        return severityMap[type] || 'LOW';
    }
    
    getMetrics() {
        return {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            alerts: {
                active: Array.from(this.alerts.activeAlerts),
                lastSent: this.alerts.lastSent
            },
            health: this.getHealthStatus()
        };
    }
    
    getHealthStatus() {
        const issues = [];
        
        if (this.metrics.latency.p95 > this.config.latencyThreshold) {
            issues.push(`High latency: P95 ${this.metrics.latency.p95}ms > ${this.config.latencyThreshold}ms`);
        }
        
        if (this.metrics.frontendErrors.rate > this.config.errorRateThreshold) {
            issues.push(`High error rate: ${this.metrics.frontendErrors.rate.toFixed(1)}% > ${this.config.errorRateThreshold}%`);
        }
        
        if (this.metrics.uniqueSolutionFail.total > 0) {
            issues.push(`Unique solution failures: ${this.metrics.uniqueSolutionFail.total}`);
        }
        
        return {
            status: issues.length === 0 ? 'healthy' : 'degraded',
            issues,
            score: Math.max(0, 100 - (issues.length * 20))
        };
    }
    
    cleanupOldMetrics() {
        const cutoff = Date.now() - this.config.retentionPeriod;
        
        this.metrics.latency.samples = this.metrics.latency.samples
            .filter(s => s.timestamp > cutoff);
        
        this.metrics.frontendErrors.lastWindow = this.metrics.frontendErrors.lastWindow
            .filter(e => e.timestamp > cutoff);
        
        this.metrics.uniqueSolutionFail.details = this.metrics.uniqueSolutionFail.details
            .filter(d => new Date(d.timestamp).getTime() > cutoff);
    }
    
    generateReport() {
        const health = this.getHealthStatus();
        
        return {
            timestamp: new Date().toISOString(),
            period: '24h',
            health,
            summary: {
                publishBlocked: this.metrics.publishBlocked.total,
                uniqueSolutionFails: this.metrics.uniqueSolutionFail.total,
                renderBlocked: this.metrics.renderBlocked.total,
                avgLatency: this.metrics.latency.samples.length > 0 
                    ? this.metrics.latency.samples.reduce((sum, s) => sum + s.duration, 0) / this.metrics.latency.samples.length 
                    : 0,
                frontendErrorRate: this.metrics.frontendErrors.rate
            },
            details: this.metrics
        };
    }
    
    static measureLatency(req, res, next) {
        const startTime = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - startTime;
            
            if (req.path.includes('/questions/') && req.method === 'GET') {
                global.monitoringSystem?.recordLatency(req.path, duration);
            }
        });
        
        next();
    }
}

const monitoringSystem = new MonitoringSystem();
global.monitoringSystem = monitoringSystem;

module.exports = MonitoringSystem;