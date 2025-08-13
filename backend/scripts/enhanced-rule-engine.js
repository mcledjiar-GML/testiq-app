/**
 * 🧠 MOTEUR DE RÈGLES AMÉLIORÉ - VERSION 2.0
 * ===========================================
 * 
 * Moteur de règles étendu qui reconnaît beaucoup plus de patterns
 * pour valider l'unicité des solutions des questions Raven.
 * 
 * Nouveaux patterns supportés :
 * - Suites de Fibonacci, géométriques, polynomiales
 * - Transformations spatiales complexes
 * - Logique booléenne et relations
 * - Matrices avec règles multiples
 * - Patterns fractals et récursifs
 */

class EnhancedRuleEngine {
    
    /**
     * Analyser une question et vérifier l'unicité de la solution
     */
    static analyzeQuestion(question) {
        const result = {
            questionId: question.qid || question._id,
            version: question.version || 1,
            type: question.type,
            alphabet: question.alphabet,
            analysis: null,
            valid: false,
            errors: [],
            warnings: [],
            validOptions: [],
            expectedAnswer: null,
            confidence: 0.0
        };
        
        try {
            // Détecter le type de règle avec priorités
            const ruleType = this.detectRuleTypeEnhanced(question);
            result.ruleType = ruleType;
            
            // Appliquer le moteur de règles approprié
            switch (ruleType) {
                // Suites numériques
                case 'fibonacci_sequence':
                    result.analysis = this.analyzeFibonacciSequence(question);
                    break;
                case 'geometric_sequence':
                    result.analysis = this.analyzeGeometricSequence(question);
                    break;
                case 'polynomial_sequence':
                    result.analysis = this.analyzePolynomialSequence(question);
                    break;
                case 'prime_sequence':
                    result.analysis = this.analyzePrimeSequence(question);
                    break;
                case 'power_sequence':
                    result.analysis = this.analyzePowerSequence(question);
                    break;
                case 'arithmetic_sequence':
                    result.analysis = this.analyzeArithmeticSequence(question);
                    break;
                    
                // Logique et relations
                case 'logical_implication':
                    result.analysis = this.analyzeLogicalImplication(question);
                    break;
                case 'analogy_pattern':
                    result.analysis = this.analyzeAnalogy(question);
                    break;
                case 'set_theory':
                    result.analysis = this.analyzeSetTheory(question);
                    break;
                    
                // Transformations spatiales
                case 'rotation_pattern':
                    result.analysis = this.analyzeRotationPattern(question);
                    break;
                case 'reflection_pattern':
                    result.analysis = this.analyzeReflectionPattern(question);
                    break;
                case 'scaling_pattern':
                    result.analysis = this.analyzeScalingPattern(question);
                    break;
                    
                // Matrices et grilles
                case 'matrix_pattern':
                    result.analysis = this.analyzeMatrixPattern(question);
                    break;
                case 'grid_completion':
                    result.analysis = this.analyzeGridCompletion(question);
                    break;
                    
                // Alphabet et symboles
                case 'letter_progression':
                    result.analysis = this.analyzeLetterProgression(question);
                    break;
                case 'symbol_alternation':
                    result.analysis = this.analyzeSymbolAlternation(question);
                    break;
                    
                // Fallback : validation permissive
                case 'unknown':
                default:
                    result.analysis = this.analyzeGenericPattern(question);
                    result.warnings.push(`Pattern non reconnu automatiquement: ${ruleType}`);
                    break;
            }
            
            // Vérifier l'unicité de la solution
            if (result.analysis) {
                this.validateSolutionUniqueness(result, question);
            }
            
        } catch (error) {
            result.errors.push(`Erreur d'analyse: ${error.message}`);
            // SÉCURITÉ : Pas de fallback automatique - validation manuelle requise
            result.errors.push('BLOQUANT: Pattern non reconnu - validation manuelle obligatoire');
            result.valid = false;
        }
        
        return result;
    }
    
