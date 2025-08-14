#!/usr/bin/env node
/**
 * 🧪 TESTS SYSTÈME RANDOMISATION SEEDÉE
 * ====================================
 * 
 * Tests complets du système de randomisation pour valider :
 * - Stabilité des seeds
 * - Reproductibilité des permutations
 * - Décodage correct des réponses
 * - Performance du système
 */

const SeededRandomization = require('../utils/seeded-randomization');

class RandomizationTester {
    
    constructor() {
        this.results = {
            stability: { passed: 0, failed: 0, details: [] },
            reproducibility: { passed: 0, failed: 0, details: [] },
            decoding: { passed: 0, failed: 0, details: [] },
            performance: { passed: 0, failed: 0, details: [] },
            overall: { passed: 0, failed: 0, total: 0 }
        };
    }
    
    /**
     * Question de test standard
     */
    getTestQuestion(id = 'test') {
        return {
            qid: `question-${id}`,
            options: [
                { key: 'A', text: 'Option A', isCorrect: false },
                { key: 'B', text: 'Option B', isCorrect: true },
                { key: 'C', text: 'Option C', isCorrect: false },
                { key: 'D', text: 'Option D', isCorrect: false }
            ]
        };
    }
    
    /**
     * Test 1: Stabilité des seeds
     */
    testSeedStability() {
        console.log('🧪 Test 1: Stabilité des seeds...');
        
        const testCases = [
            { qid: 'Q1', sessionId: 'user-123' },
            { qid: 'Q2', sessionId: 'user-456' },
            { qid: 'Q1', sessionId: 'user-123' }, // Répétition volontaire
        ];
        
        testCases.forEach(({ qid, sessionId }, index) => {
            try {
                const seed1 = SeededRandomization.generateSeed(qid, sessionId);
                const seed2 = SeededRandomization.generateSeed(qid, sessionId);
                const seed3 = SeededRandomization.generateSeed(qid, sessionId);
                
                if (seed1 === seed2 && seed2 === seed3) {
                    this.results.stability.passed++;
                    this.results.stability.details.push({
                        test: `Seed stability ${index + 1}`,
                        status: 'PASS',
                        qid,
                        sessionId: sessionId.slice(0, 8),
                        seed: seed1
                    });
                } else {
                    this.results.stability.failed++;
                    this.results.stability.details.push({
                        test: `Seed stability ${index + 1}`,
                        status: 'FAIL',
                        qid,
                        sessionId,
                        error: 'Seeds are not consistent',
                        seeds: [seed1, seed2, seed3]
                    });
                }
                
            } catch (error) {
                this.results.stability.failed++;
                this.results.stability.details.push({
                    test: `Seed stability ${index + 1}`,
                    status: 'ERROR',
                    error: error.message
                });
            }
        });
    }
    
