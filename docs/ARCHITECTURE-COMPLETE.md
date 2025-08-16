# 🏗️ Architecture Complète TestIQ v5.0

## 📖 Vue d'Ensemble

TestIQ est une **application web complète** pour l'évaluation du quotient intellectuel (QI) basée sur les **matrices progressives de Raven**. L'architecture suit un pattern **Full-Stack** avec séparation des responsabilités et support multi-mode (Production/Démo).

---

## 🎯 Stack Technologique

### **Frontend**
- **React 18+** - Interface utilisateur moderne
- **JavaScript ES6+** - Logique client
- **CSS3/SCSS** - Stylisation avancée
- **SVG Dynamique** - Rendu visuel des questions

### **Backend**
- **Node.js 18+** - Serveur JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de données NoSQL
- **Mongoose** - ODM pour MongoDB

### **DevOps & Outils**
- **Docker** - Conteneurisation
- **Concurrently** - Gestion multi-processus
- **Dotenv** - Configuration environnementale
- **Nodemon** - Développement en temps réel

---

## 🏗️ Architecture Système

```
┌─────────────────────────────────────────────────────────────┐
│                    TestIQ Application                       │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React)           Backend (Node.js/Express)      │
│  ┌─────────────────┐        ┌─────────────────────────────┐ │
│  │ Port 3000/5173  │ ◄────► │ Port 5000/4000              │ │
│  │                 │  HTTP  │                             │ │
│  │ • Dashboard     │ REST   │ • API Routes                │ │
│  │ • Test Engine   │ JSON   │ • Authentication            │ │
│  │ • Results       │        │ • Question Management       │ │
│  │ • Visual SVG    │        │ • IQ Calculation            │ │
│  └─────────────────┘        └─────────────────────────────┘ │
│                                        │                    │
│                                        ▼                    │
│                             ┌─────────────────────────────┐ │
│                             │ MongoDB Database            │ │
│                             │ • Questions Collection      │ │
│                             │ • Users Collection          │ │
│                             │ • Results Collection        │ │
│                             │ • Visual Cache              │ │
│                             └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Structure des Répertoires

```
testiq-app/
├── 📄 package.json                 # Configuration principale
├── 📄 docker-compose.yml          # Configuration Docker
├── 📄 .env / .env.demo            # Variables d'environnement
│
├── 🎨 frontend/                   # Application React
│   ├── 📄 package.json
│   ├── 📁 public/
│   │   └── index.html
│   └── 📁 src/
│       ├── 📄 App.js              # Composant principal
│       ├── 📄 index.js            # Point d'entrée
│       ├── 📁 components/         # Composants React
│       │   ├── Dashboard.js       # Tableau de bord
│       │   ├── Test.js            # Moteur de test
│       │   ├── Results.js         # Résultats IQ
│       │   ├── Review.js          # Révision questions
│       │   ├── QuestionVisual.js  # Rendu visuel
│       │   ├── Matrix3x3.js       # Matrices 3x3
│       │   ├── RotationSequence.js# Séquences rotation
│       │   ├── SemicircleSVG.js   # SVG demi-cercles
│       │   ├── AlternatingSequence.js # Séquences alternées
│       │   ├── Grid2x2.js         # Grilles 2x2
│       │   ├── Login.js           # Authentification
│       │   └── Register.js        # Inscription
│       ├── 📁 lib/
│       │   └── api.js             # Client API REST
│       ├── 📁 styles/
│       │   └── svg-tokens.css     # Styles SVG
│       └── 📁 utils/
│           └── questionValidation.js # Validation côté client
│
├── ⚙️ backend/                    # Serveur Node.js
│   ├── 📄 package.json
│   ├── 📄 server.js               # Serveur principal
│   ├── 📄 iq_calculator.js        # Calcul IQ
│   ├── 📄 raven_questions.js      # Base questions Raven
│   ├── 📄 demo-questions.js       # Questions démo
│   ├── 📄 visual_service.js       # Service visuels
│   ├── 📄 start-mongodb.js        # MongoDB en mémoire
│   │
│   ├── 📁 middleware/             # Middleware Express
│   │   ├── admin-auth.js          # Auth administrateur
│   │   ├── demo-mode.js           # Mode démo
│   │   ├── kill-switch.js         # Arrêt d'urgence
│   │   ├── monitoring.js          # Surveillance
│   │   ├── gdpr-compliance.js     # Conformité GDPR
│   │   ├── quality-gate.js        # Contrôle qualité
│   │   ├── randomization-middleware.js # Randomisation
│   │   └── slo-monitoring.js      # SLO/SLA
│   │
│   ├── 📁 routes/                 # Routes API
│   │   ├── questions-v2.js        # API Questions v2
│   │   ├── questions-bulk.js      # Import/Export masse
│   │   ├── randomization.js       # Randomisation
│   │   ├── monitoring.js          # Monitoring
│   │   ├── gdpr.js               # GDPR
│   │   ├── cdn.js                # CDN Cache
│   │   ├── slo.js                # SLO
│   │   └── deployment.js         # Déploiement
│   │
│   ├── 📁 models/                 # Modèles MongoDB
│   │   └── QuestionV2.js          # Modèle Question v2
│   │
│   ├── 📁 utils/                  # Utilitaires
│   │   ├── canonicalization.js    # Normalisation
│   │   └── seeded-randomization.js # Randomisation déterministe
│   │
│   ├── 📁 security/               # Sécurité
│   │   └── svgSanitizer.js        # Sanitisation SVG
│   │
│   ├── 📁 scripts/                # Scripts maintenance
│   │   ├── seed_all_questions.js  # Seed questions
│   │   ├── generate_all_visuals.js # Génération visuels
│   │   ├── fix_q*.js             # Corrections questions
│   │   ├── test_*.js             # Tests validation
│   │   └── migrate_*.js          # Migrations
│   │
│   └── 📁 visual_cache/           # Cache visuels
│
├── 📁 docs/                       # Documentation
│   ├── README.md
│   ├── MODES-UTILISATION.md       # Guide modes
│   ├── ARCHITECTURE-COMPLETE.md   # Cette documentation
│   ├── MONGODB-CONFIGURATION.md   # Config MongoDB
│   └── 📁 demo/                   # Docs démo
│       ├── README.md
│       ├── SECURITY-AUDIT-FINAL.md
│       └── GUIDE-DEMARRAGE-APRES-PC.md
│
└── 📁 scripts/                    # Scripts globaux
    ├── seed-demo.js               # Seed mode démo
    └── test-demo-validation.js    # Validation démo
