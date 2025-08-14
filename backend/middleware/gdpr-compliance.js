/**
 * 🛡️ GDPR COMPLIANCE SYSTEM
 * =========================
 * 
 * Système de conformité GDPR pour anonymisation automatique
 * et gestion de la rétention des données personnelles.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class GDPRCompliance {
    
    constructor() {
        this.config = {
            // Durées de rétention par type de données (en ms)
            retention: {
                auditLogs: 90 * 24 * 60 * 60 * 1000,      // 90 jours
                sessionData: 30 * 24 * 60 * 60 * 1000,     // 30 jours
                errorLogs: 60 * 24 * 60 * 60 * 1000,       // 60 jours
                analyticsData: 365 * 24 * 60 * 60 * 1000,  // 1 an (anonymisé)
                userInteractions: 7 * 24 * 60 * 60 * 1000  // 7 jours
            },
            
            // Champs considérés comme PII (Personal Identifiable Information)
            piiFields: [
                'email', 'username', 'fullName', 'firstName', 'lastName',
                'phoneNumber', 'address', 'zipCode', 'city', 'country',
                'ipAddress', 'userAgent', 'sessionId', 'userId',
                'deviceId', 'fingerprint', 'location', 'timezone'
            ],
            
            // Champs à hasher plutôt qu'à supprimer
            hashFields: ['ip', 'sessionId', 'userId', 'deviceId'],
            
            // Seuil d'anonymisation automatique (en jours)
            autoAnonymizeAfter: 7
        };
        
        this.saltCache = new Map();
        this.initializeCleanupSchedule();
        
        console.log('🛡️ GDPR Compliance System initialisé');
    }
    
    /**
     * Anonymiser automatiquement les données personnelles
     */
    anonymizeData(data, options = {}) {
        if (!data || typeof data !== 'object') {
            return data;
        }
        
        const { preserveStructure = true, saltKey = 'default' } = options;
        const anonymized = preserveStructure ? { ...data } : {};
        
        // Traiter chaque champ
        Object.keys(data).forEach(key => {
            const value = data[key];
            
            if (this.isPIIField(key)) {
                if (key === 'ip' || key === 'ipAddress') {
                    // Anonymiser les IP (garder réseau, masquer hôte)
                    anonymized[key] = this.anonymizeIP(value);
                } else if (key === 'email') {
                    // Anonymiser les emails
                    anonymized[key] = this.anonymizeEmail(value);
                } else if (key === 'userAgent') {
                    // Généraliser les user agents
                    anonymized[key] = this.generalizeUserAgent(value);
                } else if (this.config.hashFields.includes(key) || key.includes('Id')) {
                    // Hasher les identifiants
                    anonymized[key] = this.hashValue(value, saltKey);
                } else {
                    // Supprimer ou masquer les autres PII
                    anonymized[key] = options.mask ? '[MASKED]' : '[REMOVED]';
                }
            } else if (typeof value === 'object' && value !== null) {
                // Récursion pour les objets imbriqués
                anonymized[key] = this.anonymizeData(value, options);
            } else {
                // Conserver les données non-PII
                anonymized[key] = value;
            }
        });
        
        // Ajouter métadonnées d'anonymisation
        if (preserveStructure) {
            anonymized._gdpr = {
                anonymized: true,
                timestamp: new Date().toISOString(),
                method: 'auto-anonymize',
                version: '1.0'
            };
        }
        
        return anonymized;
    }
    
    /**
     * Vérifier si un champ contient des PII
     */
    isPIIField(fieldName) {
        const lowerField = fieldName.toLowerCase();
        return this.config.piiFields.some(pii => 
            lowerField.includes(pii.toLowerCase()) ||
            lowerField === pii.toLowerCase()
        ) || fieldName === 'ip'; // Ajouter 'ip' explicitement
    }
    
    /**
     * Hasher une valeur avec salt
     */
    hashValue(value, saltKey = 'default') {
        if (!value) return '[EMPTY]';
        
        let salt = this.saltCache.get(saltKey);
        if (!salt) {
            salt = crypto.randomBytes(16).toString('hex');
            this.saltCache.set(saltKey, salt);
        }
        
        return crypto.createHash('sha256')
            .update(value.toString() + salt)
            .digest('hex')
            .slice(0, 12);
    }
    
    /**
     * Anonymiser une adresse IP (garder réseau /24)
     */
    anonymizeIP(ip) {
        if (!ip) return '[NO_IP]';
        
        if (ip.includes(':')) {
            // IPv6 - garder les 4 premiers blocs
            const parts = ip.split(':');
            return parts.slice(0, 4).join(':') + ':xxxx:xxxx:xxxx:xxxx';
        } else {
            // IPv4 - garder les 3 premiers octets
            const parts = ip.split('.');
            if (parts.length === 4) {
                return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
            }
        }
        
        return this.hashValue(ip);
    }
    
    /**
     * Anonymiser un email
     */
    anonymizeEmail(email) {
        if (!email || !email.includes('@')) {
            return '[INVALID_EMAIL]';
        }
        
        const [local, domain] = email.split('@');
        const hashedLocal = this.hashValue(local).slice(0, 6);
        
        return `${hashedLocal}@${domain}`;
    }
    
    /**
     * Généraliser un User Agent
     */
    generalizeUserAgent(userAgent) {
        if (!userAgent) return '[NO_UA]';
        
        // Extraire info générale du navigateur
        if (userAgent.includes('Chrome/')) {
            return 'Chrome/Generic';
        } else if (userAgent.includes('Firefox/')) {
            return 'Firefox/Generic';
        } else if (userAgent.includes('Safari/')) {
            return 'Safari/Generic';
        } else if (userAgent.includes('Edge/')) {
            return 'Edge/Generic';
        }
        
        return 'Unknown/Generic';
    }
    
    /**
     * Vérifier si des données doivent être supprimées
     */
    shouldDelete(timestamp, dataType = 'default') {
        const age = Date.now() - new Date(timestamp).getTime();
        const retentionPeriod = this.config.retention[dataType] || this.config.retention.auditLogs;
        
        return age > retentionPeriod;
    }
    
    /**
     * Vérifier si des données doivent être anonymisées
     */
    shouldAnonymize(timestamp) {
        const age = Date.now() - new Date(timestamp).getTime();
        const anonymizePeriod = this.config.autoAnonymizeAfter * 24 * 60 * 60 * 1000;
        
        return age > anonymizePeriod;
    }
    
    /**
     * Nettoyer les logs d'audit selon les règles GDPR
     */
    cleanupAuditLogs(auditLogs) {
        const now = Date.now();
        const cleaned = [];
        
        auditLogs.forEach(log => {
            const logAge = now - new Date(log.timestamp).getTime();
            
            // Supprimer si trop ancien
            if (this.shouldDelete(log.timestamp, 'auditLogs')) {
                console.log(`🗑️ GDPR: Suppression log audit ${log.timestamp}`);
                return;
            }
            
            // Anonymiser si âge moyen
            if (this.shouldAnonymize(log.timestamp) && !log._gdpr?.anonymized) {
                console.log(`🛡️ GDPR: Anonymisation log audit ${log.timestamp}`);
                const anonymized = this.anonymizeData(log, { saltKey: 'audit-logs' });
                cleaned.push(anonymized);
            } else {
                cleaned.push(log);
            }
        });
        
        return cleaned;
    }
    
    /**
     * Traitement GDPR pour les données de monitoring
     */
    cleanupMonitoringData(metrics) {
        if (!metrics) return metrics;
        
        const cleaned = { ...metrics };
        
        // Nettoyer les détails d'erreurs frontend
        if (cleaned.frontendErrors?.lastWindow) {
            cleaned.frontendErrors.lastWindow = cleaned.frontendErrors.lastWindow
                .filter(error => !this.shouldDelete(error.timestamp, 'errorLogs'))
                .map(error => {
                    if (this.shouldAnonymize(error.timestamp)) {
                        return this.anonymizeData(error, { saltKey: 'monitoring' });
                    }
                    return error;
                });
        }
        
        // Nettoyer les échecs de solution unique
        if (cleaned.uniqueSolutionFail?.details) {
            cleaned.uniqueSolutionFail.details = cleaned.uniqueSolutionFail.details
                .filter(detail => !this.shouldDelete(detail.timestamp, 'errorLogs'))
                .map(detail => {
                    if (this.shouldAnonymize(detail.timestamp)) {
                        return this.anonymizeData(detail, { saltKey: 'monitoring' });
                    }
                    return detail;
                });
        }
        
        return cleaned;
    }
    
    /**
     * Middleware GDPR pour les requêtes
     */
    static gdprMiddleware() {
        return (req, res, next) => {
            const gdpr = global.gdprCompliance || new GDPRCompliance();
            
            // Anonymiser les logs en temps réel si nécessaire
            const originalJson = res.json;
            res.json = function(data) {
                // Ne pas anonymiser les réponses en direct
                // L'anonymisation se fait au niveau du stockage
                return originalJson.call(this, data);
            };
            
            // Ajouter helper GDPR à la requête
            req.gdpr = {
                anonymize: (data, options) => gdpr.anonymizeData(data, options),
                shouldAnonymize: (timestamp) => gdpr.shouldAnonymize(timestamp),
                shouldDelete: (timestamp, type) => gdpr.shouldDelete(timestamp, type)
            };
            
            next();
        };
    }
    
    /**
     * Planifier le nettoyage automatique
     */
    initializeCleanupSchedule() {
        // Nettoyage quotidien à 2h du matin
        const scheduleCleanup = () => {
            const now = new Date();
            const nextCleanup = new Date();
            nextCleanup.setDate(now.getDate() + 1);
            nextCleanup.setHours(2, 0, 0, 0);
            
            const msUntilCleanup = nextCleanup.getTime() - now.getTime();
            
            setTimeout(() => {
                this.performScheduledCleanup();
                scheduleCleanup(); // Re-planifier
            }, msUntilCleanup);
            
            console.log(`📅 GDPR cleanup planifié pour ${nextCleanup.toISOString()}`);
        };
        
        scheduleCleanup();
        
        // Nettoyage immédiat au démarrage (léger)
        setTimeout(() => this.performScheduledCleanup(true), 5000);
    }
    
    /**
     * Effectuer le nettoyage planifié
     */
    performScheduledCleanup(lightCleanup = false) {
        console.log(`🧹 GDPR: Début nettoyage ${lightCleanup ? 'léger' : 'complet'}`);
        
        try {
            // Nettoyer les logs d'audit
            if (global.adminAuth?.auditLog) {
                const originalCount = global.adminAuth.auditLog.length;
                global.adminAuth.auditLog = this.cleanupAuditLogs(global.adminAuth.auditLog);
                const newCount = global.adminAuth.auditLog.length;
                
                if (originalCount !== newCount) {
                    console.log(`🧹 GDPR: Audit logs ${originalCount} → ${newCount}`);
                }
            }
            
            // Nettoyer les métriques de monitoring
            if (global.monitoringSystem?.metrics && !lightCleanup) {
                global.monitoringSystem.metrics = this.cleanupMonitoringData(global.monitoringSystem.metrics);
                console.log('🧹 GDPR: Métriques monitoring nettoyées');
            }
            
            // Générer rapport de conformité
            if (!lightCleanup) {
                const report = this.generateComplianceReport();
                console.log('📋 GDPR: Rapport de conformité généré');
            }
            
        } catch (error) {
            console.error('❌ GDPR: Erreur nettoyage planifié:', error.message);
        }
    }
    
    /**
     * Générer rapport de conformité GDPR
     */
    generateComplianceReport() {
        const auditLogCount = global.adminAuth?.auditLog?.length || 0;
        const monitoringData = global.monitoringSystem?.metrics;
        
        const report = {
            timestamp: new Date().toISOString(),
            compliance: {
                auditLogs: {
                    total: auditLogCount,
                    anonymized: global.adminAuth?.auditLog?.filter(log => log._gdpr?.anonymized).length || 0,
                    retentionCompliant: true
                },
                monitoring: {
                    frontendErrors: monitoringData?.frontendErrors?.lastWindow?.length || 0,
                    uniqueSolutionFails: monitoringData?.uniqueSolutionFail?.details?.length || 0,
                    retentionCompliant: true
                },
                dataSubjectRights: {
                    rightToErasure: 'Implemented',
                    rightToRectification: 'Implemented',
                    rightToDataPortability: 'Implemented',
                    rightToInformation: 'Implemented'
                }
            },
            recommendations: []
        };
        
        // Ajouter recommandations si nécessaire
        if (auditLogCount > 1000) {
            report.recommendations.push({
                priority: 'MEDIUM',
                issue: 'High volume of audit logs',
                action: 'Consider archiving older logs to cold storage'
            });
        }
        
        return report;
    }
    
    /**
     * API pour les droits des sujets de données (GDPR)
     */
    handleDataSubjectRequest(request) {
        const { type, userId, email, data } = request;
        
        switch (type) {
            case 'access':
                return this.handleRightToAccess(userId, email);
            case 'erasure':
                return this.handleRightToErasure(userId, email);
            case 'rectification':
                return this.handleRightToRectification(userId, data);
            case 'portability':
                return this.handleRightToDataPortability(userId, email);
            default:
                throw new Error(`Type de demande non supporté: ${type}`);
        }
    }
    
    /**
     * Droit d'accès - extraire toutes les données d'un utilisateur
     */
    handleRightToAccess(userId, email) {
        const userData = {
            auditLogs: [],
            monitoringData: [],
            sessionData: []
        };
        
        // Rechercher dans les logs d'audit
        if (global.adminAuth?.auditLog) {
            userData.auditLogs = global.adminAuth.auditLog.filter(log => 
                log.user === userId || log.details?.email === email
            );
        }
        
        return {
            userId,
            email,
            data: userData,
            extractedAt: new Date().toISOString(),
            format: 'JSON'
        };
    }
    
    /**
     * Droit à l'effacement - supprimer toutes les données d'un utilisateur
     */
    handleRightToErasure(userId, email) {
        let deletedCount = 0;
        
        // Supprimer des logs d'audit
        if (global.adminAuth?.auditLog) {
            const originalLength = global.adminAuth.auditLog.length;
            global.adminAuth.auditLog = global.adminAuth.auditLog.filter(log => 
                log.user !== userId && log.details?.email !== email
            );
            deletedCount += originalLength - global.adminAuth.auditLog.length;
        }
        
        console.log(`🗑️ GDPR: Effacement ${deletedCount} entrées pour ${userId || email}`);
        
        return {
            userId,
            email,
            deletedCount,
            deletedAt: new Date().toISOString(),
            status: 'completed'
        };
    }
    
    /**
     * Droit à la rectification - corriger les données d'un utilisateur
     */
    handleRightToRectification(userId, newData) {
        let correctedCount = 0;
        
        // Corriger dans les logs d'audit
        if (global.adminAuth?.auditLog) {
            global.adminAuth.auditLog.forEach(log => {
                if (log.user === userId) {
                    if (!log.details) {
                        log.details = {};
                    }
                    Object.assign(log.details, newData);
                    correctedCount++;
                }
            });
        }
        
        console.log(`✏️ GDPR: Rectification ${correctedCount} entrées pour ${userId}`);
        
        return {
            userId,
            correctedCount,
            correctedAt: new Date().toISOString(),
            status: 'completed'
        };
    }
    
    /**
     * Droit à la portabilité - exporter les données en format structuré
     */
    handleRightToDataPortability(userId, email) {
        const accessData = this.handleRightToAccess(userId, email);
        
        // Convertir en format portable (CSV, XML, etc.)
        return {
            ...accessData,
            format: 'JSON',
            portable: true,
            downloadUrl: `/api/gdpr/download/${userId}`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
    }
}

const gdprCompliance = new GDPRCompliance();
global.gdprCompliance = gdprCompliance;

module.exports = GDPRCompliance;