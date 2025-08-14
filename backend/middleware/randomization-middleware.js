/**
 * 🎲 MIDDLEWARE RANDOMISATION QUESTIONS
 * ===================================== 
 * 
 * Middleware Express qui applique la randomisation seedée
 * automatiquement sur les endpoints de questions.
 */

const SeededRandomization = require('../utils/seeded-randomization');

class RandomizationMiddleware {
    
    /**
     * Middleware pour randomiser une question unique
     */
    static randomizeQuestion(req, res, next) {
        // Récupérer l'ID de session depuis les headers ou générer un
        const sessionId = req.headers['x-session-id'] || 
                         req.session?.id || 
                         req.user?.id || 
                         req.ip || 
                         'anonymous';
        
        // Configuration depuis query params ou headers
        const config = {
            preserveCorrectAnswer: req.query.preserve_correct === 'true',
            globalSeed: req.headers['x-randomization-seed'] || 'testiq-v4.1',
            logPermutation: process.env.NODE_ENV !== 'production'
        };
        
        // Stocker la configuration dans req pour usage ultérieur
        req.randomization = {
            sessionId,
            config,
            enabled: req.query.randomize !== 'false' // Activé par défaut
        };
        
        next();
    }
    
    /**
     * Appliquer randomisation sur une réponse de question unique
     */
    static applyToSingleQuestion(req, res, next) {
        // Intercepter la réponse
        const originalJson = res.json;
        
        res.json = function(data) {
            try {
                // Si pas de randomisation demandée
                if (!req.randomization?.enabled) {
                    return originalJson.call(this, data);
                }
                
                // Si c'est une question avec options
                if (data && data.options && Array.isArray(data.options)) {
                    const randomized = SeededRandomization.randomizeQuestionOptions(
                        data, 
                        req.randomization.sessionId, 
                        req.randomization.config
                    );
                    
                    return originalJson.call(this, randomized);
                }
                
                // Retourner données inchangées si pas applicable
                return originalJson.call(this, data);
                
            } catch (error) {
                console.error('🚨 Randomization error:', error);
                // Fallback vers données originales en cas d'erreur
                return originalJson.call(this, data);
            }
        };
        
        next();
    }
    
    /**
     * Appliquer randomisation sur un batch de questions
     */
    static applyToBatch(req, res, next) {
        const originalJson = res.json;
        
        res.json = function(data) {
            try {
                if (!req.randomization?.enabled) {
                    return originalJson.call(this, data);
                }
                
                // Si c'est un array de questions
                if (Array.isArray(data) && data.length > 0 && data[0].options) {
                    const batchResult = SeededRandomization.randomizeQuestionBatch(
                        data,
                        req.randomization.sessionId,
                        req.randomization.config
                    );
                    
                    // Ajouter metadata de randomisation
                    const response = {
                        questions: batchResult.questions,
                        randomization: {
                            applied: true,
                            summary: batchResult.summary,
                            errors: batchResult.errors
                        }
                    };
                    
                    return originalJson.call(this, response);
                }
                
                // Si c'est un objet avec propriété questions
                if (data && data.questions && Array.isArray(data.questions)) {
                    const batchResult = SeededRandomization.randomizeQuestionBatch(
                        data.questions,
                        req.randomization.sessionId,
                        req.randomization.config
                    );
                    
                    return originalJson.call(this, {
                        ...data,
                        questions: batchResult.questions,
                        randomization: {
                            applied: true,
                            summary: batchResult.summary,
                            errors: batchResult.errors
                        }
                    });
                }
                
                return originalJson.call(this, data);
                
            } catch (error) {
                console.error('🚨 Batch randomization error:', error);
                return originalJson.call(this, data);
            }
        };
        
        next();
    }
    
    /**
     * Decoder les réponses utilisateur vers indices originaux
     */
    static decodeUserAnswer(req, res, next) {
        // Si body contient une réponse utilisateur
        if (req.body && req.body.userAnswer && req.body.questionData) {
            try {
                const decoded = SeededRandomization.decodeUserAnswer(
                    req.body.questionData,
                    req.body.userAnswer
                );
                
                // Ajouter info de décodage
                req.body.decodedAnswer = decoded;
                
                console.log(`🔍 Answer decoded: ${req.body.userAnswer} → original index ${decoded.originalIndex}`);
                
            } catch (error) {
                console.error('🚨 Answer decoding error:', error);
                req.body.decodedAnswer = {
                    error: error.message,
                    decodedSuccessfully: false
                };
            }
        }
        
        next();
    }
    
    /**
     * Endpoint pour rapport de randomisation (debugging)
     */
    static async generateReport(req, res) {
        try {
            const { sessionId, questionIds } = req.body;
            
            if (!sessionId || !Array.isArray(questionIds)) {
                return res.status(400).json({
                    error: 'sessionId and questionIds array required'
                });
            }
            
            // Récupérer questions (simplifié - adapter selon votre DB)
            const questions = questionIds.map(id => ({
                qid: id,
                options: [
                    { key: 'A', text: 'Option A', isCorrect: false },
                    { key: 'B', text: 'Option B', isCorrect: true },
                    { key: 'C', text: 'Option C', isCorrect: false },
                    { key: 'D', text: 'Option D', isCorrect: false }
                ]
            }));
            
            const report = SeededRandomization.generateRandomizationReport(questions, sessionId);
            
            res.json({
                success: true,
                report,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            res.status(500).json({
                error: 'Failed to generate randomization report',
                message: error.message
            });
        }
    }
    
    /**
     * Endpoint pour validation de stabilité
     */
    static async validateStability(req, res) {
        try {
            const { sessionId, testQuestion, iterations = 10 } = req.body;
            
            if (!sessionId || !testQuestion) {
                return res.status(400).json({
                    error: 'sessionId and testQuestion required'
                });
            }
            
            const stability = SeededRandomization.validateStability(
                testQuestion, 
                sessionId, 
                iterations
            );
            
            res.json({
                success: true,
                stability,
                sessionId,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            res.status(500).json({
                error: 'Failed to validate stability',
                message: error.message
            });
        }
    }
}

module.exports = RandomizationMiddleware;