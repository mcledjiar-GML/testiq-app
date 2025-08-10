const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware de sécurité
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.'
});
app.use(limiter);

// Rate limiting spécifique pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limite à 5 tentatives de connexion par IP
  message: 'Trop de tentatives de connexion, réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connecté'))
.catch(err => console.log('❌ Erreur MongoDB:', err));

// Modèles Mongoose
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  testHistory: [{
    testType: String,
    score: Number,
    date: { type: Date, default: Date.now },
    answers: Array,
    iq: Number,
    classification: Object,
    testLevel: String,
    difficulty: Number
  }]
});

const QuestionSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['raven', 'cattell', 'custom'] },
  series: { type: String, enum: ['A', 'B', 'C', 'D', 'E'] }, // Série pour les tests Raven
  difficulty: { type: Number, min: 1, max: 10, required: true },
  content: { type: String, required: true },
  options: [String],
  correctAnswer: Number,
  category: { type: String, enum: ['logique', 'verbal', 'spatial', 'mémoire'] },
  timeLimit: { type: Number, default: 60 },
  questionIndex: { type: Number } // Index pour mapping avec les explications
});

const User = mongoose.model('User', UserSchema);
const Question = mongoose.model('Question', QuestionSchema);

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'authentification requis' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Importation des questions Raven complètes et du calculateur d'IQ
const ravenQuestions = require('./raven_questions');
const IQCalculator = require('./iq_calculator');

// Charger les explications avancées
const fs = require('fs');
const path = require('path');
const explanationsFilePath = path.join(__dirname, 'explanations_audit_corrected.json');
let advancedExplanations = {};

try {
  const explanationsData = JSON.parse(fs.readFileSync(explanationsFilePath, 'utf8'));
  
  if (explanationsData.explications) {
    advancedExplanations = explanationsData.explications.reduce((acc, exp) => {
      acc[exp.questionId] = exp;
      return acc;
    }, {});
    console.log(`✅ ${Object.keys(advancedExplanations).length} explications pédagogiques avancées chargées`);
  } else {
    console.warn('⚠️ Propriété "explications" non trouvée dans le fichier JSON');
  }
} catch (error) {
  console.warn('⚠️ Impossible de charger les explications avancées:', error.message);
}

// Création automatique de questions de test
const seedQuestions = async () => {
  const count = await Question.countDocuments();
  if (count === 0) {
    // Ajouter un index à chaque question
    const questionsWithIndex = ravenQuestions.map((q, index) => ({
      ...q,
      questionIndex: index + 1
    }));
    await Question.insertMany(questionsWithIndex);
    console.log(`✅ ${ravenQuestions.length} questions Raven créées (5 séries complètes)`);
  } else {
    // Toujours vérifier et ajouter l'index aux questions existantes
    console.log('🔄 Vérification des index des questions existantes...');
    
    // Trier par série et difficulté pour maintenir l'ordre cohérent
    const sortedQuestions = await Question.find({}).sort({ series: 1, difficulty: 1, _id: 1 });
    
    let updated = 0;
    for (let i = 0; i < sortedQuestions.length; i++) {
      if (!sortedQuestions[i].questionIndex || sortedQuestions[i].questionIndex !== (i + 1)) {
        await Question.findByIdAndUpdate(sortedQuestions[i]._id, { 
          questionIndex: i + 1 
        });
        updated++;
      }
    }
    
    if (updated > 0) {
      console.log(`✅ Index mis à jour pour ${updated} questions`);
    } else {
      console.log(`✅ Tous les index sont à jour (${sortedQuestions.length} questions)`);
    }
  }
};

// Fonction de validation des données d'entrée
const validateRegisterInput = (email, password, name) => {
  const errors = [];
  
  if (!email || !email.trim()) {
    errors.push('Email requis');
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.push('Format d\'email invalide');
  }
  
  if (!password || password.length < 6) {
    errors.push('Mot de passe requis (minimum 6 caractères)');
  }
  
  if (!name || !name.trim()) {
    errors.push('Nom requis');
  } else if (name.trim().length < 2) {
    errors.push('Nom trop court (minimum 2 caractères)');
  }
  
  return errors;
};

