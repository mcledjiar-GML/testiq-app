/**
 * 🚀 ROUTES BULK OPERATIONS - 100% QUALITY GATES
 * ===============================================
 * 
 * Import/export en lot avec validation qualité complète.
 * TOUS LES ENDPOINTS ont Quality Gates obligatoires.
 */

const express = require('express');
const router = express.Router();
const QuestionV2 = require('../models/QuestionV2');
const QuestionValidator = require('../middleware/question-validation');
const QualityGate = require('../middleware/quality-gate');

/**
 * POST /bulk/import
 * Import en lot avec Quality Gate complet sur chaque item
 */
router.post('/import', async (req, res) => {
    try {
        const { questions, validateAll = true } = req.body;
        
        if (!Array.isArray(questions)) {
            return res.status(400).json({
                error: 'Format invalide',
                message: 'Expected array of questions'
            });
        }
        
        console.log(`🔍 Bulk import: ${questions.length} questions à traiter`);
        
        const results = {
            total: questions.length,
            imported: 0,
            rejected: 0,
            errors: []
        };
        
        // Valider chaque question individuellement avec Quality Gate
        for (const [index, questionData] of questions.entries()) {
            try {
                // Forcer l'état published pour déclencher le Quality Gate
                const tempQuestion = { ...questionData, state: 'published' };
                
                // Simuler req/res pour le middleware
                const mockReq = { body: tempQuestion };
                const mockRes = {
                    status: (code) => ({
                        json: (data) => {
                            throw new Error(`Quality Gate failed: ${data.error} - ${data.message}`);
                        }
                    })
                };
                
                // Exécuter Quality Gate
                await new Promise((resolve, reject) => {
                    QualityGate.validateBeforePublish(mockReq, mockRes, (error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });
                
                // Si on arrive ici, Quality Gate OK
                const question = new QuestionV2(questionData);
                await question.save();
                
                results.imported++;
                console.log(`✅ Question ${index + 1}/${questions.length} importée`);
                
            } catch (error) {
                results.rejected++;
                results.errors.push({
                    index: index + 1,
                    qid: questionData.qid || 'unknown',
                    error: error.message
                });
                console.log(`❌ Question ${index + 1}/${questions.length} rejetée: ${error.message}`);
            }
        }
        
        const successRate = (results.imported / results.total) * 100;
        
        res.json({
            success: results.rejected === 0,
            summary: {
                total: results.total,
                imported: results.imported,
                rejected: results.rejected,
                successRate: `${successRate.toFixed(1)}%`
            },
            errors: results.errors,
            message: results.rejected === 0 
                ? `✅ Import réussi: ${results.imported} questions`
                : `⚠️ Import partiel: ${results.imported}/${results.total} questions (${results.rejected} rejetées)`
        });
        
    } catch (error) {
        console.error('Bulk import error:', error);
        res.status(500).json({
            error: 'Bulk import failed',
            message: error.message
        });
    }
});

/**
 * POST /bulk/validate
 * Validation en lot sans import (dry-run)
 */
router.post('/validate', async (req, res) => {
    try {
        const { questions } = req.body;
        
        if (!Array.isArray(questions)) {
            return res.status(400).json({
                error: 'Format invalide',
                message: 'Expected array of questions'
            });
        }
        
        console.log(`🔍 Bulk validation: ${questions.length} questions à valider`);
        
        const results = {
            total: questions.length,
            valid: 0,
            invalid: 0,
            reports: []
        };
        
        for (const [index, questionData] of questions.entries()) {
            try {
                // Générer rapport qualité complet
                const qualityReport = await QualityGate.generateQualityReport({
                    ...questionData,
                    state: 'published' // Forcer pour déclencher validation complète
                });
                
                const isValid = qualityReport.readyForProduction;
                
                if (isValid) {
                    results.valid++;
                } else {
                    results.invalid++;
                }
                
                results.reports.push({
                    index: index + 1,
                    qid: questionData.qid || `question-${index + 1}`,
                    valid: isValid,
                    score: qualityReport.summary.successRate,
                    blockers: qualityReport.blockers.length,
                    recommendations: qualityReport.recommendations.length
                });
                
            } catch (error) {
                results.invalid++;
                results.reports.push({
                    index: index + 1,
                    qid: questionData.qid || `question-${index + 1}`,
                    valid: false,
                    error: error.message
                });
            }
        }
        
        const validationRate = (results.valid / results.total) * 100;
        
        res.json({
            success: true,
            summary: {
                total: results.total,
                valid: results.valid,
                invalid: results.invalid,
                validationRate: `${validationRate.toFixed(1)}%`,
                meetsCriteria: validationRate >= 95
            },
            reports: results.reports,
            recommendation: validationRate >= 95 
                ? '✅ Lot prêt pour import en production'
                : `❌ Correction requise: ${results.invalid} questions invalides`
        });
        
    } catch (error) {
        console.error('Bulk validation error:', error);
        res.status(500).json({
            error: 'Bulk validation failed',
            message: error.message
        });
    }
});

/**
 * POST /bulk/publish
 * Publication en lot avec corpus gate obligatoire
 */
router.post('/publish', async (req, res) => {
    try {
        const { qids, locale = 'fr' } = req.body;
        
        if (!Array.isArray(qids)) {
            return res.status(400).json({
                error: 'Format invalide',
                message: 'Expected array of QIDs'
            });
        }
        
        console.log(`🔍 Bulk publish: ${qids.length} questions à publier`);
        
        // 1. Vérifier corpus gate AVANT publication
        const corpusGate = await this.checkCorpusGate(qids, locale);
        if (!corpusGate.passed) {
            return res.status(422).json({
                error: 'Corpus Gate Failed',
                message: 'Le corpus ne respecte pas les critères de qualité',
                corpusGate,
                blocked: true
            });
        }
        
        // 2. Publier individuellement avec Quality Gates
        const results = {
            total: qids.length,
            published: 0,
            failed: 0,
            errors: []
        };
        
        for (const qid of qids) {
            try {
                const question = await QuestionV2.findOne({ qid, state: 'draft' });
                if (!question) {
                    throw new Error(`Question ${qid} not found or already published`);
                }
                
                // Quality Gate individuel
                const tempQuestion = { ...question.toObject(), state: 'published' };
                const qualityReport = await QualityGate.generateQualityReport(tempQuestion);
                
                if (!qualityReport.readyForProduction) {
                    throw new Error(`Quality Gate failed: ${qualityReport.blockers.length} blockers`);
                }
                
                // Publication
                question.state = 'published';
                question.publishedAt = new Date();
                await question.save();
                
                results.published++;
                console.log(`✅ ${qid} publié`);
                
            } catch (error) {
                results.failed++;
                results.errors.push({
                    qid,
                    error: error.message
                });
                console.log(`❌ ${qid} échec: ${error.message}`);
            }
        }
        
        res.json({
            success: results.failed === 0,
            summary: results,
            corpusGate,
            message: results.failed === 0 
                ? `✅ Publication réussie: ${results.published} questions`
                : `⚠️ Publication partielle: ${results.published}/${results.total} questions`
        });
        
    } catch (error) {
        console.error('Bulk publish error:', error);
        res.status(500).json({
            error: 'Bulk publish failed',
            message: error.message
        });
    }
});

/**
 * Vérification du corpus gate (≥95% validés + 0 critique)
 */
async function checkCorpusGate(qids, locale) {
    const questions = await QuestionV2.find({ 
        qid: { $in: qids },
        $or: [{ locale }, { locale: { $exists: false } }]
    });
    
    let validCount = 0;
    let criticalIssues = 0;
    let visibleHints = 0;
    let wrongOptionCount = 0;
    
    const issues = [];
    
    for (const question of questions) {
        try {
            const qualityReport = await QualityGate.generateQualityReport({
                ...question.toObject(),
                state: 'published'
            });
            
            if (qualityReport.readyForProduction) {
                validCount++;
            } else {
                // Compter les types d'issues
                qualityReport.blockers.forEach(blocker => {
                    if (blocker.name === 'Solution Unique') criticalIssues++;
                    if (blocker.name === 'No Visible Hints') visibleHints++;
                    if (blocker.name === 'Options Count') wrongOptionCount++;
                });
                
                issues.push({
                    qid: question.qid,
                    blockers: qualityReport.blockers.length,
                    details: qualityReport.blockers.map(b => b.name)
                });
            }
        } catch (error) {
            criticalIssues++;
            issues.push({
                qid: question.qid,
                error: error.message
            });
        }
    }
    
    const validationRate = (validCount / questions.length) * 100;
    
    return {
        passed: validationRate >= 95 && criticalIssues === 0 && visibleHints === 0 && wrongOptionCount === 0,
        summary: {
            total: questions.length,
            valid: validCount,
            validationRate: `${validationRate.toFixed(1)}%`,
            criticalIssues,
            visibleHints,
            wrongOptionCount
        },
        criteria: {
            validationRate: { required: '≥95%', actual: `${validationRate.toFixed(1)}%`, passed: validationRate >= 95 },
            criticalIssues: { required: '0', actual: criticalIssues, passed: criticalIssues === 0 },
            visibleHints: { required: '0', actual: visibleHints, passed: visibleHints === 0 },
            optionCount: { required: '4 for all', actual: wrongOptionCount, passed: wrongOptionCount === 0 }
        },
        issues: issues.slice(0, 10), // Limiter pour éviter payload trop gros
        locale
    };
}

module.exports = router;