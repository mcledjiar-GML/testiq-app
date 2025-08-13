/**
 * 🚫 CORPUS GATE - VALIDATION NIVEAU CORPUS
 * =========================================
 * 
 * Gate stricte au niveau corpus qui refuse TOUT déploiement si :
 * - < 95% des items validés (solution unique)
 * - > 0 erreurs critiques (solution non unique, options ≠ 4)
 * - > 0 indices visibles
 * - > 0 problèmes d'accessibilité
 * 
 * TOUTES LES LOCALES doivent respecter ces critères.
 */

const QuestionV2 = require('../models/QuestionV2');
const QualityGate = require('./quality-gate');

class CorpusGate {
    
    /**
     * Middleware Express pour bloquer si corpus gate échoue
     */
    static async enforceCorpusGate(req, res, next) {
        try {
            console.log('🔍 Corpus Gate: Vérification niveau corpus...');
            
            const corpusResult = await CorpusGate.validateCorpus();
            
            if (!corpusResult.passed) {
                console.log('❌ Corpus Gate: DÉPLOIEMENT BLOQUÉ');
                console.log(`   Critères non respectés: ${corpusResult.failedCriteria.length}`);
                
                return res.status(422).json({
                    error: 'Corpus Gate FAILED',
                    message: 'Le corpus ne respecte pas les critères de qualité pour la production',
                    blocked: true,
                    summary: corpusResult.summary,
                    failedCriteria: corpusResult.failedCriteria,
                    byLocale: corpusResult.byLocale,
                    mustFix: corpusResult.mustFix,
                    recommendation: 'Corriger TOUS les items en échec avant re-déploiement'
                });
            }
            
            console.log('✅ Corpus Gate: Validation réussie');
            req.corpusGatePassed = true;
            next();
            
        } catch (error) {
            console.error('💥 Erreur Corpus Gate:', error);
            return res.status(500).json({
                error: 'Corpus Gate Error',
                message: 'Erreur lors de la vérification corpus',
                blocked: true,
                details: error.message
            });
        }
    }
    
    /**
     * Valider l'ensemble du corpus selon les 4 critères stricts
     */
    static async validateCorpus() {
        console.log('📊 Analyse du corpus complet...');
        
        // Récupérer TOUTES les questions publiées, toutes locales
        const questions = await QuestionV2.find({ state: 'published' }).lean();
        
        if (questions.length === 0) {
            return {
                passed: false,
                summary: { total: 0, reason: 'Aucune question publiée' },
                failedCriteria: ['EMPTY_CORPUS'],
                mustFix: ['Publier au moins une question valide']
            };
        }
        
        // Grouper par locale
        const byLocale = {};
        questions.forEach(q => {
            const locale = q.locale || 'default';
            if (!byLocale[locale]) byLocale[locale] = [];
            byLocale[locale].push(q);
        });
        
        console.log(`📋 ${questions.length} questions dans ${Object.keys(byLocale).length} locales`);
        
        const globalResult = {
            passed: true,
            summary: {
                totalQuestions: questions.length,
                totalLocales: Object.keys(byLocale).length,
                validQuestions: 0,
                criticalIssues: 0,
                visibleHints: 0,
                wrongOptions: 0
            },
            byLocale: {},
            failedCriteria: [],
            mustFix: []
        };
        
        // Analyser chaque locale
        for (const [locale, localeQuestions] of Object.entries(byLocale)) {
            console.log(`🔍 Analyse locale: ${locale} (${localeQuestions.length} questions)`);
            
            const localeResult = await this.validateLocaleCorpus(locale, localeQuestions);
            globalResult.byLocale[locale] = localeResult;
            
            // Agréger les statistiques globales
            globalResult.summary.validQuestions += localeResult.summary.valid;
            globalResult.summary.criticalIssues += localeResult.summary.criticalIssues;
            globalResult.summary.visibleHints += localeResult.summary.visibleHints;
            globalResult.summary.wrongOptions += localeResult.summary.wrongOptions;
            
            // Si une locale échoue, tout échoue
            if (!localeResult.passed) {
                globalResult.passed = false;
                globalResult.failedCriteria.push(`LOCALE_${locale.toUpperCase()}_FAILED`);
                globalResult.mustFix.push(`Corriger locale ${locale}: ${localeResult.mustFix.join(', ')}`);
            }
        }
        
        // Vérifier les critères globaux
        const globalValidationRate = (globalResult.summary.validQuestions / globalResult.summary.totalQuestions) * 100;
        
        const criteria = [
            {
                name: 'VALIDATION_RATE_95',
                required: '≥95%',
                actual: `${globalValidationRate.toFixed(1)}%`,
                passed: globalValidationRate >= 95,
                critical: true
            },
            {
                name: 'ZERO_CRITICAL_ISSUES',
                required: '0',
                actual: globalResult.summary.criticalIssues,
                passed: globalResult.summary.criticalIssues === 0,
                critical: true
            },
            {
                name: 'ZERO_VISIBLE_HINTS',
                required: '0',
                actual: globalResult.summary.visibleHints,
                passed: globalResult.summary.visibleHints === 0,
                critical: true
            },
            {
                name: 'ALL_4_OPTIONS',
                required: '4 for all',
                actual: globalResult.summary.wrongOptions,
                passed: globalResult.summary.wrongOptions === 0,
                critical: true
            }
        ];
        
        // Identifier les critères échoués
        criteria.forEach(criterion => {
            if (!criterion.passed) {
                globalResult.passed = false;
                globalResult.failedCriteria.push(criterion.name);
                globalResult.mustFix.push(`${criterion.name}: requis ${criterion.required}, trouvé ${criterion.actual}`);
            }
        });
        
        globalResult.criteria = criteria;
        globalResult.summary.globalValidationRate = `${globalValidationRate.toFixed(1)}%`;
        
        console.log(`📊 Résultat corpus: ${globalResult.passed ? '✅ VALIDÉ' : '❌ BLOQUÉ'}`);
        console.log(`   Taux validation global: ${globalValidationRate.toFixed(1)}%`);
        console.log(`   Erreurs critiques: ${globalResult.summary.criticalIssues}`);
        
        return globalResult;
    }
    