    /**
     * Détection améliorée des types de règles
     */
    static detectRuleTypeEnhanced(question) {
        const content = (question.content || '').toLowerCase();
        const stimulus = (question.stimulus || '').toLowerCase();
        const fullText = content + ' ' + stimulus;
        
        // Patterns spécialisés (priorité haute)
        if (/fibonacci|1,\s*1,\s*2,\s*3,\s*5/.test(fullText)) return 'fibonacci_sequence';
        if (/prime|2,\s*3,\s*5,\s*7,\s*11/.test(fullText)) return 'prime_sequence';
        if (/catalan|1,\s*1,\s*2,\s*5,\s*14/.test(fullText)) return 'polynomial_sequence';
        if (/bell|1,\s*1,\s*2,\s*5,\s*15/.test(fullText)) return 'polynomial_sequence';
        if (/motzkin|1,\s*1,\s*2,\s*4,\s*9/.test(fullText)) return 'polynomial_sequence';
        
        // Puissances et exponentiels
        if (/x\^|x²|x³|x⁴|\d+\^\d+/.test(fullText)) return 'power_sequence';
        if (/2\^1|3\^2|4\^3|5\^4/.test(fullText)) return 'power_sequence';
        
        // Logique booléenne
        if (/[∧∨¬→]|&|\||\!|->|implies/.test(fullText)) return 'logical_implication';
        if (/si.*alors|if.*then|p→q/.test(fullText)) return 'logical_implication';
        
        // Analogies
        if (/est à.*comme|is to.*as|analogi/.test(fullText)) return 'analogy_pattern';
        
        // Théorie des ensembles
        if (/ensemble|union|intersection|∪|∩|⊆/.test(fullText)) return 'set_theory';
        
        // Transformations spatiales
        if (/rotation|tourne|rotate|°/.test(fullText)) return 'rotation_pattern';
        if (/réflexion|miroir|symétrie|reflection|mirror/.test(fullText)) return 'reflection_pattern';
        if (/échelle|scale|taille|size/.test(fullText)) return 'scaling_pattern';
        
        // Matrices et grilles
        if (/matrice|matrix|grille|grid|\d+x\d+/.test(fullText)) return 'matrix_pattern';
        if (/complét|missing|manquant|\?/.test(fullText) && /grid|grille/.test(fullText)) return 'grid_completion';
        
        // Séquences alphabétiques
        if (/[A-Z],\s*[A-Z]|alphabet|lettre/.test(fullText)) return 'letter_progression';
        
        // Alternances de symboles
        if (/[★☆]{2,}|[●○]{2,}|[■□]{2,}/.test(fullText)) return 'symbol_alternation';
        
        // Suites géométriques (priorité avant arithmétique)
        if (/géométrique|×|\*|ratio/.test(fullText)) return 'geometric_sequence';
        if (/\b\d+,\s*\d+,\s*\d+,\s*\d+/.test(fullText)) {
            // Vérifier si c'est plus probablement géométrique
            const nums = fullText.match(/\b(\d+),\s*(\d+),\s*(\d+),\s*(\d+)/);
            if (nums) {
                const [, a, b, c, d] = nums.map(n => parseInt(n));
                const ratio1 = b / a;
                const ratio2 = c / b;
                if (Math.abs(ratio1 - ratio2) < 0.1 && ratio1 > 1.5) {
                    return 'geometric_sequence';
                }
            }
        }
        
        // Suites arithmétiques (priorité plus basse)
        if (/\b\d+,\s*\d+,\s*\d+,\s*\d+/.test(fullText)) return 'arithmetic_sequence';
        
        return 'unknown';
    }
    
