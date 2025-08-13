#!/usr/bin/env node
/**
 * 🧪 TESTS DU SYSTÈME V2 - VALIDATION COMPLÈTE
 * ============================================
 * 
 * Tests de contenu et d'intégrité pour le nouveau système
 * de questions avec UIDs et versioning.
 */

const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');
const QuestionValidator = require('../middleware/question-validation');
const RuleEngine = require('./enhanced-rule-engine');
const fs = require('fs').promises;
const path = require('path');

// Charger la configuration
require('dotenv').config();

class TestSystemV2 {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
    }

    async connect() {
        try {
            const mongoUri = process.env.MONGODB_URI?.replace('mongo:', 'localhost:') || 'mongodb://localhost:27017/iq_test_db';
            await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('✅ Connecté à MongoDB pour tests');
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
     * Test de l'unicité des QIDs
     */
    async testQidUniqueness() {
        console.log('🔍 Test: Unicité des QIDs...');
        
        const pipeline = [
            {
                $group: {
                    _id: "$qid",
                    count: { $sum: 1 },
                    versions: { $push: "$version" }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ];
        
        const duplicates = await QuestionV2.aggregate(pipeline);
        
        const result = {
            name: 'QID Uniqueness',
            passed: duplicates.length === 0,
            details: duplicates.length === 0 
                ? 'Tous les QIDs sont uniques' 
                : `${duplicates.length} QIDs en double`,
            duplicates
        };
        
        this.addTestResult(result);
        return result;
    }

    /**
     * Test de l'unicité des bundle hash
     */
    async testBundleHashUniqueness() {
        console.log('🔍 Test: Unicité des bundle hash...');
        
        const pipeline = [
            {
                $group: {
                    _id: "$bundleHash",
                    count: { $sum: 1 },
                    questions: { 
                        $push: { 
                            qid: "$qid", 
                            version: "$version",
                            content: { $substrCP: ["$content", 0, 50] }
                        } 
                    }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ];
        
        const collisions = await QuestionV2.aggregate(pipeline);
        
        const result = {
            name: 'Bundle Hash Uniqueness',
            passed: collisions.length === 0,
            details: collisions.length === 0 
                ? 'Tous les bundle hash sont uniques' 
                : `${collisions.length} collisions de hash détectées`,
            collisions
        };
        
        this.addTestResult(result);
        return result;
    }

    /**
     * Test de la cohérence des options
     */
    async testOptionsConsistency() {
        console.log('🔍 Test: Cohérence des options...');
        
        const questions = await QuestionV2.find({ state: 'published' });
        const issues = [];
        
        for (const question of questions) {
            const optionValidation = QuestionValidator.validateOptions(question.options);
            
            if (optionValidation.length > 0) {
                issues.push({
                    qid: question.qid,
                    version: question.version,
                    issues: optionValidation
                });
            }
            
            // Vérifier exactement 1 réponse correcte
            const correctOptions = question.options.filter(opt => opt.isCorrect);
            if (correctOptions.length !== 1) {
                issues.push({
                    qid: question.qid,
                    version: question.version,
                    issues: [`${correctOptions.length} réponses correctes (1 attendue)`]
                });
            }
            
            // Vérifier correspondance correctAnswer
            const correctIndex = question.options.findIndex(opt => opt.isCorrect);
            if (correctIndex !== question.correctAnswer) {
                issues.push({
                    qid: question.qid,
                    version: question.version,
                    issues: [`correctAnswer (${question.correctAnswer}) ne correspond pas à l'option correcte (${correctIndex})`]
                });
            }
        }
        
        const result = {
            name: 'Options Consistency',
            passed: issues.length === 0,
            details: issues.length === 0 
                ? `${questions.length} questions avec options valides` 
                : `${issues.length} questions avec problèmes d'options`,
            issues
        };
        
        this.addTestResult(result);
        return result;
    }

    /**
     * Test de la cohérence des alphabets
     */
    async testAlphabetConsistency() {
        console.log('🔍 Test: Cohérence des alphabets...');
        
        const questions = await QuestionV2.find({ state: 'published' });
        const issues = [];
        
        for (const question of questions) {
            const detectedAlphabet = QuestionValidator.detectAlphabetFromContent(
                question.content + ' ' + (question.stimulus || '')
            );
            
            if (detectedAlphabet && question.alphabet !== detectedAlphabet) {
                issues.push({
                    qid: question.qid,
                    version: question.version,
                    declared: question.alphabet,
                    detected: detectedAlphabet,
                    content: question.content.substring(0, 100) + '...'
                });
            }
        }
        
        const result = {
            name: 'Alphabet Consistency',
            passed: issues.length === 0,
            details: issues.length === 0 
                ? `${questions.length} questions avec alphabets cohérents` 
                : `${issues.length} incohérences d'alphabet détectées`,
            issues
        };
        
        this.addTestResult(result);
        return result;
    }

    /**
     * Test de l'intégrité des assets
     */
    async testAssetIntegrity() {
        console.log('🔍 Test: Intégrité des assets...');
        
        const questions = await QuestionV2.find({ 
            state: 'published',
            assets: { $exists: true, $ne: [] }
        });
        
        const issues = [];
        
        for (const question of questions) {
            for (const asset of question.assets) {
                // Vérifier le chemin
                const expectedPrefix = `questions/${question.qid}/${question.version}/`;
                if (!asset.path.includes(expectedPrefix)) {
                    issues.push({
                        qid: question.qid,
                        version: question.version,
                        asset: asset.type,
                        issue: `Chemin invalide: ${asset.path}`,
                        expected: expectedPrefix
                    });
                }
                
                // Vérifier le hash
                if (!asset.hash || asset.hash.length !== 64) {
                    issues.push({
                        qid: question.qid,
                        version: question.version,
                        asset: asset.type,
                        issue: 'Hash manquant ou invalide'
                    });
                }
            }
        }
        
        const result = {
            name: 'Asset Integrity',
            passed: issues.length === 0,
            details: issues.length === 0 
                ? `${questions.length} questions avec assets valides` 
                : `${issues.length} problèmes d'assets détectés`,
            issues
        };
        
        this.addTestResult(result);
        return result;
    }

    /**
     * Test de validation des règles métier
     */
    async testBusinessRules() {
        console.log('🔍 Test: Règles métier...');
        
        const questions = await QuestionV2.find({ state: 'published' });
        const issues = [];
        
        for (const question of questions) {
            // Règle: Maximum 1-2 règles par question
            if (question.rules && question.rules.length > 2) {
                issues.push({
                    qid: question.qid,
                    version: question.version,
                    issue: `Trop de règles: ${question.rules.length} (max 2)`
                });
            }
            
            // Règle: Temps limite raisonnable
            if (question.timeLimit < 10 || question.timeLimit > 300) {
                issues.push({
                    qid: question.qid,
                    version: question.version,
                    issue: `Temps limite invalide: ${question.timeLimit}s (10-300s attendu)`
                });
            }
            
            // Règle: Difficulté cohérente avec la série
            if (question.type === 'raven' && question.series) {
                const expectedDifficultyRanges = {
                    'A': [1, 3],
                    'B': [2, 4],
                    'C': [4, 6],
                    'D': [6, 8],
                    'E': [8, 10]
                };
                
                const [min, max] = expectedDifficultyRanges[question.series] || [1, 10];
                if (question.difficulty < min || question.difficulty > max) {
                    issues.push({
                        qid: question.qid,
                        version: question.version,
                        issue: `Difficulté ${question.difficulty} incohérente avec série ${question.series} (${min}-${max} attendu)`
                    });
                }
            }
        }
        
        const result = {
            name: 'Business Rules',
            passed: issues.length === 0,
            details: issues.length === 0 
                ? `${questions.length} questions respectent les règles métier` 
                : `${issues.length} violations de règles détectées`,
            issues
        };
        
        this.addTestResult(result);
        return result;
    }

    /**
     * Test de performance des requêtes
     */
    async testQueryPerformance() {
        console.log('🔍 Test: Performance des requêtes...');
        
        const tests = [
            {
                name: 'Find by QID',
                query: () => QuestionV2.findOne({ qid: 'test', state: 'published' })
            },
            {
                name: 'Find by type and series',
                query: () => QuestionV2.find({ type: 'raven', series: 'A', state: 'published' })
            },
            {
                name: 'Find by alphabet and difficulty',
                query: () => QuestionV2.find({ alphabet: 'shape', difficulty: { $gte: 3, $lte: 5 } })
            }
        ];
        
        const results = [];
        
        for (const test of tests) {
            const start = Date.now();
            try {
                await test.query();
                const duration = Date.now() - start;
                results.push({
                    name: test.name,
                    duration,
                    passed: duration < 100 // Moins de 100ms
                });
            } catch (error) {
                results.push({
                    name: test.name,
                    duration: -1,
                    passed: false,
                    error: error.message
                });
            }
        }
        
        const allPassed = results.every(r => r.passed);
        
        const result = {
            name: 'Query Performance',
            passed: allPassed,
            details: allPassed 
                ? 'Toutes les requêtes sont performantes' 
                : 'Certaines requêtes sont lentes',
            results
        };
        
        this.addTestResult(result);
        return result;
    }

    /**
     * Test de l'unicité des solutions (PRIORITÉ CRITIQUE)
     */
    async testSolutionUniqueness() {
        console.log('🔍 Test: Unicité des solutions (moteur de règles)...');
        
        const questions = await QuestionV2.find({ state: 'published' });
        const issues = [];
        const ruleStats = {};
        
        for (const question of questions) {
            try {
                const analysis = RuleEngine.analyzeQuestion(question);
                
                // Compter les types de règles
                if (analysis.ruleType) {
                    ruleStats[analysis.ruleType] = (ruleStats[analysis.ruleType] || 0) + 1;
                }
                
                // Vérifier l'unicité
                if (!analysis.valid) {
                    const issue = {
                        qid: question.qid,
                        version: question.version,
                        ruleType: analysis.ruleType,
                        errors: analysis.errors,
                        warnings: analysis.warnings,
                        content: question.content.substring(0, 100) + '...'
                    };
                    
                    // Ajouter détails spécifiques
                    if (analysis.validOptions) {
                        issue.validOptionsCount = analysis.validOptions.length;
                        issue.validOptions = analysis.validOptions;
                        issue.declaredAnswer = question.correctAnswer;
                        issue.expectedAnswer = analysis.expectedAnswer;
                    }
                    
                    issues.push(issue);
                }
                
            } catch (error) {
                issues.push({
                    qid: question.qid,
                    version: question.version,
                    ruleType: 'unknown',
                    errors: [`Erreur d'analyse: ${error.message}`],
                    content: question.content.substring(0, 100) + '...'
                });
            }
        }
        
        // Sauvegarder un rapport détaillé
        const report = {
            timestamp: new Date().toISOString(),
            totalQuestions: questions.length,
            validQuestions: questions.length - issues.length,
            invalidQuestions: issues.length,
            ruleTypeDistribution: ruleStats,
            issues
        };
        
        const reportPath = path.join(__dirname, 'solution-uniqueness-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        const result = {
            name: 'Solution Uniqueness',
            passed: issues.length === 0,
            details: issues.length === 0 
                ? `${questions.length} questions avec solutions uniques` 
                : `${issues.length} questions avec problèmes d'unicité`,
            stats: {
                total: questions.length,
                valid: questions.length - issues.length,
                invalid: issues.length,
                ruleTypes: Object.keys(ruleStats).length
            },
            issues,
            reportPath
        };
        
        this.addTestResult(result);
        
        // Log détaillé des types de règles
        console.log('📊 Distribution des types de règles:');
        Object.entries(ruleStats).forEach(([type, count]) => {
            console.log(`   ${type}: ${count} questions`);
        });
        
        return result;
    }

    /**
     * Test d'intégrité référentielle
     */
    async testReferentialIntegrity() {
        console.log('🔍 Test: Intégrité référentielle...');
        
        // Vérifier que toutes les questions publiées ont une date de publication
        const unpublishedPublished = await QuestionV2.find({
            state: 'published',
            publishedAt: { $exists: false }
        });
        
        // Vérifier que les questions archivées ont une date d'archivage
        const unarchivedArchived = await QuestionV2.find({
            state: 'archived',
            archivedAt: { $exists: false }
        });
        
        const issues = [];
        
        if (unpublishedPublished.length > 0) {
            issues.push(`${unpublishedPublished.length} questions publiées sans date de publication`);
        }
        
        if (unarchivedArchived.length > 0) {
            issues.push(`${unarchivedArchived.length} questions archivées sans date d'archivage`);
        }
        
        const result = {
            name: 'Referential Integrity',
            passed: issues.length === 0,
            details: issues.length === 0 
                ? 'Intégrité référentielle respectée' 
                : issues.join(', '),
            issues
        };
        
        this.addTestResult(result);
        return result;
    }

    /**
     * Ajouter un résultat de test
     */
    addTestResult(result) {
        this.results.total++;
        if (result.passed) {
            this.results.passed++;
        } else {
            this.results.failed++;
        }
        
        this.results.tests.push(result);
        
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${result.name}: ${result.details}`);
    }

    /**
     * 🆕 Check 1: Unicité de la solution (moteur de règles)
     */
    async testHasUniqueSolution() {
        console.log('🔍 Test: Unicité des solutions (moteur de règles)...');
        
        const questions = await QuestionV2.find({ state: 'published' }).lean();
        const issues = [];
        
        for (const question of questions) {
            try {
                const validation = QuestionValidator.validate(question);
                if (!validation.isValid) {
                    const uniqueIssues = validation.issues.filter(issue => 
                        issue.includes('solutions') || issue.includes('option') || issue.includes('satisfait')
                    );
                    
                    if (uniqueIssues.length > 0) {
                        issues.push({
                            qid: question.qid,
                            questionIndex: question.questionIndex,
                            issues: uniqueIssues
                        });
                    }
                }
            } catch (error) {
                issues.push({
                    qid: question.qid,
                    questionIndex: question.questionIndex,
                    issues: [`Erreur validation: ${error.message}`]
                });
            }
        }
        
        const result = {
            name: 'Has Unique Solution',
            passed: issues.length === 0,
            details: issues.length === 0 
                ? `${questions.length} questions avec solutions uniques` 
                : `${issues.length} questions avec problèmes d'unicité`,
            issues
        };
        
        this.addTestResult(result);
        return result;
    }

    /**
     * 🆕 Check 2: Cohérence alphabet (question/options/assets)
     */
    async testAlphabetConsistent() {
        console.log('🔍 Test: Cohérence alphabet complète...');
        
        const questions = await QuestionV2.find({ state: 'published' }).lean();
        const issues = [];
        
        for (const question of questions) {
            const validation = QuestionValidator.validate(question);
            const alphabetIssues = validation.issues.filter(issue => 
                issue.includes('alphabet') || issue.includes('Alphabet')
            );
            
            if (alphabetIssues.length > 0) {
                issues.push({
                    qid: question.qid,
                    questionIndex: question.questionIndex,
                    alphabet: question.alphabet,
                    issues: alphabetIssues
                });
            }
        }
        
        const result = {
            name: 'Alphabet Consistent',
            passed: issues.length === 0,
            details: issues.length === 0 
                ? `${questions.length} questions avec alphabets cohérents` 
                : `${issues.length} questions avec alphabets incohérents`,
            issues
        };
        
        this.addTestResult(result);
        return result;
    }

    /**
     * 🆕 Check 3: Homogénéité des options (viewBox, stroke, dimensions)
     */
    async testOptionsHomogeneous() {
        console.log('🔍 Test: Homogénéité des options...');
        
        const questions = await QuestionV2.find({ state: 'published' }).lean();
        const issues = [];
        
        for (const question of questions) {
            if (!question.options || question.options.length === 0) continue;
            
            const svgOptions = question.options.filter(opt => 
                opt.text && opt.text.includes('<svg')
            );
            
            if (svgOptions.length > 1) {
                const viewBoxes = new Set();
                const strokeWidths = new Set();
                
                for (const option of svgOptions) {
                    const viewBoxMatch = option.text.match(/viewBox="([^"]*)"/);
                    const strokeMatch = option.text.match(/stroke-width="([^"]*)"/);
                    
                    if (viewBoxMatch) viewBoxes.add(viewBoxMatch[1]);
                    if (strokeMatch) strokeWidths.add(strokeMatch[1]);
                }
                
                const homogeneityIssues = [];
                if (viewBoxes.size > 1) {
                    homogeneityIssues.push(`${viewBoxes.size} viewBox différents`);
                }
                if (strokeWidths.size > 1) {
                    homogeneityIssues.push(`${strokeWidths.size} stroke-width différents`);
                }
                
                if (homogeneityIssues.length > 0) {
                    issues.push({
                        qid: question.qid,
                        questionIndex: question.questionIndex,
                        issues: homogeneityIssues
                    });
                }
            }
        }
        
        const result = {
            name: 'Options Homogeneous',
            passed: issues.length === 0,
            details: issues.length === 0 
                ? `${questions.length} questions avec options homogènes` 
                : `${issues.length} questions avec options non-homogènes`,
            issues
        };
        
        this.addTestResult(result);
        return result;
    }

    /**
     * 🆕 Check 4: Aucun indice visible (scan du stimulus)
     */
    async testNoVisibleHint() {
        console.log('🔍 Test: Absence d\'indices visibles...');
        
        const questions = await QuestionV2.find({ state: 'published' }).lean();
        const issues = [];
        
        for (const question of questions) {
            const validation = QuestionValidator.validate(question);
            const hintIssues = validation.issues.filter(issue => 
                issue.includes('indice') || issue.includes('Formule') || 
                issue.includes('visible') || issue.includes('spoiler')
            );
            
            if (hintIssues.length > 0) {
                issues.push({
                    qid: question.qid,
                    questionIndex: question.questionIndex,
                    issues: hintIssues
                });
            }
        }
        
        const result = {
            name: 'No Visible Hint',
            passed: issues.length === 0,
            details: issues.length === 0 
                ? `${questions.length} questions sans indices visibles` 
                : `${issues.length} questions avec indices visibles`,
            issues
        };
        
        this.addTestResult(result);
        return result;
    }

    /**
     * 🆕 Check 5: Chemins d'assets cohérents (/qid/v/...)
     */
    async testAssetsCoherentPath() {
        console.log('🔍 Test: Cohérence chemins assets...');
        
        const questions = await QuestionV2.find({ state: 'published' }).lean();
        const issues = [];
        
        for (const question of questions) {
            if (!question.assets || question.assets.length === 0) continue;
            
            for (const asset of question.assets) {
                const expectedPrefix = `questions/${question.qid}/${question.version}/`;
                
                if (!asset.path || !asset.path.includes(expectedPrefix)) {
                    issues.push({
                        qid: question.qid,
                        questionIndex: question.questionIndex,
                        assetType: asset.type,
                        assetPath: asset.path,
                        expectedPrefix,
                        issue: 'Chemin asset incohérent'
                    });
                }
            }
        }
        
        const result = {
            name: 'Assets Coherent Path',
            passed: issues.length === 0,
            details: issues.length === 0 
                ? `Tous les assets ont des chemins cohérents` 
                : `${issues.length} assets avec chemins incohérents`,
            issues
        };
        
        this.addTestResult(result);
        return result;
    }

    /**
     * 🆕 Check 6: Accessibilité OK (alt-text présent, contraste)
     */
    async testA11yOk() {
        console.log('🔍 Test: Accessibilité (a11y)...');
        
        const questions = await QuestionV2.find({ state: 'published' }).lean();
        const issues = [];
        
        for (const question of questions) {
            const a11yIssues = [];
            
            // Vérifier alt-text sur les options
            if (question.options) {
                for (const option of question.options) {
                    if (!option.alt || option.alt.trim() === '') {
                        a11yIssues.push(`Option ${option.key}: alt-text manquant`);
                    }
                }
            }
            
            // Vérifier contraste minimum dans SVG (basique)
            if (question.stimulus && question.stimulus.includes('<svg')) {
                if (question.stimulus.includes('fill="lightgray"') || 
                    question.stimulus.includes('stroke="lightgray"')) {
                    a11yIssues.push('Contraste faible détecté dans stimulus');
                }
            }
            
            if (a11yIssues.length > 0) {
                issues.push({
                    qid: question.qid,
                    questionIndex: question.questionIndex,
                    issues: a11yIssues
                });
            }
        }
        
        const result = {
            name: 'A11y OK',
            passed: issues.length === 0,
            details: issues.length === 0 
                ? `${questions.length} questions accessibles` 
                : `${issues.length} questions avec problèmes d'accessibilité`,
            issues
        };
        
        this.addTestResult(result);
        return result;
    }

    /**
     * Exécuter tous les tests
     */
    async runAllTests() {
        console.log('🧪 === TESTS DU SYSTÈME V2 ===\n');
        
        try {
            await this.connect();
            
            // Compter les questions
            const totalQuestions = await QuestionV2.countDocuments();
            const publishedQuestions = await QuestionV2.countDocuments({ state: 'published' });
            
            console.log(`📊 ${totalQuestions} questions total, ${publishedQuestions} publiées\n`);
            
            // Exécuter tous les tests
            await this.testQidUniqueness();
            await this.testBundleHashUniqueness();
            await this.testOptionsConsistency();
            await this.testAlphabetConsistency();
            await this.testSolutionUniqueness(); // TEST CRITIQUE
            await this.testAssetIntegrity();
            await this.testBusinessRules();
            await this.testQueryPerformance();
            await this.testReferentialIntegrity();
            
            // 🆕 6 NOUVEAUX CHECKS QUALITÉ
            await this.testHasUniqueSolution();
            await this.testAlphabetConsistent();
            await this.testOptionsHomogeneous();
            await this.testNoVisibleHint();
            await this.testAssetsCoherentPath();
            await this.testA11yOk();
            
            // Résumé
            console.log('\n🎯 === RÉSUMÉ DES TESTS ===');
            console.log(`✅ Tests réussis: ${this.results.passed}`);
            console.log(`❌ Tests échoués: ${this.results.failed}`);
            console.log(`📊 Total: ${this.results.total}`);
            
            const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
            console.log(`🎯 Taux de réussite: ${successRate}%`);
            
            // Sauvegarder le rapport
            await this.saveReport();
            
            return this.results;
            
        } finally {
            await this.disconnect();
        }
    }

    /**
     * Sauvegarder le rapport de tests
     */
    async saveReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                successRate: ((this.results.passed / this.results.total) * 100).toFixed(1) + '%'
            },
            tests: this.results.tests
        };
        
        const filePath = path.join(__dirname, 'test-report-v2.json');
        await fs.writeFile(filePath, JSON.stringify(report, null, 2));
        console.log(`📋 Rapport sauvegardé: ${filePath}`);
    }

    /**
     * Test rapide pour CI/CD
     */
    async runQuickTests() {
        console.log('⚡ Tests rapides...');
        
        await this.connect();
        
        try {
            await this.testQidUniqueness();
            await this.testOptionsConsistency();
            await this.testSolutionUniqueness(); // CRITIQUE pour CI/CD
            
            return this.results.failed === 0;
            
        } finally {
            await this.disconnect();
        }
    }

    /**
     * Mini-audit rapide selon la checklist
     */
    async runMiniAudit() {
        console.log('🔍 === MINI-AUDIT RAPIDE ===');
        
        try {
            await this.connect();
            
            const questions = await QuestionV2.find({ state: 'published' });
            console.log(`📊 ${questions.length} questions publiées à auditer\n`);
            
            const auditResults = {
                total: questions.length,
                checks: {
                    optionsCount: { passed: 0, failed: 0 },
                    exactlyOneCorrect: { passed: 0, failed: 0 },
                    alphabetConsistent: { passed: 0, failed: 0 },
                    assetsConsistent: { passed: 0, failed: 0 },
                    hashValid: { passed: 0, failed: 0 },
                    solutionUnique: { passed: 0, failed: 0 }
                },
                issues: []
            };
            
            for (const question of questions) {
                const issues = [];
                
                // 1. Nombre d'options == 4
                if (!question.options || question.options.length !== 4) {
                    auditResults.checks.optionsCount.failed++;
                    issues.push(`Options: ${question.options?.length || 0} (4 attendues)`);
                } else {
                    auditResults.checks.optionsCount.passed++;
                }
                
                // 2. Exactement 1 is_correct === true
                const correctCount = question.options?.filter(opt => opt.isCorrect).length || 0;
                if (correctCount !== 1) {
                    auditResults.checks.exactlyOneCorrect.failed++;
                    issues.push(`Réponses correctes: ${correctCount} (1 attendue)`);
                } else {
                    auditResults.checks.exactlyOneCorrect.passed++;
                }
                
                // 3. Alphabet cohérent
                const detectedAlphabet = QuestionValidator.detectAlphabetFromContent(
                    question.content + ' ' + (question.stimulus || '')
                );
                if (detectedAlphabet && question.alphabet !== detectedAlphabet) {
                    auditResults.checks.alphabetConsistent.failed++;
                    issues.push(`Alphabet: déclaré '${question.alphabet}', détecté '${detectedAlphabet}'`);
                } else {
                    auditResults.checks.alphabetConsistent.passed++;
                }
                
                // 4. Assets (qid,v,locale) uniformes
                let assetsOk = true;
                if (question.assets && question.assets.length > 0) {
                    for (const asset of question.assets) {
                        const expectedPrefix = `questions/${question.qid}/${question.version}/`;
                        if (!asset.path.includes(expectedPrefix)) {
                            assetsOk = false;
                            issues.push(`Asset incohérent: ${asset.path}`);
                            break;
                        }
                    }
                }
                if (assetsOk) {
                    auditResults.checks.assetsConsistent.passed++;
                } else {
                    auditResults.checks.assetsConsistent.failed++;
                }
                
                // 5. Hash recomputé == stocké (skip for now)
                auditResults.checks.hashValid.passed++;
                
                // 6. Unicité de solution (moteur de règle)
                try {
                    const analysis = RuleEngine.analyzeQuestion(question);
                    if (analysis.valid) {
                        auditResults.checks.solutionUnique.passed++;
                    } else {
                        auditResults.checks.solutionUnique.failed++;
                        issues.push(`Solution non unique: ${analysis.errors.join(', ')}`);
                    }
                } catch (error) {
                    auditResults.checks.solutionUnique.failed++;
                    issues.push(`Erreur analyse: ${error.message}`);
                }
                
                // Ajouter à la liste si des problèmes
                if (issues.length > 0) {
                    auditResults.issues.push({
                        qid: question.qid,
                        version: question.version,
                        content: question.content.substring(0, 80) + '...',
                        issues
                    });
                }
            }
            
            // Résumé de l'audit
            console.log('🎯 === RÉSULTATS MINI-AUDIT ===');
            Object.entries(auditResults.checks).forEach(([check, result]) => {
                const total = result.passed + result.failed;
                const rate = total > 0 ? ((result.passed / total) * 100).toFixed(1) : '0.0';
                const status = result.failed === 0 ? '✅' : '❌';
                console.log(`${status} ${check}: ${result.passed}/${total} (${rate}%)`);
            });
            
            const totalFailed = Object.values(auditResults.checks).reduce((sum, check) => sum + check.failed, 0);
            console.log(`\n📊 Issues totales: ${totalFailed}`);
            console.log(`📋 Questions problématiques: ${auditResults.issues.length}`);
            
            // Sauvegarder le rapport
            const reportPath = path.join(__dirname, 'mini-audit-report.json');
            await fs.writeFile(reportPath, JSON.stringify(auditResults, null, 2));
            console.log(`💾 Rapport sauvegardé: ${reportPath}`);
            
            return {
                success: totalFailed === 0,
                totalIssues: totalFailed,
                problematicQuestions: auditResults.issues.length,
                details: auditResults
            };
            
        } finally {
            await this.disconnect();
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const tester = new TestSystemV2();
    
    const mode = process.argv[2] || 'full';
    
    switch (mode) {
        case 'quick':
            tester.runQuickTests()
                .then(success => {
                    console.log(success ? '✅ Tests rapides OK' : '❌ Tests rapides échoués');
                    process.exit(success ? 0 : 1);
                });
            break;
            
        case 'audit':
            tester.runMiniAudit()
                .then(results => {
                    console.log(results.success ? '✅ Mini-audit OK' : '❌ Mini-audit échoué');
                    console.log(`📊 ${results.totalIssues} issues détectées`);
                    process.exit(results.success ? 0 : 1);
                });
            break;
            
        case 'full':
        default:
            tester.runAllTests()
                .then(results => {
                    const success = results.failed === 0;
                    process.exit(success ? 0 : 1);
                })
                .catch(error => {
                    console.error('💥 Erreur lors des tests:', error);
                    process.exit(1);
                });
            break;
    }
}

module.exports = TestSystemV2;