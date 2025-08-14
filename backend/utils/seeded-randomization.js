/**
 * 🎲 SYSTÈME DE RANDOMISATION SEEDÉE
 * ==================================
 * 
 * Génération d'ordres d'options stables et reproductibles basés sur :
 * - qid (identifiant question)
 * - session_id (session utilisateur)  
 * - seed global (pour A/B testing)
 * 
 * Garantit que chaque utilisateur voit toujours les mêmes options
 * dans le même ordre pour analyses comportementales stables.
 */

const crypto = require('crypto');

class SeededRandomization {
    
    /**
     * Générer un seed déterministe basé sur qid + session
     */
    static generateSeed(qid, sessionId, globalSeed = 'testiq-v4.1') {
        const combined = `${globalSeed}:${qid}:${sessionId}`;
        return crypto.createHash('sha256').update(combined).digest('hex').slice(0, 8);
    }
    
    /**
     * Générateur de nombres pseudo-aléatoires seedé (algorithme LCG)
     */
    static createSeededRandom(seed) {
        // Convertir seed hexadécimal en nombre
        const numericSeed = parseInt(seed, 16) % 2147483647;
        let state = numericSeed > 0 ? numericSeed : 1;
        
        return function() {
            state = (state * 16807) % 2147483647;
            return (state - 1) / 2147483646;
        };
    }
    
    /**
     * Mélanger un tableau avec un seed donné (Fisher-Yates seedé)
     */
    static shuffleWithSeed(array, seed) {
        if (!Array.isArray(array) || array.length === 0) {
            return { shuffled: [], permutation: [] };
        }
        
        const shuffled = [...array];
        const permutation = [];
        const random = this.createSeededRandom(seed);
        
        // Enregistrer l'ordre original pour traçabilité
        const originalIndices = shuffled.map((_, index) => index);
        
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            
            // Échanger éléments
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            [originalIndices[i], originalIndices[j]] = [originalIndices[j], originalIndices[i]];
        }
        
        // Créer mapping A,B,C,D → indices originaux
        permutation.push(...originalIndices.map((originalIndex, newPosition) => ({
            displayPosition: String.fromCharCode(65 + newPosition), // A, B, C, D
            originalIndex,
            originalKey: array[originalIndex]?.key || String.fromCharCode(65 + originalIndex)
        })));
        
