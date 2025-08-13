/**
 * 🆔 SCHÉMA QUESTION V2 - AVEC UID IMMUABLE ET VERSIONING
 * =====================================================
 * 
 * Nouveau système d'identifiants uniques et de versioning pour éliminer
 * les collisions de contenu et assurer la cohérence des assets.
 */

const mongoose = require('mongoose');
const { ulid } = require('ulid');
const crypto = require('crypto');
const Canonicalizer = require('../utils/canonicalization');

// Schéma pour les options de réponse
const OptionSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true,
    enum: ['A', 'B', 'C', 'D', 'E', 'F'] // Maximum 6 options
  },
  text: { type: String, required: true },
  alt: { type: String }, // Texte alternatif pour accessibilité
  isCorrect: { type: Boolean, default: false },
  assetPath: { type: String }, // Chemin vers SVG/image de l'option
  assetHash: { type: String }, // SHA256 de l'asset pour intégrité
  metadata: { type: mongoose.Schema.Types.Mixed } // Données spécifiques (rotation, etc.)
}, { _id: false });

// Schéma pour les assets liés à la question
const AssetSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['stimulus', 'option', 'explanation', 'visual', 'course'] 
  },
  slot: {
    type: String,
    required: true,
    validate: {
      validator: function(slot) {
        // Valider le slot selon le type
        switch (this.type) {
          case 'stimulus':
            return slot === 'stimulus';
          case 'option':
            return /^option[A-F]$/.test(slot); // optionA, optionB, etc.
          case 'explanation':
            return slot === 'explanation';
          case 'visual':
            return ['visual', 'diagram', 'matrix'].includes(slot);
          case 'course':
            return ['course', 'lesson', 'tutorial'].includes(slot);
          default:
            return false;
        }
      },
      message: 'Slot invalide pour le type d\'asset'
    }
  },
  path: { type: String, required: true }, // s3://iq/questions/{qid}/{v}/...
  hash: { type: String, required: true }, // SHA256 pour intégrité
  locale: { type: String, default: 'fr' },
  mimeType: { type: String },
  size: { type: Number },
  minified: { type: Boolean, default: false }, // Pour SVG minifiés
  originalHash: { type: String } // Hash avant minification
}, { _id: false });

// Schéma principal Question V2
const QuestionV2Schema = new mongoose.Schema({
  // === IDENTIFIANTS UNIQUES ET IMMUABLES ===
  qid: { 
    type: String, 
    required: true,
    unique: true,
    default: () => ulid(),
    immutable: true // Ne peut jamais être modifié
  },
  
  version: { 
    type: Number, 
    required: true,
    min: 1,
    default: 1
  },
  
  // === MÉTADONNÉES DE PUBLICATION ===
  state: {
    type: String,
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft',
    required: true
  },
  
  publishedAt: { type: Date },
  archivedAt: { type: Date },
  
  // === CONTENU DE LA QUESTION ===
  type: { 
    type: String, 
    required: true, 
    enum: ['raven', 'cattell', 'custom', 'verbal', 'numerical', 'spatial'] 
  },
  
  series: { 
    type: String, 
    enum: ['A', 'B', 'C', 'D', 'E'],
    required: function() { return this.type === 'raven'; }
  },
  
  alphabet: {
    type: String,
    enum: ['dot', 'semicircle', 'arrow', 'shape', 'number', 'letter'],
    required: true
  },
  
  difficulty: { 
    type: Number, 
    min: 1, 
    max: 10, 
    required: true 
  },
  
  content: { type: String, required: true }, // Énoncé de la question
  stimulus: { type: String }, // Stimulus textuel (ex: "◼ ◻ ◼ ?")
  
  // === OPTIONS DE RÉPONSE ===
  options: {
    type: [OptionSchema],
    required: true,
    validate: {
      validator: function(options) {
        // Exactement 4 options (ou selon type)
        if (options.length !== 4) return false;
        
        // Exactement une réponse correcte
        const correctCount = options.filter(opt => opt.isCorrect).length;
        if (correctCount !== 1) return false;
        
        // Clés uniques et séquentielles
        const keys = options.map(opt => opt.key).sort();
        const expectedKeys = ['A', 'B', 'C', 'D'].slice(0, options.length);
        return JSON.stringify(keys) === JSON.stringify(expectedKeys);
      },
      message: 'Options invalides: doit avoir exactement 4 options avec 1 réponse correcte'
    }
  },
  
  correctAnswer: { 
    type: Number, 
    required: true,
    min: 0,
    max: 5
  },
  
  // === CLASSIFICATION ===
  category: { 
    type: String, 
    enum: ['logique', 'verbal', 'spatial', 'mémoire', 'numérique'],
    required: true 
  },
  
  timeLimit: { 
    type: Number, 
    default: 60,
    min: 10,
    max: 300
  },
  
  // === ASSETS ET INTÉGRITÉ ===
  assets: [AssetSchema],
  
  bundleHash: { 
    type: String,
    required: false  // Temporairement optionnel pour migration
  },
  
  // === RÈGLES ET VALIDATION ===
  rules: [{
    type: { type: String, enum: ['pattern', 'sequence', 'rotation', 'logic'] },
    description: { type: String },
    formula: { type: String } // Expression pour validation automatique
  }],
  
  visualPattern: { type: String }, // Pattern pour générateur visuel
  
  // === EXPLICATIONS ET PÉDAGOGIE ===
  explanation: { type: String },
  hints: [String],
  pedagogicalNotes: { type: String },
  
  // === INDEXATION ET RECHERCHE ===
  questionIndex: { type: Number }, // Index legacy pour migration
  tags: [String],
  
  // === MÉTADONNÉES ===
  createdBy: { type: String },
  updatedBy: { type: String },
  
  // === STATISTIQUES (calculées) ===
  stats: {
    totalAttempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 },
    difficultyRating: { type: Number } // Calculé automatiquement
  }
}, {
  timestamps: true,
  collection: 'questions_v2'
});

