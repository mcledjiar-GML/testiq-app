/**
 * 🔧 CANONICALISATION - BUNDLE HASH STABLE
 * =========================================
 * 
 * Utilitaires pour générer des hash stables et canoniques,
 * indépendants de l'ordre de sérialisation JSON.
 */

const crypto = require('crypto');

class Canonicalizer {
    
    /**
     * Canonicaliser un objet JSON (ordre de clés stable)
     */
    static canonicalizeJSON(obj) {
        if (obj === null || obj === undefined) {
            return obj;
        }
        
        if (typeof obj !== 'object') {
            return obj;
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.canonicalizeJSON(item));
        }
        
        // Trier les clés et créer un nouvel objet
        const sortedKeys = Object.keys(obj).sort();
        const canonical = {};
        
        for (const key of sortedKeys) {
            canonical[key] = this.canonicalizeJSON(obj[key]);
        }
        
        return canonical;
    }
    
    /**
     * Sérialiser de manière déterministe
     */
    static deterministicStringify(obj) {
        const canonical = this.canonicalizeJSON(obj);
        return JSON.stringify(canonical);
    }
    
    /**
     * Calculer le bundle hash canonique d'une question
     */
    static calculateCanonicalBundleHash(question) {
        // 1. Extraire les champs essentiels (sans volatils)
        const essentialFields = {
            // Contenu principal
            content: question.content || '',
            stimulus: question.stimulus || '',
            type: question.type || '',
            alphabet: question.alphabet || '',
            
            // Payload trié
            payload: this.canonicalizePayload(question),
            
            // Options canoniques (ordre de clés stable)
            options: this.canonicalizeOptions(question.options || []),
            
            // Assets minifiés (hash seulement)
            assetHashes: this.canonicalizeAssetHashes(question.assets || [])
        };
        
        // 2. Sérialisation déterministe
        const canonicalString = this.deterministicStringify(essentialFields);
        
        // 3. Hash SHA256
        return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
    }
    
    /**
     * Canonicaliser le payload d'une question
     */
    static canonicalizePayload(question) {
        const payload = {};
        
        // Ajouter les champs métier dans un ordre stable
        if (question.series) payload.series = question.series;
        if (question.difficulty !== undefined) payload.difficulty = question.difficulty;
        if (question.category) payload.category = question.category;
        if (question.timeLimit !== undefined) payload.timeLimit = question.timeLimit;
        
        // Règles triées
        if (question.rules && Array.isArray(question.rules)) {
            payload.rules = question.rules
                .map(rule => this.canonicalizeJSON(rule))
                .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
        }
        
        // Visual pattern
        if (question.visualPattern) payload.visualPattern = question.visualPattern;
        
        return payload;
    }
    
    /**
     * Canonicaliser les options
     */
    static canonicalizeOptions(options) {
        if (!Array.isArray(options)) return [];
        
        return options.map(option => {
            if (typeof option === 'string') {
                return { key: '', text: option, isCorrect: false };
            }
            
            // Ordre canonique des propriétés d'option
            const canonicalOption = {};
            
            if (option.key !== undefined) canonicalOption.key = option.key;
            if (option.text !== undefined) canonicalOption.text = option.text;
            if (option.alt !== undefined) canonicalOption.alt = option.alt;
            if (option.isCorrect !== undefined) canonicalOption.isCorrect = Boolean(option.isCorrect);
            
            // Métadonnées triées
            if (option.metadata) {
                canonicalOption.metadata = this.canonicalizeJSON(option.metadata);
            }
            
            return canonicalOption;
        }).sort((a, b) => {
            // Trier par clé pour assurer l'ordre stable
            return (a.key || '').localeCompare(b.key || '');
        });
    }
    
    /**
     * Canonicaliser les hash d'assets
     */
    static canonicalizeAssetHashes(assets) {
        if (!Array.isArray(assets)) return [];
        
        return assets.map(asset => {
            const canonical = {
                type: asset.type || '',
                slot: asset.slot || '',
                locale: asset.locale || 'fr'
            };
            
            // Utiliser le hash original si disponible (avant minification)
            if (asset.originalHash) {
                canonical.hash = asset.originalHash;
            } else if (asset.hash) {
                canonical.hash = asset.hash;
            }
            
            // Inclure la minification dans le hash si applicable
            if (asset.minified && asset.mimeType === 'image/svg+xml') {
                canonical.minified = true;
            }
            
            return canonical;
        }).sort((a, b) => {
            // Trier par type, slot, locale
            const aKey = `${a.type}:${a.slot}:${a.locale}`;
            const bKey = `${b.type}:${b.slot}:${b.locale}`;
            return aKey.localeCompare(bKey);
        });
    }
    
    /**
     * Minifier un SVG (enlever espaces, commentaires, etc.)
     */
    static minifySVG(svgContent) {
        if (!svgContent || typeof svgContent !== 'string') {
            return svgContent;
        }
        
        return svgContent
            // Supprimer les commentaires XML
            .replace(/<!--[\s\S]*?-->/g, '')
            // Supprimer les déclarations XML
            .replace(/<\?xml[^>]*\?>/g, '')
            // Supprimer les espaces multiples
            .replace(/\s+/g, ' ')
            // Supprimer les espaces avant/après les balises
            .replace(/>\s+</g, '><')
            // Supprimer les espaces en début/fin
            .trim()
            // Supprimer les attributs de style inline dangereux
            .replace(/\s*style\s*=\s*["'][^"']*["']/gi, '')
            // Supprimer les scripts inline
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    }
    
    /**
     * Calculer le hash d'un SVG minifié
     */
    static calculateMinifiedSVGHash(svgContent) {
        const minified = this.minifySVG(svgContent);
        return crypto.createHash('sha256').update(minified, 'utf8').digest('hex');
    }
    
    /**
     * Valider la cohérence d'un bundle hash
     */
    static validateBundleHash(question) {
        const errors = [];
        
        // Recalculer le hash canonique
        const calculatedHash = this.calculateCanonicalBundleHash(question);
        
        if (!question.bundleHash) {
            errors.push('Bundle hash manquant');
        } else if (question.bundleHash !== calculatedHash) {
            errors.push(
                `Bundle hash incohérent: ` +
                `stocké=${question.bundleHash.substring(0, 8)}..., ` +
                `calculé=${calculatedHash.substring(0, 8)}...`
            );
        }
        
        // Vérifier les hash d'assets
        if (question.assets) {
            for (const asset of question.assets) {
                if (!asset.hash) {
                    errors.push(`Asset ${asset.type}:${asset.slot} sans hash`);
                }
                
                // Vérifier la cohérence originalHash vs hash
                if (asset.originalHash && asset.minified && asset.hash !== asset.originalHash) {
                    // C'est normal, le hash a changé après minification
                } else if (asset.originalHash && !asset.minified && asset.hash !== asset.originalHash) {
                    errors.push(`Asset ${asset.type}:${asset.slot} hash incohérent avec originalHash`);
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors,
            calculatedHash
        };
    }
    
    /**
     * Comparer deux versions d'une question
     */
    static compareQuestionVersions(questionV1, questionV2) {
        const hashV1 = this.calculateCanonicalBundleHash(questionV1);
        const hashV2 = this.calculateCanonicalBundleHash(questionV2);
        
        const changes = {
            identical: hashV1 === hashV2,
            hashV1,
            hashV2,
            differences: []
        };
        
        if (!changes.identical) {
            // Analyser les différences champ par champ
            const fieldsToCheck = ['content', 'stimulus', 'type', 'alphabet', 'options', 'assets'];
            
            for (const field of fieldsToCheck) {
                const canonical1 = this.deterministicStringify(questionV1[field]);
                const canonical2 = this.deterministicStringify(questionV2[field]);
                
                if (canonical1 !== canonical2) {
                    changes.differences.push({
                        field,
                        changed: true,
                        hashV1: crypto.createHash('sha256').update(canonical1).digest('hex').substring(0, 8),
                        hashV2: crypto.createHash('sha256').update(canonical2).digest('hex').substring(0, 8)
                    });
                }
            }
        }
        
        return changes;
    }
    
    /**
     * Générer un hash court pour affichage
     */
    static shortHash(hash, length = 8) {
        return hash ? hash.substring(0, length) : 'N/A';
    }
}

module.exports = Canonicalizer;