        return { shuffled, permutation, seed };
    }
    
    /**
     * Randomiser les options d'une question pour un utilisateur
     */
    static randomizeQuestionOptions(question, sessionId, config = {}) {
        const {
            preserveCorrectAnswer = false,
            globalSeed = 'testiq-v4.1',
            logPermutation = true
        } = config;
        
        if (!question.options || !Array.isArray(question.options)) {
            return {
                ...question,
                randomization: {
                    error: 'No valid options to randomize',
                    applied: false
                }
            };
        }
        
        const qid = question.qid || question.id || 'unknown';
        const seed = this.generateSeed(qid, sessionId, globalSeed);
        
        // Identifier la réponse correcte avant randomisation
        const originalCorrectIndex = question.options.findIndex(opt => opt.isCorrect);
        const originalCorrectKey = question.options[originalCorrectIndex]?.key;
        
        // Randomiser les options
        const { shuffled, permutation } = this.shuffleWithSeed(question.options, seed);
        
        // Trouver la nouvelle position de la réponse correcte
        const newCorrectIndex = shuffled.findIndex(opt => opt.isCorrect);
        const newCorrectKey = String.fromCharCode(65 + newCorrectIndex); // A, B, C, D
        
        // Mettre à jour les clés des options (A, B, C, D)
        const randomizedOptions = shuffled.map((option, index) => ({
            ...option,
            key: String.fromCharCode(65 + index),
            originalKey: option.key,
            originalIndex: question.options.findIndex(opt => opt === option)
        }));
        
        const randomization = {
            applied: true,
            seed,
            sessionId,
            qid,
            permutation,
            originalCorrectIndex,
            originalCorrectKey,
            newCorrectIndex,
            newCorrectKey,
            timestamp: new Date().toISOString()
        };
        
        // Log pour analyses comportementales
        if (logPermutation) {
            console.log(`🎲 Randomization applied: ${qid} | Session: ${sessionId.slice(0, 8)} | Seed: ${seed}`);
            console.log(`   Correct answer: ${originalCorrectKey} → ${newCorrectKey} (${originalCorrectIndex} → ${newCorrectIndex})`);
        }
        
        return {
            ...question,
            options: randomizedOptions,
            correctAnswer: newCorrectIndex,
            randomization
        };
    }
    
    /**
     * Batch randomization pour plusieurs questions
     */
    static randomizeQuestionBatch(questions, sessionId, config = {}) {
        if (!Array.isArray(questions)) {
            return { questions: [], errors: ['Invalid questions array'] };
        }
        
        const results = [];
        const errors = [];
        
        questions.forEach((question, index) => {
            try {
                const randomized = this.randomizeQuestionOptions(question, sessionId, config);
                results.push(randomized);
            } catch (error) {
                errors.push(`Question ${index}: ${error.message}`);
                results.push(question); // Fallback vers question originale
            }
        });
        
        return {
            questions: results,
            errors,
            summary: {
                total: questions.length,
                randomized: results.filter(q => q.randomization?.applied).length,
                failed: errors.length,
                sessionId,
                timestamp: new Date().toISOString()
            }
        };
    }
    
    /**
     * Décoder une réponse utilisateur vers l'index original
     */
    static decodeUserAnswer(randomizedQuestion, userAnswerKey) {
        if (!randomizedQuestion.randomization?.applied) {
            // Pas de randomisation, retourner l'index direct
            return {
                originalIndex: userAnswerKey.charCodeAt(0) - 65,
                decodedSuccessfully: true,
                wasRandomized: false
            };
        }
        
        const { permutation } = randomizedQuestion.randomization;
        const userIndex = userAnswerKey.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        
        if (userIndex < 0 || userIndex >= permutation.length) {
            return {
                originalIndex: -1,
                decodedSuccessfully: false,
                error: `Invalid answer key: ${userAnswerKey}`
            };
        }
        
        return {
            originalIndex: permutation[userIndex].originalIndex,
            originalKey: permutation[userIndex].originalKey,
            decodedSuccessfully: true,
            wasRandomized: true,
            randomization: randomizedQuestion.randomization
        };
    }
    
    /**
     * Valider qu'une randomisation est stable (même seed = même résultat)
     */
    static validateStability(question, sessionId, iterations = 10) {
        const firstResult = this.randomizeQuestionOptions(question, sessionId, { logPermutation: false });
        
        for (let i = 1; i < iterations; i++) {
            const nextResult = this.randomizeQuestionOptions(question, sessionId, { logPermutation: false });
            
            // Vérifier que les permutations sont identiques
            const firstPerm = JSON.stringify(firstResult.randomization.permutation);
            const nextPerm = JSON.stringify(nextResult.randomization.permutation);
            
            if (firstPerm !== nextPerm) {
                return {
                    stable: false,
                    error: `Instability detected at iteration ${i}`,
                    firstSeed: firstResult.randomization.seed,
                    nextSeed: nextResult.randomization.seed
                };
            }
        }
        
        return {
            stable: true,
            iterations,
            seed: firstResult.randomization.seed,
            message: 'Randomization is stable across multiple calls'
        };
    }
    
    /**
     * Générer rapport de randomisation pour debugging
     */
    static generateRandomizationReport(questions, sessionId) {
        const report = {
            sessionId,
            timestamp: new Date().toISOString(),
            summary: {
                totalQuestions: questions.length,
                randomized: 0,
                stable: 0,
                errors: []
            },
            details: []
        };
        
        questions.forEach((question, index) => {
            try {
                const randomized = this.randomizeQuestionOptions(question, sessionId, { logPermutation: false });
                const stability = this.validateStability(question, sessionId, 3);
                
                if (randomized.randomization?.applied) {
                    report.summary.randomized++;
                }
                
                if (stability.stable) {
                    report.summary.stable++;
                }
                
                report.details.push({
                    questionIndex: index,
                    qid: question.qid,
                    randomized: randomized.randomization?.applied || false,
                    stable: stability.stable,
                    seed: randomized.randomization?.seed,
                    permutation: randomized.randomization?.permutation,
                    correctAnswerShift: `${randomized.randomization?.originalCorrectKey} → ${randomized.randomization?.newCorrectKey}`
                });
                
            } catch (error) {
                report.summary.errors.push(`Question ${index}: ${error.message}`);
            }
        });
        
        return report;
    }
}

module.exports = SeededRandomization;