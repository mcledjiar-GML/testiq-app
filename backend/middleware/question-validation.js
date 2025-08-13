/**
 * 🛡️ MIDDLEWARE DE VALIDATION DES QUESTIONS
 * ==========================================
 * 
 * Validation côté API pour empêcher la publication de questions
 * avec des incohérences détectées par le système de qualité.
 * 
 * Validations implémentées :
 * - Alphabet unique et cohérent (énoncé/stimulus/options)
 * - Exactement 4 options avec 1 réponse correcte
 * - Aucun indice visible dans l'énoncé
 * - Homogénéité visuelle des options
 * - Unicité de la solution (via moteur de règles)
 */

const RuleEngine = require('../scripts/enhanced-rule-engine');

class QuestionValidator {
    
    /**
     * Middleware Express pour valider une question avant création/mise à jour
     */
    static validateQuestion(req, res, next) {
        try {
            const question = req.body;
            const validationResult = QuestionValidator.validate(question);
            
            if (!validationResult.isValid) {
                return res.status(400).json({
                    error: 'Question validation failed',
                    issues: validationResult.issues,
                    suggestions: validationResult.suggestions
                });
            }
            
            // Ajouter le résultat de validation à la requête pour usage ultérieur
            req.validationResult = validationResult;
            next();
            
        } catch (error) {
            console.error('Erreur validation question:', error);
            return res.status(500).json({
                error: 'Internal validation error',
                message: error.message
            });
        }
    }
    
    /**
     * Valider une question complète
     */
    static validate(question) {
        const result = {
            isValid: true,
            issues: [],
            warnings: [],
            suggestions: [],
            severity: 'none'
        };
        
        // 1. Validation de l'alphabet
        const alphabetValidation = this.validateAlphabetConsistency(question);
        if (!alphabetValidation.isValid) {
            result.isValid = false;
            result.issues.push(...alphabetValidation.issues);
            result.suggestions.push(...alphabetValidation.suggestions);
            result.severity = this.maxSeverity(result.severity, 'medium');
        }
        
        // 2. Validation des options
        const optionsValidation = this.validateOptions(question);
        if (!optionsValidation.isValid) {
            result.isValid = false;
            result.issues.push(...optionsValidation.issues);
            result.suggestions.push(...optionsValidation.suggestions);
            result.severity = this.maxSeverity(result.severity, 'high');
        }
        
        // 3. Validation des indices visibles
        const hintsValidation = this.validateNoVisibleHints(question);
        if (!hintsValidation.isValid) {
            result.isValid = false;
            result.issues.push(...hintsValidation.issues);
            result.suggestions.push(...hintsValidation.suggestions);
            result.severity = this.maxSeverity(result.severity, 'medium');
        }
        
        // 4. Validation de l'unicité de la solution
        const uniquenessValidation = this.validateSolutionUniqueness(question);
        if (!uniquenessValidation.isValid) {
            result.isValid = false;
            result.issues.push(...uniquenessValidation.issues);
            result.suggestions.push(...uniquenessValidation.suggestions);
            result.severity = this.maxSeverity(result.severity, 'high');
        }
        
        // 5. Validation de l'homogénéité visuelle
        const homogeneityValidation = this.validateVisualHomogeneity(question);
        if (homogeneityValidation.warnings.length > 0) {
            result.warnings.push(...homogeneityValidation.warnings);
            result.suggestions.push(...homogeneityValidation.suggestions);
        }
        
        return result;
    }
    
    /**
     * Valider la cohérence de l'alphabet
     */
    static validateAlphabetConsistency(question) {
        const result = { isValid: true, issues: [], suggestions: [] };
        
        const declaredAlphabet = question.alphabet;
        if (!declaredAlphabet) {
            result.isValid = false;
            result.issues.push('Alphabet manquant');
            result.suggestions.push('Déclarer un alphabet : shape, number, letter, dot, arrow, semicircle');
            return result;
        }
        
        // Détecter l'alphabet depuis le contenu
        const contentAlphabet = this.detectAlphabetFromContent(
            (question.content || '') + ' ' + (question.stimulus || '')
        );
        
        if (contentAlphabet !== 'unknown' && contentAlphabet !== declaredAlphabet) {
            result.isValid = false;
            result.issues.push(`Alphabet déclaré '${declaredAlphabet}' ne correspond pas au contenu '${contentAlphabet}'`);
            result.suggestions.push(`Changer l'alphabet à '${contentAlphabet}' ou modifier le contenu`);
        }
        
        // Vérifier la cohérence avec les options
        if (question.options && Array.isArray(question.options)) {
            for (const [idx, option] of question.options.entries()) {
                if (option.text) {
                    const optionAlphabet = this.detectAlphabetFromContent(option.text);
                    if (optionAlphabet !== 'unknown' && optionAlphabet !== declaredAlphabet) {
                        result.isValid = false;
                        result.issues.push(`Option ${option.key || idx + 1}: alphabet '${optionAlphabet}' ≠ '${declaredAlphabet}'`);
                        result.suggestions.push(`Corriger l'option ${option.key || idx + 1} pour utiliser l'alphabet '${declaredAlphabet}'`);
                    }
                }
            }
        }
        
        return result;
    }
    