```

---

## 🔄 Architecture Multi-Mode

### **Mode Production**
```yaml
Configuration: .env
Ports: 
  - Backend: 5000
  - Frontend: 3000
Database: iq_test_db
Auth: ✅ Requise (JWT)
Features: 
  - ✅ Toutes fonctionnalités
  - ✅ Routes admin
  - ✅ Import/Export masse
  - ✅ Monitoring complet
Rate Limit: 100 req/15min
```

### **Mode Démo**
```yaml
Configuration: .env.demo
Ports:
  - Backend: 4000  
  - Frontend: 5173
Database: testiq_demo
Auth: ❌ Désactivée
Features:
  - ✅ Tests IQ de base
  - ❌ Routes admin bloquées
  - ❌ Import masse désactivé
  - ✅ Export autorisé
  - ✅ Tunnels Cloudflare
Rate Limit: 50 req/15min
```

---

## 🧠 Composants Métier

### **1. Moteur de Questions Raven**
```javascript
// backend/raven_questions.js
const ravenQuestions = [
  {
    type: 'raven',
    series: 'A|B|C|D|E',     // 5 séries de difficulté croissante
    questionIndex: 1-12,      // 12 questions par série  
    difficulty: 1-10,         // Niveau de difficulté
    content: '...',           // Énoncé question
    options: [...],           // Choix multiples
    correctAnswer: 0-7,       // Index réponse correcte
    visualPattern: '...',     // Type de pattern visuel
    category: 'spatial|logique|analogie',
    timeLimit: 30-300,        // Temps limite (secondes)
    explanation: '...'        // Explication pédagogique
  }
]
```

### **2. Calculateur d'IQ**
```javascript
// backend/iq_calculator.js
class IQCalculator {
  static calculateIQ(correctAnswers, totalQuestions, avgDifficulty) {
    // Conversion score brut → IQ standardisé (60-200)
    // Ajustement selon difficulté moyenne
    // Classification selon échelle Wechsler
    return { iq, classification, percentile }
  }
}
```

### **3. Générateur de Visuels SVG**
```javascript
// Composants visuels React
- Matrix3x3.js         → Matrices 3×3 progressives
- RotationSequence.js  → Séquences de rotation
- SemicircleSVG.js     → Demi-cercles orientés
- AlternatingSequence.js → Patterns alternés
- Grid2x2.js           → Grilles 2×2
- QuestionVisual.js    → Orchestrateur visuel
```

---

## 🔌 API REST

### **Endpoints Principaux**

#### **Questions**
```http
GET    /api/questions-v2           # Liste questions
GET    /api/questions-v2/:id       # Question spécifique
POST   /api/questions-v2           # Créer question
PUT    /api/questions-v2/:id       # Modifier question
DELETE /api/questions-v2/:id       # Supprimer question

