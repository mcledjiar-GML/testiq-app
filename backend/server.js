const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

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
    answers: Array
  }]
});

const QuestionSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['raven', 'cattell', 'custom'] },
  difficulty: { type: Number, min: 1, max: 10, required: true },
  content: { type: String, required: true },
  options: [String],
  correctAnswer: Number,
  category: { type: String, enum: ['logique', 'verbal', 'spatial', 'mémoire'] },
  timeLimit: { type: Number, default: 60 }
});

const User = mongoose.model('User', UserSchema);
const Question = mongoose.model('Question', QuestionSchema);

// Création automatique de questions de test
const seedQuestions = async () => {
  const count = await Question.countDocuments();
  if (count === 0) {
    const questions = [
      {
        type: 'raven',
        difficulty: 3,
        content: 'Complétez la séquence: 2, 4, 6, 8, ?',
        options: ['9', '10', '11', '12'],
        correctAnswer: 1,
        category: 'logique',
        timeLimit: 30
      },
      {
        type: 'raven',
        difficulty: 5,
        content: 'Si tous les A sont des B, et tous les B sont des C, alors tous les A sont-ils des C ?',
        options: ['Oui', 'Non', 'Peut-être', 'Insuffisant'],
        correctAnswer: 0,
        category: 'logique',
        timeLimit: 60
      },
      {
        type: 'cattell',
        difficulty: 4,
        content: 'Trouvez l\'intrus: Chien, Chat, Oiseau, Poisson',
        options: ['Chien', 'Chat', 'Oiseau', 'Poisson'],
        correctAnswer: 2,
        category: 'spatial',
        timeLimit: 45
      },
      {
        type: 'custom',
        difficulty: 6,
        content: 'Quel nombre vient ensuite: 1, 1, 2, 3, 5, 8, ?',
        options: ['11', '13', '15', '17'],
        correctAnswer: 1,
        category: 'logique',
        timeLimit: 30
      },
      {
        type: 'raven',
        difficulty: 2,
        content: 'Quelle est la capitale de la France ?',
        options: ['Londres', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 2,
        category: 'verbal',
        timeLimit: 20
      }
    ];
    await Question.insertMany(questions);
    console.log('✅ Questions de test créées');
  }
};

// Routes d'authentification
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name });
    await user.save();
    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes des tests
app.post('/api/tests/start', async (req, res) => {
  try {
    const { testType } = req.body;
    const questions = await Question.find({ type: testType }).limit(5);
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tests/submit', async (req, res) => {
  try {
    const { userId, answers, testType } = req.body;
    const correctAnswers = answers.filter(answer => {
      return answer.selectedOption === answer.correctAnswer;
    }).length;
    
    const score = Math.round((correctAnswers / answers.length) * 100);
    
    // Sauvegarder le résultat
    await User.findByIdAndUpdate(userId, {
      $push: {
        testHistory: {
          testType,
          score,
          date: new Date(),
          answers
        }
      }
    });
    
    res.json({ score, maxScore: answers.length, correctAnswers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/results/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    
    const tests = user.testHistory;
    const averageScore = tests.length > 0 
      ? tests.reduce((sum, test) => sum + test.score, 0) / tests.length 
      : 0;
    
    res.json({
      tests,
      averageScore,
      interpretation: getInterpretation(averageScore)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

// Initialiser les questions au démarrage
seedQuestions();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur TestIQ démarré sur le port ${PORT}`);
});