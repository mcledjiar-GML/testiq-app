#!/usr/bin/env node
const RuleEngine = require('./rule-engine');
const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');

async function analyzeQ3() {
  await mongoose.connect('mongodb://localhost:27017/iq_test_db');
  
  const q3 = await QuestionV2.findOne({ 
    qid: '01K2G2QP2W97KTF3AQBAVHFN5Q',
    version: 1
  }).lean();
  
  console.log('=== ANALYSE Q3 ===');
  console.log('Content:', q3.content);
  console.log('Options:');
  q3.options.forEach((opt, idx) => {
    console.log(`  ${opt.key}: '${opt.text}' (correct: ${opt.isCorrect})`);
  });
  console.log('correctAnswer:', q3.correctAnswer);
  
  console.log('\n=== ANALYSE MOTEUR DE RÈGLES ===');
  const ruleAnalysis = RuleEngine.analyzeQuestion(q3);
  console.log('Type de règle détecté:', ruleAnalysis.ruleType);
  console.log('Analysis result:', ruleAnalysis.analysis);
  console.log('Valid options:', ruleAnalysis.validOptions);
  console.log('Expected answer:', ruleAnalysis.expectedAnswer);
  
  mongoose.disconnect();
}

analyzeQ3().catch(console.error);