GET    /api/questions-v2/series/:series     # Questions par série
GET    /api/questions-v2/difficulty/:level  # Questions par difficulté
```

#### **Tests & Résultats**
```http
POST   /api/test/submit            # Soumettre réponses
GET    /api/test/result/:sessionId # Récupérer résultats
POST   /api/test/start             # Démarrer session
```

#### **Randomisation**
```http
GET    /api/randomization/test     # Test randomisé
POST   /api/randomization/seed     # Seed déterministe
```

#### **Administration**
```http
GET    /api/admin/stats            # Statistiques
POST   /api/admin/backup           # Sauvegarde
GET    /api/monitoring/health      # Santé système
```

#### **GDPR & Conformité**
```http
POST   /api/gdpr/export-data       # Export données utilisateur
POST   /api/gdpr/delete-data       # Suppression données
GET    /api/gdpr/compliance-status # Statut conformité
```

---

## 🛡️ Sécurité & Conformité

### **Authentification**
- **JWT Tokens** - Sessions sécurisées
- **bcrypt** - Hachage mots de passe
- **Rate Limiting** - Protection DoS
- **Helmet.js** - Headers sécurisés

### **Validation & Sanitisation**
- **SVG Sanitizer** - Nettoyage SVG malveillants
- **Question Validation** - Validation côté serveur
- **CORS** - Contrôle accès cross-origin

### **Conformité GDPR**
- **Nettoyage automatique** - Suppression données expirées
- **Export données** - Portabilité utilisateur
- **Consentement explicite** - Tracking opt-in
- **Kill-Switch** - Arrêt d'urgence

---

## 📊 Monitoring & Observabilité

### **SLO/SLA Monitoring**
```javascript
// Objectifs de niveau de service
- Throughput: > 50 RPS
- Latency: < 200ms (P95)
- Error Rate: < 1%
- Uptime: > 99.9%
```

### **Métriques Collectées**
- **Performance** - Temps réponse, throughput
- **Erreurs** - Taux d'erreur, types d'erreurs
- **Usage** - Nombre sessions, questions répondues
- **Ressources** - CPU, mémoire, stockage

### **Alerting**
- **Email** - Alertes critiques
- **Slack** - Notifications équipe
- **Kill-Switch** - Arrêt automatique si critique

---

## 🚀 Déploiement & CI/CD

### **Scripts de Démarrage**
```bash
# Production
npm start                    # Mode production complet
npm run install:all          # Installation dépendances

# Démo  
npm run demo:up              # Mode démo complet
npm run seed:demo            # Données de démonstration
npm run demo:down            # Arrêt démo

# Développement
npm --prefix backend run dev   # Backend seul
npm --prefix frontend run start # Frontend seul
```

### **Docker Support**
```yaml
# docker-compose.yml
services:
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
  
  backend:
    build: ./backend
    ports: ["5000:5000"]
    depends_on: [mongo]
    
  frontend:
    build: ./frontend  
    ports: ["3000:3000"]
```

### **Pipeline CI/CD**
```bash
# ci-cd-pipeline.sh
1. Tests automatisés
2. Validation qualité (ESLint, tests)
3. Build production
4. Déploiement sécurisé
5. Tests post-déploiement
```

---

## 🔧 Configuration Avancée

### **Variables d'Environnement**

#### **Production (.env)**
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://localhost:27017/iq_test_db
AUTH_REQUIRED=true
RATE_LIMIT_MAX_REQUESTS=100
FEATURE_BULK_IMPORT=true
```