    /**
     * Valider les options de réponse
     */
    static validateOptions(question) {
        const result = { isValid: true, issues: [], suggestions: [] };
        
        if (!question.options || !Array.isArray(question.options)) {
            result.isValid = false;
            result.issues.push('Options manquantes');
            result.suggestions.push('Ajouter exactement 4 options de réponse');
            return result;
        }
        
        // Vérifier le nombre d'options
        if (question.options.length !== 4) {
            result.isValid = false;
            result.issues.push(`${question.options.length} options au lieu de 4`);
            result.suggestions.push('Ajouter/supprimer des options pour avoir exactement 4 choix');
        }
        
        // Vérifier les clés des options
        const expectedKeys = ['A', 'B', 'C', 'D'];
        const actualKeys = question.options.map(opt => opt.key).sort();
        if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
            result.isValid = false;
            result.issues.push(`Clés d'options incorrectes: ${actualKeys.join(', ')}`);
            result.suggestions.push('Utiliser les clés A, B, C, D pour les options');
        }
        
        // Vérifier qu'il y a exactement une réponse correcte
        const correctOptions = question.options.filter(opt => opt.isCorrect);
        if (correctOptions.length !== 1) {
            result.isValid = false;
            result.issues.push(`${correctOptions.length} réponses correctes au lieu de 1`);
            result.suggestions.push('Marquer exactement une option comme correcte');
        }
        
        // Vérifier que toutes les options ont du contenu
        for (const [idx, option] of question.options.entries()) {
            if (!option.text || option.text.trim() === '') {
                result.isValid = false;
                result.issues.push(`Option ${option.key || idx + 1} vide`);
                result.suggestions.push(`Ajouter du contenu à l'option ${option.key || idx + 1}`);
            }
        }
        
