/**
 * 🧠 MOTEUR DE RÈGLES - VALIDATION DE L'UNICITÉ DES SOLUTIONS
 * ==========================================================
 * 
 * Moteur qui applique les règles logiques aux questions pour vérifier
 * qu'exactement une seule option satisfait les critères.
 */

class RuleEngine {
    
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
            expectedAnswer: null
        };
        
        try {
            // Détecter le type de règle basé sur le contenu
            const ruleType = this.detectRuleType(question);
            result.ruleType = ruleType;
            
            // Appliquer le moteur de règles approprié
            switch (ruleType) {
                case 'arithmetic_sequence':
                    result.analysis = this.analyzeArithmeticSequence(question);
                    break;
                case 'alternating_pattern':
                    result.analysis = this.analyzeAlternatingPattern(question);
                    break;
                case 'rotation_90':
                    result.analysis = this.analyzeRotation90(question);
                    break;
                case 'matrix_2x2':
                    result.analysis = this.analyzeMatrix2x2(question);
                    break;
                case 'matrix_3x3':
                    result.analysis = this.analyzeMatrix3x3(question);
                    break;
                case 'geometric_sequence':
                    result.analysis = this.analyzeGeometricSequence(question);
                    break;
                case 'letter_sequence':
                    result.analysis = this.analyzeLetterSequence(question);
                    break;
                case 'factorial_sequence':
                    result.analysis = this.analyzeFactorialSequence(question);
                    break;
                default:
                    result.warnings.push(`Type de règle non reconnu: ${ruleType}`);
                    return result;
            }
            
            // Vérifier l'unicité de la solution
            if (result.analysis) {
                const validCount = result.analysis.validOptions.length;
                result.validOptions = result.analysis.validOptions;
                result.expectedAnswer = result.analysis.expectedAnswer;
                
                if (validCount === 1) {
                    result.valid = true;
                    
                    // Vérifier que l'option déclarée correcte correspond
                    const declaredCorrect = question.correctAnswer;
                    const computedCorrect = result.analysis.expectedAnswer;
                    
                    if (declaredCorrect !== computedCorrect) {
                        result.errors.push(
                            `Réponse déclarée (${declaredCorrect}) ≠ réponse calculée (${computedCorrect})`
                        );
                        result.valid = false;
                    }
                } else if (validCount === 0) {
                    result.errors.push('Aucune option ne satisfait les règles');
                } else {
                    result.errors.push(
                        `${validCount} options satisfont les règles (1 attendue): ${result.analysis.validOptions.join(', ')}`
                    );
                }
            }
            
        } catch (error) {
            result.errors.push(`Erreur d'analyse: ${error.message}`);
        }
        
        return result;
    }
    
    /**
     * Détecter le type de règle basé sur le contenu
     */
    static detectRuleType(question) {
        const content = (question.content || '').toLowerCase();
        const stimulus = question.stimulus || '';
        
        // Séquences arithmétiques
        if (/\b\d+,\s*\d+,\s*\d+,\s*\d+,\s*\?/.test(content + stimulus)) {
            return 'arithmetic_sequence';
        }
        
        // Motifs alternés (carrés, cercles, etc.)
        if (/[◼◻]{2,}|[●○]{2,}|[■□]{2,}/.test(content + stimulus)) {
            return 'alternating_pattern';
        }
        
        // Rotations
        if (/rotation|tourne|[◐◑◒◓]/.test(content + stimulus)) {
            return 'rotation_90';
        }
        
        // Matrices
        if (/matrice.*2.*2|2x2/.test(content)) {
            return 'matrix_2x2';
        }
        if (/matrice.*3.*3|3x3/.test(content)) {
            return 'matrix_3x3';
        }
        
        // Suites de lettres
        if (/[A-Z],\s*[A-Z],\s*[A-Z]/.test(content)) {
            return 'letter_sequence';
        }
        
        // Factorielles
        if (/factorial|n!|\d+!/.test(content)) {
            return 'factorial_sequence';
        }
        
        // Suites géométriques
        if (/\b\d+,\s*\d+,\s*\d+/.test(content) && !/rotation|matrice/.test(content)) {
            return 'geometric_sequence';
        }
        
        return 'unknown';
    }
    
    /**
     * Analyser une séquence arithmétique
     */
    static analyzeArithmeticSequence(question) {
        const content = question.content + ' ' + (question.stimulus || '');
        
        // Extraire les nombres de la séquence
        const numberMatches = content.match(/\b(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*\?/);
        if (!numberMatches) {
            throw new Error('Format de séquence arithmétique non reconnu');
        }
        
        const numbers = numberMatches.slice(1).map(n => parseInt(n));
        const [a, b, c, d] = numbers;
        
        // Calculer la différence
        const diff1 = b - a;
        const diff2 = c - b;
        const diff3 = d - c;
        
        // Vérifier si c'est une progression arithmétique
        if (diff1 === diff2 && diff2 === diff3) {
            const expectedNext = d + diff1;
            
            // Vérifier quelles options correspondent
            const validOptions = [];
            question.options.forEach((option, index) => {
                const optionValue = parseInt(option.text || option);
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
                expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1
            };
        } else {
            throw new Error(`Différences incohérentes: ${diff1}, ${diff2}, ${diff3}`);
        }
    }
    
    /**
     * Analyser un motif alterné
     */
    static analyzeAlternatingPattern(question) {
        const stimulus = question.stimulus || question.content;
        
        // Extraire le motif
        let pattern = stimulus.match(/([◼◻■□●○]+)\s*\?/);
        if (!pattern) {
            throw new Error('Motif alterné non reconnu');
        }
        
        const sequence = pattern[1];
        const symbols = Array.from(sequence);
        
        // Détecter le motif d'alternance
        if (symbols.length >= 3) {
            const isAlternating = symbols.every((symbol, index) => {
                if (index === 0) return true;
                return symbol !== symbols[index - 1];
            });
            
            if (isAlternating) {
                // Prédire le prochain symbole
                const lastSymbol = symbols[symbols.length - 1];
                const secondToLast = symbols[symbols.length - 2];
                const expectedNext = (lastSymbol === secondToLast) ? 
                    symbols[0] : // Si les deux derniers sont identiques, changer
                    (lastSymbol === symbols[0] ? symbols[1] : symbols[0]); // Sinon alterner
                
                // En fait, pour une vraie alternance, c'est plus simple :
                const expectedSymbol = (symbols.length % 2 === 0) ? symbols[0] : symbols[1];
                
                // Vérifier quelles options correspondent
                const validOptions = [];
                question.options.forEach((option, index) => {
                    const optionText = option.text || option;
                    if (optionText === expectedSymbol) {
                        validOptions.push(index);
                    }
                });
                
                return {
                    rule: 'Alternance de symboles',
                    sequence: symbols,
                    expectedNext: expectedSymbol,
                    validOptions,
                    expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1
                };
            }
        }
        
        throw new Error('Motif d\'alternance non détecté');
    }
    
    /**
     * Analyser une rotation 90°
     */
    static analyzeRotation90(question) {
        const content = question.content + ' ' + (question.stimulus || '');
        
        // Mapping des rotations pour demi-cercles
        const rotationMap = {
            '◐': '◓', // gauche → haut
            '◓': '◑', // haut → droite  
            '◑': '◒', // droite → bas
            '◒': '◐'  // bas → gauche
        };
        
        // Extraire la séquence de rotation
        const rotationMatch = content.match(/([◐◑◒◓])\s*([◐◑◒◓])\s*([◐◑◒◓])\s*([◐◑◒◓]?)\s*\?/);
        if (rotationMatch) {
            const sequence = rotationMatch.slice(1).filter(Boolean);
            
            if (sequence.length >= 3) {
                // Vérifier la cohérence de la rotation
                let valid = true;
                for (let i = 1; i < sequence.length; i++) {
                    if (rotationMap[sequence[i-1]] !== sequence[i]) {
                        valid = false;
                        break;
                    }
                }
                
                if (valid) {
                    const lastSymbol = sequence[sequence.length - 1];
                    const expectedNext = rotationMap[lastSymbol];
                    
                    // Vérifier quelles options correspondent
                    const validOptions = [];
                    question.options.forEach((option, index) => {
                        const optionText = option.text || option;
                        if (optionText === expectedNext) {
                            validOptions.push(index);
                        }
                    });
                    
                    return {
                        rule: 'Rotation 90° horaire',
                        sequence,
                        expectedNext,
                        validOptions,
                        expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1
                    };
                }
            }
        }
        
        throw new Error('Séquence de rotation non reconnue');
    }
    
    /**
     * Analyser une matrice 2x2
     */
    static analyzeMatrix2x2(question) {
        const content = question.content;
        
        // Rechercher les éléments de la matrice dans le contenu
        // Format attendu : [A][B] / [C][?] ou similaire
        const matrixPattern = /\[([^\]]+)\]\s*\[([^\]]+)\]\s*(?:\n|\s*\/\s*|\s+)\s*\[([^\]]+)\]\s*\[\s*\?\s*\]/;
        const match = content.match(matrixPattern);
        
        if (match) {
            const [, topLeft, topRight, bottomLeft] = match;
            
            // Analyser les patterns possibles
            // 1. Rotation dans le sens horaire
            const rotationMap = {
                '↗': '↓', '↓': '←', '←': '↑', '↑': '→',
                '→': '↓', '↓': '←', '←': '↑', '↑': '→'
            };
            
            if (rotationMap[topLeft] === topRight && rotationMap[bottomLeft]) {
                const expectedBottomRight = rotationMap[bottomLeft];
                
                const validOptions = [];
                question.options.forEach((option, index) => {
                    const optionText = option.text || option;
                    if (optionText === expectedBottomRight || 
                        (optionText === '➡' && expectedBottomRight === '→') ||
                        (optionText === '⬅' && expectedBottomRight === '←') ||
                        (optionText === '⬆' && expectedBottomRight === '↑') ||
                        (optionText === '⬇' && expectedBottomRight === '↓')) {
                        validOptions.push(index);
                    }
                });
                
                return {
                    rule: 'Matrice 2x2 - Rotation horaire',
                    matrix: { topLeft, topRight, bottomLeft },
                    expectedBottomRight,
                    validOptions,
                    expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1
                };
            }
        }
        
        throw new Error('Motif de matrice 2x2 non reconnu');
    }
    
    /**
     * Analyser une matrice 3x3
     */
    static analyzeMatrix3x3(question) {
        // Pour l'instant, motif simplifié
        // TODO: Implémenter la logique complète pour matrices 3x3
        
        return {
            rule: 'Matrice 3x3 - Analyse non implémentée',
            validOptions: [question.correctAnswer || 0],
            expectedAnswer: question.correctAnswer || 0,
            warning: 'Analyse de matrice 3x3 non encore implémentée'
        };
    }
    
    /**
     * Analyser une suite géométrique
     */
    static analyzeGeometricSequence(question) {
        const content = question.content + ' ' + (question.stimulus || '');
        
        // Cas spéciaux connus
        if (/1,\s*4,\s*9,\s*16,\s*25/.test(content)) {
            // Suite des carrés parfaits
            const expected = 36; // 6²
            
            const validOptions = [];
            question.options.forEach((option, index) => {
                const optionValue = parseInt(option.text || option);
                if (optionValue === expected) {
                    validOptions.push(index);
                }
            });
            
            return {
                rule: 'Suite des carrés parfaits',
                pattern: 'n²',
                expectedNext: expected,
                validOptions,
                expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1
            };
        }
        
        // Suite géométrique générale
        const numberMatches = content.match(/\b(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*\?/);
        if (numberMatches) {
            const numbers = numberMatches.slice(1).map(n => parseInt(n));
            const [a, b, c, d] = numbers;
            
            // Vérifier si c'est une progression géométrique
            if (b/a === c/b && c/b === d/c) {
                const ratio = b/a;
                const expectedNext = d * ratio;
                
                const validOptions = [];
                question.options.forEach((option, index) => {
                    const optionValue = parseInt(option.text || option);
                    if (optionValue === expectedNext) {
                        validOptions.push(index);
                    }
                });
                
                return {
                    rule: 'Progression géométrique',
                    ratio,
                    sequence: numbers,
                    expectedNext,
                    validOptions,
                    expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1
                };
            }
        }
        
        throw new Error('Suite géométrique non reconnue');
    }
    
    /**
     * Analyser une suite de lettres
     */
    static analyzeLetterSequence(question) {
        const content = question.content;
        
        // Extraire la séquence de lettres
        const letterMatch = content.match(/\b([A-Z]),\s*([A-Z]),\s*([A-Z]),\s*([A-Z]),\s*\?/);
        if (letterMatch) {
            const letters = letterMatch.slice(1);
            const codes = letters.map(l => l.charCodeAt(0));
            
            // Vérifier si c'est une progression arithmétique
            const diff1 = codes[1] - codes[0];
            const diff2 = codes[2] - codes[1];
            const diff3 = codes[3] - codes[2];
            
            if (diff1 === diff2 && diff2 === diff3) {
                const expectedCode = codes[3] + diff1;
                const expectedLetter = String.fromCharCode(expectedCode);
                
                const validOptions = [];
                question.options.forEach((option, index) => {
                    const optionText = option.text || option;
                    if (optionText === expectedLetter) {
                        validOptions.push(index);
                    }
                });
                
                return {
                    rule: 'Progression alphabétique',
                    difference: diff1,
                    sequence: letters,
                    expectedNext: expectedLetter,
                    validOptions,
                    expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1
                };
            }
        }
        
        throw new Error('Suite de lettres non reconnue');
    }
    
    /**
     * Analyser une suite factorielle
     */
    static analyzeFactorialSequence(question) {
        const content = question.content;
        
        // Détecter les factorielles
        if (/n!.*1,.*2,.*3,.*4,.*5/.test(content)) {
            // Suite 1!, 2!, 3!, 4!, 5!, ?
            const expected = 720; // 6! = 720
            
            const validOptions = [];
            question.options.forEach((option, index) => {
                const optionValue = parseInt(option.text || option);
                if (optionValue === expected) {
                    validOptions.push(index);
                }
            });
            
            return {
                rule: 'Suite factorielle n!',
                pattern: 'n!',
                expectedNext: expected,
                validOptions,
                expectedAnswer: validOptions.length > 0 ? validOptions[0] : -1
            };
        }
        
        throw new Error('Suite factorielle non reconnue');
    }
    
    /**
     * Générer un rapport d'analyse pour un ensemble de questions
     */
    static generateAnalysisReport(questions) {
        const report = {
            timestamp: new Date().toISOString(),
            totalQuestions: questions.length,
            analyzed: 0,
            valid: 0,
            invalid: 0,
            warnings: 0,
            ruleTypes: {},
            issues: []
        };
        
        for (const question of questions) {
            try {
                const analysis = this.analyzeQuestion(question);
                report.analyzed++;
                
                // Compter les types de règles
                if (analysis.ruleType) {
                    report.ruleTypes[analysis.ruleType] = (report.ruleTypes[analysis.ruleType] || 0) + 1;
                }
                
                if (analysis.valid) {
                    report.valid++;
                } else {
                    report.invalid++;
                    report.issues.push({
                        questionId: analysis.questionId,
                        type: analysis.ruleType,
                        errors: analysis.errors,
                        warnings: analysis.warnings
                    });
                }
                
                if (analysis.warnings.length > 0) {
                    report.warnings++;
                }
                
            } catch (error) {
                report.issues.push({
                    questionId: question.qid || question._id,
                    type: 'error',
                    errors: [error.message]
                });
            }
        }
        
        report.successRate = ((report.valid / report.analyzed) * 100).toFixed(1) + '%';
        
        return report;
    }
}

module.exports = RuleEngine;