#### **Démo (.env.demo)**
```env
NODE_ENV=demo
PORT=4000
MONGODB_URI=mongodb://localhost:27017/testiq_demo
AUTH_REQUIRED=false
DISABLE_ADMIN_ROUTES=true
RATE_LIMIT_MAX_REQUESTS=50
FEATURE_BULK_IMPORT=false
```

### **Feature Flags**
```json
{
  "FEATURE_EXPORT": true,
  "FEATURE_BULK_IMPORT": false,
  "FEATURE_API_DOCS": true,
  "FEATURE_VISUAL_GENERATOR": true,
  "SVG_SANITIZER_ENABLED": true,
  "RATE_LIMIT_ENABLED": true
}
```

---

## 🎮 Nouvelle Organisation des Tests - Architecture UI

### **🎯 Concept : Tests Personnalisés avec Menu Hiérarchique**

**Philosophie :** Interface simple par défaut + personnalisation avancée accessible

### **📱 Architecture UI Complète**

#### **1. Dashboard Principal (Écran d'accueil)**
```
┌─────────────────────────────────────────┐
│             🧠 TestIQ                   │
├─────────────────────────────────────────┤
│  🏠 TESTS GUIDÉS (Par défaut)           │
│  ┌─────────────────────────────────────┐ │
│  │ 🟢 Débutant (Série A)     [12Q]    │ │
│  │ 🟡 Intermédiaire (A+B)    [24Q]    │ │
│  │ 🟠 Avancé (A+B+C)         [36Q]    │ │
│  │ 🔴 Expert (A+B+C+D+E)     [60Q]    │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ⚙️ [TESTS PERSONNALISÉS]               │
│  📊 Mes Résultats                       │
│  📖 Révision                            │
└─────────────────────────────────────────┘
```

#### **2. Menu Tests Personnalisés (Écran secondaire)**
```
┌─────────────────────────────────────────┐
│        ⚙️ Tests Personnalisés           │
├─────────────────────────────────────────┤
│  🏠 TESTS GUIDÉS                        │
│  🟢 Débutant | 🟡 Intermédiaire         │
│  🟠 Avancé   | 🔴 Expert                │
│                                         │
│  📚 TESTS PAR SÉRIE                     │
│  📖 Série A - Bases (diff 1-2)         │
│  📔 Série B - Logique (diff 3-4)       │
│  📘 Série C - Spatial (diff 5-6)       │
│  📕 Série D - Complexe (diff 7-8)      │
│  📚 Série E - Genius (diff 9-10)       │
│                                         │
│  🎯 TESTS CIBLÉS                        │
│  🎯 QI 90-110  | 🎯 QI 110-120         │
│  🎯 QI 120-130 | 🎯 QI 130+            │
│                                         │
│  ← Retour au Menu Principal             │
└─────────────────────────────────────────┘
```

### **🏗️ Structure de Données par Série**

#### **Série A - Bases (Débutant)**
- **Questions** : 1-12 (questionIndex: 1-12)
- **Difficulté** : 1-2 (Très facile à Facile)
- **Objectif** : Introduction aux concepts de base
- **Patterns** : Rotation simple, séquences arithmétiques, alternance
- **QI Ciblé** : 90-110

#### **Série B - Logique (Intermédiaire)**
- **Questions** : 13-24 (questionIndex: 1-12, series: 'B')
- **Difficulté** : 3-4 (Moyen à Difficile)
- **Objectif** : Raisonnement logique et analogies
- **Patterns** : Relations complexes, progressions géométriques
- **QI Ciblé** : 110-120

#### **Série C - Spatial (Avancé)**
- **Questions** : 25-36 (questionIndex: 1-12, series: 'C')
- **Difficulté** : 5-6 (Difficile à Très difficile)
- **Objectif** : Visualisation spatiale avancée
- **Patterns** : Matrices 3x3, transformations complexes
- **QI Ciblé** : 120-130

#### **Série D - Complexe (Expert)**
- **Questions** : 37-48 (questionIndex: 1-12, series: 'D')
- **Difficulté** : 7-8 (Très difficile à Expert)
- **Objectif** : Raisonnement abstrait de haut niveau
- **Patterns** : Relations multiples, logique symbolique
- **QI Ciblé** : 130-140

