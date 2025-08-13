/**
 * 🛡️ MIDDLEWARE DE VALIDATION DES QUESTIONS V2
 * ============================================
 * 
 * Validations strictes pour assurer l'intégrité et la cohérence
 * des questions avec le nouveau système UID/versioning.
 */

const QuestionV2 = require('../models/QuestionV2');
const crypto = require('crypto');
const Canonicalizer = require('../utils/canonicalization');

class QuestionValidator {
    
    /**
     * Valider l'intégrité complète d'une question
     */
    static async validateQuestionIntegrity(req, res, next) {
        try {
            const question = req.body;
            const errors = [];
            
            // 1. Validation des options
            const optionErrors = QuestionValidator.validateOptions(question.options);
            errors.push(...optionErrors);
            
            // 2. Validation de l'alphabet
            const alphabetErrors = QuestionValidator.validateAlphabet(question);
            errors.push(...alphabetErrors);
            
            // 3. Validation du bundle hash
            const hashErrors = await QuestionValidator.validateBundleHash(question);
            errors.push(...hashErrors);
            
            // 4. Validation de l'état de publication
            const stateErrors = QuestionValidator.validatePublicationState(question);
            errors.push(...stateErrors);
            
            // 5. Validation de l'intégrité cross-références
            const crossRefErrors = QuestionValidator.validateCrossReferences(question);
            errors.push(...crossRefErrors);
            
            if (errors.length > 0) {
                return res.status(400).json({
                    error: 'Question invalide',
                    details: errors
                });
            }
            
            next();
            
        } catch (error) {
            console.error('Erreur validation question:', error);
            res.status(500).json({ error: 'Erreur de validation interne' });
        }
    }
    
    /**
     * Valider les options de réponse
     */
    static validateOptions(options) {
        const errors = [];
        
        if (!Array.isArray(options)) {
            errors.push('Les options doivent être un tableau');
            return errors;
        }
        
        // Exactement 4 options
        if (options.length !== 4) {
            errors.push(`Exactement 4 options requises, trouvées: ${options.length}`);
        }
        
        // Compter les réponses correctes
        const correctOptions = options.filter(opt => opt.isCorrect);
        if (correctOptions.length !== 1) {
            errors.push(`Exactement 1 réponse correcte requise, trouvées: ${correctOptions.length}`);
        }
        
        // Vérifier les clés séquentielles
        const keys = options.map(opt => opt.key).sort();
        const expectedKeys = ['A', 'B', 'C', 'D'];
        if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
            errors.push(`Clés d'options invalides. Attendues: ${expectedKeys.join(',')}, trouvées: ${keys.join(',')}`);
        }
        
        // Vérifier que toutes les options ont du contenu
        options.forEach((option, idx) => {
            if (!option.text || option.text.trim() === '') {
                errors.push(`Option ${option.key || idx} sans contenu`);
            }
            if (!option.alt || option.alt.trim() === '') {
                errors.push(`Option ${option.key || idx} sans texte alternatif`);
            }
        });
        
