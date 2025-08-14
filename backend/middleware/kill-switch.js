/**
 * 🔴 KILL-SWITCH ET CANARY RELEASE
 * ===============================
 * 
 * Système de feature flags global avec kill-switch instantané
 */

const fs = require('fs');
const path = require('path');

class KillSwitchSystem {
    
    constructor() {
        this.configPath = path.join(__dirname, '../config/feature-flags.json');
        this.flags = this.loadFlags();
        
        this.watchConfigFile();
        console.log('🚦 Kill-Switch système initialisé');
    }
    
    loadFlags() {
        try {
            if (fs.existsSync(this.configPath)) {
                const content = fs.readFileSync(this.configPath, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            console.error('⚠️ Erreur lecture feature flags:', error.message);
        }
        
        return {
            globalKillSwitch: false,
            features: {
                qualityGates: true,
                corpusGate: true,
                randomization: true,
                visualGeneration: true,
                enhancedRuleEngine: true,
                bulkOperations: true,
                multiLocale: true,
                pedagogy: true
            },
            canary: {
                enabled: false,
                percentage: 10,
                features: {
                    newVisualEngine: false,
                    advancedAnalytics: false,
                    betaUI: false
                }
            },
            emergency: {
                disableUploads: false,
                disablePublishing: false,
                readOnlyMode: false,
                maintenanceMode: false
            }
        };
    }
    
    saveFlags() {
        try {
            const dir = path.dirname(this.configPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(this.configPath, JSON.stringify(this.flags, null, 2));
            console.log('✅ Feature flags sauvegardés');
            return true;
        } catch (error) {
            console.error('❌ Erreur sauvegarde feature flags:', error.message);
            return false;
        }
    }
    
    watchConfigFile() {
        if (fs.existsSync(this.configPath)) {
            fs.watchFile(this.configPath, (curr, prev) => {
                console.log('🔄 Rechargement feature flags détecté');
                this.flags = this.loadFlags();
            });
        }
    }
    
    isEnabled(featureName, userId = null, req = null) {
        if (this.flags.globalKillSwitch) {
            console.log('🔴 GLOBAL KILL SWITCH ACTIVÉ');
            return false;
        }
        
        if (this.flags.emergency?.maintenanceMode) {
            console.log('🚧 Mode maintenance activé');
            return false;
        }
        
        const mainFeature = this.flags.features?.[featureName];
        if (mainFeature === false) {
            return false;
        }
        
        const canaryFeature = this.flags.canary?.features?.[featureName];
        if (canaryFeature !== undefined) {
            return this.isInCanary(userId, req) ? canaryFeature : mainFeature;
        }
        
        return mainFeature !== false;
    }
    
    isInCanary(userId, req) {
        if (!this.flags.canary?.enabled) {
            return false;
        }
        
        if (userId && this.flags.canary.targetUsers?.includes(userId)) {
            return true;
        }
        
        if (userId && this.flags.canary.excludeUsers?.includes(userId)) {
            return false;
        }
        
        const identifier = userId || req?.ip || req?.sessionID || 'anonymous';
        const hash = this.hashString(identifier);
        const percentage = hash % 100;
        
        return percentage < (this.flags.canary.percentage || 10);
    }
    
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    
    emergencyKillSwitch(reason = 'Emergency stop') {
        console.log(`🔴 EMERGENCY KILL SWITCH ACTIVÉ: ${reason}`);
        
        this.flags.globalKillSwitch = true;
        this.flags.emergency.maintenanceMode = true;
        
        this.saveFlags();
        return true;
    }
    
    disableFeature(featureName, reason = 'Disabled by operator') {
        console.log(`🔴 Feature '${featureName}' désactivée: ${reason}`);
        
        if (!this.flags.features) {
            this.flags.features = {};
        }
        
        this.flags.features[featureName] = false;
        this.saveFlags();
        
        return true;
    }
    
    enableReadOnlyMode(reason = 'Read-only mode activated') {
        console.log(`📖 Mode lecture seule activé: ${reason}`);
        
        this.flags.emergency.readOnlyMode = true;
        this.flags.emergency.disableUploads = true;
        this.flags.emergency.disablePublishing = true;
        
        this.saveFlags();
        return true;
    }
    
    configureCanary(config) {
        console.log('🐤 Configuration canary mise à jour:', config);
        
        this.flags.canary = {
            ...this.flags.canary,
            ...config
        };
        
        this.saveFlags();
        return this.flags.canary;
    }
    
    rollbackToStable() {
        console.log('⏪ ROLLBACK vers version stable');
        
        this.flags.canary.enabled = false;
        
        if (this.flags.canary.features) {
            Object.keys(this.flags.canary.features).forEach(feature => {
                this.flags.canary.features[feature] = false;
            });
        }
        
        this.saveFlags();
        return true;
    }
    
    getStatus() {
        const totalUsers = 1000;
        const canaryUsers = this.flags.canary.enabled 
            ? Math.round(totalUsers * (this.flags.canary.percentage / 100))
            : 0;
        
        return {
            timestamp: new Date().toISOString(),
            globalKillSwitch: this.flags.globalKillSwitch,
            maintenanceMode: this.flags.emergency?.maintenanceMode || false,
            readOnlyMode: this.flags.emergency?.readOnlyMode || false,
            canary: {
                enabled: this.flags.canary?.enabled || false,
                percentage: this.flags.canary?.percentage || 0,
                estimatedUsers: canaryUsers,
                targetUsers: this.flags.canary?.targetUsers?.length || 0,
                features: this.flags.canary?.features || {}
            },
            features: this.flags.features || {},
            emergency: this.flags.emergency || {},
            health: this.flags.globalKillSwitch ? 'EMERGENCY' : 'OPERATIONAL'
        };
    }
    
    static checkFeature(featureName) {
        return (req, res, next) => {
            const killSwitch = global.killSwitchSystem;
            if (!killSwitch) {
                return next();
            }
            
            const userId = req.user?.id || req.headers['x-user-id'];
            const enabled = killSwitch.isEnabled(featureName, userId, req);
            
            if (!enabled) {
                console.log(`🚫 Feature '${featureName}' désactivée`);
                return res.status(503).json({
                    error: 'Feature temporarily disabled',
                    feature: featureName,
                    message: 'Cette fonctionnalité est temporairement désactivée'
                });
            }
            
            req.canaryInfo = {
                isCanary: killSwitch.isInCanary(userId, req),
                canaryPercentage: killSwitch.flags.canary?.percentage || 0
            };
            
            next();
        };
    }
}

const killSwitchSystem = new KillSwitchSystem();
global.killSwitchSystem = killSwitchSystem;

module.exports = KillSwitchSystem;