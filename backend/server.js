const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const visualService = require('./visual_service');
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

// Démarrage MongoDB en mémoire
const { startMongoDB } = require('./start-mongodb');

// Import supplémentaires pour la sauvegarde démo
const fs = require('fs');
const path = require('path');

// Connexion à MongoDB avec MongoDB en mémoire comme fallback
const connectDB = async () => {
  try {
    // Mode démo : utiliser MongoDB persistant (même localhost)
    const isDemoMode = process.env.NODE_ENV === 'demo' || process.env.DEMO_MODE === 'true';
    
    // Mode démo avec sauvegarde JSON
    if (isDemoMode && process.env.MONGODB_URI === 'memory') {
      console.log('🔄 Démarrage MongoDB en mémoire pour mode démo...');
      const memoryUri = await startMongoDB();
      console.log('✅ MongoDB démo prêt:', memoryUri);
      
      // Charger les données de sauvegarde si elles existent
      await loadDemoBackup();
      return;
    }
    
    // Essayer de se connecter à MongoDB configuré d'abord
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'memory-persistent') {
      try {
        await mongoose.connect(process.env.MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000
        });
        console.log(`✅ MongoDB ${isDemoMode ? 'démo persistant' : 'externe'} connecté:`, process.env.MONGODB_URI);
        return;
      } catch (mongoError) {
        if (isDemoMode) {
          console.log('⚠️ MongoDB local non disponible, fallback vers MongoDB en mémoire pour démo');
        } else {
          throw mongoError;
        }
      }
    }
    
    // Fallback: démarrer MongoDB en mémoire
    console.log('🔄 Démarrage MongoDB en mémoire...');
    const memoryUri = await startMongoDB();
    console.log('✅ MongoDB en mémoire prêt:', memoryUri);
    
  } catch (err) {
    console.log('❌ Erreur de connexion MongoDB:', err.message);
    process.exit(1);
  }
};

connectDB();

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
  stimulus: { type: String }, // Stimulus pour affichage (séquence, etc.)
  options: [mongoose.Schema.Types.Mixed], // Support String et Object
  correctAnswer: Number,
  category: { type: String, enum: ['logique', 'verbal', 'spatial', 'mémoire'] },
  timeLimit: { type: Number, default: 60 },
  questionIndex: { type: Number }, // Index pour mapping avec les explications
  
  // **NOUVEAUX CHAMPS POUR VISUELS PRÉ-STOCKÉS**
  hasVisual: { type: Boolean, default: false }, // Indique si la question a un visuel
  visualData: { type: String }, // Visuel en Base64 ou URL
  visualType: { type: String, enum: ['svg', 'png', 'jpg', 'custom'], default: 'svg' }, // Type de visuel
  visualMetadata: {
    width: { type: Number, default: 400 },
    height: { type: Number, default: 300 },
    backgroundColor: { type: String, default: '#ffffff' },
    description: { type: String } // Description du visuel pour debug
  },
  
  // **MÉTADONNÉES ENRICHIES**
  isValidated: { type: Boolean, default: false }, // Question validée (test + révision)
  validationDate: { type: Date }, // Date de validation
  validationNotes: { type: String }, // Notes de validation
  
  // **SYSTÈME PÉDAGOGIQUE INTÉGRÉ**
  advancedExplanation: { type: mongoose.Schema.Types.Mixed } // Explications pédagogiques avancées intégrées
});

const User = mongoose.model('User', UserSchema);
const Question = mongoose.model('Question', QuestionSchema);

// Fonctions de sauvegarde/restauration démo
const loadDemoBackup = async () => {
  const backupPath = process.env.DEMO_DATA_BACKUP;
  if (!backupPath || !fs.existsSync(backupPath)) {
    console.log('💾 Aucune sauvegarde démo trouvée');
    return;
  }
  
  try {
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    console.log('📥 Chargement sauvegarde démo...');
    
    // Restaurer les utilisateurs
    if (backupData.users && backupData.users.length > 0) {
      await User.insertMany(backupData.users);
      console.log(`✅ ${backupData.users.length} utilisateurs démo restaurés`);
    }
    
    console.log('✅ Sauvegarde démo chargée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors du chargement de la sauvegarde démo:', error.message);
  }
};

const saveDemoBackup = async () => {
  const backupPath = process.env.DEMO_DATA_BACKUP;
  if (!backupPath) return;
  
  try {
    // Créer le répertoire si nécessaire
    const backupDir = path.dirname(backupPath);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Exporter les données démo
    const demoUsers = await User.find({ email: 'demo@testiq.app' });
    
    const backupData = {
      timestamp: new Date().toISOString(),
      users: demoUsers
    };
    
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    console.log('💾 Sauvegarde démo mise à jour');
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde démo:', error.message);
  }
};

