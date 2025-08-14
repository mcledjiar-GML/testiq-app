/**
 * 🎲 ROUTES RANDOMISATION ET A/B TESTING
 * ====================================
 * 
 * Endpoints pour gérer la randomisation seedée des questions
 * et l'A/B testing stable.
 */

const express = require('express');
const router = express.Router();
const RandomizationMiddleware = require('../middleware/randomization-middleware');
const SeededRandomization = require('../utils/seeded-randomization');

/**
 * POST /api/randomization/report
 * Générer un rapport de randomisation pour debugging
 */
router.post('/report', RandomizationMiddleware.generateReport);

/**
 * POST /api/randomization/validate-stability
 * Valider la stabilité de la randomisation
 */
router.post('/validate-stability', RandomizationMiddleware.validateStability);

/**
 * POST /api/randomization/test-question
 * Tester la randomisation sur une question spécifique
 */
router.post('/test-question', async (req, res) => {
    try {
        const { question, sessionId, config = {} } = req.body;
        
        if (!question || !sessionId) {
            return res.status(400).json({
                error: 'question and sessionId required'
            });
        }
        
        const randomized = SeededRandomization.randomizeQuestionOptions(
            question, 
            sessionId, 
            config
        );
        
        const stability = SeededRandomization.validateStability(
            question, 
            sessionId, 
            5
        );
        
        res.json({
            success: true,
            original: question,
            randomized,
            stability,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Randomization test failed',
            message: error.message
        });
    }
});

/**
 * POST /api/randomization/decode-answer
 * Décoder une réponse utilisateur vers l'index original
 */
router.post('/decode-answer', async (req, res) => {
    try {
        const { randomizedQuestion, userAnswer } = req.body;
        
        if (!randomizedQuestion || !userAnswer) {
            return res.status(400).json({
                error: 'randomizedQuestion and userAnswer required'
            });
        }
        
        const decoded = SeededRandomization.decodeUserAnswer(
            randomizedQuestion, 
            userAnswer
        );
        
        res.json({
            success: true,
            userAnswer,
            decoded,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Answer decoding failed',
            message: error.message
        });
    }
});

/**
 * GET /api/randomization/seeds/:sessionId
 * Générer seeds pour une session donnée (pour debugging)
 */
router.get('/seeds/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { qids, globalSeed } = req.query;
        
        if (!qids) {
            return res.status(400).json({
                error: 'qids query parameter required (comma-separated)'
            });
        }
        
        const questionIds = qids.split(',');
        const seeds = {};
        
        questionIds.forEach(qid => {
            seeds[qid] = SeededRandomization.generateSeed(
                qid, 
                sessionId, 
                globalSeed || 'testiq-v4.1'
            );
        });
        
        res.json({
            success: true,
            sessionId,
            globalSeed: globalSeed || 'testiq-v4.1',
            seeds,
            count: Object.keys(seeds).length,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Seed generation failed',
            message: error.message
        });
    }
});

/**
 * POST /api/randomization/batch-test
 * Tester randomisation sur un batch de questions
 */
router.post('/batch-test', async (req, res) => {
    try {
        const { questions, sessionId, config = {} } = req.body;
        
        if (!Array.isArray(questions) || !sessionId) {
            return res.status(400).json({
                error: 'questions array and sessionId required'
            });
        }
        
        const batchResult = SeededRandomization.randomizeQuestionBatch(
            questions, 
            sessionId, 
            config
        );
        
        // Tester stabilité sur échantillon
        const stabilityTests = questions.slice(0, 3).map(q => 
            SeededRandomization.validateStability(q, sessionId, 3)
        );
        
        res.json({
            success: true,
            batch: batchResult,
            stability: {
                tested: stabilityTests.length,
                stable: stabilityTests.filter(t => t.stable).length,
                details: stabilityTests
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'Batch randomization test failed',
            message: error.message
        });
    }
});

/**
 * GET /api/randomization/health
 * Health check pour le système de randomisation
 */
router.get('/health', async (req, res) => {
    try {
        // Test rapide avec question fictive
        const testQuestion = {
            qid: 'health-check-' + Date.now(),
            options: [
                { key: 'A', text: 'Test A', isCorrect: false },
                { key: 'B', text: 'Test B', isCorrect: true },
                { key: 'C', text: 'Test C', isCorrect: false },
                { key: 'D', text: 'Test D', isCorrect: false }
            ]
        };
        
        const testSessionId = 'health-check-session';
        
        // Test randomisation
        const randomized = SeededRandomization.randomizeQuestionOptions(
            testQuestion, 
            testSessionId, 
            { logPermutation: false }
        );
        
        // Test stabilité
        const stability = SeededRandomization.validateStability(
            testQuestion, 
            testSessionId, 
            3
        );
        
        // Test décodage
        const decoded = SeededRandomization.decodeUserAnswer(
            randomized, 
            'B'
        );
        
        const health = {
            status: 'healthy',
            randomization: {
                working: randomized.randomization?.applied || false,
                seed: randomized.randomization?.seed
            },
            stability: {
                stable: stability.stable,
                iterations: stability.iterations
            },
            decoding: {
                working: decoded.decodedSuccessfully,
                originalIndex: decoded.originalIndex
            },
            timestamp: new Date().toISOString()
        };
        
        res.json(health);
        
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;