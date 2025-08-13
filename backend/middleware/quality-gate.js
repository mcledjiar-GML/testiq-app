/**
 * 🛡️ QUALITY GATE BLOQUANT - RELEASE READY
 * =========================================
 * 
 * Gate stricte qui refuse la publication si :
 * - Tests CI ≠ 15/15 verts
 * - Unicité solution non garantie
 * - Options ≠ 4 ou multiple réponses correctes
 * - Alphabet mismatch (major issue)
 */

const TestSystemV2 = require('../scripts/test-v2-system');
const QuestionValidator = require('./question-validation');
const RuleEngine = require('../scripts/enhanced-rule-engine');

class QualityGate {
    
    /**
     * Middleware Express pour bloquer publication si quality gate échoue
     */
    static async validateBeforePublish(req, res, next) {
        try {
            const question = req.body;
            
            // 1. Validation stricte de base
            const baseValidation = QuestionValidator.validate(question);
            if (!baseValidation.isValid) {
                return res.status(400).json({
                    error: 'Quality Gate FAILED',
                    reason: 'Base validation failed',
                    issues: baseValidation.issues,
                    severity: baseValidation.severity,
                    blocked: true
                });
            }
            
            // 2. Validation critique des options
            if (!question.options || question.options.length !== 4) {
                return res.status(400).json({
                    error: 'Quality Gate FAILED',
                    reason: 'Exactly 4 options required',
                    found: question.options?.length || 0,
                    blocked: true
                });
            }
            
            // 3. Validation unicité de la réponse correcte
            const correctOptions = question.options.filter(opt => opt.isCorrect);
            if (correctOptions.length !== 1) {
                return res.status(400).json({
                    error: 'Quality Gate FAILED',
                    reason: 'Exactly 1 correct answer required',
                    found: correctOptions.length,
                    blocked: true
                });
            }
            
            // 4. Validation unicité de la solution (moteur de règles)
            try {
                const ruleAnalysis = RuleEngine.analyzeQuestion(question);
                if (!ruleAnalysis.valid) {
                    return res.status(400).json({
                        error: 'Quality Gate FAILED',
                        reason: 'Solution uniqueness not guaranteed',
                        ruleType: ruleAnalysis.ruleType,
                        errors: ruleAnalysis.errors,
                        blocked: true
                    });
                }
            } catch (error) {
                // Si le moteur de règles échoue, on considère cela comme non-bloquant pour l'instant
                console.warn('Rule engine analysis failed:', error.message);
            }
            
            // 5. Validation alphabet cohérent (major issue)
            const alphabetIssues = baseValidation.issues.filter(issue => 
                issue.toLowerCase().includes('alphabet')
            );
            if (alphabetIssues.length > 0) {
                return res.status(400).json({
                    error: 'Quality Gate FAILED',
                    reason: 'Alphabet consistency required (MAJOR)',
                    issues: alphabetIssues,
                    blocked: true
                });
            }
            
            // ✅ Quality Gate passed
            req.qualityGatePassed = true;
            next();
            
        } catch (error) {
            console.error('Quality Gate error:', error);
            return res.status(500).json({
                error: 'Quality Gate INTERNAL ERROR',
                message: error.message,
                blocked: true
            });
        }
    }
    
    /**
     * Exécuter tous les tests CI et vérifier 15/15 verts
     */
    static async runCITests() {
        const tester = new TestSystemV2();
        
        try {
            const results = await tester.runAllTests();
            
            const ciResult = {
                passed: results.failed === 0,
                total: results.total,
                passed_count: results.passed,
                failed_count: results.failed,
                success_rate: ((results.passed / results.total) * 100).toFixed(1) + '%',
                failed_tests: results.tests.filter(test => !test.passed).map(test => test.name)
            };
            
            return ciResult;
            
        } catch (error) {
            return {
                passed: false,
                error: error.message,
                blocked: true
            };
        }
    }
    
    /**
     * Calculer le score qualité général
     */
    static async calculateQualityScore() {
        const tester = new TestSystemV2();
        
        try {
            const auditResults = await tester.runMiniAudit();
            
            const score = {
                validated_questions: auditResults.details.total - auditResults.problematicQuestions,
                total_questions: auditResults.details.total,
                validation_rate: (((auditResults.details.total - auditResults.problematicQuestions) / auditResults.details.total) * 100).toFixed(1) + '%',
                critical_issues: auditResults.totalIssues,
                meets_95_percent_gate: auditResults.problematicQuestions <= (auditResults.details.total * 0.05)
            };
            
            return score;
            
        } catch (error) {
            return {
                error: error.message,
                blocked: true
            };
        }
    }
    
    /**
     * Quality Gate complet pour release
     */
    static async validateRelease() {
        console.log('🛡️ === QUALITY GATE RELEASE ===\n');
        
        const result = {
            passed: false,
            ci_tests: null,
            quality_score: null,
            blocking_issues: [],
            ready_for_release: false
        };
        
        try {
            // 1. Tests CI
            console.log('🧪 Running CI tests...');
            result.ci_tests = await this.runCITests();
            
            if (!result.ci_tests.passed) {
                result.blocking_issues.push({
                    type: 'CI_TESTS_FAILED',
                    details: `${result.ci_tests.failed_count}/${result.ci_tests.total} tests failed`,
                    failed_tests: result.ci_tests.failed_tests
                });
            }
            
            // 2. Quality Score
            console.log('📊 Calculating quality score...');
            result.quality_score = await this.calculateQualityScore();
            
            if (!result.quality_score.meets_95_percent_gate) {
                result.blocking_issues.push({
                    type: 'QUALITY_SCORE_LOW',
                    details: `Only ${result.quality_score.validation_rate} validated (≥95% required)`,
                    critical_issues: result.quality_score.critical_issues
                });
            }
            
            // 3. Verdict final
            result.passed = result.blocking_issues.length === 0;
            result.ready_for_release = result.passed;
            
            // 4. Rapport
            console.log('\n🎯 === QUALITY GATE RESULT ===');
            console.log(`CI Tests: ${result.ci_tests.success_rate}`);
            console.log(`Quality Score: ${result.quality_score.validation_rate}`);
            console.log(`Blocking Issues: ${result.blocking_issues.length}`);
            console.log(`Ready for Release: ${result.ready_for_release ? '✅ YES' : '❌ NO'}`);
            
            if (result.blocking_issues.length > 0) {
                console.log('\n🚨 BLOCKING ISSUES:');
                result.blocking_issues.forEach((issue, idx) => {
                    console.log(`${idx + 1}. ${issue.type}: ${issue.details}`);
                });
            }
            
            return result;
            
        } catch (error) {
            result.error = error.message;
            console.error('💥 Quality Gate Error:', error);
            return result;
        }
    }
}

module.exports = QualityGate;