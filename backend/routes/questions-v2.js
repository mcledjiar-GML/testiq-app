/**
 * 🛡️ ROUTES API QUESTIONS V2 - AVEC VALIDATION QUALITÉ
 * =====================================================
 * 
 * Routes pour la gestion des questions V2 avec validation automatique
 * et système de qualité intégré.
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');
const QuestionValidator = require('../middleware/question-validation');
const QualityGate = require('../middleware/quality-gate');

// Utiliser le modèle Question existant (défini dans server.js)
const Question = mongoose.models.Question || mongoose.model('Question');

// Middleware d'authentification (à adapter selon votre système)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }

  // JWT verification logic ici
  // Pour simplifier, on passe directement
  req.user = { id: 'admin', role: 'admin' };
  next();
};

/**
 * GET /questions-v2/series/:serie
 * Récupérer toutes les questions d'une série spécifique (A, B, C, D, E)
 */
router.get('/series/:serie', async (req, res) => {
  try {
    const { serie } = req.params;
    
    // Valider la série
    const validSeries = ['A', 'B', 'C', 'D', 'E'];
    if (!validSeries.includes(serie.toUpperCase())) {
      return res.status(400).json({ 
        error: `Série invalide. Séries supportées: ${validSeries.join(', ')}` 
      });
    }

    console.log(`📚 Récupération questions série ${serie.toUpperCase()}`);

    // Récupérer questions de la série depuis la collection classique
    const questions = await Question.find({ 
      series: serie.toUpperCase(),
      type: 'raven'
    }).sort({ questionIndex: 1 });

    console.log(`✅ ${questions.length} questions trouvées pour série ${serie.toUpperCase()}`);

    // Formatage pour le frontend
    const formattedQuestions = questions.map(q => ({
      _id: q._id,
      type: q.type,
      series: q.series,
      questionIndex: q.questionIndex,
      difficulty: q.difficulty,
      content: q.content,
      stimulus: q.stimulus,
      options: q.options,
      correctAnswer: q.correctAnswer,
      category: q.category,
      timeLimit: q.timeLimit,
      explanation: q.explanation,
      visualPattern: q.visualPattern,
      hasVisual: q.hasVisual,
      visualType: q.visualType
    }));

    res.json({
      serie: serie.toUpperCase(),
      questions: formattedQuestions,
      total: formattedQuestions.length,
      metadata: {
        difficulty_range: `${Math.min(...formattedQuestions.map(q => q.difficulty))}-${Math.max(...formattedQuestions.map(q => q.difficulty))}`,
        categories: [...new Set(formattedQuestions.map(q => q.category))],
        avg_time_limit: Math.round(formattedQuestions.reduce((sum, q) => sum + q.timeLimit, 0) / formattedQuestions.length)
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération questions série:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des questions',
      details: error.message 
    });
  }
});

/**
 * GET /questions-v2
 * Récupérer toutes les questions V2 publiées
 */
router.get('/', async (req, res) => {
  try {
    const { 
      series, 
      type = 'raven', 
      difficulty, 
      limit = 50, 
      offset = 0,
      alphabet,
      category
    } = req.query;

    // Construire la requête
    const query = { state: 'published' };
    
    if (series) query.series = series;
    if (type) query.type = type;
    if (difficulty) query.difficulty = parseInt(difficulty);
    if (alphabet) query.alphabet = alphabet;
    if (category) query.category = category;

    const questions = await QuestionV2.find(query)
      .sort({ series: 1, difficulty: 1, questionIndex: 1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    const total = await QuestionV2.countDocuments(query);

    res.json({
      questions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > (parseInt(offset) + questions.length)
      }
    });

  } catch (error) {
    console.error('Erreur récupération questions V2:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /questions-v2/:qid
 * Récupérer une question V2 spécifique
 */
router.get('/:qid', async (req, res) => {
  try {
    const { qid } = req.params;
    const { version } = req.query;

    const query = { qid, state: 'published' };
    if (version) query.version = parseInt(version);

    const question = await QuestionV2.findOne(query)
      .sort({ version: -1 }) // Version la plus récente par défaut
      .lean();

    if (!question) {
      return res.status(404).json({ error: 'Question non trouvée' });
    }

    res.json(question);

  } catch (error) {
    console.error('Erreur récupération question V2:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /questions-v2
 * Créer une nouvelle question V2 avec validation qualité
 */
router.post('/', authenticateToken, QuestionValidator.validateQuestion, QualityGate.validateBeforePublish, async (req, res) => {
  try {
    const questionData = req.body;
    
    // Ajouter des métadonnées
    questionData.createdBy = req.user.id;
    questionData.state = 'draft'; // Toujours commencer en brouillon
    
    const question = new QuestionV2(questionData);
    await question.save();

    res.status(201).json({
      message: 'Question créée avec succès',
      question: {
        qid: question.qid,
        version: question.version,
        state: question.state
      },
      validationResult: req.validationResult
    });

  } catch (error) {
    console.error('Erreur création question V2:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Erreur de validation',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /questions-v2/:qid
 * Mettre à jour une question V2 (crée une nouvelle version)
 */
router.put('/:qid', authenticateToken, QuestionValidator.validateQuestion, QualityGate.validateBeforePublish, async (req, res) => {
  try {
    const { qid } = req.params;
    const updateData = req.body;

    // Trouver la question existante
    const existingQuestion = await QuestionV2.findOne({ qid }).sort({ version: -1 });
    
    if (!existingQuestion) {
      return res.status(404).json({ error: 'Question non trouvée' });
    }

    // Créer une nouvelle version
    const newVersion = existingQuestion.createNewVersion();
    Object.assign(newVersion, updateData);
    newVersion.updatedBy = req.user.id;
    
    await newVersion.save();

    res.json({
      message: 'Nouvelle version créée avec succès',
      question: {
        qid: newVersion.qid,
        version: newVersion.version,
        state: newVersion.state
      },
      validationResult: req.validationResult
    });

  } catch (error) {
    console.error('Erreur mise à jour question V2:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /questions-v2/:qid/publish
 * Publier une question V2 (validation stricte)
 */
router.post('/:qid/publish', authenticateToken, QualityGate.validateBeforePublish, async (req, res) => {
  try {
    const { qid } = req.params;
    const { version } = req.body;

    const question = await QuestionV2.findOne({ qid, version: version || 1 });
    
    if (!question) {
      return res.status(404).json({ error: 'Question non trouvée' });
    }

    // Validation stricte avant publication
    const validationResult = QuestionValidator.validate(question.toObject());
    
    if (!validationResult.isValid) {
      return res.status(400).json({
        error: 'Validation échouée pour la publication',
        issues: validationResult.issues,
        severity: validationResult.severity,
        suggestions: validationResult.suggestions
      });
    }

    // Publier la question
    question.state = 'published';
    question.publishedAt = new Date();
    await question.save();

    res.json({
      message: 'Question publiée avec succès',
      question: {
        qid: question.qid,
        version: question.version,
        state: question.state,
        publishedAt: question.publishedAt
      },
      validationResult
    });

  } catch (error) {
    console.error('Erreur publication question V2:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * POST /questions-v2/:qid/validate
 * Valider une question sans la sauvegarder
 */
router.post('/:qid/validate', async (req, res) => {
  try {
    const questionData = req.body;
    const validationResult = QuestionValidator.validate(questionData);
    
    res.json({
      validation: validationResult,
      recommendations: {
        canPublish: validationResult.isValid,
        criticalIssues: validationResult.issues.length,
        warnings: validationResult.warnings.length,
        severity: validationResult.severity
      }
    });

  } catch (error) {
    console.error('Erreur validation question V2:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /questions-v2/quality/report
 * Rapport de qualité sur toutes les questions
 */
router.get('/quality/report', authenticateToken, async (req, res) => {
  try {
    const questions = await QuestionV2.find({ state: 'published' }).lean();
    
    const report = {
      total: questions.length,
      validated: 0,
      issues: [],
      summary: {
        critical: 0,
        medium: 0,
        low: 0,
        clean: 0
      }
    };

    for (const question of questions) {
      const validation = QuestionValidator.validate(question);
      
      if (validation.isValid) {
        report.validated++;
        report.summary.clean++;
      } else {
        report.issues.push({
          qid: question.qid,
          version: question.version,
          questionIndex: question.questionIndex,
          severity: validation.severity,
          issueCount: validation.issues.length,
          issues: validation.issues.slice(0, 2) // Limiter pour l'aperçu
        });
        
        report.summary[validation.severity]++;
      }
    }

    report.healthScore = ((report.validated / report.total) * 100).toFixed(1);

    res.json(report);

  } catch (error) {
    console.error('Erreur rapport qualité:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * DELETE /questions-v2/:qid
 * Archiver une question V2 (soft delete)
 */
router.delete('/:qid', authenticateToken, async (req, res) => {
  try {
    const { qid } = req.params;
    const { version } = req.query;

    const query = { qid };
    if (version) query.version = parseInt(version);

    const result = await QuestionV2.updateMany(query, {
      state: 'archived',
      archivedAt: new Date()
    });

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Question non trouvée' });
    }

    res.json({
      message: `${result.modifiedCount} version(s) archivée(s)`,
      archivedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Erreur archivage question V2:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;