#### **Série E - Genius (Maître)**
- **Questions** : 49-60 (questionIndex: 1-12, series: 'E')
- **Difficulté** : 9-10 (Expert à Impossible)
- **Objectif** : Capacités exceptionnelles
- **Patterns** : Logique modale, mathématiques avancées
- **QI Ciblé** : 140+

### **🎮 Flux Utilisateur Amélioré**

#### **1. Navigation Hiérarchique**
```mermaid
Dashboard → Tests Guidés → Test Direct (A, A+B, A+B+C, A-E)
         → Tests Personnalisés → Sous-menu → Test Choisi
                                         → Tests Guidés
                                         → Tests par Série (A,B,C,D,E)
                                         → Tests Ciblés (QI ranges)
         → Mes Résultats → Historique par série/type
         → Révision → Questions ratées par série
```

#### **2. Session de Test par Série**
```mermaid
User → Sélection Série → Chargement Questions → Question Loop → Submit → Results → Review Série
```

#### **3. Calcul IQ Adaptatif**
```mermaid
Submit Answers → Série Detection → Difficulty Analysis → IQ Calculation → Series-based Classification
```

### **🛠️ Avantages Architecture**

#### **Pour Développeurs**
- **Tests isolés par série** → Validation Q1-Q12 série A séparément
- **Tests par difficulté** → Vérification progression 1-2, 3-4, etc.
- **Tests ciblés** → Validation calculs IQ par tranche
- **Débogage facilité** → Isolation des problèmes par série

#### **Pour Utilisateurs**
- **Interface simple** → Tests guidés par défaut
- **Progression claire** → Débutant → Expert
- **Flexibilité** → Accès à tous modes via Tests Personnalisés
- **Pédagogie** → Apprentissage progressif par série

#### **Pour Pédagogie**
- **Apprentissage structuré** → Série A → B → C → D → E
- **Feedback ciblé** → Résultats par type de raisonnement
- **Révision efficace** → Par série ou difficulté
- **Motivation** → Progression visible et gamifiée

---

## 🚨 **VÉRIFICATION DES CORRECTIONS - Août 2025**

### **✅ État des 12 Questions Série A**

**PRODUCTION** (`backend/raven_questions.js`)
- ✅ **12 questions complètes** : Questions 1-12 toutes présentes et corrigées
- ✅ **Indexation correcte** : `questionIndex: 1` à `questionIndex: 12`
- ✅ **Réponses valides** : `correctAnswer` entre 0-3 pour toutes les questions
- ✅ **Explications présentes** : Chaque question possède son `explanation`
- ✅ **Difficulté progressive** : Difficulté 1-2 (appropriée pour série A)
- ✅ **Révision fonctionnelle** : Composant `Review.js` complet avec navigation

**MODE DÉMO** (`backend/demo-questions.js`)
- ✅ **Question Q7 enrichie** : Version spécifique avec visuels SVG base64
- ✅ **Métadonnées avancées** : `vocabulary`, `patternRule`, `visualStyle`
- ✅ **Explications détaillées** : "Progression de remplissage par colonnes"

**STATUT GLOBAL** : ✅ **TOUTES CORRECTIONS PRÉSERVÉES DANS LES 2 VERSIONS**

---

## 🎯 **ARCHITECTURE RECOMMANDÉE - Séparation Intelligente**

### **❌ PROBLÈME ACTUEL**
- **Modes mélangés** sur branche `main` unique
- **Risque contamination** du code production
- **Configurations dispersées** dans le même espace

### **✅ SOLUTION : Mode Hybride avec Séparation par Configuration**

> **IMPORTANT** : "Séparer les modes" ≠ "Créer 2 branches"
> 
> **Séparation intelligente** = **Code partagé** + **Configurations isolées**

