// Configuration partagée entre tous les modes
module.exports = {
  // Limites globales
  maxQuestions: 60,
  maxSeries: 5,
  questionsPerSeries: 12,
  
  // Timeouts par défaut
  defaultTimeout: 120000,
  questionTimeout: 300000,
  
  // Formats supportés
  supportedFormats: ['json', 'csv', 'xml'],
  supportedImageFormats: ['svg', 'png', 'jpg'],
  
  // Validations communes
  validation: {
    minPasswordLength: 8,
    maxUsernameLength: 50,
    maxQuestionContentLength: 1000,
    maxOptionsCount: 8
  },
  
  // Calculs IQ standards
  iqCalculation: {
    minIQ: 60,
    maxIQ: 200,
    averageIQ: 100,
    standardDeviation: 15
  },
  
  // Classifications IQ communes
  iqClassifications: {
    130: { level: "Très supérieur", percentile: 98 },
    120: { level: "Supérieur", percentile: 91 },
    110: { level: "Moyen supérieur", percentile: 75 },
    90: { level: "Moyen", percentile: 50 },
    80: { level: "Moyen inférieur", percentile: 16 },
    70: { level: "Limite", percentile: 2 },
    0: { level: "Déficient", percentile: 0.1 }
  },
  
  // Patterns visuels supportés
  visualPatterns: [
    'rotation_sequence_90deg',
    'rotation_sequence_45deg',
    'alternating_squares_series',
    'matrix_3x3_bicolor_discs',
    'progression_remplissage'
  ],
  
  // Catégories de questions
  questionCategories: ['spatial', 'logique', 'verbal', 'analogie'],
  
  // Niveaux de difficulté
  difficultyLevels: {
    1: 'Très facile',
    2: 'Facile', 
    3: 'Moyen',
    4: 'Difficile',
    5: 'Très difficile',
    6: 'Expert',
    7: 'Maître',
    8: 'Grand maître',
    9: 'Légendaire',
    10: 'Impossible'
  }
};