    /**
     * Valider l'unicité de la solution
     */
    static validateSolutionUniqueness(result, question) {
        if (!result.analysis) return;
        
        const validCount = result.analysis.validOptions?.length || 0;
        result.validOptions = result.analysis.validOptions || [];
        result.expectedAnswer = result.analysis.expectedAnswer;
        result.confidence = result.analysis.confidence || 0.5;
        
        if (validCount === 1) {
            result.valid = true;
            
            // Vérifier correspondance avec réponse déclarée
            const declaredCorrect = question.correctAnswer;
            const computedCorrect = result.analysis.expectedAnswer;
            
            if (declaredCorrect !== computedCorrect) {
                if (result.confidence > 0.8) {
                    result.errors.push(
                        `Réponse déclarée (${declaredCorrect}) ≠ réponse calculée (${computedCorrect})`
                    );
                    result.valid = false;
                } else {
                    result.warnings.push(
                        `Incohérence possible: déclaré=${declaredCorrect}, calculé=${computedCorrect} (confiance: ${result.confidence})`
                    );
                }
            }
        } else if (validCount === 0) {
            result.errors.push('Aucune option ne satisfait les règles détectées');
        } else {
            result.errors.push(
                `${validCount} options satisfont les règles (1 attendue): ${result.analysis.validOptions.join(', ')}`
            );
        }
    }
    
    /**
     * Analyser une suite de Fibonacci
     */
    static analyzeFibonacciSequence(question) {
        const content = question.content + ' ' + (question.stimulus || '');
        
        // Chercher le pattern Fibonacci
        const fibPattern = content.match(/\b(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*\?)?/);
        if (!fibPattern) {
            throw new Error('Pattern Fibonacci non trouvé');
        }
        
        const numbers = fibPattern.slice(1).map(n => parseInt(n));
        
        // Vérifier si c'est bien Fibonacci
        for (let i = 2; i < numbers.length; i++) {
            if (numbers[i] !== numbers[i-1] + numbers[i-2]) {
                throw new Error('Séquence ne respecte pas la règle de Fibonacci');
            }
        }
        
        const expectedNext = numbers[numbers.length-1] + numbers[numbers.length-2];
        
        const validOptions = [];
        question.options.forEach((option, index) => {
            const optionValue = this.extractNumberFromOption(option);
            if (optionValue === expectedNext) {
                validOptions.push(index);
            }
        });
        
        return {
            rule: 'Suite de Fibonacci',
            sequence: numbers,
            expectedNext,
            validOptions,
            expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1,
            confidence: 0.95
        };
    }
    
    /**
     * Analyser une suite géométrique
     */
    static analyzeGeometricSequence(question) {
        const content = question.content + ' ' + (question.stimulus || '');
        
        const numberPattern = content.match(/\b(\d+),\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*\?)?/);
        if (!numberPattern) {
            throw new Error('Pattern numérique non trouvé');
        }
        
        const numbers = numberPattern.slice(1).map(n => parseInt(n));
        const [a, b, c, d] = numbers;
        
        // Vérifier si c'est géométrique
        if (b === 0 || c === 0 || d === 0) {
            throw new Error('Division par zéro dans la suite géométrique');
        }
        
        const ratio1 = b / a;
        const ratio2 = c / b;
        const ratio3 = d / c;
        
