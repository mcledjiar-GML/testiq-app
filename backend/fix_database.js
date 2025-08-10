#!/usr/bin/env node
/**
 * 🔧 SCRIPT DE CORRECTION DE BASE DE DONNÉES - TESTIQ
 * ================================================
 * 
 * Force la recréation de toutes les questions dans MongoDB
 * avec les bons questionIndex pour que les explications Q40 fonctionnent
 */

const mongoose = require('mongoose');
const ravenQuestions = require('./raven_questions.js');

const QuestionSchema = new mongoose.Schema({
  type: String,
  series: String,
  difficulty: Number,
  content: { type: String, required: true },
  options: [String],
  correctAnswer: Number,
  category: { type: String, enum: ['logique', 'verbal', 'spatial', 'mémoire', 'numerique'] },
  timeLimit: { type: Number, default: 60 },
  questionIndex: { type: Number } 
});

const Question = mongoose.model('Question', QuestionSchema);

async function fixDatabase() {
  try {
    console.log('🔧 Connexion à MongoDB...');
    await mongoose.connect('mongodb://mongo:27017/testiq', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connecté à MongoDB');
    
    // Supprimer toutes les questions existantes
    const deleteResult = await Question.deleteMany({});
    console.log(`🗑️ ${deleteResult.deletedCount} anciennes questions supprimées`);
    
    // Créer toutes les questions avec index
    const questionsWithIndex = ravenQuestions.map((q, index) => ({
      ...q,
      questionIndex: index + 1
    }));
    
    const insertResult = await Question.insertMany(questionsWithIndex);
    console.log(`✅ ${insertResult.length} questions créées avec questionIndex`);
    
    // Vérifier spécifiquement la question 4D
    const question4D = await Question.findOne({
      content: 'Transformation géométrique en 4 dimensions'
    });
    
    if (question4D) {
      console.log(`🎯 Question 4D trouvée:`);
      console.log(`   - questionIndex: ${question4D.questionIndex}`);
      console.log(`   - series: ${question4D.series}`);
      console.log(`   - difficulty: ${question4D.difficulty}`);
      console.log(`   - content: "${question4D.content}"`);
    } else {
      console.log('❌ Question 4D non trouvée!');
    }
    
    // Vérifier le total
    const totalQuestions = await Question.countDocuments();
    console.log(`📊 Total questions en base: ${totalQuestions}`);
    
    console.log('✅ Base de données corrigée!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

// Exécuter la correction
fixDatabase();