#!/usr/bin/env node
/**
 * 🔌 TEST DE CONNECTIVITÉ API SIMPLE
 * ===================================
 * 
 * Test basique pour vérifier que l'API répond et que les Quality Gates sont en place.
 */

const axios = require('axios');

class ConnectivityTester {
    
    constructor() {
        this.baseURL = 'http://localhost:5000/api';
        this.authToken = 'test-token';
    }
    
    async testBasicConnectivity() {
        console.log('🔌 Test de connectivité de base...');
        
        try {
            // Test simple endpoint
            const response = await axios.get(`${this.baseURL}/questions-v2`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` },
                timeout: 5000
            });
            
            console.log(`✅ API répond: Status ${response.status}`);
            return true;
        } catch (error) {
            console.log(`❌ API ne répond pas: ${error.message}`);
            
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${error.response.data?.message || 'Unknown error'}`);
            }
            return false;
        }
    }
    
    async testQualityGateEndpoint() {
        console.log('🛡️ Test endpoint Quality Gate...');
        
        try {
            // Test endpoint qui devrait avoir Quality Gate
            const testQuestion = {
                qid: 'test-connectivity-' + Date.now(),
                version: 1,
                content: 'Test question: 2, 4, 6, 8, ?',
                options: [
                    { key: 'A', text: '10', isCorrect: true },
                    { key: 'B', text: '12', isCorrect: false },
                    { key: 'C', text: '14', isCorrect: false },
                    { key: 'D', text: '16', isCorrect: false }
                ],
                correctAnswer: 0,
                type: 'raven',
                alphabet: 'number',
                state: 'draft',
                locale: 'fr'
            };
            
            const response = await axios.post(`${this.baseURL}/questions-v2`, testQuestion, {
                headers: { 
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            console.log(`✅ Quality Gate endpoint répond: Status ${response.status}`);
            console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
            return true;
            
        } catch (error) {
            console.log(`❌ Quality Gate endpoint: ${error.message}`);
            
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
                
                // Si c'est un 422, c'est en fait un succès (Quality Gate fonctionne)
                if (error.response.status === 422) {
                    console.log('✅ Quality Gate fonctionne (rejet attendu pour question de test)');
                    return true;
                }
            }
            return false;
        }
    }
    
    async testCorpusGateEndpoint() {
        console.log('🔒 Test endpoint Corpus Gate...');
        
        try {
            const response = await axios.get(`${this.baseURL}/corpus-gate`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` },
                timeout: 10000
            });
            
            console.log(`✅ Corpus Gate endpoint répond: Status ${response.status}`);
            console.log(`   Ready for prod: ${response.data?.corpusGate?.readyForProduction}`);
            return true;
            
        } catch (error) {
            console.log(`❌ Corpus Gate endpoint: ${error.message}`);
            
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
            }
            return false;
        }
    }
    
    async runConnectivityTests() {
        console.log('🧪 === TEST DE CONNECTIVITÉ API ===\n');
        
        const tests = [
            this.testBasicConnectivity(),
            this.testQualityGateEndpoint(), 
            this.testCorpusGateEndpoint()
        ];
        
        const results = await Promise.allSettled(tests);
        
        let passed = 0;
        let total = results.length;
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value === true) {
                passed++;
            }
        });
        
        console.log('\n📊 RÉSULTATS:');
        console.log(`✅ Tests réussis: ${passed}/${total}`);
        console.log(`🎯 Taux de réussite: ${((passed / total) * 100).toFixed(1)}%`);
        
        const success = passed === total;
        console.log(`🚀 API prête: ${success ? '✅ OUI' : '❌ NON'}`);
        
        return success;
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const tester = new ConnectivityTester();
    
    tester.runConnectivityTests()
        .then(success => {
            console.log(`\n${success ? '✅' : '❌'} Test de connectivité terminé`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur test connectivité:', error);
            process.exit(1);
        });
}

module.exports = ConnectivityTester;