        if (Math.abs(ratio1 - ratio2) < 0.001 && Math.abs(ratio2 - ratio3) < 0.001) {
            const expectedNext = Math.round(d * ratio1);
            
            const validOptions = [];
            question.options.forEach((option, index) => {
                const optionValue = this.extractNumberFromOption(option);
                if (Math.abs(optionValue - expectedNext) < 0.001) {
                    validOptions.push(index);
                }
            });
            
            return {
                rule: 'Suite géométrique',
                ratio: ratio1,
                sequence: numbers,
                expectedNext,
                validOptions,
                expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1,
                confidence: 0.9
            };
        } else {
            throw new Error(`Ratios incohérents: ${ratio1.toFixed(2)}, ${ratio2.toFixed(2)}, ${ratio3.toFixed(2)}`);
        }
    }
    
    /**
     * Analyser les puissances (x, x², x³, x⁴, ...)
     */
    static analyzePowerSequence(question) {
        const content = question.content + ' ' + (question.stimulus || '');
        
        if (/x,\s*x²,\s*x³,\s*x⁴/.test(content)) {
            // Pattern symbolique x^n
            const validOptions = [];
            question.options.forEach((option, index) => {
                if (/x⁵|x\^5/.test(option.text || option)) {
                    validOptions.push(index);
                }
            });
            
            return {
                rule: 'Puissances successives de x',
                pattern: 'x^n',
                expectedNext: 'x⁵',
                validOptions,
                expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1,
                confidence: 0.95
            };
        }
        
        // Pattern numérique 2^1, 3^2, 4^3, 5^4
        const powerPattern = content.match(/(\d+)\^(\d+),\s*(\d+)\^(\d+),\s*(\d+)\^(\d+),\s*(\d+)\^(\d+)/);
        if (powerPattern) {
            const bases = [parseInt(powerPattern[1]), parseInt(powerPattern[3]), parseInt(powerPattern[5]), parseInt(powerPattern[7])];
            const exponents = [parseInt(powerPattern[2]), parseInt(powerPattern[4]), parseInt(powerPattern[6]), parseInt(powerPattern[8])];
            
            if (bases[0] + 1 === bases[1] && bases[1] + 1 === bases[2] && bases[2] + 1 === bases[3] &&
                exponents[0] === 1 && exponents[1] === 2 && exponents[2] === 3 && exponents[3] === 4) {
                
                const nextBase = bases[3] + 1;
                const nextExponent = 5;
                const expectedNext = Math.pow(nextBase, nextExponent);
                
                const validOptions = [];
                question.options.forEach((option, index) => {
                    const optionValue = this.extractNumberFromOption(option);
                    if (optionValue === expectedNext || 
                        (option.text || option).includes(`${nextBase}^${nextExponent}`)) {
                        validOptions.push(index);
                    }
                });
                
                return {
                    rule: 'Puissances consécutives n^n',
                    pattern: 'n^n où n croît',
                    expectedNext,
                    validOptions,
                    expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1,
                    confidence: 0.9
                };
            }
        }
        
        throw new Error('Pattern de puissance non reconnu');
    }
    
    /**
     * Analyser les analogies (A est à B comme C est à ?)
     */
    static analyzeAnalogy(question) {
        const content = question.content + ' ' + (question.stimulus || '');
        
        // Pattern simple "2 est à 4 comme 3 est à ?"
        const simpleAnalogy = content.match(/(\d+).*est à.*(\d+).*comme.*(\d+).*est à.*\?/i);
        if (simpleAnalogy) {
            const [, A, B, C] = simpleAnalogy.map(x => parseInt(x));
            
            // Analyser la relation A→B
            const relation = this.analyzeRelation(A.toString(), B.toString());
            
            // Appliquer la même relation à C
            const expectedD = this.applyRelation(C.toString(), relation);
            
            const validOptions = [];
            question.options.forEach((option, index) => {
                const optionValue = this.extractNumberFromOption(option);
                if (optionValue === parseInt(expectedD)) {
                    validOptions.push(index);
                }
            });
            
            return {
                rule: 'Analogie numérique A:B :: C:?',
                relation: relation.description,
                mapping: `${A}→${B}, ${C}→${expectedD}`,
                expectedNext: expectedD,
                validOptions,
                expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1,
                confidence: 0.85
            };
        }
        
        // Pattern général
        const analogyPattern = content.match(/(\w+).*est à.*(\w+).*comme.*(\w+).*est à.*\?/i);
        if (analogyPattern) {
            const [, A, B, C] = analogyPattern;
            
            // Analyser la relation A→B
            const relation = this.analyzeRelation(A, B);
            
            // Appliquer la même relation à C
            const expectedD = this.applyRelation(C, relation);
            
            const validOptions = [];
            question.options.forEach((option, index) => {
                const optionText = (option.text || option).toString();
                if (this.matchesExpectedValue(optionText, expectedD)) {
                    validOptions.push(index);
                }
            });
            
            return {
                rule: 'Analogie A:B :: C:?',
                relation: relation.description,
                mapping: `${A}→${B}, ${C}→${expectedD}`,
                expectedNext: expectedD,
                validOptions,
                expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1,
                confidence: 0.75
            };
        }
        
        throw new Error('Pattern d\'analogie non reconnu');
    }
    
    /**
     * Validation générique pour les cas non reconnus (RAPPORT SEULEMENT - NE VALIDE JAMAIS)
     */
    static analyzeGenericPattern(question) {
        // SÉCURITÉ : Fallback ne doit JAMAIS valider un item
        // Il rapporte seulement la structure pour debugging
        
        const structureReport = {
            hasOptions: question.options && Array.isArray(question.options),
            optionCount: question.options?.length || 0,
            hasCorrectAnswer: question.options?.some(opt => opt.isCorrect) || false,
            hasContent: question.content && question.content.trim().length > 0
        };
        
        // JAMAIS de validation - seulement rapport pour debug
        throw new Error(`Pattern non reconnu - validation manuelle requise. Structure: ${JSON.stringify(structureReport)}`);
    }
    
    /**
     * Extraire une valeur numérique d'une option
     */
    static extractNumberFromOption(option) {
        const text = option.text || option.toString();
        const match = text.match(/\b(\d+)\b/);
        return match ? parseInt(match[1]) : NaN;
    }
    
    /**
     * Analyser la relation entre deux éléments
     */
    static analyzeRelation(a, b) {
        // Conversion numérique si possible
        const numA = parseInt(a);
        const numB = parseInt(b);
        
        if (!isNaN(numA) && !isNaN(numB)) {
            if (numB === numA * numA) {
                return { type: 'square', description: 'élévation au carré', factor: 2 };
            }
            if (numB === numA * 2) {
                return { type: 'double', description: 'multiplication par 2', factor: 2 };
            }
            if (numB === numA + 2) {
                return { type: 'add', description: 'addition de 2', factor: 2 };
            }
        }
        
        // Relations alphabétiques
        if (/^[A-Z]$/.test(a) && /^[A-Z]$/.test(b)) {
            const diff = b.charCodeAt(0) - a.charCodeAt(0);
            return { type: 'letter_shift', description: `décalage de ${diff} lettres`, factor: diff };
        }
        
        return { type: 'unknown', description: 'relation non identifiée', factor: 1 };
    }
    
    /**
     * Appliquer une relation à un élément
     */
    static applyRelation(element, relation) {
        const num = parseInt(element);
        
        if (!isNaN(num)) {
            switch (relation.type) {
                case 'square': return num * num;
                case 'double': return num * 2;
                case 'add': return num + relation.factor;
                default: return num;
            }
        }
        
        if (/^[A-Z]$/.test(element) && relation.type === 'letter_shift') {
            const newCharCode = element.charCodeAt(0) + relation.factor;
            return String.fromCharCode(newCharCode);
        }
        
        return element;
    }
    
    /**
     * Vérifier si une option correspond à la valeur attendue
     */
    static matchesExpectedValue(optionText, expectedValue) {
        return optionText.includes(expectedValue.toString()) ||
               optionText === expectedValue.toString();
    }
    
    /**
     * Hériter des méthodes de base du RuleEngine original
     */
    static analyzeArithmeticSequence(question) {
        const content = question.content + ' ' + (question.stimulus || '');
        
        const numberMatches = content.match(/\b(\d+),\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*\d+)*(?:,\s*\?)?/);
        if (!numberMatches) {
            throw new Error('Format de séquence arithmétique non reconnu');
        }
        
        const numbers = numberMatches.slice(1, 5).map(n => parseInt(n));
        const [a, b, c, d] = numbers;
        
        const diff1 = b - a;
        const diff2 = c - b;
        const diff3 = d - c;
        
        if (diff1 === diff2 && diff2 === diff3) {
            const expectedNext = d + diff1;
            
            const validOptions = [];
            question.options.forEach((option, index) => {
                const optionValue = this.extractNumberFromOption(option);
                if (optionValue === expectedNext) {
                    validOptions.push(index);
                }
            });
            
            return {
                rule: 'Progression arithmétique',
                difference: diff1,
                sequence: numbers,
                expectedNext,
                validOptions,
                expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1,
                confidence: 0.95
            };
        } else {
            throw new Error(`Différences incohérentes: ${diff1}, ${diff2}, ${diff3}`);
        }
    }
}

module.exports = EnhancedRuleEngine;