const validateLoginInput = (email, password) => {
  const errors = [];
  
  if (!email || !email.trim()) {
    errors.push('Email requis');
  }
  
  if (!password) {
    errors.push('Mot de passe requis');
  }
  
  return errors;
};

// Routes d'authentification
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validation des données d'entrée
    const validationErrors = validateRegisterInput(email, password, name);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Un utilisateur avec cet email existe déjà' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ 
      email: email.trim().toLowerCase(), 
      password: hashedPassword, 
      name: name.trim() 
    });
    await user.save();
    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation des données d'entrée
    const validationErrors = validateLoginInput(email, password);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }
    
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Routes des tests (protégées)
app.post('/api/tests/start', authenticateToken, async (req, res) => {
  try {
    const { testType } = req.body;
    
    // Validation de l'entrée
    if (!testType || !['raven', 'cattell', 'custom'].includes(testType)) {
      return res.status(400).json({ error: 'Type de test invalide' });
    }
    
    // Sélectionner des questions selon le niveau demandé
    const { level = 'standard' } = req.body;
    let questionCount = 20; // Par défaut: test standard
    
    if (level === 'short') questionCount = 12;    // Test rapide
    else if (level === 'full') questionCount = 60;  // Test complet Raven
    
    // Sélectionner des questions de chaque série pour un test équilibré
    const allQuestions = await Question.find({ type: testType });
    let selectedQuestions = [];
    
    if (level === 'full') {
      // Test complet: toutes les questions dans l'ordre des séries
      selectedQuestions = allQuestions.sort((a, b) => {
        const seriesOrder = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 };
        return seriesOrder[a.series] - seriesOrder[b.series];
      });
    } else {
      // Test partiel: échantillonner chaque série
      const series = ['A', 'B', 'C', 'D', 'E'];
      const questionsPerSeries = Math.ceil(questionCount / 5);
      
      for (const s of series) {
        const seriesQuestions = allQuestions.filter(q => q.series === s);
        const shuffled = seriesQuestions.sort(() => 0.5 - Math.random());
        selectedQuestions.push(...shuffled.slice(0, questionsPerSeries));
      }
      
      // Mélanger le résultat final et limiter au nombre souhaité
      selectedQuestions = selectedQuestions.sort(() => 0.5 - Math.random()).slice(0, questionCount);
    }
    
    const questions = selectedQuestions;
    
    if (questions.length === 0) {
      return res.status(404).json({ error: 'Aucune question trouvée pour ce type de test' });
    }
    
    res.json({ questions });
  } catch (error) {
    console.error('Erreur lors du démarrage du test:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.post('/api/tests/submit', authenticateToken, async (req, res) => {
  try {
    const { userId, answers, testType, testLevel = 'standard' } = req.body;
    
    // Validation des données
    if (!userId || !answers || !Array.isArray(answers) || !testType) {
      return res.status(400).json({ error: 'Données manquantes ou invalides' });
    }
    
    // Vérifier que l'utilisateur correspond au token
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const correctAnswers = answers.filter(answer => {
      return answer.selectedOption === answer.correctAnswer;
    }).length;
    
    const score = Math.round((correctAnswers / answers.length) * 100);
    
    // Calculer la difficulté moyenne des questions répondues
    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.find({ '_id': { $in: questionIds } });
    const avgDifficulty = questions.reduce((sum, q) => sum + q.difficulty, 0) / questions.length;
    
    // Calculer l'IQ avec le nouveau système
    const iqResult = IQCalculator.calculateIQ(
      correctAnswers, 
      answers.length, 
      avgDifficulty, 
      testLevel
    );
    
    // Obtenir les conseils personnalisés et la comparaison
    const advice = IQCalculator.getPersonalizedAdvice(iqResult.iq, testLevel);
    const populationComparison = IQCalculator.getPopulationComparison(iqResult.iq);
    
    // Sauvegarder le résultat avec l'IQ
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          testHistory: {
            testType,
            testLevel,
            score,
            iq: iqResult.iq,
            classification: iqResult.classification,
            difficulty: avgDifficulty,
            date: new Date(),
            answers
          }
        }
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({ 
      score, 
      correctAnswers, 
      totalQuestions: answers.length,
      iq: iqResult.iq,
      classification: iqResult.classification,
      percentile: iqResult.percentile,
      advice: advice,
      populationComparison: populationComparison,
      testLevel: testLevel,
      difficulty: avgDifficulty
    });
  } catch (error) {
    console.error('Erreur lors de la soumission du test:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

app.get('/api/results/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur correspond au token
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    // Calculer le QI pour les tests qui n'en ont pas
    const testsWithIQ = await Promise.all(user.testHistory.map(async (test) => {
      if (test.iq) {
        // Le test a déjà un QI, le retourner tel quel
        return test;
      } else {
        // Calculer le QI pour les anciens tests
        try {
          const questionIds = test.answers.map(a => a.questionId);
          const questions = await Question.find({ '_id': { $in: questionIds } });
          
          if (questions.length > 0) {
            const correctAnswers = test.answers.filter((answer, index) => {
              const question = questions.find(q => q._id.toString() === answer.questionId);
              return question && answer.selectedOption === question.correctAnswer;
            }).length;
            
            const avgDifficulty = questions.reduce((sum, q) => sum + q.difficulty, 0) / questions.length;
            const iqResult = IQCalculator.calculateIQ(correctAnswers, test.answers.length, avgDifficulty, test.testLevel || 'standard');
            
            return {
              ...test.toObject(),
              iq: iqResult.iq,
              classification: iqResult.classification,
              difficulty: avgDifficulty
            };
          }
        } catch (error) {
          console.log('Erreur calcul QI pour test ancien:', error);
        }
        
        return test;
      }
    }));

    const averageScore = testsWithIQ.length > 0 
      ? testsWithIQ.reduce((sum, test) => sum + test.score, 0) / testsWithIQ.length 
      : 0;
    
    res.json({
      tests: testsWithIQ,
      averageScore,
      interpretation: getInterpretation(averageScore)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Fonction d'interprétation
function getInterpretation(score) {
  if (score >= 90) return "Excellent - Performance très supérieure";
  if (score >= 70) return "Bien - Performance supérieure à la moyenne";
  if (score >= 50) return "Moyen - Performance dans la moyenne";
  return "À améliorer - Performance inférieure à la moyenne";
}

// Route racine
app.get('/', (req, res) => {
  res.json({ 
    message: 'API TestIQ opérationnelle !',
    version: '1.0.0',
    endpoints: ['/api/auth/register', '/api/auth/login', '/api/tests/start', '/api/tests/submit']
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Route pour supprimer un test spécifique
app.delete('/api/tests/:userId/:testIndex', authenticateToken, async (req, res) => {
  try {
    const { userId, testIndex } = req.params;
    
    // Vérifier que l'utilisateur correspond au token
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const index = parseInt(testIndex);
    console.log(`🗑️ Tentative de suppression du test index ${index} pour user ${userId}`);
    
    // Utiliser findByIdAndUpdate avec $unset pour éviter les problèmes de concurrence
    const result = await User.findByIdAndUpdate(
      userId,
      { $unset: { [`testHistory.${index}`]: 1 } },
      { new: false }
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    if (index < 0 || index >= result.testHistory.length) {
      return res.status(400).json({ error: 'Index de test invalide' });
    }
    
    // Nettoyer les éléments null du tableau
    await User.findByIdAndUpdate(
      userId,
      { $pull: { testHistory: null } }
    );
    
    console.log(`✅ Test supprimé avec succès pour user ${userId}`);
    
    // Récupérer l'utilisateur mis à jour
    const updatedUser = await User.findById(userId);
    
    res.json({ 
      message: 'Test supprimé avec succès', 
      testsRemaining: updatedUser.testHistory.length 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du test:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour supprimer tout l'historique
app.delete('/api/tests/:userId/all', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur correspond au token
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { testHistory: [] } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    res.json({ message: 'Tout l\'historique a été supprimé', testsRemaining: 0 });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'historique:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour obtenir les détails d'un test avec les bonnes réponses
app.get('/api/tests/:userId/:testIndex/review', authenticateToken, async (req, res) => {
  try {
    const { userId, testIndex } = req.params;
    console.log('🔍 Review request - userId:', userId, 'testIndex:', testIndex);
    
    // Vérifier que l'utilisateur correspond au token
    if (req.user.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const index = parseInt(testIndex);
    console.log('📊 Test history length:', user.testHistory.length, 'requested index:', index);
    if (index < 0 || index >= user.testHistory.length) {
      return res.status(400).json({ error: 'Index de test invalide' });
    }
    
    const test = user.testHistory[index];
    console.log('📝 Test data:', {
      testType: test.testType,
      answersCount: test.answers?.length,
      firstAnswer: test.answers?.[0]
    });
    
    // Récupérer les questions avec leurs bonnes réponses
    const questionIds = test.answers.map(a => a.questionId);
    console.log('🔍 Looking for question IDs:', questionIds);
    const questions = await Question.find({ '_id': { $in: questionIds } });
    console.log('📚 Found questions:', questions.length, '/', questionIds.length);
    
    // Créer un mapping pour les questions
    const questionMap = {};
    questions.forEach(q => {
      questionMap[q._id.toString()] = q;
    });
    
    // Si aucune question n'est trouvée, utilisons les premières questions disponibles
    if (questions.length === 0) {
      console.log('⚠️ Aucune question trouvée avec les IDs, récupération des premières questions disponibles...');
      const fallbackQuestions = await Question.find({ type: 'raven' }).limit(test.answers.length);
      console.log('🔄 Questions de remplacement trouvées:', fallbackQuestions.length);
      
      fallbackQuestions.forEach(q => {
        questionMap[q._id.toString()] = q;
      });
    }

    // Enrichir les réponses avec les détails des questions
    const detailedAnswers = test.answers.map((answer, index) => {
      let question = questionMap[answer.questionId];
      
      // Si pas de question trouvée, utiliser une question par défaut
      if (!question && Object.keys(questionMap).length > 0) {
        const availableQuestions = Object.values(questionMap);
        question = availableQuestions[index % availableQuestions.length];
        console.log('🔄 Utilisation question de remplacement pour index', index);
      }
      
      const actualCorrectAnswer = question ? question.correctAnswer : answer.correctAnswer;
      const isAnswerCorrect = answer.selectedOption === actualCorrectAnswer;
      
      return {
        question: question ? question.content : 'Question non trouvée',
        options: question ? question.options : [],
        yourAnswer: answer.selectedOption,
        correctAnswer: actualCorrectAnswer,
        isCorrect: isAnswerCorrect,
        difficulty: question ? question.difficulty : 0,
        series: question ? question.series : 'N/A',
        category: question ? question.category : 'N/A',
        timeUsed: answer.timeUsed || 0,
        questionIndex: question ? question.questionIndex : (index + 1), // Fallback vers index+1 si pas de questionIndex
        explanation: getExplanation(question, { 
          ...answer, 
          selectedOption: answer.selectedOption,
          correctAnswer: actualCorrectAnswer,
          isCorrect: isAnswerCorrect
        })
      };
    });
    
    // Calculer le QI si pas disponible (pour les anciens tests)
    let iqToShow = test.iq;
    let classificationToShow = test.classification;
    
    if (!iqToShow && questions.length > 0) {
      const correctCount = detailedAnswers.filter(a => a.isCorrect).length;
      const avgDifficulty = questions.reduce((sum, q) => sum + q.difficulty, 0) / questions.length;
      const iqResult = IQCalculator.calculateIQ(correctCount, test.answers.length, avgDifficulty, test.testLevel || 'standard');
      iqToShow = iqResult.iq;
      classificationToShow = iqResult.classification;
    }

    res.json({
      testInfo: {
        testType: test.testType,
        testLevel: test.testLevel || 'standard',
        date: test.date,
        score: test.score,
        iq: iqToShow,
        classification: classificationToShow,
        difficulty: test.difficulty || (questions.length > 0 ? questions.reduce((sum, q) => sum + q.difficulty, 0) / questions.length : 0)
      },
      answers: detailedAnswers,
      summary: {
        totalQuestions: test.answers.length,
        correctAnswers: detailedAnswers.filter(a => a.isCorrect).length,
        averageDifficulty: questions.length > 0 ? questions.reduce((sum, q) => sum + q.difficulty, 0) / questions.length : 0
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du test:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Système d'indexation unifié - Chargement du mapping complet (60 questions)
let questionExplanationMapping = {};
let mappingStats = {};
try {
  const mappingData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'complete_question_explanation_mapping.json'), 'utf8'));
  
  questionExplanationMapping = mappingData.mappings.reduce((acc, mapping) => {
    acc[mapping.questionContent] = {
      explanationId: mapping.explanationId,
      positionIndex: mapping.positionIndex,
      correctAnswer: mapping.correctAnswer,
      competence: mapping.competence,
      series: mapping.series,
      difficulty: mapping.difficulty,
      options: mapping.options,
      isConsistent: mapping.isConsistent
    };
    return acc;
  }, {});
  
  mappingStats = mappingData.statistics || {};
  
  console.log(`🗺️ SYSTÈME D'INDEXATION UNIFIÉ CHARGÉ`);
  console.log(`   📚 Total questions: ${mappingData.totalQuestions}`);
  console.log(`   ✅ Correspondances: ${mappingData.matchedExplanations}/${mappingData.totalQuestions}`);
  console.log(`   📊 Répartition: A:${mappingStats.serieA || 0}, B:${mappingStats.serieB || 0}, C:${mappingStats.serieC || 0}, D:${mappingStats.serieD || 0}, E:${mappingStats.serieE || 0}`);
  
} catch (error) {
  console.warn('⚠️ Impossible de charger le mapping complet question→explication:', error.message);
  // Fallback vers l'ancien mapping partiel si disponible
  try {
    const fallbackData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'question_explanation_mapping.json'), 'utf8'));
    questionExplanationMapping = fallbackData.mappings.reduce((acc, mapping) => {
      acc[mapping.questionContent] = mapping;
      return acc;
    }, {});
    console.log(`🔄 Fallback: ${Object.keys(questionExplanationMapping).length} mappings partiels chargés`);
  } catch (fallbackError) {
    console.error('❌ Aucun mapping disponible:', fallbackError.message);
  }
}

// Fonction d'indexation unifiée - Trouve la bonne explication pour une question
function getCorrectExplanationId(questionContent, fallbackIndex) {
  console.log(`🔍 Recherche mapping pour: "${questionContent?.substring(0, 50)}..."`);
  
  // Utiliser le mapping définitif basé sur le contenu
  const mapping = questionExplanationMapping[questionContent];
  
  if (mapping) {
    console.log(`✅ Mapping trouvé: ${mapping.explanationId} (position ${mapping.positionIndex})`);
    return mapping.explanationId;
  }
  
  // Fallback intelligent : essayer de deviner par similarité partielle
  for (const [content, data] of Object.entries(questionExplanationMapping)) {
    if (questionContent && content.includes(questionContent.substring(0, 20))) {
      console.log(`🔄 Mapping partiel trouvé: ${data.explanationId} via similarité`);
      return data.explanationId;
    }
  }
  
  // Dernier fallback vers l'index fourni
  const finalId = `Q${fallbackIndex}`;
  console.log(`⚠️ Aucun mapping trouvé, fallback vers: ${finalId}`);
  return finalId;
}

// Route pour récupérer une explication avancée spécifique
app.post('/api/explanation', authenticateToken, (req, res) => {
  try {
    const { questionId, questionContent } = req.body;
    console.log(`🔍 Demande d'explication pour questionId: ${questionId}, contenu: "${questionContent?.substring(0, 50)}..."`);
    
    // Utiliser le mapping intelligent pour obtenir le bon ID d'explication
    const correctExplanationId = getCorrectExplanationId(questionContent, questionId?.replace('Q', ''));
    console.log(`🎯 ID d'explication corrigé: ${questionId} → ${correctExplanationId}`);
    
    const explanation = advancedExplanations[correctExplanationId];
    
    if (!explanation) {
      console.log(`❌ Aucune explication trouvée pour ${correctExplanationId}. Explications disponibles:`, Object.keys(advancedExplanations).slice(0, 5));
      return res.status(404).json({ error: 'Explication non trouvée pour cette question' });
    }
    
    console.log(`✅ Explication ${correctExplanationId} trouvée et envoyée`);
    res.json({
      success: true,
      explanation: explanation
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'explication:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route de diagnostic du système d'indexation
app.get('/api/system/mapping-info', authenticateToken, (req, res) => {
  try {
    const totalMappings = Object.keys(questionExplanationMapping).length;
    const consistentMappings = Object.values(questionExplanationMapping).filter(m => m.isConsistent).length;
    
    res.json({
      success: true,
      system: {
        totalMappings,
        consistentMappings,
        statistics: mappingStats,
        sampleMappings: Object.entries(questionExplanationMapping).slice(0, 3).map(([content, data]) => ({
          content: content.substring(0, 50) + '...',
          explanationId: data.explanationId,
          series: data.series,
          isConsistent: data.isConsistent
        }))
      }
    });
  } catch (error) {
    console.error('❌ Erreur diagnostic mapping:', error);
    res.status(500).json({ error: 'Erreur système' });
  }
});

// Fonction pour générer des explications des réponses avec système avancé
function getExplanation(question, answer) {
  if (!question) return "Question non disponible.";
  
  const actualCorrectAnswer = question.correctAnswer;
  const correctOption = question.options[actualCorrectAnswer];
  const selectedOption = answer.selectedOption !== -1 ? question.options[answer.selectedOption] : "Aucune réponse";
  
  // Chercher une explication avancée avec mapping intelligent
  const questionId = `Q${question.questionIndex}`;
  const correctExplanationId = getCorrectExplanationId(question.content, question.questionIndex);
  console.log(`🔍 getExplanation - questionId: ${questionId} → ${correctExplanationId} pour: "${question.content?.substring(0, 40)}..."`);
  const advancedExp = advancedExplanations[correctExplanationId];
  
  if (advancedExp) {
    // Utiliser le système d'explications avancées
    let explanation = '';
    
    if (answer.selectedOption === actualCorrectAnswer) {
      explanation = `✅ Bonne réponse !`;
    } else if (answer.selectedOption === -1) {
      explanation = `⏰ Temps écoulé. La bonne réponse était "${correctOption}".`;
    } else {
      explanation = `❌ Vous avez répondu "${selectedOption}". La bonne réponse était "${correctOption}".`;
      
      // Ajouter le diagnostic d'erreur personnalisé
      if (advancedExp.diagnosticErreur && advancedExp.diagnosticErreur.pourquoiPlausible) {
        explanation += ` ${advancedExp.diagnosticErreur.pourquoiPlausible}`;
      }
    }
    
    // Ajouter la règle extraite pour tous
    if (advancedExp.regleExtraite) {
      explanation += ` ${advancedExp.regleExtraite}`;
    }
    
    return explanation;
  }
  
  // Fallback vers l'ancien système si pas d'explication avancée
  let explanation = `La bonne réponse était "${correctOption}".`;
  
  if (answer.selectedOption === actualCorrectAnswer) {
    explanation = `✅ Correct ! ${explanation}`;
  } else if (answer.selectedOption === -1) {
    explanation = `⏰ Temps écoulé. ${explanation}`;
  } else {
    explanation = `❌ Vous avez répondu "${selectedOption}". ${explanation}`;
  }
  
  // Ajouter des explications spécifiques selon le type de question
  if (question.series === 'A' && question.difficulty <= 2) {
    explanation += " Cette question de série A teste la reconnaissance de motifs simples.";
  } else if (question.series === 'E' && question.difficulty >= 9) {
    explanation += " Cette question de série E est de niveau très avancé et teste l'abstraction complexe.";
  } else if (question.category === 'logique') {
    explanation += " Cette question évalue votre raisonnement logique et analytique.";
  } else if (question.category === 'spatial') {
    explanation += " Cette question teste votre capacité de visualisation spatiale.";
  }
  
  return explanation;
}

// Fonction d'interprétation des résultats
function getInterpretation(averageScore) {
  if (averageScore >= 90) return 'Excellent - Performance remarquable';
  if (averageScore >= 80) return 'Très bon - Au-dessus de la moyenne';
  if (averageScore >= 70) return 'Bon - Performance satisfaisante';
  if (averageScore >= 60) return 'Correct - Dans la moyenne';
  if (averageScore >= 50) return 'À améliorer - En dessous de la moyenne';
  return 'À améliorer - Performance faible';
}


// Initialiser les questions au démarrage
seedQuestions();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur TestIQ démarré sur le port ${PORT}`);
});