    /**
     * Valider une locale spécifique
     */
    static async validateLocaleCorpus(locale, questions) {
        let validCount = 0;
        let criticalIssues = 0;
        let visibleHints = 0;
        let wrongOptions = 0;
        
        const issues = [];
        
        for (const question of questions) {
            try {
                // Utiliser le Quality Gate pour analyse individuelle
                const qualityReport = await QualityGate.generateQualityReport({
                    ...question,
                    state: 'published'
                });
                
                if (qualityReport.readyForProduction) {
                    validCount++;
                } else {
                    // Classifier les types d'erreurs
                    qualityReport.blockers.forEach(blocker => {
                        switch (blocker.name) {
                            case 'Solution Unique':
                            case 'QID Valid':
                            case 'Content Not Empty':
                                criticalIssues++;
                                break;
                            case 'No Visible Hints':
                                visibleHints++;
                                break;
                            case 'Options Count':
                            case 'Exactly One Correct':
                                wrongOptions++;
                                break;
                        }
                    });
                    
                    // Garder seulement les pires cas pour le rapport
                    if (qualityReport.blockers.length > 0) {
                        issues.push({
                            qid: question.qid,
                            version: question.version,
                            blockers: qualityReport.blockers.length,
                            criticalTypes: qualityReport.blockers.map(b => b.name)
                        });
                    }
                }
                
            } catch (error) {
                criticalIssues++;
                issues.push({
                    qid: question.qid,
                    version: question.version,
                    error: 'Analysis failed',
                    details: error.message
                });
            }
        }
        
        const validationRate = (validCount / questions.length) * 100;
        
        const localeResult = {
            locale,
            passed: validationRate >= 95 && criticalIssues === 0 && visibleHints === 0 && wrongOptions === 0,
            summary: {
                total: questions.length,
                valid: validCount,
                validationRate: `${validationRate.toFixed(1)}%`,
                criticalIssues,
                visibleHints,
                wrongOptions
            },
            issues: issues.slice(0, 5), // Limiter pour éviter surcharge
            mustFix: []
        };
        
        // Générer les actions à faire
        if (validationRate < 95) {
            const missing = Math.ceil(questions.length * 0.95) - validCount;
            localeResult.mustFix.push(`Valider ${missing} questions supplémentaires`);
        }
        if (criticalIssues > 0) {
            localeResult.mustFix.push(`Corriger ${criticalIssues} erreurs critiques`);
        }
        if (visibleHints > 0) {
            localeResult.mustFix.push(`Supprimer ${visibleHints} indices visibles`);
        }
        if (wrongOptions > 0) {
            localeResult.mustFix.push(`Corriger ${wrongOptions} problèmes d'options`);
        }
        
        return localeResult;
    }
    
    /**
     * Générer un rapport corpus détaillé
     */
    static async generateCorpusReport() {
        const corpusValidation = await this.validateCorpus();
        
        return {
            timestamp: new Date().toISOString(),
            version: '1.0',
            corpusGate: {
                passed: corpusValidation.passed,
                readyForProduction: corpusValidation.passed,
                blockers: corpusValidation.failedCriteria.length,
                mustFix: corpusValidation.mustFix.length
            },
            summary: corpusValidation.summary,
            criteria: corpusValidation.criteria,
            byLocale: corpusValidation.byLocale,
            actions: corpusValidation.mustFix,
            recommendation: corpusValidation.passed 
                ? '✅ Corpus prêt pour déploiement production'
                : '❌ DÉPLOIEMENT BLOQUÉ - Corrections obligatoires'
        };
    }
    
    /**
     * Version rapide pour CI/CD
     */
    static async quickCorpusCheck() {
        try {
            const questions = await QuestionV2.find({ state: 'published' }).lean();
            
            if (questions.length === 0) {
                return { passed: false, reason: 'No published questions' };
            }
            
            // Check rapide des critères de base
            const wrongOptionCount = questions.filter(q => !q.options || q.options.length !== 4).length;
            const noCorrectAnswer = questions.filter(q => {
                const correctCount = q.options?.filter(opt => opt.isCorrect).length || 0;
                return correctCount !== 1;
            }).length;
            
            const basicIssues = wrongOptionCount + noCorrectAnswer;
            const basicValidRate = ((questions.length - basicIssues) / questions.length) * 100;
            
            return {
                passed: basicValidRate >= 95 && basicIssues === 0,
                summary: {
                    total: questions.length,
                    basicValidRate: `${basicValidRate.toFixed(1)}%`,
                    basicIssues
                }
            };
            
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }
}

module.exports = CorpusGate;