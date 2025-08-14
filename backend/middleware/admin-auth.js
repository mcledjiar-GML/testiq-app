/**
 * 🔐 AUTH/RBAC POUR MONITORING ET KILL-SWITCH
 * ===========================================
 * 
 * Sécurisation des endpoints critiques avec authentification
 * et contrôle d'accès basé sur les rôles.
 */

const crypto = require('crypto');

class AdminAuth {
    
    constructor() {
        // API Keys d'admin (normalement depuis env/DB sécurisée)
        this.adminKeys = new Map([
            ['admin-key-monitoring', { 
                role: 'admin', 
                permissions: ['monitoring:read', 'monitoring:write', 'killswitch:read', 'killswitch:write'],
                name: 'Admin Full Access',
                created: new Date().toISOString()
            }],
            ['readonly-key-monitoring', { 
                role: 'viewer', 
                permissions: ['monitoring:read'],
                name: 'Monitoring Read-Only',
                created: new Date().toISOString()
            }],
            ['emergency-key-killswitch', { 
                role: 'emergency', 
                permissions: ['killswitch:emergency'],
                name: 'Emergency Kill-Switch Only',
                created: new Date().toISOString()
            }]
        ]);
        
        this.auditLog = [];
        this.ipAllowlist = process.env.ADMIN_IP_ALLOWLIST?.split(',') || ['127.0.0.1', '::1'];
        this.rateLimits = new Map(); // IP -> { count, window }
    }
    
    /**
     * Middleware d'authentification pour endpoints admin
     */
    static requireAuth(requiredPermission) {
        return (req, res, next) => {
            const auth = global.adminAuth || new AdminAuth();
            
            try {
                // 1. Vérifier IP allowlist
                if (!auth.isIPAllowed(req.ip)) {
                    auth.logSecurityEvent('IP_BLOCKED', req.ip, null, 'IP not in allowlist');
                    return res.status(403).json({
                        error: 'Forbidden',
                        message: 'Access denied from this IP address'
                    });
                }
                
                // 2. Rate limiting
                if (!auth.checkRateLimit(req.ip)) {
                    auth.logSecurityEvent('RATE_LIMITED', req.ip, null, 'Rate limit exceeded');
                    return res.status(429).json({
                        error: 'Too Many Requests',
                        message: 'Rate limit exceeded. Try again later.',
                        retryAfter: 60
                    });
                }
                
                // 3. Vérifier token API
                const token = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
                if (!token) {
                    return res.status(401).json({
                        error: 'Unauthorized',
                        message: 'API key required'
                    });
                }
                
                // 4. Valider token
                const keyInfo = auth.adminKeys.get(token);
                if (!keyInfo) {
                    auth.logSecurityEvent('INVALID_TOKEN', req.ip, token.slice(0, 8), 'Invalid API key');
                    return res.status(401).json({
                        error: 'Unauthorized',
                        message: 'Invalid API key'
                    });
                }
                
                // 5. Vérifier permissions
                if (requiredPermission && !keyInfo.permissions.includes(requiredPermission)) {
                    auth.logSecurityEvent('PERMISSION_DENIED', req.ip, keyInfo.name, `Missing permission: ${requiredPermission}`);
                    return res.status(403).json({
                        error: 'Forbidden',
                        message: `Insufficient permissions. Required: ${requiredPermission}`
                    });
                }
                
                // 6. Ajouter info utilisateur dans request
                req.admin = {
                    role: keyInfo.role,
                    permissions: keyInfo.permissions,
                    name: keyInfo.name,
                    tokenHash: auth.hashToken(token)
                };
                
                // 7. Log accès réussi
                auth.logAuditEvent('ACCESS_GRANTED', req.admin.name, req.method, req.path, {
                    ip: req.ip,
                    userAgent: req.headers['user-agent'],
                    permission: requiredPermission
                });
                
                next();
                
            } catch (error) {
                console.error('🚨 Auth middleware error:', error);
                auth.logSecurityEvent('AUTH_ERROR', req.ip, null, error.message);
                return res.status(500).json({
                    error: 'Internal Server Error',
                    message: 'Authentication system error'
                });
            }
        };
    }
    
    /**
     * Vérifier si IP est autorisée
     */
    isIPAllowed(ip) {
        // Normaliser IPv6 localhost
        const normalizedIP = ip === '::ffff:127.0.0.1' ? '127.0.0.1' : ip;
        return this.ipAllowlist.includes(normalizedIP) || this.ipAllowlist.includes('*');
    }
    
    /**
     * Rate limiting par IP
     */
    checkRateLimit(ip) {
        const now = Date.now();
        const window = 60000; // 1 minute
        const maxRequests = 30; // 30 requêtes par minute
        
        const current = this.rateLimits.get(ip) || { count: 0, windowStart: now };
        
        // Reset window si expiré
        if (now - current.windowStart > window) {
            current.count = 1;
            current.windowStart = now;
        } else {
            current.count++;
        }
        
        this.rateLimits.set(ip, current);
        
        return current.count <= maxRequests;
    }
    
