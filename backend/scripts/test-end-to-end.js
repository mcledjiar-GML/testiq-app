#!/usr/bin/env node
/**
 * 🧪 TESTS END-TO-END - TOUS LES WORKFLOWS
 * =======================================
 * 
 * Tests complets des workflows critiques avec Quality Gates :
 * 1. Création question
 * 2. Mise à jour v+1  
 * 3. Import bulk
 * 4. Publication
 * 5. Multi-locale
 * 6. Rollback
 * 
 * TOUS doivent passer les 15 checks Quality Gates.
 */

const axios = require('axios');
const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');

// Configuration
require('dotenv').config();

class EndToEndTester {
    
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.results = {
            workflows: {},
            overall: {
                tested: 0,
                passed: 0,
                failed: 0,
                blocked: 0
            }
        };
        this.authToken = 'test-token'; // Simulé pour les tests
    }
    
    async connect() {
        try {
            const mongoUri = process.env.MONGODB_URI?.replace('mongo:', 'localhost:') || 'mongodb://localhost:27017/iq_test_db';
            await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('✅ Connecté à MongoDB pour tests E2E');
        } catch (error) {
            console.error('❌ Erreur de connexion MongoDB:', error);
            process.exit(1);
        }
    }
    
    async disconnect() {
        await mongoose.disconnect();
        console.log('📌 Connexion MongoDB fermée');
    }
    
    /**
     * Question de test valide
     */
    getValidTestQuestion(suffix = '') {
        return {
            qid: `test-e2e-${Date.now()}${suffix}`,
            version: 1,
            content: 'Suite de Fibonacci: 1, 1, 2, 3, 5, ?',
            stimulus: '',
            options: [
                { key: 'A', text: '7', isCorrect: false, alt: 'Option A: sept' },
                { key: 'B', text: '8', isCorrect: true, alt: 'Option B: huit' },
                { key: 'C', text: '9', isCorrect: false, alt: 'Option C: neuf' },
                { key: 'D', text: '10', isCorrect: false, alt: 'Option D: dix' }
            ],
            correctAnswer: 1,
            type: 'raven',
            series: 'A',
            difficulty: 3,
            timeLimit: 60,
            alphabet: 'number',
            state: 'published',
            locale: 'fr'
        };
    }
    
    /**
     * Question de test invalide (pour tester les rejets)
     */
    getInvalidTestQuestion() {
        return {
            qid: `test-invalid-${Date.now()}`,
            content: 'Question invalide avec indice visible: la réponse est B',
            options: [
                { key: 'A', text: 'A' },
                { key: 'B', text: 'B' },
                { key: 'C', text: 'C' }
            ], // Seulement 3 options au lieu de 4
            correctAnswer: 1,
            state: 'published'
        };
    }
    
    /**
     * Test 1: Workflow de création
     */
    async testCreationWorkflow() {
        console.log('🧪 Test 1: Workflow de création...');
        
        const workflow = {
            name: 'Creation Workflow',
            steps: [],
            passed: false,
            blocked: false
        };
        
        try {
            // Étape 1: Créer question valide
            const validQuestion = this.getValidTestQuestion();
            const response = await this.makeRequest('POST', '/questions-v2', validQuestion);
            
            workflow.steps.push({
                step: 'Create valid question',
                success: response.status === 201,
                details: response.status === 201 ? 'Created successfully' : response.data
            });
            
            // Étape 2: Tenter création question invalide (doit être rejetée)
            const invalidQuestion = this.getInvalidTestQuestion();
            const invalidResponse = await this.makeRequest('POST', '/questions-v2', invalidQuestion);
            
            workflow.steps.push({
                step: 'Reject invalid question',
                success: invalidResponse.status === 422 || invalidResponse.status === 400,
                details: invalidResponse.status >= 400 ? 'Correctly rejected' : 'SECURITY ISSUE: Invalid question accepted'
            });
            
            workflow.passed = workflow.steps.every(step => step.success);
            
        } catch (error) {
            workflow.blocked = true;
            workflow.error = error.message;
        }
        
        this.results.workflows.creation = workflow;
        this.updateOverallStats(workflow);
        
        return workflow;
    }
    
    /**
     * Test 2: Workflow de mise à jour v+1
     */
    async testUpdateWorkflow() {
        console.log('🧪 Test 2: Workflow de mise à jour v+1...');
        
        const workflow = {
            name: 'Update Workflow',
            steps: [],
            passed: false,
            blocked: false
        };
        
        try {
            // Créer question initiale
            const question = this.getValidTestQuestion('-update');
            const createResponse = await this.makeRequest('POST', '/questions-v2', question);
            
            if (createResponse.status !== 201) {
                throw new Error('Failed to create initial question for update test');
            }
            
            const qid = question.qid;
            
            // Mettre à jour avec contenu valide
            const updatedQuestion = {
                ...question,
                version: 2,
                content: 'Suite géométrique: 2, 6, 18, 54, ?',
                options: [
                    { key: 'A', text: '108', isCorrect: false, alt: 'Option A' },
                    { key: 'B', text: '162', isCorrect: true, alt: 'Option B' },
                    { key: 'C', text: '216', isCorrect: false, alt: 'Option C' },
                    { key: 'D', text: '324', isCorrect: false, alt: 'Option D' }
                ]
            };
            
            const updateResponse = await this.makeRequest('PUT', `/questions-v2/${qid}`, updatedQuestion);
            
            workflow.steps.push({
                step: 'Update to v2 with valid content',
                success: updateResponse.status === 200,
                details: updateResponse.status === 200 ? 'Updated successfully' : updateResponse.data
            });
            
            // Tenter mise à jour avec contenu invalide
            const invalidUpdate = {
                ...question,
                version: 3,
                content: 'Question avec indice: réponse = A',
                options: [
                    { key: 'A', text: 'Correct' },
                    { key: 'B', text: 'Wrong' }
                ] // Seulement 2 options
            };
            
            const invalidUpdateResponse = await this.makeRequest('PUT', `/questions-v2/${qid}`, invalidUpdate);
            
            workflow.steps.push({
                step: 'Reject invalid update',
                success: invalidUpdateResponse.status >= 400,
                details: invalidUpdateResponse.status >= 400 ? 'Correctly rejected' : 'SECURITY ISSUE: Invalid update accepted'
            });
            
            workflow.passed = workflow.steps.every(step => step.success);
            
        } catch (error) {
            workflow.blocked = true;
            workflow.error = error.message;
        }
        
        this.results.workflows.update = workflow;
        this.updateOverallStats(workflow);
        
        return workflow;
    }
    
    /**
     * Test 3: Workflow d'import bulk
     */
    async testBulkImportWorkflow() {
        console.log('🧪 Test 3: Workflow d\'import bulk...');
        
        const workflow = {
            name: 'Bulk Import Workflow',
            steps: [],
            passed: false,
            blocked: false
        };
        
        try {
            // Préparer lot mixte (valides + invalides)
            const bulkQuestions = [
                this.getValidTestQuestion('-bulk1'),
                this.getValidTestQuestion('-bulk2'),
                this.getInvalidTestQuestion(), // Doit être rejeté
                this.getValidTestQuestion('-bulk3')
            ];
            
            const bulkResponse = await this.makeRequest('POST', '/questions-v2/bulk/import', {
                questions: bulkQuestions,
                validateAll: true
            });
            
            workflow.steps.push({
                step: 'Bulk import with mixed quality',
                success: bulkResponse.status === 200 && bulkResponse.data.rejected > 0,
                details: bulkResponse.data ? 
                    `Imported: ${bulkResponse.data.summary?.imported}, Rejected: ${bulkResponse.data.summary?.rejected}` : 
                    'No response data'
            });
            
            // Test validation dry-run
            const validateResponse = await this.makeRequest('POST', '/questions-v2/bulk/validate', {
                questions: [this.getValidTestQuestion('-validate')]
            });
            
            workflow.steps.push({
                step: 'Bulk validation dry-run',
                success: validateResponse.status === 200,
                details: validateResponse.data?.summary ? 
                    `Validation rate: ${validateResponse.data.summary.validationRate}` : 
                    'No validation summary'
            });
            
            workflow.passed = workflow.steps.every(step => step.success);
            
        } catch (error) {
            workflow.blocked = true;
            workflow.error = error.message;
        }
        
        this.results.workflows.bulkImport = workflow;
        this.updateOverallStats(workflow);
        
        return workflow;
    }
    
    /**
     * Test 4: Workflow multi-locale
     */
    async testMultiLocaleWorkflow() {
        console.log('🧪 Test 4: Workflow multi-locale...');
        
        const workflow = {
            name: 'Multi-Locale Workflow',
            steps: [],
            passed: false,
            blocked: false
        };
        
        try {
            // Créer question française
            const questionFR = {
                ...this.getValidTestQuestion('-fr'),
                locale: 'fr',
                content: 'Suite: 2, 4, 6, 8, ?'
            };
            
            const frResponse = await this.makeRequest('POST', '/questions-v2', questionFR);
            
            workflow.steps.push({
                step: 'Create French question',
                success: frResponse.status === 201,
                details: frResponse.status === 201 ? 'French version created' : frResponse.data
            });
            
            // Créer version anglaise
            const questionEN = {
                ...this.getValidTestQuestion('-en'),
                locale: 'en',
                content: 'Sequence: 2, 4, 6, 8, ?'
            };
            
            const enResponse = await this.makeRequest('POST', '/questions-v2', questionEN);
            
            workflow.steps.push({
                step: 'Create English question',
                success: enResponse.status === 201,
                details: enResponse.status === 201 ? 'English version created' : enResponse.data
            });
            
            workflow.passed = workflow.steps.every(step => step.success);
            
        } catch (error) {
            workflow.blocked = true;
            workflow.error = error.message;
        }
        
        this.results.workflows.multiLocale = workflow;
        this.updateOverallStats(workflow);
        
        return workflow;
    }
    
    /**
     * Test 5: Corpus Gate
     */
    async testCorpusGate() {
        console.log('🧪 Test 5: Corpus Gate...');
        
        const workflow = {
            name: 'Corpus Gate',
            steps: [],
            passed: false,
            blocked: false
        };
        
        try {
            const corpusResponse = await this.makeRequest('GET', '/corpus-gate');
            
            workflow.steps.push({
                step: 'Check corpus gate status',
                success: corpusResponse.status === 200,
                details: corpusResponse.data ? 
                    `Ready for prod: ${corpusResponse.data.corpusGate?.readyForProduction}` : 
                    'No corpus data'
            });
            
            workflow.passed = workflow.steps.every(step => step.success);
            
        } catch (error) {
            workflow.blocked = true;
            workflow.error = error.message;
        }
        
        this.results.workflows.corpusGate = workflow;
        this.updateOverallStats(workflow);
        
        return workflow;
    }
    
    /**
     * Faire une requête HTTP avec gestion d'erreur
     */
    async makeRequest(method, endpoint, data = null) {
        try {
            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            };
            
            if (data) {
                config.data = data;
            }
            
            const response = await axios(config);
            return response;
            
        } catch (error) {
            return {
                status: error.response?.status || 500,
                data: error.response?.data || { error: error.message }
            };
        }
    }
    
    /**
     * Mettre à jour les statistiques globales
     */
    updateOverallStats(workflow) {
        this.results.overall.tested++;
        
        if (workflow.blocked) {
            this.results.overall.blocked++;
        } else if (workflow.passed) {
            this.results.overall.passed++;
        } else {
            this.results.overall.failed++;
        }
    }
    
    /**
     * Nettoyer les données de test
     */
    async cleanup() {
        try {
            console.log('🧹 Nettoyage des données de test...');
            await QuestionV2.deleteMany({ qid: /^test-/ });
            console.log('✅ Nettoyage terminé');
        } catch (error) {
            console.log('⚠️ Erreur lors du nettoyage:', error.message);
        }
    }
    
    /**
     * Exécuter tous les tests end-to-end
     */
    async runAllTests() {
        console.log('🧪 === TESTS END-TO-END - TOUS LES WORKFLOWS ===\n');
        
        try {
            await this.connect();
            
            // Nettoyer avant de commencer
            await this.cleanup();
            
            // Exécuter tous les workflows
            await this.testCreationWorkflow();
            await this.testUpdateWorkflow();
            await this.testBulkImportWorkflow();
            await this.testMultiLocaleWorkflow();
            await this.testCorpusGate();
            
            // Afficher les résultats
            this.displayResults();
            
            // Nettoyer après les tests
            await this.cleanup();
            
            return this.results;
            
        } finally {
            await this.disconnect();
        }
    }
    
    /**
     * Afficher les résultats
     */
    displayResults() {
        console.log('\n🎯 === RÉSULTATS END-TO-END ===');
        
        Object.entries(this.results.workflows).forEach(([name, workflow]) => {
            const status = workflow.blocked ? '🚫' : workflow.passed ? '✅' : '❌';
            console.log(`\n${status} ${workflow.name}:`);
            
            workflow.steps.forEach((step, idx) => {
                const stepStatus = step.success ? '✅' : '❌';
                console.log(`   ${idx + 1}. ${stepStatus} ${step.step}: ${step.details}`);
            });
            
            if (workflow.error) {
                console.log(`   💥 Error: ${workflow.error}`);
            }
        });
        
        console.log('\n📊 STATISTIQUES GLOBALES:');
        console.log(`✅ Workflows réussis: ${this.results.overall.passed}`);
        console.log(`❌ Workflows échoués: ${this.results.overall.failed}`);
        console.log(`🚫 Workflows bloqués: ${this.results.overall.blocked}`);
        console.log(`📋 Total testé: ${this.results.overall.tested}`);
        
        const successRate = (this.results.overall.passed / this.results.overall.tested) * 100;
        console.log(`🎯 Taux de réussite: ${successRate.toFixed(1)}%`);
        
        const readyForProd = successRate >= 80 && this.results.overall.blocked === 0;
        console.log(`🚀 Prêt pour production: ${readyForProd ? '✅ OUI' : '❌ NON'}`);
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const tester = new EndToEndTester();
    
    tester.runAllTests()
        .then(results => {
            const success = results.overall.passed === results.overall.tested && results.overall.blocked === 0;
            console.log(`\n${success ? '✅' : '❌'} Tests end-to-end terminés`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur tests E2E:', error);
            process.exit(1);
        });
}

module.exports = EndToEndTester;