        return result;
    }
    
    /**
     * Valider l'absence d'indices visibles
     */
    static validateNoVisibleHints(question) {
        const result = { isValid: true, issues: [], suggestions: [] };
        
        const content = (question.content || '') + ' ' + (question.stimulus || '');
        
        // Mots-clés d'indices interdits
        const hintKeywords = [
            'indice', 'astuce', 'conseil', 'aide', 'solution',
            'méthode', 'technique', 'remarque', 'note',
            'attention', 'observez', 'notez que'
        ];
        
        for (const keyword of hintKeywords) {
            if (content.toLowerCase().includes(keyword)) {
                result.isValid = false;
                result.issues.push(`Indice visible: "${keyword}"`);
                result.suggestions.push(`Supprimer le mot "${keyword}" de l'énoncé`);
            }
        }
        
        // Formules mathématiques explicites
        if (/[+\-×÷]\s*\d+/.test(content) || /=\s*\d+/.test(content)) {
            result.isValid = false;
            result.issues.push('Formule mathématique visible (spoiler)');
            result.suggestions.push('Remplacer les calculs explicites par des points d\'interrogation');
        }
        
        // Explications causales
        if (content.includes('car ') || content.includes('parce que')) {
            result.isValid = false;
            result.issues.push('Explication causale visible (spoiler)');
            result.suggestions.push('Supprimer les explications causales de l\'énoncé');
        }
        
        return result;
    }
    
    /**
     * Valider l'unicité de la solution via le moteur de règles amélioré
     */
    static validateSolutionUniqueness(question) {
        const result = { isValid: true, issues: [], suggestions: [] };
        
        try {
            const ruleAnalysis = RuleEngine.analyzeQuestion(question);
            
            // Utiliser le nouveau format de résultat
            const validOptionsCount = ruleAnalysis.validOptions?.length || 0;
            const expectedAnswer = ruleAnalysis.expectedAnswer;
            const confidence = ruleAnalysis.confidence || 0.5;
            
            if (validOptionsCount === 0) {
                if (confidence > 0.8) {
                    result.isValid = false;
                    result.issues.push('Aucune option ne satisfait la règle détectée');
                    result.suggestions.push('Revoir les options ou la logique de la question');
                } else {
                    // Confiance faible : ne pas bloquer
                    result.suggestions.push('Pattern non reconnu avec certitude - validation manuelle recommandée');
                }
            } else if (validOptionsCount > 1) {
                if (confidence > 0.7) {
                    result.isValid = false;
                    result.issues.push(`${validOptionsCount} options satisfont la règle (ambiguïté)`);
                    result.suggestions.push('Modifier les options pour qu\'une seule soit logiquement correcte');
                } else {
                    result.suggestions.push(`Ambiguïté possible détectée (confiance: ${confidence})`);
                }
            } else if (validOptionsCount === 1 && expectedAnswer !== null && question.correctAnswer !== expectedAnswer) {
                if (confidence > 0.8) {
                    result.isValid = false;
                    result.issues.push(`Réponse déclarée incorrecte (attendue: ${expectedAnswer}, déclarée: ${question.correctAnswer})`);
                    result.suggestions.push(`Changer correctAnswer à ${expectedAnswer} ou revoir la logique`);
                } else {
                    result.suggestions.push(`Incohérence possible: attendue=${expectedAnswer}, déclarée=${question.correctAnswer} (confiance: ${confidence})`);
                }
            }
            
            // Ajouter les avertissements du moteur
            if (ruleAnalysis.warnings && ruleAnalysis.warnings.length > 0) {
                result.suggestions.push(...ruleAnalysis.warnings);
            }
            
        } catch (error) {
            // Le moteur amélioré a un fallback générique, donc l'erreur est rare
            result.suggestions.push('Analyse automatique échouée - validation manuelle requise');
        }
        
        return result;
    }
    
    /**
     * Valider l'homogénéité visuelle des options
     */
    static validateVisualHomogeneity(question) {
        const result = { isValid: true, warnings: [], suggestions: [] };
        
        if (!question.options || question.options.length === 0) {
            return result;
        }
        
        // Analyser les SVG des options
        const svgOptions = question.options.filter(opt => 
            opt.text && opt.text.includes('<svg')
        );
        
        if (svgOptions.length > 1) {
            // Vérifier les viewBox
            const viewBoxes = svgOptions.map(opt => {
                const match = opt.text.match(/viewBox="([^"]*)"/);
                return match ? match[1] : null;
            });
            
            const uniqueViewBoxes = new Set(viewBoxes.filter(vb => vb));
            if (uniqueViewBoxes.size > 1) {
                result.warnings.push('ViewBox incohérents entre les options SVG');
                result.suggestions.push('Normaliser tous les viewBox à "0 0 100 100"');
            }
            
            // Vérifier les stroke-width
            const strokeWidths = svgOptions.map(opt => {
                const match = opt.text.match(/stroke-width="([^"]*)"/);
                return match ? match[1] : null;
            });
            
            const uniqueStrokes = new Set(strokeWidths.filter(sw => sw));
            if (uniqueStrokes.size > 1) {
                result.warnings.push('Épaisseurs de trait incohérentes entre les options');
                result.suggestions.push('Normaliser stroke-width à "2" pour toutes les options');
            }
        }
        
        return result;
    }
    
    /**
     * Détecter l'alphabet depuis le contenu (version améliorée)
     */
    static detectAlphabetFromContent(content) {
        if (!content) return 'unknown';

        // Formes géométriques (priorité haute car plus spécifique)
        if (/[◼◻▦▪⬛⬜□■▲▼◆◇★☆]/.test(content) || 
            content.includes('<rect') || 
            content.includes('<circle') ||
            content.includes('<polygon') ||
            content.toLowerCase().includes('triangle') ||
            content.toLowerCase().includes('carré') ||
            content.toLowerCase().includes('hexagone') ||
            content.toLowerCase().includes('forme')) {
            return 'shape';
        }

        // Demi-cercles et rotations
        if (/[◐◑◒◓]/.test(content) || 
            content.toLowerCase().includes('rotation') ||
            content.toLowerCase().includes('semi') ||
            content.toLowerCase().includes('demi') ||
            content.toLowerCase().includes('arc')) {
            return 'semicircle';
        }

        // Flèches et directions
        if (/[↑↓←→⬆⬇⬅➡]/.test(content) ||
            content.toLowerCase().includes('direction') ||
            content.toLowerCase().includes('flèche')) {
            return 'arrow';
        }

        // Points et cercles
        if (/[●○⚫⚪]/.test(content) ||
            content.toLowerCase().includes('point') ||
            content.toLowerCase().includes('cercle')) {
            return 'dot';
        }

        // Nombres et suites numériques
        if (/\b[0-9]+\b/.test(content) ||
            content.toLowerCase().includes('suite') ||
            content.toLowerCase().includes('numérique') ||
            content.toLowerCase().includes('nombre') ||
            content.toLowerCase().includes('progression') ||
            content.toLowerCase().includes('fibonacci') ||
            content.toLowerCase().includes('prime') ||
            content.toLowerCase().includes('terme')) {
            return 'number';
        }

        // Lettres de l'alphabet (en dernier car peut interférer)
        if (/\b[A-Z]\b/.test(content) ||
            content.toLowerCase().includes('alphabet') ||
            content.toLowerCase().includes('lettre')) {
            return 'letter';
        }

        return 'unknown';
    }
    
    /**
     * Comparer la sévérité et retourner la plus haute
     */
    static maxSeverity(current, new_severity) {
        const severityOrder = { 'none': 0, 'low': 1, 'medium': 2, 'high': 3 };
        return severityOrder[new_severity] > severityOrder[current] ? new_severity : current;
    }
    
    /**
     * Validation rapide pour API (version allégée)
     */
    static validateQuick(question) {
        const issues = [];
        
        // Validations critiques seulement
        if (!question.options || question.options.length !== 4) {
            issues.push('Exactement 4 options requises');
        }
        
        if (question.options) {
            const correctCount = question.options.filter(opt => opt.isCorrect).length;
            if (correctCount !== 1) {
                issues.push('Exactement 1 réponse correcte requise');
            }
        }
        
        if (!question.alphabet) {
            issues.push('Alphabet requis');
        }
        
        return {
            isValid: issues.length === 0,
            issues
        };
    }
}

module.exports = QuestionValidator;