    /**
     * Hasher un token pour les logs (pas stocker en clair)
     */
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex').slice(0, 12);
    }
    
    /**
     * Logger événement d'audit
     */
    logAuditEvent(action, user, method, path, details = {}) {
        const event = {
            timestamp: new Date().toISOString(),
            type: 'AUDIT',
            action,
            user: user || 'anonymous',
            method,
            path,
            details,
            sessionId: details.sessionId || 'unknown'
        };
        
        this.auditLog.push(event);
        
        // Garder seulement les 1000 derniers événements
        if (this.auditLog.length > 1000) {
            this.auditLog = this.auditLog.slice(-1000);
        }
        
        console.log(`📋 AUDIT: ${user} ${action} ${method} ${path}`);
        
        // En production : envoyer vers système central (Elasticsearch, etc.)
        this.sendToAuditSystem(event);
    }
    
    /**
     * Logger événement de sécurité
     */
    logSecurityEvent(type, ip, user, details) {
        const event = {
            timestamp: new Date().toISOString(),
            type: 'SECURITY',
            event: type,
            ip,
            user: user || 'unknown',
            details,
            severity: this.getSecuritySeverity(type)
        };
        
        this.auditLog.push(event);
        console.log(`🚨 SECURITY [${event.severity}]: ${type} from ${ip} - ${details}`);
        
        // Alerte immédiate pour événements critiques
        if (event.severity === 'HIGH') {
            global.monitoringSystem?.sendAlert('security_incident', event);
        }
        
        this.sendToAuditSystem(event);
    }
    
    /**
     * Déterminer sévérité événement sécurité
     */
    getSecuritySeverity(type) {
        const severityMap = {
            'IP_BLOCKED': 'MEDIUM',
            'INVALID_TOKEN': 'HIGH',
            'PERMISSION_DENIED': 'MEDIUM', 
            'RATE_LIMITED': 'LOW',
            'AUTH_ERROR': 'HIGH'
        };
        
        return severityMap[type] || 'MEDIUM';
    }
    
    /**
     * Envoyer vers système d'audit central
     */
    sendToAuditSystem(event) {
        // Anonymiser PII avant envoi
        const anonymizedEvent = this.anonymizeEvent(event);
        
        // En production : intégration avec ELK, Splunk, etc.
        if (process.env.AUDIT_WEBHOOK_URL) {
            // fetch(process.env.AUDIT_WEBHOOK_URL, { ... })
        }
        
        // Pour dev : simple log
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 AUDIT EVENT:', JSON.stringify(anonymizedEvent, null, 2));
        }
    }
    
    /**
     * Anonymiser événement pour conformité GDPR
     */
    anonymizeEvent(event) {
        const anonymized = { ...event };
        
        // Hasher IP pour anonymisation
        if (anonymized.ip) {
            anonymized.ip = crypto.createHash('sha256').update(anonymized.ip).digest('hex').slice(0, 8);
        }
        
        // Supprimer user agent (peut contenir PII)
        if (anonymized.details?.userAgent) {
            anonymized.details.userAgent = '[ANONYMIZED]';
        }
        
        return anonymized;
    }
    
    /**
     * Middleware pour logger les changements d'état
     */
    static logStateChange(req, res, next) {
        const auth = global.adminAuth || new AdminAuth();
        
        // Intercepter la réponse pour logger les changements
        const originalJson = res.json;
        res.json = function(data) {
            // Logger si changement d'état détecté
            if (req.method === 'POST' && req.path.includes('kill-switch')) {
                auth.logAuditEvent('STATE_CHANGE', req.admin?.name, req.method, req.path, {
                    previousState: 'unknown',
                    newState: data.success ? 'changed' : 'failed',
                    data: data,
                    ip: req.ip
                });
            }
            
            return originalJson.call(this, data);
        };
        
        next();
    }
    
    /**
     * Obtenir logs d'audit (avec pagination)
     */
    getAuditLogs(options = {}) {
        const { limit = 100, offset = 0, type, user, startTime, endTime } = options;
        
        let filtered = this.auditLog;
        
        // Filtres
        if (type) {
            filtered = filtered.filter(log => log.type === type);
        }
        if (user) {
            filtered = filtered.filter(log => log.user === user);
        }
        if (startTime) {
            filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(startTime));
        }
        if (endTime) {
            filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(endTime));
        }
        
        // Pagination
        const total = filtered.length;
        const paginated = filtered.slice(offset, offset + limit);
        
        return {
            logs: paginated,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        };
    }
    
    /**
     * Générer rapport d'audit
     */
    generateAuditReport(period = '24h') {
        const now = new Date();
        const startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24h ago
        
        const logs = this.getAuditLogs({ startTime: startTime.toISOString() });
        
        const summary = {
            period,
            totalEvents: logs.total,
            byType: {},
            byUser: {},
            securityEvents: 0,
            failedAuthentications: 0
        };
        
        logs.logs.forEach(log => {
            // Compter par type
            summary.byType[log.type] = (summary.byType[log.type] || 0) + 1;
            
            // Compter par utilisateur
            summary.byUser[log.user] = (summary.byUser[log.user] || 0) + 1;
            
            // Compter événements sécurité
            if (log.type === 'SECURITY') {
                summary.securityEvents++;
                if (log.event === 'INVALID_TOKEN' || log.event === 'PERMISSION_DENIED') {
                    summary.failedAuthentications++;
                }
            }
        });
        
        return {
            timestamp: now.toISOString(),
            summary,
            recentLogs: logs.logs.slice(-10), // 10 derniers événements
            recommendations: this.generateSecurityRecommendations(summary)
        };
    }
    
    /**
     * Générer recommandations sécurité
     */
    generateSecurityRecommendations(summary) {
        const recommendations = [];
        
        if (summary.failedAuthentications > 10) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'High number of failed authentications',
                action: 'Review API key management and consider rotating keys'
            });
        }
        
        if (summary.securityEvents > 20) {
            recommendations.push({
                priority: 'MEDIUM',
                issue: 'High security event count',
                action: 'Review IP allowlist and monitoring thresholds'
            });
        }
        
        return recommendations;
    }
}

// Instance globale
const adminAuth = new AdminAuth();
global.adminAuth = adminAuth;

module.exports = AdminAuth;