// Middleware d'authentification
// Middleware d'authentification conditionnel (mode démo vs production)
const authenticateToken = (req, res, next) => {
  // En mode démo, simuler un utilisateur virtuel
  const isDemoMode = process.env.NODE_ENV === 'demo' || process.env.PORT === '4000';
  
  if (isDemoMode) {
    // Mode démo : créer un utilisateur virtuel
    req.user = {
      userId: 'demo-user',
      email: 'demo@testiq.app',
      role: 'demo'
    };
    console.log('🎭 Mode démo : utilisateur virtuel créé');
    return next();
  }
  
  // Mode production : authentification JWT normale
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
const explanationsFilePath = path.join(__dirname, 'explanations_audit_corrected.json');
let advancedExplanations = {};

// Charger les nouvelles explications pédagogiques v2.1 (version complète)
const pedagogicalCompletePath = '/app/raven_explanations_complete_v2.1.json';
let pedagogicalExplanations = {};

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

// Charger le système complet d'explications pédagogiques v2.1
try {
  const pedagogicalData = JSON.parse(fs.readFileSync(pedagogicalCompletePath, 'utf8'));
  
  if (pedagogicalData.items) {
    pedagogicalExplanations = pedagogicalData.items;
    console.log(`🎓 ${Object.keys(pedagogicalExplanations).length} explications pédagogiques v2.1 chargées`);
    console.log(`📚 Structure: rule → steps → pitfalls → verify → hints (${pedagogicalData.hintsPolicy})`);
  }
} catch (error) {
  console.warn('⚠️ Impossible de charger le système pédagogique complet v2.1:', error.message);
}

// Création automatique de questions de test
const seedQuestions = async () => {
  try {
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
  } catch (error) {
    console.log('⚠️ Erreur lors du seeding des questions:', error.message);
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
    const { level = 'standard', mode = 'standard', serie = null } = req.body;
    let questionCount = 20; // Par défaut: test standard
    
    if (level === 'short') questionCount = 12;    // Test rapide
    else if (level === 'full') questionCount = 60;  // Test complet Raven
    
    // Sélectionner des questions selon le mode et la série
    const allQuestions = await Question.find({ type: testType });
    let selectedQuestions = [];
    
    if (mode === 'serie' && serie) {
      // Mode série: toutes les questions de la série spécifiée
      const seriesQuestions = allQuestions.filter(q => q.series === serie)
        .sort((a, b) => (a.questionIndex || 0) - (b.questionIndex || 0));
      selectedQuestions = seriesQuestions;
      console.log(`🎯 Mode série ${serie}: ${selectedQuestions.length} questions sélectionnées`);
    } else if (level === 'full') {
      // Test complet: toutes les questions dans l'ordre des séries
      selectedQuestions = allQuestions.sort((a, b) => {
        const seriesOrder = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5 };
        return seriesOrder[a.series] - seriesOrder[b.series];
      });
    } else if (level === 'short') {
      // Test rapide: toutes les questions de la série A (Questions 1-12)
      const seriesAQuestions = allQuestions.filter(q => q.series === 'A')
        .sort((a, b) => (a.questionIndex || 0) - (b.questionIndex || 0));
      selectedQuestions = seriesAQuestions.slice(0, 12);
    } else {
      // Test standard: échantillonner chaque série
      const series = ['A', 'B', 'C', 'D', 'E'];
      const questionsPerSeries = Math.ceil(questionCount / 5);
      
      for (const s of series) {
        const seriesQuestions = allQuestions.filter(q => q.series === s)
          .sort((a, b) => (a.questionIndex || 0) - (b.questionIndex || 0));
        selectedQuestions.push(...seriesQuestions.slice(0, questionsPerSeries));
      }
      
      // Garder l'ordre logique des séries pour un apprentissage progressif
      selectedQuestions = selectedQuestions.slice(0, questionCount);
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
    
    // Mode démo : gérer l'utilisateur démo persistant
    const isDemoMode = req.user.role === 'demo';
    
    if (!isDemoMode) {
      // Mode production : vérifier que l'utilisateur correspond au token
      if (req.user.userId !== userId) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    } else {
      // Mode démo : s'assurer que l'utilisateur démo existe
      let demoUser = await User.findOne({ email: 'demo@testiq.app' });
      
      if (!demoUser) {
        console.log('🎭 Création de l\'utilisateur démo persistant...');
        demoUser = new User({
          name: 'Utilisateur Démo',
          email: 'demo@testiq.app',
          password: 'demo-hash', // Pas d'authentification réelle
          testHistory: []
        });
        await demoUser.save();
        console.log('✅ Utilisateur démo créé avec ID:', demoUser._id);
      }
      
      // Forcer l'userId à celui de l'utilisateur démo
      req.body.userId = demoUser._id.toString();
      console.log('🎭 Mode démo : utilisation de l\'utilisateur démo persistant');
    }
    
    const correctAnswers = answers.filter(answer => {
      return answer.selectedOption === answer.correctAnswer;
    }).length;
    
    const score = Math.round((correctAnswers / answers.length) * 100);
    
    // **NOUVEAU SYSTÈME D'INDEXATION STABLE**
    // Récupérer les questions pour convertir questionId -> questionIndex
    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.find({ '_id': { $in: questionIds } });
    
    // Créer un mapping questionId -> questionIndex
    const idToIndexMap = {};
    questions.forEach(q => {
      idToIndexMap[q._id.toString()] = q.questionIndex;
    });
    
    // Convertir les réponses avec indexation stable
    const stableAnswers = answers.map((answer, arrayIndex) => {
      const questionIndex = idToIndexMap[answer.questionId] || (arrayIndex + 1);
      return {
        questionIndex: questionIndex,  // **NOUVEAU** : Index stable au lieu de ObjectID
        questionId: answer.questionId, // Gardé pour rétrocompatibilité
        selectedOption: answer.selectedOption,
        correctAnswer: answer.correctAnswer,
        timeUsed: answer.timeUsed,
        testPosition: arrayIndex + 1    // **NOUVEAU** : Position dans le test
      };
    });
    
    console.log('💾 Sauvegarde avec indexation stable:', {
      testType,
      testLevel,
      answersCount: stableAnswers.length,
      indexMapping: stableAnswers.slice(0, 3).map(a => `Q${a.questionIndex} (pos ${a.testPosition})`)
    });
    
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
    
    // Sauvegarder le résultat avec l'indexation stable (production ET démo)
    const updatedUser = await User.findByIdAndUpdate(
      req.body.userId, // Utilise l'userId (possiblement modifié pour le démo)
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
            answers: stableAnswers,  // **NOUVEAU** : Réponses avec indexation stable
            demoMode: isDemoMode     // **NOUVEAU** : Marquer les tests démo
          }
        }
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    if (isDemoMode) {
      console.log('🎭 Mode démo : test sauvegardé en BD démo');
      console.log(`📊 Score: ${score}%, QI: ${iqResult.iq}, Historique: ${updatedUser.testHistory.length} tests`);
      
      // Sauvegarder les données démo
      await saveDemoBackup();
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
    
    // Mode démo : autoriser l'accès aux résultats de l'utilisateur démo
    const isDemoMode = req.user.role === 'demo';
    
    if (!isDemoMode) {
      // Mode production : vérifier que l'utilisateur correspond au token
      if (req.user.userId !== userId) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    } else {
      // Mode démo : vérifier que c'est bien l'utilisateur démo
      const demoUser = await User.findOne({ email: 'demo@testiq.app' });
      if (!demoUser || demoUser._id.toString() !== userId) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
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

// Endpoint temporaire pour tester Q1
app.get('/api/admin/test-q1', async (req, res) => {
  try {
    console.log('🧪 Test Q1 - Vérification évaluation');
    
    // Find Q1 actuelle
    const q1 = await Question.findOne({ 
      questionIndex: 1, 
      series: 'A' 
    });
    
    if (!q1) {
      return res.status(404).json({ error: 'Q1 non trouvée' });
    }
    
    // Simuler différentes réponses
    const testAnswers = [0, 1, 2, 3];
    const results = testAnswers.map(answer => ({
      selectedOption: answer,
      selectedText: q1.options[answer]?.text,
      isCorrect: answer === q1.correctAnswer,
      correctAnswer: q1.correctAnswer,
      correctText: q1.options[q1.correctAnswer]?.text
    }));
    
    res.json({
      success: true,
      q1: {
        stimulus: q1.stimulus,
        correctAnswer: q1.correctAnswer,
        options: q1.options
      },
      testResults: results
    });
    
  } catch (error) {
    console.error('❌ Erreur test Q1:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint temporaire pour corriger Q7
app.post('/api/admin/fix-q7', async (req, res) => {
  try {
    console.log('🔧 Correction de Q7 - Grille 3×3');
    
    // Find Q7
    const q7 = await Question.findOne({ 
      questionIndex: 7, 
      series: 'A',
      content: { $regex: /grille 3×3/i }
    });
    
    if (!q7) {
      return res.status(404).json({ error: 'Q7 non trouvée' });
    }
    
    console.log('📍 Question trouvée:', q7.content);
    console.log('📍 Options:', q7.options.map((opt, i) => `${i}: ${opt.text} (${opt.rotation || opt.type})`));
    console.log('📍 Réponse actuelle:', q7.correctAnswer);
    
    // The correct answer should be "○" (circle empty) for center of 3x3 grid
    // Let's update Q7 to have the correct options and answer
    const newOptions = [
      {"text":"○","type":"circle","rotation":"none","alt":"cercle vide"},         // Index 0 ✅ CORRECT
      {"text":"●","type":"circle","rotation":"filled","alt":"cercle plein"},     // Index 1
      {"text":"◑","type":"semicircle","rotation":"right","alt":"demi-cercle droite"}, // Index 2 
      {"text":"◐","type":"semicircle","rotation":"left","alt":"demi-cercle gauche"}   // Index 3
    ];
    
    // Update Q7 with correct options and answer
    await Question.findByIdAndUpdate(q7._id, {
      options: newOptions,
      correctAnswer: 0  // Index 0 = "○" (cercle vide)
    });
    
    console.log('🎉 Q7 corrigée: réponse correcte = option 0 (○)');
    
    res.json({ 
      success: true, 
      oldAnswer: q7.correctAnswer,
      newAnswer: 0,
      oldOptions: q7.options,
      newOptions: newOptions,
      message: 'Q7 corrigée: réponse correcte = option 0 (○ cercle vide)'
    });
    
  } catch (error) {
    console.error('❌ Erreur correction Q7:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint temporaire pour corriger Q1
app.post('/api/admin/fix-q1', async (req, res) => {
  try {
    console.log('🔧 Correction de Q1 - Séquence de rotations');
    
    // Find Q1
    const q1 = await Question.findOne({ 
      questionIndex: 1, 
      series: 'A',
      content: { $regex: /rotation/i }
    });
    
    if (!q1) {
      return res.status(404).json({ error: 'Q1 non trouvée' });
    }
    
    console.log('📍 Question trouvée:', q1.content);
    console.log('📍 Options:', q1.options.map((opt, i) => `${i}: ${opt.rotation}`));
    console.log('📍 Réponse actuelle:', q1.correctAnswer);
    
    // Find index of "up" option  
    const upOptionIndex = q1.options.findIndex(opt => opt.rotation === 'up');
    
    if (upOptionIndex === -1) {
      return res.status(400).json({ error: 'Option "up" non trouvée' });
    }
    
    // Update correct answer
    await Question.findByIdAndUpdate(q1._id, {
      correctAnswer: upOptionIndex
    });
    
    console.log('🎉 Q1 corrigée:', q1.correctAnswer, '->', upOptionIndex);
    
    res.json({ 
      success: true, 
      oldAnswer: q1.correctAnswer,
      newAnswer: upOptionIndex,
      message: `Q1 corrigée: réponse correcte = option ${upOptionIndex} (${q1.options[upOptionIndex].rotation})`
    });
    
  } catch (error) {
    console.error('❌ Erreur correction Q1:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route pour supprimer tout l'historique (DOIT ÊTRE AVANT la route générique)
app.delete('/api/tests/:userId/all', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🗑️ Tentative de suppression de TOUT l'historique pour user ${userId}`);
    
    // Mode démo : autorisation adaptée
    const isDemoMode = req.user.role === 'demo';
    
    if (!isDemoMode) {
      // Mode production : vérifier que l'utilisateur correspond au token
      if (req.user.userId !== userId) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    } else {
      // Mode démo : vérifier que c'est bien l'utilisateur démo
      const demoUser = await User.findOne({ email: 'demo@testiq.app' });
      if (!demoUser || demoUser._id.toString() !== userId) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { testHistory: [] } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    console.log(`✅ TOUT l'historique supprimé pour user ${userId}`);
    res.json({ message: 'Tout l\'historique a été supprimé', testsRemaining: 0 });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'historique:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour supprimer un test spécifique
app.delete('/api/tests/:userId/:testIndex', authenticateToken, async (req, res) => {
  try {
    const { userId, testIndex } = req.params;
    
    // Mode démo : autorisation adaptée
    const isDemoMode = req.user.role === 'demo';
    
    if (!isDemoMode) {
      // Mode production : vérifier que l'utilisateur correspond au token
      if (req.user.userId !== userId) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    } else {
      // Mode démo : vérifier que c'est bien l'utilisateur démo
      const demoUser = await User.findOne({ email: 'demo@testiq.app' });
      if (!demoUser || demoUser._id.toString() !== userId) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
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


// Route pour obtenir les informations de l'utilisateur démo
app.get('/api/demo/user-info', authenticateToken, async (req, res) => {
  try {
    // Vérifier que c'est bien un utilisateur démo
    if (req.user.role !== 'demo') {
      return res.status(403).json({ error: 'Cette route est réservée au mode démo' });
    }
    
    // Trouver l'utilisateur démo
    const demoUser = await User.findOne({ email: 'demo@testiq.app' });
    
    if (!demoUser) {
      return res.json({ userId: null, exists: false });
    }
    
    res.json({ 
      userId: demoUser._id.toString(),
      exists: true,
      name: demoUser.name,
      testsCount: demoUser.testHistory?.length || 0
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des infos démo:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route spéciale pour vider l'historique démo
app.delete('/api/demo/clear-history', authenticateToken, async (req, res) => {
  try {
    // Vérifier que c'est bien un utilisateur démo
    if (req.user.role !== 'demo') {
      return res.status(403).json({ error: 'Cette route est réservée au mode démo' });
    }
    
    console.log('🧹 Nettoyage de l\'historique démo...');
    
    // Trouver l'utilisateur démo
    const demoUser = await User.findOne({ email: 'demo@testiq.app' });
    
    if (!demoUser) {
      return res.status(404).json({ error: 'Utilisateur démo non trouvé' });
    }
    
    // Vider l'historique des tests démo
    const updatedUser = await User.findByIdAndUpdate(
      demoUser._id,
      { $set: { testHistory: [] } },
      { new: true }
    );
    
    console.log('✅ Historique démo vidé avec succès');
    
    res.json({ 
      message: 'Historique démo vidé avec succès',
      testsRemaining: 0,
      demoMode: true
    });
    
  } catch (error) {
    console.error('Erreur lors du nettoyage démo:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour obtenir les détails d'un test avec les bonnes réponses
app.get('/api/tests/:userId/:testIndex/review', authenticateToken, async (req, res) => {
  try {
    const { userId, testIndex } = req.params;
    console.log('🔍 Review request - userId:', userId, 'testIndex:', testIndex);
    
    // Mode démo : autoriser l'accès aux données de révision de l'utilisateur démo
    const isDemoMode = req.user.role === 'demo';
    
    if (!isDemoMode) {
      // Mode production : vérifier que l'utilisateur correspond au token
      if (req.user.userId !== userId) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
    } else {
      // Mode démo : vérifier que c'est bien l'utilisateur démo
      const demoUser = await User.findOne({ email: 'demo@testiq.app' });
      if (!demoUser || demoUser._id.toString() !== userId) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
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
    
    // **NOUVEAU SYSTÈME : MAPPING DIRECT AVEC INDEXATION STABLE**
    console.log('🎯 Utilisation du nouveau système d\'indexation stable');
    
    // Déterminer les questionIndex à partir des réponses sauvegardées
    let questionIndices = [];
    if (test.answers[0]?.questionIndex) {
      // Nouveau format avec questionIndex
      questionIndices = test.answers.map(a => a.questionIndex);
      console.log('✅ Format moderne avec questionIndex:', questionIndices.slice(0, 5));
    } else {
      // Format legacy avec questionId, convertir pour compatibilité
      const questionIds = test.answers.map(a => a.questionId);
      const legacyQuestions = await Question.find({ '_id': { $in: questionIds } });
      questionIndices = legacyQuestions.map(q => q.questionIndex).filter(idx => idx);
      console.log('🔄 Format legacy converti, questionIndex:', questionIndices.slice(0, 5));
    }
    
    // Récupérer les questions avec mapping direct par questionIndex
    const questions = await Question.find({ 
      questionIndex: { $in: questionIndices },
      type: test.testType || 'raven'
    }).sort({ questionIndex: 1 });
    
    console.log('📚 Questions trouvées avec indexation directe:', questions.length, '/', questionIndices.length);
    
    // Créer un mapping questionIndex -> Question (au lieu de ObjectID -> Question)
    const indexToQuestionMap = {};
    questions.forEach(q => {
      indexToQuestionMap[q.questionIndex] = q;
    });
    
    // Enrichir les réponses avec les détails des questions (MAPPING GARANTI)
    const detailedAnswers = test.answers.map((answer, arrayPosition) => {
      // Utiliser questionIndex si disponible, sinon position dans le test
      const targetIndex = answer.questionIndex || (arrayPosition + 1);
      const question = indexToQuestionMap[targetIndex];
      
      if (!question) {
        console.warn(`⚠️ Question Q${targetIndex} non trouvée dans la BD`);
      }
      
      const actualCorrectAnswer = question ? question.correctAnswer : answer.correctAnswer;
      const isAnswerCorrect = answer.selectedOption === actualCorrectAnswer;
      
      // **INDEXATION COHÉRENTE GARANTIE**
      const stableQuestionIndex = question ? question.questionIndex : targetIndex;
      const visualQuestionId = `Q${stableQuestionIndex}`;
      
      console.log(`🎯 Q${stableQuestionIndex} -> Visuel: ${visualQuestionId}, Pos test: ${arrayPosition + 1}`);
      
      // 🎯 NOUVEAU : Utiliser l'ordre des options sauvegardé pendant le test
      const optionsToUse = answer.optionsOrder || (question ? question.options : []);
      
      // 🎯 NOUVEAU : Évaluation basée sur la question ACTUELLE (post-corrections)
      let realIsCorrect = isAnswerCorrect;
      if (question && question.options && answer.selectedOption !== undefined) {
        // TOUJOURS utiliser la question actuelle pour l'évaluation (ignore les données sauvegardées obsolètes)
        realIsCorrect = answer.selectedOption === question.correctAnswer;
        if (stableQuestionIndex === 1) {
          console.log(`🔍 Q${stableQuestionIndex} - DÉTAILS COMPLETS:`, {
            selectedOption: answer.selectedOption,
            currentCorrectAnswer: question.correctAnswer,
            oldCorrectAnswer: answer.correctAnswer,
            isCorrect: realIsCorrect,
            questionCorrected: question.correctAnswer !== answer.correctAnswer,
            questionOptions: question.options?.map((opt, i) => `${i}:${opt.text}`),
            selectedText: question.options?.[answer.selectedOption]?.text
          });
        } else {
          console.log(`🔍 Q${stableQuestionIndex} - Évaluation mise à jour: OK`);
        }
      } else if (answer.selectedOptionValue && answer.correctOptionValue) {
        // Fallback: Comparer les valeurs réelles pour les anciens tests sans question BD
        realIsCorrect = JSON.stringify(answer.selectedOptionValue) === JSON.stringify(answer.correctOptionValue);
        console.log(`🔍 Q${stableQuestionIndex} - Évaluation fallback:`, {
          selectedValue: answer.selectedOptionValue?.text || answer.selectedOptionValue,
          correctValue: answer.correctOptionValue?.text || answer.correctOptionValue,
          isCorrect: realIsCorrect
        });
      }

      return {
        question: question ? question.content : `Question Q${targetIndex} (non trouvée en BD)`,
        options: optionsToUse, // 🎯 UTILISER L'ORDRE EXACT DU TEST
        yourAnswer: answer.selectedOption,
        correctAnswer: question ? question.correctAnswer : actualCorrectAnswer, // 🎯 CORRECTION : Utiliser la vraie bonne réponse actuelle
        isCorrect: realIsCorrect, // 🎯 ÉVALUATION RÉELLE
        difficulty: question ? question.difficulty : 5,
        series: question ? question.series : 'N/A',
        category: question ? question.category : 'N/A',
        timeUsed: answer.timeUsed || 0,
        questionIndex: stableQuestionIndex,
        // **NOUVEAU** : ID cohérent garanti pour visuels
        visualQuestionId: visualQuestionId,
        // **NOUVEAU** : Position dans le test
        testPosition: arrayPosition + 1,
        // **NOUVEAU** : Index stable pour API
        stableIndex: stableQuestionIndex,
        // 🎯 NOUVEAU : Valeurs réelles des options
        selectedOptionValue: answer.selectedOptionValue,
        correctOptionValue: answer.correctOptionValue,
        explanation: getExplanation(question, { 
          ...answer, 
          selectedOption: answer.selectedOption,
          correctAnswer: question ? question.correctAnswer : actualCorrectAnswer, // 🎯 CORRECTION : Utiliser la vraie bonne réponse actuelle
          isCorrect: realIsCorrect
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
  const mappingData = JSON.parse(fs.readFileSync('/app/complete_question_explanation_mapping.json', 'utf8'));
  
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
    const fallbackData = JSON.parse(fs.readFileSync('/app/question_explanation_mapping.json', 'utf8'));
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

// **NOUVEAU** : Route pour récupérer les visuels pré-stockés
app.get('/api/questions/:questionId/visual', authenticateToken, async (req, res) => {
  try {
    const { questionId } = req.params;
    console.log(`🎨 Demande de visuel pour ${questionId}`);
    
    // Extraire le numéro de question de l'ID (ex: Q1 → 1)
    const questionIndex = parseInt(questionId.replace('Q', ''));
    
    // Rechercher la question par son index
    const question = await Question.findOne({ questionIndex: questionIndex });
    
    if (!question) {
      console.log(`❌ Question ${questionId} non trouvée`);
      return res.json({
        success: false,
        hasVisual: false,
        message: 'Question non trouvée'
      });
    }
    
    if (!question.hasVisual || !question.visualData) {
      console.log(`ℹ️ Pas de visuel pour ${questionId}`);
      return res.json({
        success: false,
        hasVisual: false,
        message: 'Pas de visuel pour cette question'
      });
    }
    
    console.log(`✅ Visuel trouvé pour ${questionId}`);
    res.json({
      success: true,
      hasVisual: true,
      visualData: question.visualData,
      visualType: question.visualType,
      visualMetadata: question.visualMetadata
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération visuel:', error);
    res.status(500).json({
      success: false,
      hasVisual: false,
      message: 'Erreur serveur'
    });
  }
});

// Route pour récupérer une explication avancée spécifique
app.post('/api/explanation', authenticateToken, async (req, res) => {
  try {
    const { questionId, questionContent } = req.body;
    console.log(`🔍 Demande d'explication pour questionId: ${questionId}, contenu: "${questionContent?.substring(0, 50)}..."`);
    
    const questionIndex = parseInt(questionId?.replace('Q', ''));
    console.log(`🎯 Recherche d'explication pour Q${questionIndex}`);
    
    // **NOUVEAU SYSTÈME ROBUSTE** : Priorité aux explications intégrées dans raven_questions.js
    try {
      const question = await Question.findOne({ questionIndex: questionIndex, type: 'raven' });
      if (question && question.advancedExplanation) {
        console.log(`✅ Explication intégrée trouvée pour Q${questionIndex}`);
        return res.json({
          success: true,
          explanation: question.advancedExplanation
        });
      } else {
        console.log(`⚠️ Pas d'explication intégrée pour Q${questionIndex}, fallback vers fichiers externes`);
      }
    } catch (error) {
      console.log(`❌ Erreur recherche DB pour Q${questionIndex}:`, error.message);
    }
    
    // Fallback : Utiliser le mapping intelligent pour obtenir le bon ID d'explication  
    const correctExplanationId = getCorrectExplanationId(questionContent, questionId?.replace('Q', ''));
    console.log(`🎯 ID d'explication corrigé: ${questionId} → ${correctExplanationId}`);
    
    // Fallback : ancien système pédagogique v2.1
    // ✅ FIX OFFSET: Correction de l'indexation +1 pour Q8-Q12 dans les explications externes
    let externalExplanationId = correctExplanationId;
    if (questionIndex >= 8 && questionIndex <= 12) {
      externalExplanationId = `Q${questionIndex - 1}`;
      console.log(`🔧 Correction offset Q${questionIndex}: ${correctExplanationId} → ${externalExplanationId}`);
    }
    // Q7 nécessite une explication spéciale car le contenu grille 3x3 n'existe pas dans les fichiers externes
    
    const pedagogicalExp = pedagogicalExplanations[externalExplanationId];
    const advancedExp = advancedExplanations[externalExplanationId];
    
    if (pedagogicalExp) {
      // Utiliser le nouveau système pédagogique (rule → steps → pitfalls → verify → hints)
      console.log(`🎓 Explication pédagogique v2.1 ${externalExplanationId} trouvée`);
      
      // Créer une explication hybride avec les deux systèmes
      const hybridExplanation = {
        ...advancedExp, // Garder les données existantes
        pedagogy: {
          rule: pedagogicalExp.rule,
          steps: pedagogicalExp.steps,
          pitfalls: pedagogicalExp.pitfalls,
          verify: pedagogicalExp.verify,
          hints: pedagogicalExp.hints
        }
      };
      
      res.json({
        success: true,
        explanation: hybridExplanation
      });
    } else if (advancedExp) {
      // Fallback vers l'ancien système
      console.log(`✅ Explication classique ${externalExplanationId} trouvée`);
      res.json({
        success: true,
        explanation: advancedExp
      });
    } else {
      console.log(`❌ Aucune explication trouvée pour ${correctExplanationId}. Génération d'une explication de base pour Q${questionIndex}`);
      
      // **FALLBACK ROBUSTE** : Générer une explication de base à partir des données de la question
      try {
        const question = await Question.findOne({ questionIndex: questionIndex, type: 'raven' });
        if (question) {
          const fallbackExplanation = {
            serie: question.series || 'A',
            competence: question.category || 'logique',
            solutionPasAPas: [
              `Analyser la question : ${question.content}`,
              `Examiner les options disponibles`,
              `Appliquer la logique de ${question.category === 'spatial' ? 'reconnaissance spatiale' : 'raisonnement logique'}`,
              `La bonne réponse est l'option ${String.fromCharCode(65 + question.correctAnswer)}`
            ],
            regleExtraite: question.explanation || `Règle de ${question.category === 'spatial' ? 'logique spatiale' : 'suite logique'} appliquée`,
            generalisation: question.category === 'spatial' 
              ? 'Les questions spatiales requièrent d\'identifier les patterns visuels et les transformations'
              : 'Les questions logiques suivent des règles de progression ou de transformation numérique/symbolique',
            analyseDistracteurs: question.options?.map((option, index) => ({
              option: `${String.fromCharCode(65 + index)} - ${typeof option === 'string' ? option : option.text || option.alt}`,
              raisonChoixFrequent: index === question.correctAnswer 
                ? '✅ Correct selon la règle identifiée'
                : `❌ Ne respecte pas la logique de ${question.category === 'spatial' ? 'transformation spatiale' : 'progression logique'}`
            })) || [],
            nouveauConcept: {
              isNew: false,
              fiche: {
                nom: question.category === 'spatial' ? 'Raisonnement spatial' : 'Raisonnement logique',
                definition: question.category === 'spatial' 
                  ? 'Capacité à manipuler et analyser des objets dans l\'espace'
                  : 'Capacité à identifier des patterns et progressions logiques',
                application: 'Identifier la règle sous-jacente puis l\'appliquer pour trouver la solution'
              }
            },
            metacognition: {
              tempsCibleSec: question.timeLimit || 60,
              heuristiqueExpress: question.category === 'spatial' 
                ? 'Observer les transformations visuelles entre les éléments'
                : 'Chercher la progression numérique ou logique dans la séquence'
            }
          };
          
          console.log(`✅ Explication de base générée pour Q${questionIndex}`);
          return res.json({
            success: true,
            explanation: fallbackExplanation
          });
        }
      } catch (fallbackError) {
        console.log(`❌ Erreur génération fallback pour Q${questionIndex}:`, fallbackError.message);
      }
      
      // Dernier fallback : erreur
      return res.status(404).json({ error: 'Explication non trouvée pour cette question' });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'explication:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Route pour générer des visuels professionnels
app.post('/api/visual', authenticateToken, async (req, res) => {
  try {
    const { questionId, questionContent, category } = req.body;
    console.log(`🎨 Demande de visuel pour questionId: ${questionId}, contenu: "${questionContent?.substring(0, 50)}..."`);
    
    const questionData = {
      content: questionContent,
      category: category || 'general'
    };
    
    // Vérifier si un visuel est nécessaire pour cette question
    if (!visualService.requiresVisual(questionData)) {
      return res.json({
        success: true,
        hasVisual: false,
        message: 'Aucun visuel requis pour cette question'
      });
    }
    
    // Générer le visuel via Python
    const visualBase64 = await visualService.generateVisual(questionId, questionData);
    
    if (visualBase64) {
      console.log(`✅ Visuel généré pour ${questionId}`);
      res.json({
        success: true,
        hasVisual: true,
        visual: visualBase64,
        format: 'base64'
      });
    } else {
      console.log(`⚠️ Impossible de générer le visuel pour ${questionId}`);
      res.json({
        success: true,
        hasVisual: false,
        message: 'Visuel non disponible'
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du visuel:', error);
    res.status(500).json({ 
      success: false,
      hasVisual: false,
      error: 'Erreur interne du serveur' 
    });
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

// Fonction pour générer des explications des réponses avec système corrigé
function getExplanation(question, answer) {
  if (!question) return "Question non disponible.";
  
  const actualCorrectAnswer = question.correctAnswer;
  
  // **CORRECTION** : Gérer les options qui peuvent être des objets {text, alt} ou des chaînes
  const getOptionText = (option) => {
    if (typeof option === 'string') return option;
    if (typeof option === 'object' && option.text) return option.text;
    if (typeof option === 'object' && option.alt) return option.alt;
    return String(option);
  };
  
  const correctOption = getOptionText(question.options[actualCorrectAnswer]);
  const selectedOption = answer.selectedOption !== -1 ? getOptionText(question.options[answer.selectedOption]) : "Aucune réponse";
  
  // **NOUVEAU SYSTÈME** : Utiliser les explications stockées directement dans la BD
  console.log(`🔍 getExplanation Q${question.questionIndex} - Utilisation des explications BD corrigées`);
  
  let explanation = '';
  
  // Construire la réponse selon le résultat
  if (answer.selectedOption === actualCorrectAnswer) {
    explanation = `✅ Bonne réponse !`;
  } else if (answer.selectedOption === -1) {
    explanation = `⏰ Temps écoulé. La bonne réponse était "${correctOption}".`;
  } else {
    explanation = `❌ Vous avez répondu "${selectedOption}". La bonne réponse était "${correctOption}".`;
  }
  
  // Ajouter l'explication corrigée stockée en BD si disponible
  if (question.explanation) {
    explanation += ` ${question.explanation}`;
  } else if (question.explanationDetailed) {
    explanation += ` ${question.explanationDetailed}`;
  }
  
  // Tags corrigés pour plus d'informations contextuelles
  if (question.visualMetadata && question.visualMetadata.tags && question.visualMetadata.tags.length > 0) {
    const tags = question.visualMetadata.tags.join(', ');
    explanation += ` (Type: ${tags})`;
  }
  
  console.log(`✅ Explication générée Q${question.questionIndex}: ${explanation.length} caractères`);
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


// Routes API Questions V2 avec validation qualité
const questionsV2Routes = require('./routes/questions-v2');
const questionsBulkRoutes = require('./routes/questions-bulk');
const CorpusGate = require('./middleware/corpus-gate');

// Initialiser les systèmes de conformité et monitoring
const GDPRCompliance = require('./middleware/gdpr-compliance');
const MonitoringSystem = require('./middleware/monitoring');
const KillSwitchSystem = require('./middleware/kill-switch');
const AdminAuth = require('./middleware/admin-auth');

// Middleware GDPR
app.use(GDPRCompliance.gdprMiddleware());

// Middleware de monitoring
app.use(MonitoringSystem.measureLatency);

// Middleware de cache CDN
const CDNCacheManager = require('./middleware/cdn-cache');
app.use(CDNCacheManager.cacheHeaders());

// Middleware Kill-Switch UI
const KillSwitchUI = require('./middleware/kill-switch-ui');
app.use(KillSwitchUI.uiMiddleware());

// Initialiser SLO Monitoring
const SLOMonitoring = require('./middleware/slo-monitoring');

// Initialiser Deployment Playbook
const DeploymentPlaybook = require('./middleware/deployment-playbook');

app.use('/api/questions-v2', questionsV2Routes);
app.use('/api/questions-v2/bulk', questionsBulkRoutes);

// Routes GDPR
const gdprRoutes = require('./routes/gdpr');
app.use('/api/gdpr', gdprRoutes);

// Routes CDN Cache
const cdnRoutes = require('./routes/cdn');
app.use('/api/cdn', cdnRoutes);

// Routes Kill-Switch UI
const killSwitchUIRoutes = require('./routes/kill-switch-ui');
app.use('/api/kill-switch-ui', killSwitchUIRoutes);

// Routes SLO
const sloRoutes = require('./routes/slo');
app.use('/api/slo', sloRoutes);

// Routes Deployment
const deploymentRoutes = require('./routes/deployment');
app.use('/api/deployment', deploymentRoutes);

// Endpoint corpus gate pour CI/CD
app.get('/api/corpus-gate', async (req, res) => {
    try {
        const corpusReport = await CorpusGate.generateCorpusReport();
        res.json(corpusReport);
    } catch (error) {
        res.status(500).json({
            error: 'Corpus gate check failed',
            message: error.message
        });
    }
});

// Initialiser les questions au démarrage
seedQuestions();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur TestIQ démarré sur le port ${PORT}`);
  console.log(`🛡️ API Questions V2 disponible sur /api/questions-v2`);
});