```
testiq-app/ (BRANCHE MAIN UNIQUE)
├── 📁 shared/                    # 🔄 CODE PARTAGÉ
│   ├── raven_questions.js        # ← Questions Q1-Q12 communes
│   ├── iq_calculator.js          # ← Calculs IQ partagés
│   ├── components/Review.js      # ← Révision partagée
│   └── visual_service.js         # ← Génération SVG commune
│
├── 📁 config/                    # ⚙️ CONFIGURATIONS SÉPARÉES
│   ├── production.env            # ← AUTH=true, PORT=5000, DB=iq_test_db
│   ├── demo.env                  # ← AUTH=false, PORT=4000, DB=testiq_demo
│   ├── production.js             # ← Config serveur production
│   └── demo.js                   # ← Config serveur démo
│
├── 📁 modes/                     # 🎯 SPÉCIFIQUES PAR MODE
│   ├── production/
│   │   ├── scripts/              # ← Scripts production uniquement
│   │   ├── middleware/           # ← Auth complète, admin routes
│   │   └── features/             # ← Import masse, monitoring avancé
│   └── demo/
│       ├── scripts/              # ← Scripts démo seulement
│       ├── middleware/           # ← Auth désactivée, routes limitées
│       └── features/             # ← Export seul, tunnels Cloudflare
│
└── 📁 deployment/                # 🚀 DÉPLOIEMENT
    ├── start-production.js       # ← Charge config production
    ├── start-demo.js             # ← Charge config démo
    └── docker-compose.yml        # ← Services selon NODE_ENV
```

### **🧠 Avantages Séparation Intelligente**

| Aspect | Mode Hybride | Branches Séparées |
|--------|--------------|-------------------|
| **Code partagé** | ✅ Questions communes | ❌ Duplication code |
| **Corrections propagées** | ✅ Fix Q7 → prod + démo | ❌ Merge conflicts |
| **Maintenance** | ✅ Un seul codebase | ❌ Double maintenance |
| **Déploiement** | ✅ Script par environnement | ❌ 2 repos à gérer |
| **Configuration** | ✅ Isolée par .env | ⚠️ Mélangée dans code |
| **Stabilité production** | ✅ Préservée par config | ✅ Isolée mais dupliquée |

### **⚙️ Configuration Dynamique**

```javascript
// config/mode-loader.js
const loadConfig = (mode) => {
  const baseConfig = require('./shared.js');
  const modeConfig = require(`./${mode}.js`);
  
  return {
    ...baseConfig,
    ...modeConfig,
    features: {
      ...baseConfig.features,
      ...modeConfig.features
    }
  };
};

// server.js
const config = loadConfig(process.env.NODE_ENV);
const questionsSource = config.demo ? 
  './demo-questions.js' : 
  './shared/raven_questions.js';
```

### **🚀 Scripts de Démarrage Séparés**

```json
{
  "scripts": {
    "start:production": "NODE_ENV=production node deployment/start-production.js",
    "start:demo": "NODE_ENV=demo node deployment/start-demo.js",
    "dev:production": "dotenv -e config/production.env -- npm run dev",
    "dev:demo": "dotenv -e config/demo.env -- npm run demo:up"
  }
}
```

---

## 🔮 **Migration vers Architecture Hybride**

### **Phase 1 : Réorganisation**
1. **Créer structure `shared/`** - Déplacer code commun
2. **Créer structure `config/`** - Séparer configurations
3. **Créer structure `modes/`** - Isoler spécificités

### **Phase 2 : Configuration**
1. **Scripts de démarrage** - Un par environnement
2. **Variables d'environnement** - Fichiers dédiés
3. **Feature flags** - Activation selon mode

### **Phase 3 : Validation**
1. **Tests production** - Vérifier stabilité
2. **Tests démo** - Confirmer fonctionnement
3. **Migration données** - Sans interruption

### **Avantages Finaux**
- ✅ **Code partagé préservé** - Questions, calculs, révision
- ✅ **Corrections propagées** - Fix une fois, bénéfice partout
- ✅ **Production sécurisée** - Configuration isolée
- ✅ **Démo flexible** - Features limitées par config
- ✅ **Maintenance simple** - Un seul codebase à maintenir

---

## 📋 Conclusion

TestIQ v5.0 présente une **architecture robuste et évolutive** supportant :

- **Multi-mode** (Production/Démo) avec isolation complète
- **Moteur de test IQ** basé sur les standards Raven
- **Sécurité enterprise** (GDPR, authentification, sanitisation)
- **Monitoring production** (SLO, alerting, métriques)
- **Déploiement flexible** (Docker, scripts, CI/CD)

L'architecture actuelle permet une **séparation claire** entre les modes tout en préservant la **flexibilité** pour les évolutions futures.

---

*Documentation générée le 16 août 2025 - TestIQ v5.0*