const axios = require('axios');
const { getAPIBase } = require('./check-demo');

async function testDemoValidation() {
    console.log('🧪 Tests validation démo TestIQ\n');
    
    const apiBase = getAPIBase();
    let passedTests = 0;
    let totalTests = 0;
    
    const tests = [
        {
            name: 'Health Check API',
            test: async () => {
                const response = await axios.get(`${apiBase}/health`);
                return response.status === 200 && response.data.ok === true;
            }
        },
        {
            name: 'CORS Headers Present',
            test: async () => {
                const response = await axios.options(`${apiBase}/api/questions-v2`);
                return response.headers['access-control-allow-origin'] !== undefined;
            }
        },
        {
            name: 'Admin Routes Blocked',
            test: async () => {
                try {
                    await axios.get(`${apiBase}/admin/users`);
                    return false; // Ne devrait pas réussir
                } catch (error) {
                    return error.response?.status === 403;
                }
            }
        },
        {
            name: 'Questions Demo Available',
            test: async () => {
                const response = await axios.get(`${apiBase}/api/questions-v2?limit=5`);
                const questions = response.data.questions || response.data;
                return Array.isArray(questions) && questions.length > 0;
            }
        },
        {
            name: 'Quality Gates Active',
            test: async () => {
                const response = await axios.get(`${apiBase}/api/questions-v2?limit=5`);
                const questions = response.data.questions || response.data;
                return questions.every(q => (q.options || q.choices || []).length === 4);
            }
        }
    ];
    
    for (const test of tests) {
        totalTests++;
        try {
            const result = await test.test();
            if (result) {
                console.log(`✅ ${test.name}`);
                passedTests++;
            } else {
                console.log(`❌ ${test.name} - Test échoué`);
            }
        } catch (error) {
            console.log(`❌ ${test.name} - Erreur: ${error.message}`);
        }
    }
    
    console.log(`\n📊 Résultats: ${passedTests}/${totalTests} tests réussis`);
    
    if (passedTests === totalTests) {
        console.log('🎉 Démo validation complète réussie !');
        process.exit(0);
    } else {
        console.log('💥 Certains tests ont échoué');
        process.exit(1);
    }
}

if (require.main === module) {
    testDemoValidation();
}

module.exports = { testDemoValidation };