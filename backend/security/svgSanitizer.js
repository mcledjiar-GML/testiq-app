/**
 * 🛡️ SVG SANITIZER - SÉCURITÉ CONTRE XSS
 * ======================================
 * 
 * Sanitisation des SVG pour empêcher les XSS et assurer la sécurité
 * des assets visuels dans TestIQ.
 */

const crypto = require('crypto');

class SVGSanitizer {
    
    constructor() {
        // Whitelist des balises SVG autorisées
        this.allowedTags = new Set([
            'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
            'text', 'tspan', 'textPath', 'defs', 'clipPath', 'mask', 'pattern', 'marker',
            'linearGradient', 'radialGradient', 'stop', 'use', 'symbol', 'image',
            'foreignObject', 'switch', 'animate', 'animateTransform', 'animateMotion',
            'set', 'mpath', 'title', 'desc', 'metadata'
        ]);
        
        // Whitelist des attributs autorisés
        this.allowedAttributes = new Set([
            // Attributs géométriques
            'x', 'y', 'width', 'height', 'r', 'rx', 'ry', 'cx', 'cy',
            'x1', 'y1', 'x2', 'y2', 'points', 'd', 'transform',
            
            // Attributs de style visuels (sécurisés)
            'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
            'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'fill-opacity',
            'stroke-opacity', 'font-family', 'font-size', 'font-weight',
            'text-anchor', 'dominant-baseline', 'alignment-baseline',
            
            // Attributs de structure
            'id', 'class', 'viewBox', 'preserveAspectRatio', 'xmlns',
            'xmlns:xlink', 'version', 'baseProfile',
            
            // Attributs de clipping et masking (sécurisés)
            'clip-path', 'mask', 'clip-rule', 'fill-rule',
            
            // Attributs d'animation (limités)
            'dur', 'repeatCount', 'begin', 'end', 'values', 'from', 'to', 'by',
            
            // Attributs de gradient
            'gradientUnits', 'gradientTransform', 'offset', 'stop-color', 'stop-opacity',
            
            // Attributs de référence (contrôlés)
            'href', 'xlink:href'
        ]);
        
        // Balises et attributs explicitement interdits (sécurité)
        this.forbiddenTags = new Set([
            'script', 'object', 'embed', 'iframe', 'frame', 'frameset',
            'applet', 'link', 'meta', 'base', 'form', 'input', 'button'
        ]);
        
        this.forbiddenAttributes = new Set([
            'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur',
            'onchange', 'onsubmit', 'onreset', 'onselect', 'onkeydown', 'onkeyup',
            'onkeypress', 'onabort', 'onerror', 'onresize', 'onscroll', 'onunload',
            'style', // Interdit pour éviter les CSS injections
            'javascript:', 'vbscript:', 'data:', 'expression'
        ]);
        
        // Patterns de contenu dangereux
        this.dangerousPatterns = [
            /javascript:/gi,
            /vbscript:/gi,
            /data:text\/html/gi,
            /data:application\/javascript/gi,
            /<script[^>]*>/gi,
            /expression\s*\(/gi,
            /import\s*\(/gi,
            /eval\s*\(/gi,
            /setTimeout\s*\(/gi,
            /setInterval\s*\(/gi
        ];
    }
    
    /**
     * Sanitiser un SVG complet
     */
    sanitizeSVG(svgContent) {
        if (!svgContent || typeof svgContent !== 'string') {
            throw new Error('Contenu SVG invalide');
        }
        
        try {
            // 1. Nettoyer le contenu initial
            let cleaned = this.initialCleanup(svgContent);
            
            // 2. Vérifier les patterns dangereux
            cleaned = this.removeDangerousPatterns(cleaned);
            
            // 3. Parser et sanitiser la structure XML
            cleaned = this.sanitizeXMLStructure(cleaned);
            
            // 4. Valider le résultat final
            const validation = this.validateSanitizedSVG(cleaned);
            if (!validation.safe) {
                throw new Error(`SVG non sécurisé après sanitisation: ${validation.issues.join(', ')}`);
            }
            
            return {
                sanitized: cleaned,
                originalHash: crypto.createHash('sha256').update(svgContent).digest('hex'),
                sanitizedHash: crypto.createHash('sha256').update(cleaned).digest('hex'),
                safe: true,
                warnings: validation.warnings || []
            };
            
        } catch (error) {
            throw new Error(`Erreur sanitisation SVG: ${error.message}`);
        }
    }
    
    /**
     * Nettoyage initial du SVG
     */
    initialCleanup(svg) {
        return svg
            // Supprimer les déclarations XML potentiellement dangereuses
            .replace(/<\?xml[^>]*\?>/g, '')
            // Supprimer les DTD externes
            .replace(/<!DOCTYPE[^>]*>/g, '')
            // Supprimer les commentaires
            .replace(/<!--[\s\S]*?-->/g, '')
            // Supprimer les sections CDATA suspectes
            .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
            // Normaliser les espaces
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    /**
     * Supprimer les patterns dangereux
     */
    removeDangerousPatterns(svg) {
        let cleaned = svg;
        
        for (const pattern of this.dangerousPatterns) {
            cleaned = cleaned.replace(pattern, '');
        }
        
        return cleaned;
    }
    
    /**
     * Sanitiser la structure XML (version simplifiée)
     */
    sanitizeXMLStructure(svg) {
        // Parser basique pour nettoyer les balises et attributs
        let cleaned = svg;
        
        // Supprimer toutes les balises interdites
        for (const tag of this.forbiddenTags) {
            const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
            cleaned = cleaned.replace(regex, '');
            
            // Balises auto-fermantes
            const selfClosingRegex = new RegExp(`<${tag}[^>]*/>`, 'gi');
            cleaned = cleaned.replace(selfClosingRegex, '');
        }
        
        // Supprimer les attributs interdits
        for (const attr of this.forbiddenAttributes) {
            const regex = new RegExp(`\\s+${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
            cleaned = cleaned.replace(regex, '');
        }
        
        // Nettoyer les références href suspectes
        cleaned = cleaned.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
        cleaned = cleaned.replace(/xlink:href\s*=\s*["']javascript:[^"']*["']/gi, '');
        
        return cleaned;
    }
    
    /**
     * Valider le SVG sanitisé
     */
    validateSanitizedSVG(svg) {
        const issues = [];
        const warnings = [];
        
        // Vérifier qu'il reste des balises SVG valides
        if (!svg.includes('<svg')) {
            issues.push('Pas de balise SVG racine trouvée');
        }
        
        // Vérifier la présence de contenu dangereux résiduel
        for (const pattern of this.dangerousPatterns) {
            if (pattern.test(svg)) {
                issues.push(`Pattern dangereux détecté: ${pattern.source}`);
            }
        }
        
        // Vérifier les balises interdites résiduelles
        for (const tag of this.forbiddenTags) {
            if (svg.toLowerCase().includes(`<${tag}`)) {
                issues.push(`Balise interdite trouvée: ${tag}`);
            }
        }
        
        // Vérifier les attributs event handlers
        if (/\s+on\w+\s*=/i.test(svg)) {
            issues.push('Event handlers détectés');
        }
        
        // Avertissements pour optimisation
        if (svg.includes('style=')) {
            warnings.push('Attributs style détectés (recommandé: classes CSS externes)');
        }
        
        if (svg.length > 50000) {
            warnings.push('SVG très volumineux (>50KB), considérer l\'optimisation');
        }
        
        return {
            safe: issues.length === 0,
            issues,
            warnings
        };
    }
    
    /**
     * Créer une CSP stricte pour les SVG
     */
    static getStrictCSP() {
        return {
            'Content-Security-Policy': [
                "default-src 'none'",
                "script-src 'none'",
                "object-src 'none'",
                "style-src 'unsafe-inline'", // Nécessaire pour les SVG avec styles inline
                "img-src 'self' data:",
                "font-src 'self'",
                "connect-src 'none'",
                "frame-src 'none'",
                "worker-src 'none'",
                "base-uri 'none'",
                "form-action 'none'"
            ].join('; ')
        };
    }
    
    /**
     * Middleware Express pour sécuriser les réponses SVG
     */
    static svgSecurityMiddleware() {
        return (req, res, next) => {
            // Ajouter les headers de sécurité pour les SVG
            if (req.path.endsWith('.svg') || req.headers.accept?.includes('image/svg+xml')) {
                const cspHeaders = SVGSanitizer.getStrictCSP();
                Object.entries(cspHeaders).forEach(([key, value]) => {
                    res.setHeader(key, value);
                });
                
                // Headers de sécurité additionnels
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.setHeader('X-Frame-Options', 'DENY');
                res.setHeader('X-XSS-Protection', '1; mode=block');
                res.setHeader('Referrer-Policy', 'no-referrer');
            }
            
            next();
        };
    }
    
    /**
     * Valider qu'un SVG est sécurisé pour le rendu web
     */
    static validateForWeb(svgContent) {
        const sanitizer = new SVGSanitizer();
        
        try {
            const result = sanitizer.sanitizeSVG(svgContent);
            
            return {
                safe: result.safe,
                sanitized: result.sanitized,
                needsSanitization: result.originalHash !== result.sanitizedHash,
                warnings: result.warnings,
                hashes: {
                    original: result.originalHash,
                    sanitized: result.sanitizedHash
                }
            };
            
        } catch (error) {
            return {
                safe: false,
                error: error.message,
                sanitized: null
            };
        }
    }
    
    /**
     * Générer un rapport de sécurité pour une collection de SVG
     */
    static generateSecurityReport(svgAssets) {
        const report = {
            timestamp: new Date().toISOString(),
            totalAssets: svgAssets.length,
            safe: 0,
            unsafe: 0,
            needsSanitization: 0,
            issues: []
        };
        
        for (const asset of svgAssets) {
            try {
                const validation = SVGSanitizer.validateForWeb(asset.content);
                
                if (validation.safe) {
                    report.safe++;
                } else {
                    report.unsafe++;
                    report.issues.push({
                        assetId: asset.id || asset.path,
                        error: validation.error,
                        recommendations: [
                            'Sanitiser le SVG avant utilisation',
                            'Vérifier l\'absence de scripts inline',
                            'Utiliser des CSP strictes'
                        ]
                    });
                }
                
                if (validation.needsSanitization) {
                    report.needsSanitization++;
                }
                
            } catch (error) {
                report.unsafe++;
                report.issues.push({
                    assetId: asset.id || asset.path,
                    error: `Erreur validation: ${error.message}`
                });
            }
        }
        
        report.securityScore = report.totalAssets > 0 
            ? ((report.safe / report.totalAssets) * 100).toFixed(1) + '%'
            : '0%';
        
        return report;
    }
}

module.exports = SVGSanitizer;