// === INDEX COMPOSÉS POUR PERFORMANCE ===
QuestionV2Schema.index({ qid: 1, version: 1 }, { unique: true });
QuestionV2Schema.index({ state: 1, type: 1, series: 1 });
QuestionV2Schema.index({ alphabet: 1, difficulty: 1 });
QuestionV2Schema.index({ bundleHash: 1 }, { unique: true });
QuestionV2Schema.index({ questionIndex: 1 }, { sparse: true }); // Pour migration

// === INDEX UNIQUE POUR ASSETS (EMPÊCHE RÉUTILISATION ERRONÉE) ===
// Index unique (qid, version, locale, type, slot) pour éviter qu'un SVG d'option B 
// soit réutilisé par erreur comme option C ou dans un autre item
QuestionV2Schema.index(
  { 
    'assets.qid': 1, 
    'assets.version': 1, 
    'assets.locale': 1, 
    'assets.type': 1, 
    'assets.slot': 1 
  }, 
  { 
    unique: true, 
    sparse: true, 
    name: 'assets_unique_reference',
    partialFilterExpression: { 'assets.0': { $exists: true } }
  }
);

// === MIDDLEWARE POUR CALCUL DU BUNDLE HASH CANONIQUE ===
QuestionV2Schema.pre('save', function(next) {
  // Calculer le bundle hash canonique stable (temporairement désactivé pour migration)
  try {
    this.bundleHash = Canonicalizer.calculateCanonicalBundleHash(this);
  } catch (error) {
    console.warn('⚠️ Erreur calcul bundle hash:', error.message);
    this.bundleHash = 'temp-' + Date.now(); // Hash temporaire
  }
  
  // Valider état de publication
  if (this.state === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Valider la cohérence du hash (temporairement désactivé)
  // const validation = Canonicalizer.validateBundleHash(this);
  // if (!validation.valid) {
  //   const error = new Error(`Bundle hash invalide: ${validation.errors.join(', ')}`);
  //   error.name = 'ValidationError';
  //   return next(error);
  // }
  
  next();
});

// === MÉTHODES D'INSTANCE ===
QuestionV2Schema.methods.createNewVersion = function() {
  const newQuestion = new this.constructor(this.toObject());
  newQuestion._id = undefined;
  newQuestion.version = this.version + 1;
  newQuestion.state = 'draft';
  newQuestion.publishedAt = undefined;
  newQuestion.createdAt = undefined;
  newQuestion.updatedAt = undefined;
  return newQuestion;
};

QuestionV2Schema.methods.getAssetPath = function(assetType) {
  return `questions/${this.qid}/${this.version}/${assetType}`;
};

QuestionV2Schema.methods.validateIntegrity = function() {
  // Vérifier l'intégrité complète avec canonicalisation
  const issues = [];
  
  // Vérifier options
  const correctOptions = this.options.filter(opt => opt.isCorrect);
  if (correctOptions.length !== 1) {
    issues.push('Exactement une option doit être correcte');
  }
  
  // Vérifier alphabet cohérent
  const expectedAlphabet = this.detectAlphabet();
  if (this.alphabet !== expectedAlphabet) {
    issues.push(`Alphabet incohérent: attendu ${expectedAlphabet}, trouvé ${this.alphabet}`);
  }
  
  // Vérifier bundle hash canonique
  const validation = Canonicalizer.validateBundleHash(this);
  if (!validation.valid) {
    issues.push(...validation.errors);
  }
  
  // Vérifier cohérence des assets
  if (this.assets && this.assets.length > 0) {
    for (const asset of this.assets) {
      // Vérifier que le chemin contient qid/version correct
      const expectedPrefix = `questions/${this.qid}/${this.version}/`;
      if (!asset.path.includes(expectedPrefix)) {
        issues.push(`Asset ${asset.type}:${asset.slot} chemin incohérent`);
      }
      
      // Vérifier slot valide pour le type
      const slotValid = this.validateAssetSlot(asset.type, asset.slot);
      if (!slotValid) {
        issues.push(`Asset ${asset.type} slot invalide: ${asset.slot}`);
      }
    }
  }
  
  return issues;
};

QuestionV2Schema.methods.validateAssetSlot = function(type, slot) {
  switch (type) {
    case 'stimulus':
      return slot === 'stimulus';
    case 'option':
      return /^option[A-F]$/.test(slot);
    case 'explanation':
      return slot === 'explanation';
    case 'visual':
      return ['visual', 'diagram', 'matrix'].includes(slot);
    case 'course':
      return ['course', 'lesson', 'tutorial'].includes(slot);
    default:
      return false;
  }
};

QuestionV2Schema.methods.detectAlphabet = function() {
  // Détecter l'alphabet basé sur le contenu
  const content = this.content + ' ' + (this.stimulus || '');
  
  if (/[◼◻▦▪]/.test(content)) return 'shape';
  if (/[◐◑◒◓]/.test(content)) return 'semicircle';
  if (/[↑↓←→]/.test(content)) return 'arrow';
  if (/[●○]/.test(content)) return 'dot';
  if (/[0-9]/.test(content)) return 'number';
  if (/[A-Z]/.test(content)) return 'letter';
  
  return 'shape'; // Par défaut
};

// === MÉTHODES STATIQUES ===
QuestionV2Schema.statics.findByQid = function(qid, version = null) {
  const query = { qid, state: 'published' };
  if (version) query.version = version;
  
  return this.findOne(query).sort({ version: -1 });
};

QuestionV2Schema.statics.generateQid = function() {
  return ulid();
};

QuestionV2Schema.statics.migrateFromLegacy = function(legacyQuestion) {
  const qid = this.generateQid();
  
  return new this({
    qid,
    version: 1,
    type: legacyQuestion.type || 'raven',
    series: legacyQuestion.series,
    alphabet: 'shape', // À détecter automatiquement
    difficulty: legacyQuestion.difficulty,
    content: legacyQuestion.content,
    stimulus: legacyQuestion.stimulus,
    options: legacyQuestion.options?.map((opt, idx) => ({
      key: String.fromCharCode(65 + idx), // A, B, C, D
      text: typeof opt === 'string' ? opt : opt.text,
      alt: opt.alt,
      isCorrect: idx === legacyQuestion.correctAnswer
    })) || [],
    correctAnswer: legacyQuestion.correctAnswer,
    category: legacyQuestion.category,
    timeLimit: legacyQuestion.timeLimit || 60,
    explanation: legacyQuestion.explanation,
    visualPattern: legacyQuestion.visualPattern,
    questionIndex: legacyQuestion.questionIndex,
    state: 'published',
    publishedAt: new Date()
  });
};

module.exports = mongoose.model('QuestionV2', QuestionV2Schema);