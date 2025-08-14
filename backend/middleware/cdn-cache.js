/**
 * 🌐 CDN INVALIDATION & CACHE COHERENCE
 * ====================================
 * 
 * Système de gestion du cache CDN avec invalidation coordonnée
 * pour les releases canary et déploiements bleu-vert.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class CDNCacheManager {
    
    constructor() {
        this.config = {
            // Configuration CDN (CloudFront, CloudFlare, etc.)
            cdnProvider: process.env.CDN_PROVIDER || 'mock',
            distributionId: process.env.CDN_DISTRIBUTION_ID,
            apiKey: process.env.CDN_API_KEY,
            apiSecret: process.env.CDN_API_SECRET,
            
            // Stratégies de cache
            cacheStrategies: {
                static: { ttl: 31536000, staleWhileRevalidate: 86400 }, // 1 an
                api: { ttl: 300, staleWhileRevalidate: 60 },            // 5 min
                questions: { ttl: 3600, staleWhileRevalidate: 300 },    // 1h
                images: { ttl: 604800, staleWhileRevalidate: 3600 },    // 1 semaine
                canary: { ttl: 60, staleWhileRevalidate: 30 }           // 1 min (canary)
            },
            
            // Patterns d'invalidation
            invalidationPatterns: {
                fullDeploy: ['/*'],
                canaryDeploy: ['/api/questions/*', '/static/js/canary/*'],
                hotfix: ['/api/*'],
                assets: ['/static/*', '/images/*']
            }
        };
        
        this.invalidationHistory = [];
        this.cacheVersions = new Map();
        this.canaryCache = new Map();
        
        this.initializeCacheVersioning();
        console.log('🌐 CDN Cache Manager initialisé');
    }
    
    /**
     * Initialiser le versioning du cache
     */
    initializeCacheVersioning() {
        // Générer version de cache basée sur timestamp + hash
        const timestamp = Date.now();
        const hash = crypto.randomBytes(8).toString('hex');
        this.currentVersion = `${timestamp}-${hash}`;
        
        // Charger les versions existantes
        this.loadCacheVersions();
        
        console.log(`📦 Cache version: ${this.currentVersion}`);
    }
    
    /**
     * Charger les versions de cache depuis le fichier
     */
    loadCacheVersions() {
        const versionsFile = path.join(__dirname, '../config/cache-versions.json');
        
        try {
            if (fs.existsSync(versionsFile)) {
                const versions = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));
                Object.entries(versions).forEach(([key, value]) => {
                    this.cacheVersions.set(key, value);
                });
            }
        } catch (error) {
            console.warn('⚠️ Erreur chargement versions cache:', error.message);
        }
    }
    
    /**
     * Sauvegarder les versions de cache
     */
    saveCacheVersions() {
        const versionsFile = path.join(__dirname, '../config/cache-versions.json');
        const versionsObj = Object.fromEntries(this.cacheVersions);
        
        try {
            const dir = path.dirname(versionsFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(versionsFile, JSON.stringify(versionsObj, null, 2));
            console.log('💾 Versions cache sauvegardées');
        } catch (error) {
            console.error('❌ Erreur sauvegarde versions:', error.message);
        }
    }
    
    /**
     * Invalider le cache CDN
     */
    async invalidateCache(patterns, reason = 'Manual invalidation', deploymentType = 'standard') {
        const invalidationId = crypto.randomBytes(16).toString('hex');
        
        console.log(`🔄 Invalidation CDN [${invalidationId}]: ${reason}`);
        console.log(`   Patterns: ${patterns.join(', ')}`);
        console.log(`   Type: ${deploymentType}`);
        
        const invalidation = {
            id: invalidationId,
            timestamp: new Date().toISOString(),
            patterns: [...patterns],
            reason,
            deploymentType,
            status: 'pending',
            provider: this.config.cdnProvider
        };
        
        try {
            // Invalider selon le provider
            switch (this.config.cdnProvider) {
                case 'cloudfront':
                    await this.invalidateCloudFront(patterns, invalidationId);
                    break;
                case 'cloudflare':
                    await this.invalidateCloudFlare(patterns, invalidationId);
                    break;
                case 'mock':
                    await this.mockInvalidation(patterns, invalidationId);
                    break;
                default:
                    throw new Error(`Provider CDN non supporté: ${this.config.cdnProvider}`);
            }
            
            invalidation.status = 'completed';
            invalidation.completedAt = new Date().toISOString();
            
            console.log(`✅ Invalidation CDN terminée [${invalidationId}]`);
            
        } catch (error) {
            invalidation.status = 'failed';
            invalidation.error = error.message;
            invalidation.failedAt = new Date().toISOString();
            
            console.error(`❌ Erreur invalidation CDN [${invalidationId}]:`, error.message);
        }
        
        // Enregistrer dans l'historique
        this.invalidationHistory.push(invalidation);
        if (this.invalidationHistory.length > 100) {
            this.invalidationHistory = this.invalidationHistory.slice(-100);
        }
        
        // Notifier le système de monitoring
        if (global.monitoringSystem) {
            global.monitoringSystem.emit('cdn_invalidation', invalidation);
        }
        
        return invalidation;
    }
    
    /**
     * Invalidation CloudFront
     */
    async invalidateCloudFront(patterns, invalidationId) {
        if (!this.config.distributionId) {
            throw new Error('CloudFront Distribution ID manquant');
        }
        
        // Simulation de l'appel AWS CloudFront
        console.log(`☁️ CloudFront invalidation: ${this.config.distributionId}`);
        
        // En production, utiliser AWS SDK :
        /*
        const AWS = require('aws-sdk');
        const cloudfront = new AWS.CloudFront({
            accessKeyId: this.config.apiKey,
            secretAccessKey: this.config.apiSecret
        });
        
        const params = {
            DistributionId: this.config.distributionId,
            InvalidationBatch: {
                CallerReference: invalidationId,
                Paths: {
                    Quantity: patterns.length,
                    Items: patterns
                }
            }
        };
        
        const result = await cloudfront.createInvalidation(params).promise();
        console.log('CloudFront invalidation created:', result.Invalidation.Id);
        */
        
        // Simulation
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('☁️ CloudFront invalidation simulée');
    }
    
    /**
     * Invalidation Cloudflare
     */
    async invalidateCloudFlare(patterns, invalidationId) {
        console.log(`🔥 Cloudflare purge: ${patterns.length} patterns`);
        
        // En production, utiliser Cloudflare API :
        /*
        const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/purge_cache`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: patterns
            })
        });
        */
        
        // Simulation
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('🔥 Cloudflare purge simulé');
    }
    
    /**
     * Mock invalidation pour développement
     */
    async mockInvalidation(patterns, invalidationId) {
        console.log(`🎭 Mock invalidation: ${patterns.length} patterns`);
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('🎭 Mock invalidation terminée');
    }
    
    /**
     * Gestion du cache canary
     */
    setupCanaryCache(canaryConfig) {
        const { percentage, features, version } = canaryConfig;
        
        console.log(`🐤 Configuration cache canary: ${percentage}% - version ${version}`);
        
        // Créer une version de cache spécifique au canary
        const canaryVersion = `${version}-canary-${percentage}`;
        this.cacheVersions.set('canary', canaryVersion);
        
        // Configuration headers cache pour canary
        this.canaryCache.set('headers', {
            'Cache-Control': `public, max-age=${this.config.cacheStrategies.canary.ttl}, stale-while-revalidate=${this.config.cacheStrategies.canary.staleWhileRevalidate}`,
            'X-Cache-Version': canaryVersion,
            'X-Canary-Percentage': percentage.toString(),
            'Vary': 'X-User-Group, X-Canary-Flag'
        });
        
        // Invalider le cache canary précédent
        const canaryPatterns = [
            '/api/questions/canary/*',
            '/static/js/canary/*',
            '/api/monitoring/canary'
        ];
        
        this.invalidateCache(canaryPatterns, `Canary setup: ${percentage}%`, 'canary');
        
        this.saveCacheVersions();
        return canaryVersion;
    }
    
    /**
     * Middleware de gestion des headers de cache
     */
    static cacheHeaders() {
        return (req, res, next) => {
            const cacheManager = global.cdnCacheManager || new CDNCacheManager();
            const killSwitch = global.killSwitchSystem;
            
            // Déterminer le type de contenu
            const isStatic = req.path.includes('/static/');
            const isAPI = req.path.includes('/api/');
            const isImages = req.path.includes('/images/');
            const isCanary = killSwitch?.isInCanary(req.user?.id, req);
            
            let strategy = 'api';
            if (isStatic) strategy = 'static';
            else if (isImages) strategy = 'images';
            else if (req.path.includes('/questions')) strategy = 'questions';
            
            // Utiliser cache canary si utilisateur est dans le canary
            if (isCanary) {
                strategy = 'canary';
                const canaryHeaders = cacheManager.canaryCache.get('headers');
                if (canaryHeaders) {
                    Object.entries(canaryHeaders).forEach(([key, value]) => {
                        res.setHeader(key, value);
                    });
                }
            } else {
                // Headers de cache standard
                const cacheConfig = cacheManager.config.cacheStrategies[strategy];
                res.setHeader('Cache-Control', 
                    `public, max-age=${cacheConfig.ttl}, stale-while-revalidate=${cacheConfig.staleWhileRevalidate}`
                );
            }
            
            // Headers communs
            res.setHeader('X-Cache-Version', cacheManager.currentVersion);
            res.setHeader('X-Cache-Strategy', strategy);
            
            if (isCanary) {
                res.setHeader('X-Canary-User', 'true');
            }
            
            next();
        };
    }
    
    /**
     * Invalidation coordonnée pour déploiement
     */
    async coordinatedInvalidation(deploymentType, options = {}) {
        const { 
            version, 
            rollbackVersion, 
            waitForPropagation = true,
            validateAfter = true 
        } = options;
        
        console.log(`🎯 Invalidation coordonnée: ${deploymentType}`);
        
        const patterns = this.config.invalidationPatterns[deploymentType] || ['/*'];
        
        // Phase 1: Pre-invalidation
        await this.preInvalidationChecks(deploymentType);
        
        // Phase 2: Invalidation principale
        const invalidation = await this.invalidateCache(
            patterns, 
            `Deployment: ${deploymentType}`,
            deploymentType
        );
        
        // Phase 3: Attendre propagation
        if (waitForPropagation) {
            await this.waitForPropagation(invalidation.id);
        }
        
        // Phase 4: Validation post-invalidation
        if (validateAfter) {
            const validation = await this.validateCacheInvalidation(patterns);
            invalidation.validation = validation;
        }
        
        // Phase 5: Mise à jour versions
        if (version) {
            this.cacheVersions.set('production', version);
            if (rollbackVersion) {
                this.cacheVersions.set('rollback', rollbackVersion);
            }
            this.saveCacheVersions();
        }
        
        return invalidation;
    }
    
    /**
     * Vérifications pré-invalidation
     */
    async preInvalidationChecks(deploymentType) {
        console.log('🔍 Vérifications pré-invalidation...');
        
        // Vérifier que le CDN est accessible
        const healthCheck = await this.checkCDNHealth();
        if (!healthCheck.healthy) {
            throw new Error(`CDN non accessible: ${healthCheck.error}`);
        }
        
        // Vérifier les ressources critiques
        if (deploymentType === 'fullDeploy') {
            const criticalResources = await this.checkCriticalResources();
            if (!criticalResources.available) {
                throw new Error('Ressources critiques non disponibles');
            }
        }
        
        console.log('✅ Vérifications pré-invalidation OK');
    }
    
    /**
     * Attendre la propagation CDN
     */
    async waitForPropagation(invalidationId) {
        console.log(`⏳ Attente propagation CDN [${invalidationId}]...`);
        
        const maxWait = 300000; // 5 minutes
        const interval = 10000;  // 10 secondes
        let waited = 0;
        
        while (waited < maxWait) {
            const status = await this.checkInvalidationStatus(invalidationId);
            
            if (status === 'completed') {
                console.log(`✅ Propagation CDN terminée [${invalidationId}]`);
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, interval));
            waited += interval;
        }
        
        console.warn(`⚠️ Timeout propagation CDN [${invalidationId}]`);
        return false;
    }
    
    /**
     * Valider l'invalidation du cache
     */
    async validateCacheInvalidation(patterns) {
        console.log('✅ Validation invalidation cache...');
        
        const validation = {
            timestamp: new Date().toISOString(),
            patterns: [...patterns],
            results: [],
            success: true
        };
        
        // Tester quelques URLs représentatives
        const testUrls = [
            '/api/questions/sample',
            '/static/js/main.js',
            '/images/logo.png'
        ];
        
        for (const url of testUrls) {
            try {
                const result = await this.testCacheInvalidation(url);
                validation.results.push(result);
                
                if (!result.invalidated) {
                    validation.success = false;
                }
            } catch (error) {
                validation.results.push({
                    url,
                    invalidated: false,
                    error: error.message
                });
                validation.success = false;
            }
        }
        
        console.log(`✅ Validation cache: ${validation.success ? 'OK' : 'FAILED'}`);
        return validation;
    }
    
    /**
     * Tester l'invalidation d'une URL spécifique
     */
    async testCacheInvalidation(url) {
        // Simulation de test d'invalidation
        // En production, faire des requêtes HTTP avec headers cache
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
            url,
            invalidated: true, // 100% de succès pour les tests
            timestamp: new Date().toISOString(),
            cacheHeaders: {
                'x-cache': 'MISS',
                'x-cache-version': this.currentVersion
            }
        };
    }
    
    /**
     * Vérifier la santé du CDN
     */
    async checkCDNHealth() {
        // Simulation de health check
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return {
            healthy: true,
            provider: this.config.cdnProvider,
            timestamp: new Date().toISOString(),
            responseTime: Math.floor(Math.random() * 50) + 10
        };
    }
    
    /**
     * Vérifier les ressources critiques
     */
    async checkCriticalResources() {
        const criticalPaths = [
            '/api/health',
            '/static/js/main.js',
            '/static/css/main.css'
        ];
        
        // Simulation
        await new Promise(resolve => setTimeout(resolve, 200));
        
        return {
            available: true,
            paths: criticalPaths,
            timestamp: new Date().toISOString()
        };
    }
    
    /**
     * Vérifier le statut d'une invalidation
     */
    async checkInvalidationStatus(invalidationId) {
        // Simulation - en production, interroger l'API CDN
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 80% de chances que l'invalidation soit terminée après quelques secondes
        return Math.random() > 0.2 ? 'completed' : 'in-progress';
    }
    
    /**
     * Obtenir le statut du cache
     */
    getCacheStatus() {
        return {
            timestamp: new Date().toISOString(),
            currentVersion: this.currentVersion,
            versions: Object.fromEntries(this.cacheVersions),
            canaryConfig: {
                enabled: this.canaryCache.size > 0,
                headers: Object.fromEntries(this.canaryCache)
            },
            recentInvalidations: this.invalidationHistory.slice(-10),
            provider: this.config.cdnProvider,
            strategies: this.config.cacheStrategies
        };
    }
    
    /**
     * Rollback de cache
     */
    async rollbackCache(targetVersion) {
        console.log(`⏪ Rollback cache vers version: ${targetVersion}`);
        
        const rollbackInvalidation = await this.coordinatedInvalidation('fullDeploy', {
            version: targetVersion,
            validateAfter: true
        });
        
        this.currentVersion = targetVersion;
        this.cacheVersions.set('production', targetVersion);
        this.saveCacheVersions();
        
        console.log(`✅ Rollback cache terminé: ${targetVersion}`);
        return rollbackInvalidation;
    }
}

const cdnCacheManager = new CDNCacheManager();
global.cdnCacheManager = cdnCacheManager;

module.exports = CDNCacheManager;