        return errors;
    }
    
    /**
     * Valider la cohérence de l'alphabet
     */
    static validateAlphabet(question) {
        const errors = [];
        
        if (!question.alphabet) {
            errors.push('Alphabet manquant');
            return errors;
        }
        
        const validAlphabets = ['dot', 'semicircle', 'arrow', 'shape', 'number', 'letter'];
        if (!validAlphabets.includes(question.alphabet)) {
            errors.push(`Alphabet invalide: ${question.alphabet}. Valides: ${validAlphabets.join(', ')}`);
        }
        
        // Détecter l'alphabet automatiquement et comparer
        const detectedAlphabet = QuestionValidator.detectAlphabet(question);
        if (question.alphabet !== detectedAlphabet) {
            errors.push(
                `Incohérence d'alphabet: déclaré '${question.alphabet}', ` +
                `détecté '${detectedAlphabet}' dans le contenu`
            );
        }
        
        // Vérifier cohérence avec les options
        const optionAlphabets = question.options?.map(opt => 
            QuestionValidator.detectAlphabetFromText(opt.text)
        ).filter(Boolean) || [];
        
        const uniqueOptionAlphabets = [...new Set(optionAlphabets)];
        if (uniqueOptionAlphabets.length > 1) {
            errors.push(
                `Options utilisent des alphabets différents: ${uniqueOptionAlphabets.join(', ')}`
            );
        }
        
        if (uniqueOptionAlphabets.length === 1 && uniqueOptionAlphabets[0] !== question.alphabet) {
            errors.push(
                `Alphabet des options (${uniqueOptionAlphabets[0]}) différent de l'alphabet déclaré (${question.alphabet})`
            );
        }
        
        return errors;
    }
    
    /**
     * Détecter l'alphabet d'une question
     */
    static detectAlphabet(question) {
        const content = (question.content || '') + ' ' + (question.stimulus || '');
        return QuestionValidator.detectAlphabetFromText(content);
    }
    
    /**
     * Détecter l'alphabet d'un texte
     */
    static detectAlphabetFromText(text) {
        if (!text) return null;
        
        if (/[◼◻▦▪⬛⬜□■]/.test(text)) return 'shape';
        if (/[◐◑◒◓]/.test(text)) return 'semicircle';
        if (/[↑↓←→⬆⬇⬅➡]/.test(text)) return 'arrow';
        if (/[●○⚫⚪]/.test(text)) return 'dot';
        if (/\b[0-9]+\b/.test(text)) return 'number';
        if (/\b[A-Z]\b/.test(text) && !/\b(est|à|comme|sont)\b/i.test(text)) return 'letter';
        
        return 'shape'; // Par défaut
    }
    
    /**
     * Valider le bundle hash
     */
    static async validateBundleHash(question) {
        const errors = [];
        
        if (!question.bundleHash) {
            // Le hash sera calculé automatiquement par le middleware Mongoose
            return errors;
        }
        
        // Recalculer le hash et comparer
        const calculatedHash = QuestionValidator.calculateBundleHash(question);
        
        if (question.bundleHash !== calculatedHash) {
            errors.push(
                `Bundle hash incorrect. Calculé: ${calculatedHash.substring(0, 8)}..., ` +
                `fourni: ${question.bundleHash.substring(0, 8)}...`
            );
        }
        
        // Vérifier l'unicité du hash dans la base
        try {
            const existingQuestion = await QuestionV2.findOne({ 
                bundleHash: calculatedHash,
                qid: { $ne: question.qid } // Exclure la question actuelle
            });
            
            if (existingQuestion) {
                errors.push(
                    `Collision de bundle hash détectée avec la question ${existingQuestion.qid} v${existingQuestion.version}`
                );
            }
        } catch (dbError) {
            console.warn('Erreur lors de la vérification d\'unicité du hash:', dbError);
        }
        
        return errors;
    }
    
    /**
     * Valider l'intégrité des cross-références
     */
    static validateCrossReferences(question) {
        const errors = [];
        
        if (!question.qid || !question.version) {
            errors.push('QID et version requis pour validation cross-références');
            return errors;
        }
        
        // Vérifier que tous les assets pointent vers le même (qid,v,locale)
        if (question.assets && Array.isArray(question.assets)) {
            const expectedPrefix = `questions/${question.qid}/${question.version}/`;
            const localeGroups = {};
            
            for (const asset of question.assets) {
                // Vérifier le chemin
                if (!asset.path || !asset.path.includes(expectedPrefix)) {
                    errors.push(
                        `Asset ${asset.type}:${asset.slot} chemin invalide: ` +
                        `attendu prefix '${expectedPrefix}', trouvé '${asset.path}'`
                    );
                }
                
                // Grouper par locale pour vérifier cohérence
                const locale = asset.locale || 'fr';
                if (!localeGroups[locale]) {
                    localeGroups[locale] = [];
                }
                localeGroups[locale].push(asset);
                
                // Vérifier que le slot correspond au type
                if (!this.validateAssetSlot(asset.type, asset.slot)) {
                    errors.push(`Asset ${asset.type} slot invalide: ${asset.slot}`);
                }
                
                // Vérifier hash présent
                if (!asset.hash) {
                    errors.push(`Asset ${asset.type}:${asset.slot} sans hash d'intégrité`);
                }
                
                // Vérifier incohérence entre qid/version dans le path
                const pathMatch = asset.path.match(/questions\/([^\/]+)\/([^\/]+)\//);
                if (pathMatch) {
                    const [, pathQid, pathVersion] = pathMatch;
                    if (pathQid !== question.qid) {
                        errors.push(
                            `Asset ${asset.type}:${asset.slot} QID incohérent: ` +
                            `question=${question.qid}, path=${pathQid}`
                        );
                    }
                    if (pathVersion !== String(question.version)) {
                        errors.push(
                            `Asset ${asset.type}:${asset.slot} version incohérente: ` +
                            `question=${question.version}, path=${pathVersion}`
                        );
                    }
                }
            }
            
            // Vérifier cohérence par locale
            Object.entries(localeGroups).forEach(([locale, assets]) => {
                // Vérifier qu'on n'a pas de doublons type:slot pour une même locale
                const slots = assets.map(a => `${a.type}:${a.slot}`);
                const uniqueSlots = new Set(slots);
                if (slots.length !== uniqueSlots.size) {
                    const duplicates = slots.filter((slot, index) => slots.indexOf(slot) !== index);
                    errors.push(
                        `Locale ${locale}: slots en double détectés: ${duplicates.join(', ')}`
                    );
                }
            });
        }
        
        // Vérifier cohérence options avec assets
        if (question.options && question.assets) {
            const optionAssets = question.assets.filter(a => a.type === 'option');
            const optionKeys = question.options.map(opt => opt.key).filter(Boolean);
            
            for (const asset of optionAssets) {
                const expectedSlot = `option${asset.slot.replace('option', '')}`;
                const optionKey = asset.slot.replace('option', '');
                
                if (!optionKeys.includes(optionKey)) {
                    errors.push(
                        `Asset option ${asset.slot} sans option correspondante dans la question`
                    );
                }
            }
        }
        
        return errors;
    }
    
    /**
     * Valider un slot d'asset selon son type
     */
    static validateAssetSlot(type, slot) {
        switch (type) {
            case 'stimulus':
                return slot === 'stimulus';
            case 'option':
                return /^option[A-F]$/.test(slot);
            case 'explanation':
                return slot === 'explanation';
            case 'visual':
                return ['visual', 'diagram', 'matrix'].includes(slot);
            case 'course':
                return ['course', 'lesson', 'tutorial'].includes(slot);
            default:
                return false;
        }
    }
    
    /**
     * Calculer le bundle hash canonique d'une question
     */
    static calculateBundleHash(question) {
        return Canonicalizer.calculateCanonicalBundleHash(question);
    }
    
    /**
     * Valider l'état de publication
     */
    static validatePublicationState(question) {
        const errors = [];
        
        const validStates = ['draft', 'review', 'published', 'archived'];
        if (!validStates.includes(question.state)) {
            errors.push(`État invalide: ${question.state}. Valides: ${validStates.join(', ')}`);
        }
        
        // Règles spécifiques selon l'état
        switch (question.state) {
            case 'published':
                if (!question.publishedAt) {
                    errors.push('Date de publication requise pour l\'état "published"');
                }
                // Une question publiée doit être complète
                if (!question.content || !question.options || question.options.length === 0) {
                    errors.push('Question incomplète ne peut pas être publiée');
                }
                break;
                
            case 'archived':
                if (!question.archivedAt) {
                    errors.push('Date d\'archivage requise pour l\'état "archived"');
                }
                break;
        }
        
        return errors;
    }
    
    /**
     * Middleware pour vérifier qu'une question existe et est publiée
     */
    static async validateQuestionAccess(req, res, next) {
        try {
            const { qid, version } = req.params;
            
            if (!qid) {
                return res.status(400).json({ error: 'QID manquant' });
            }
            
            const query = { qid, state: 'published' };
            if (version) query.version = parseInt(version);
            
            const question = await QuestionV2.findOne(query).sort({ version: -1 });
            
            if (!question) {
                return res.status(404).json({ 
                    error: 'Question non trouvée ou non publiée',
                    qid,
                    version
                });
            }
            
            // Valider l'intégrité avant de servir
            const integrityErrors = question.validateIntegrity();
            if (integrityErrors.length > 0) {
                console.error(`Question ${qid} v${question.version} a des problèmes d'intégrité:`, integrityErrors);
                return res.status(500).json({ 
                    error: 'Question corrompue',
                    details: integrityErrors
                });
            }
            
            req.question = question;
            next();
            
        } catch (error) {
            console.error('Erreur validation accès question:', error);
            res.status(500).json({ error: 'Erreur de validation interne' });
        }
    }
    
    /**
     * Middleware pour valider les paramètres de test
     */
    static validateTestParameters(req, res, next) {
        try {
            const { testType, testLevel, alphabet, difficulty } = req.body;
            const errors = [];
            
            // Valider le type de test
            const validTestTypes = ['raven', 'cattell', 'custom', 'verbal', 'numerical', 'spatial'];
            if (testType && !validTestTypes.includes(testType)) {
                errors.push(`Type de test invalide: ${testType}`);
            }
            
            // Valider le niveau de test
            const validTestLevels = ['short', 'medium', 'long', 'adaptive'];
            if (testLevel && !validTestLevels.includes(testLevel)) {
                errors.push(`Niveau de test invalide: ${testLevel}`);
            }
            
            // Valider l'alphabet si spécifié
            if (alphabet) {
                const validAlphabets = ['dot', 'semicircle', 'arrow', 'shape', 'number', 'letter'];
                if (!validAlphabets.includes(alphabet)) {
                    errors.push(`Alphabet invalide: ${alphabet}`);
                }
            }
            
            // Valider la difficulté
            if (difficulty !== undefined) {
                const diff = parseInt(difficulty);
                if (isNaN(diff) || diff < 1 || diff > 10) {
                    errors.push('Difficulté doit être entre 1 et 10');
                }
            }
            
            if (errors.length > 0) {
                return res.status(400).json({
                    error: 'Paramètres de test invalides',
                    details: errors
                });
            }
            
            next();
            
        } catch (error) {
            console.error('Erreur validation paramètres test:', error);
            res.status(500).json({ error: 'Erreur de validation interne' });
        }
    }
    
    /**
     * Middleware pour valider les réponses utilisateur
     */
    static validateUserAnswer(req, res, next) {
        try {
            const { qid, selectedOption, timeUsed } = req.body;
            const errors = [];
            
            if (!qid) {
                errors.push('QID de question manquant');
            }
            
            if (selectedOption === undefined || selectedOption === null) {
                errors.push('Réponse sélectionnée manquante');
            } else {
                const option = parseInt(selectedOption);
                if (isNaN(option) || option < -1 || option > 5) {
                    errors.push('Réponse sélectionnée invalide (doit être entre -1 et 5)');
                }
            }
            
            if (timeUsed !== undefined) {
                const time = parseInt(timeUsed);
                if (isNaN(time) || time < 0 || time > 600) {
                    errors.push('Temps utilisé invalide (doit être entre 0 et 600 secondes)');
                }
            }
            
            if (errors.length > 0) {
                return res.status(400).json({
                    error: 'Réponse utilisateur invalide',
                    details: errors
                });
            }
            
            next();
            
        } catch (error) {
            console.error('Erreur validation réponse:', error);
            res.status(500).json({ error: 'Erreur de validation interne' });
        }
    }
}

module.exports = QuestionValidator;