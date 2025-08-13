/**
 * 🛡️ GARDE-FOUS FRONTEND - VALIDATION DES QUESTIONS V2
 * ====================================================
 * 
 * Validations côté client pour assurer la cohérence des questions
 * avant rendu et interaction utilisateur.
 */

/**
 * Classe pour valider et sécuriser les questions côté frontend
 */
class QuestionValidator {
    
    /**
     * Valider qu'une question est prête à être rendue
     */
    static validateQuestionReady(question) {
        const errors = [];
        const warnings = [];
        
        // 1. Vérifications critiques (bloquantes)
        if (!question) {
            errors.push('Question manquante');
            return { isValid: false, errors, warnings };
        }
        
        if (!question.qid) {
            errors.push('QID manquant');
        }
        
        if (!question.content || question.content.trim() === '') {
            errors.push('Contenu de question manquant');
        }
        
        // 2. Validation des options
        const optionErrors = this.validateOptions(question.options);
        errors.push(...optionErrors.errors);
        warnings.push(...optionErrors.warnings);
        
        // 3. Validation de l'état
        if (question.state !== 'published') {
            errors.push(`Question non publiée (état: ${question.state})`);
        }
        
        // 4. Validation de l'alphabet
        const alphabetErrors = this.validateAlphabet(question);
        warnings.push(...alphabetErrors);
        
        // 5. Validation des assets
        const assetErrors = this.validateAssets(question);
        warnings.push(...assetErrors);
        
        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            canRender: errors.length === 0
        };
    }
    
    /**
     * Valider les options de réponse
     */
    static validateOptions(options) {
        const errors = [];
        const warnings = [];
        
        if (!Array.isArray(options)) {
            errors.push('Options manquantes ou invalides');
            return { errors, warnings };
        }
        
        // Exactement 4 options
        if (options.length !== 4) {
            errors.push(`4 options requises, trouvées: ${options.length}`);
        }
        
        // Vérifier chaque option
        options.forEach((option, index) => {
            if (!option) {
                errors.push(`Option ${index} manquante`);
                return;
            }
            
            if (!option.text || option.text.trim() === '') {
                errors.push(`Option ${option.key || index} sans contenu`);
            }
            
            if (!option.alt || option.alt.trim() === '') {
                warnings.push(`Option ${option.key || index} sans texte alternatif`);
            }
            
            if (!option.key || !/^[A-F]$/.test(option.key)) {
                errors.push(`Option ${index} avec clé invalide: ${option.key}`);
            }
        });
        
        // Vérifier l'unicité des clés
        const keys = options.map(opt => opt.key).filter(Boolean);
        const uniqueKeys = new Set(keys);
        if (keys.length !== uniqueKeys.size) {
            errors.push('Clés d\'options en double détectées');
        }
        
        // Vérifier les réponses correctes
        const correctOptions = options.filter(opt => opt.isCorrect);
        if (correctOptions.length === 0) {
            errors.push('Aucune réponse correcte définie');
        } else if (correctOptions.length > 1) {
            errors.push(`${correctOptions.length} réponses correctes (1 attendue)`);
        }
        
        return { errors, warnings };
    }
    
    /**
     * Valider la cohérence de l'alphabet
     */
    static validateAlphabet(question) {
        const warnings = [];
        
        if (!question.alphabet) {
            warnings.push('Alphabet non défini');
            return warnings;
        }
        
        const validAlphabets = ['dot', 'semicircle', 'arrow', 'shape', 'number', 'letter'];
        if (!validAlphabets.includes(question.alphabet)) {
            warnings.push(`Alphabet non reconnu: ${question.alphabet}`);
        }
        
        // Détecter l'alphabet dans le contenu
        const detectedAlphabet = this.detectAlphabet(question);
        if (detectedAlphabet && question.alphabet !== detectedAlphabet) {
            warnings.push(
                `Incohérence d'alphabet: déclaré '${question.alphabet}', ` +
                `détecté '${detectedAlphabet}'`
            );
        }
        
        return warnings;
    }
    
    /**
     * Détecter l'alphabet d'une question
     */
    static detectAlphabet(question) {
        const content = (question.content || '') + ' ' + (question.stimulus || '');
        
        if (/[◼◻▦▪⬛⬜□■]/.test(content)) return 'shape';
        if (/[◐◑◒◓]/.test(content)) return 'semicircle';
        if (/[↑↓←→⬆⬇⬅➡]/.test(content)) return 'arrow';
        if (/[●○⚫⚪]/.test(content)) return 'dot';
        if (/\b[0-9]+\b/.test(content)) return 'number';
        if (/\b[A-Z]\b/.test(content)) return 'letter';
        
        return null;
    }
    
    /**
     * Valider les assets (chemins, cohérence qid/version)
     */
    static validateAssets(question) {
        const warnings = [];
        
        if (!question.assets || question.assets.length === 0) {
            return warnings; // Pas d'assets = OK
        }
        
        question.assets.forEach((asset, index) => {
            if (!asset.path) {
                warnings.push(`Asset ${index} sans chemin`);
                return;
            }
            
            // Vérifier que le chemin contient qid/version
            const expectedPrefix = `questions/${question.qid}/${question.version}/`;
            if (!asset.path.includes(expectedPrefix)) {
                warnings.push(
                    `Asset ${index} avec chemin incohérent: ` +
                    `attendu prefix '${expectedPrefix}', trouvé '${asset.path}'`
                );
            }
            
            if (!asset.hash) {
                warnings.push(`Asset ${index} sans hash d'intégrité`);
            }
        });
        
        return warnings;
    }
    
    /**
     * Randomiser l'ordre des options tout en gardant la trace
     */
    static randomizeOptions(question) {
        if (!question.options || question.options.length === 0) {
            return {
                question,
                permutation: [],
                correctAnswerIndex: -1
            };
        }
        
        const originalOptions = [...question.options];
        const indices = originalOptions.map((_, i) => i);
        
        // Mélange Fisher-Yates
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        const shuffledOptions = indices.map(i => originalOptions[i]);
        
        // Trouver le nouvel index de la réponse correcte
        const originalCorrectIndex = originalOptions.findIndex(opt => opt.isCorrect);
        const newCorrectIndex = indices.indexOf(originalCorrectIndex);
        
        return {
            question: {
                ...question,
                options: shuffledOptions
            },
            permutation: indices,
            correctAnswerIndex: newCorrectIndex,
            originalCorrectIndex
        };
    }
    
    /**
     * Valider une réponse utilisateur
     */
    static validateUserAnswer(answer, question) {
        const errors = [];
        
        if (!question) {
            errors.push('Question manquante pour validation');
            return { isValid: false, errors };
        }
        
        if (!answer || typeof answer !== 'object') {
            errors.push('Réponse manquante ou invalide');
            return { isValid: false, errors };
        }
        
        // Vérifier le QID
        if (answer.qid !== question.qid) {
            errors.push('QID de réponse ne correspond pas à la question');
        }
        
        // Vérifier l'option sélectionnée
        if (answer.selectedOption === undefined || answer.selectedOption === null) {
            errors.push('Option sélectionnée manquante');
        } else {
            const option = parseInt(answer.selectedOption);
            if (isNaN(option) || option < -1 || option >= question.options.length) {
                errors.push('Option sélectionnée invalide');
            }
        }
        
        // Vérifier le temps
        if (answer.timeUsed !== undefined) {
            const time = parseInt(answer.timeUsed);
            if (isNaN(time) || time < 0) {
                errors.push('Temps utilisé invalide');
            }
            
            if (question.timeLimit && time > question.timeLimit + 5) {
                errors.push('Temps dépassé de manière suspecte');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    /**
     * Créer un objet question sécurisé pour le rendu
     */
    static createSafeQuestion(question) {
        const validation = this.validateQuestionReady(question);
        
        if (!validation.isValid) {
            console.error('Question invalide:', validation.errors);
            return null;
        }
        
        // Logger les avertissements
        if (validation.warnings.length > 0) {
            console.warn('Avertissements question:', validation.warnings);
        }
        
        // Randomiser les options
        const randomized = this.randomizeOptions(question);
        
        return {
            ...randomized.question,
            _permutation: randomized.permutation,
            _originalCorrectIndex: randomized.originalCorrectIndex,
            _validationWarnings: validation.warnings
        };
    }
    
    /**
     * Vérifier que tous les assets sont chargés
     */
    static validateAssetsLoaded(question, loadedAssets = {}) {
        if (!question.assets || question.assets.length === 0) {
            return { allLoaded: true, missing: [] };
        }
        
        const missing = [];
        
        question.assets.forEach(asset => {
            const assetId = `${asset.type}-${asset.path}`;
            if (!loadedAssets[assetId]) {
                missing.push({
                    type: asset.type,
                    path: asset.path,
                    required: asset.type === 'stimulus' || asset.type === 'option'
                });
            }
        });
        
        const criticalMissing = missing.filter(m => m.required);
        
        return {
            allLoaded: missing.length === 0,
            allCriticalLoaded: criticalMissing.length === 0,
            missing,
            criticalMissing
        };
    }
    
    /**
     * Créer un log de session pour debugging
     */
    static createSessionLog(question, userAnswer, permutation) {
        return {
            timestamp: new Date().toISOString(),
            qid: question.qid,
            version: question.version,
            alphabet: question.alphabet,
            permutation,
            userAnswer: {
                selectedOption: userAnswer.selectedOption,
                timeUsed: userAnswer.timeUsed
            },
            validation: this.validateQuestionReady(question)
        };
    }
}

/**
 * Hook React pour valider une question
 */
export function useQuestionValidation(question) {
    const [validation, setValidation] = useState(null);
    const [safeQuestion, setSafeQuestion] = useState(null);
    
    useEffect(() => {
        if (!question) {
            setValidation(null);
            setSafeQuestion(null);
            return;
        }
        
        const result = QuestionValidator.validateQuestionReady(question);
        setValidation(result);
        
        if (result.isValid) {
            setSafeQuestion(QuestionValidator.createSafeQuestion(question));
        } else {
            setSafeQuestion(null);
        }
    }, [question]);
    
    return {
        validation,
        safeQuestion,
        isReady: validation?.isValid || false,
        errors: validation?.errors || [],
        warnings: validation?.warnings || []
    };
}

export default QuestionValidator;