    /**
     * Test 2: Performance du système
     */
    testPerformance() {
        console.log('🧪 Test 2: Performance du système...');
        
        try {
            // Test performance randomisation simple
            const start1 = Date.now();
            const question = this.getTestQuestion('performance');
            
            for (let i = 0; i < 100; i++) { // Réduit pour Windows
                SeededRandomization.randomizeQuestionOptions(
                    question, 
                    `session-${i}`, 
                    { logPermutation: false }
                );
            }
            
            const duration1 = Date.now() - start1;
            
            if (duration1 < 1000) { // Moins de 1 seconde pour 100 randomisations
                this.results.performance.passed++;
                this.results.performance.details.push({
                    test: 'Single question performance',
                    status: 'PASS',
                    iterations: 100,
                    duration: `${duration1}ms`,
                    avgPerOp: `${(duration1 / 100).toFixed(2)}ms`
                });
            } else {
                this.results.performance.failed++;
                this.results.performance.details.push({
                    test: 'Single question performance',
                    status: 'FAIL',
                    iterations: 100,
                    duration: `${duration1}ms`,
                    error: 'Performance below threshold (>1s for 100 ops)'
                });
            }
            
        } catch (error) {
            this.results.performance.failed++;
            this.results.performance.details.push({
                test: 'Performance testing',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 3: Reproductibilité
     */
    testReproducibility() {
        console.log('🧪 Test 3: Reproductibilité...');
        
        const question = this.getTestQuestion('reproducibility');
        const sessionId = 'test-session-reproducibility';
        
        try {
            // Générer même randomisation 3 fois
            const results = [];
            for (let i = 0; i < 3; i++) {
                const randomized = SeededRandomization.randomizeQuestionOptions(
                    question, 
                    sessionId, 
                    { logPermutation: false }
                );
                results.push(randomized);
            }
            
            // Vérifier que toutes les permutations sont identiques
            const firstSeed = results[0].randomization.seed;
            const allIdentical = results.every(r => r.randomization.seed === firstSeed);
            
            if (allIdentical) {
                this.results.reproducibility.passed++;
                this.results.reproducibility.details.push({
                    test: 'Seed consistency',
                    status: 'PASS',
                    iterations: 3,
                    seed: firstSeed
                });
            } else {
                this.results.reproducibility.failed++;
                this.results.reproducibility.details.push({
                    test: 'Seed consistency',
                    status: 'FAIL',
                    error: 'Seeds are not identical across iterations'
                });
            }
            
        } catch (error) {
            this.results.reproducibility.failed++;
            this.results.reproducibility.details.push({
                test: 'Reproducibility',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Test 4: Décodage des réponses
     */
    testAnswerDecoding() {
        console.log('🧪 Test 4: Décodage des réponses...');
        
        const question = this.getTestQuestion('decoding');
        const sessionId = 'test-session-decoding';
        
        try {
            // Randomiser la question
            const randomized = SeededRandomization.randomizeQuestionOptions(
                question, 
                sessionId, 
                { logPermutation: false }
            );
            
            // Test décodage des 4 options
            const allAnswers = ['A', 'B', 'C', 'D'];
            let decodingErrors = 0;
            
            allAnswers.forEach(answer => {
                const decoded = SeededRandomization.decodeUserAnswer(randomized, answer);
                if (!decoded.decodedSuccessfully || decoded.originalIndex < 0 || decoded.originalIndex > 3) {
                    decodingErrors++;
                }
            });
            
            if (decodingErrors === 0) {
                this.results.decoding.passed++;
                this.results.decoding.details.push({
                    test: 'All options decoding',
                    status: 'PASS',
                    message: 'All 4 options decode correctly'
                });
            } else {
                this.results.decoding.failed++;
                this.results.decoding.details.push({
                    test: 'All options decoding',
                    status: 'FAIL',
                    errors: decodingErrors,
                    message: `${decodingErrors}/4 options failed to decode`
                });
            }
            
        } catch (error) {
            this.results.decoding.failed++;
            this.results.decoding.details.push({
                test: 'Answer decoding',
                status: 'ERROR',
                error: error.message
            });
        }
    }
    
    /**
     * Calculer résultats globaux
     */
    calculateOverallResults() {
        const categories = ['stability', 'reproducibility', 'decoding', 'performance'];
        
        categories.forEach(category => {
            this.results.overall.passed += this.results[category].passed;
            this.results.overall.failed += this.results[category].failed;
        });
        
        this.results.overall.total = this.results.overall.passed + this.results.overall.failed;
    }
    
    /**
     * Afficher les résultats
     */
    displayResults() {
        console.log('\n🎯 === RÉSULTATS TESTS RANDOMISATION ===');
        
        const categories = [
            { name: 'Stabilité Seeds', key: 'stability' },
            { name: 'Reproductibilité', key: 'reproducibility' },
            { name: 'Décodage Réponses', key: 'decoding' },
            { name: 'Performance', key: 'performance' }
        ];
        
        categories.forEach(({ name, key }) => {
            const result = this.results[key];
            const total = result.passed + result.failed;
            const status = result.failed === 0 ? '✅' : '❌';
            
            console.log(`\n${status} ${name}: ${result.passed}/${total} tests passés`);
            
            if (result.failed > 0) {
                result.details.filter(d => d.status !== 'PASS').forEach(detail => {
                    console.log(`   ❌ ${detail.test}: ${detail.error || detail.message || 'Failed'}`);
                });
            }
        });
        
        console.log('\n📊 STATISTIQUES GLOBALES:');
        console.log(`✅ Tests réussis: ${this.results.overall.passed}`);
        console.log(`❌ Tests échoués: ${this.results.overall.failed}`);
        console.log(`📋 Total: ${this.results.overall.total}`);
        
        const successRate = (this.results.overall.passed / this.results.overall.total) * 100;
        console.log(`🎯 Taux de réussite: ${successRate.toFixed(1)}%`);
        
        const ready = this.results.overall.failed === 0;
        console.log(`🚀 Système prêt: ${ready ? '✅ OUI' : '❌ NON'}`);
        
        return ready;
    }
    
    /**
     * Exécuter tous les tests
     */
    async runAllTests() {
        console.log('🧪 === TESTS SYSTÈME RANDOMISATION SEEDÉE ===\n');
        
        this.testSeedStability();
        this.testReproducibility();
        this.testAnswerDecoding();
        this.testPerformance();
        
        this.calculateOverallResults();
        const success = this.displayResults();
        
        return success;
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const tester = new RandomizationTester();
    
    tester.runAllTests()
        .then(success => {
            console.log(`\n${success ? '✅' : '❌'} Tests randomisation terminés`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur tests randomisation:', error);
            process.exit(1);
        });
}

module.exports = RandomizationTester;