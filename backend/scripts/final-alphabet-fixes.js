#!/usr/bin/env node
const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');

async function finalAlphabetFixes() {
  await mongoose.connect('mongodb://localhost:27017/iq_test_db');
  
  console.log('🔧 Corrections finales des alphabets...');
  
  const fixes = [
    { qid: '01K2G2QP4TNGE626JTRGGWN29T', newAlphabet: 'letter' }, // Q12 - contenu en letter
    { qid: '01K2G2QP6CWP5R9CY8HDR57K94', newAlphabet: 'number' }, // Q28 - contenu en number  
    { qid: '01K2G2QP78FCF49QQZZDB2WV3T', newAlphabet: 'letter' }, // Q36 - contenu en letter
    { qid: '01K2G2QP89JY304PQ3N6D7A157', newAlphabet: 'letter' }, // Q45 - contenu en letter
  ];
  
  for (const fix of fixes) {
    const question = await QuestionV2.findOne({ qid: fix.qid, version: 1 });
    if (question) {
      console.log(`Q${question.questionIndex}: ${question.alphabet} → ${fix.newAlphabet}`);
      question.alphabet = fix.newAlphabet;
      await question.save();
      console.log('  ✅ Corrigé');
    }
  }
  
  mongoose.disconnect();
  console.log('🎉 Corrections finales terminées !');
}

finalAlphabetFixes().catch(console.error);