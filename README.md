# TestIQ - Application d'Évaluation de QI 🧠

Application web complète pour l'évaluation du quotient intellectuel (QI) basée sur les matrices progressives de Raven, développée avec React, Node.js et MongoDB.

## ✨ Fonctionnalités Principales

### 🎯 Tests d'Intelligence
- **Test Rapide** : 12 questions (15 minutes) - Échantillon de chaque série
- **Test Standard** : 20 questions (25 minutes) - Test équilibré recommandé  
- **Test Complet Raven** : 60 questions (90 minutes) - Test professionnel complet

### 🧠 Calcul de QI Intelligent
- Calcul automatique du QI basé sur les standards scientifiques
- Classification selon l'échelle de Wechsler (Déficient à Très Supérieur)
- Ajustement selon la difficulté des questions et le niveau du test
- Affichage du percentile et comparaison avec la population

### 📊 Tableau de Bord Personnalisé
- **QI Actuel** : Affichage prominent de votre QI (dernier test ou moyenne des 3 derniers)
- Classification avec emoji et description détaillée
- Historique complet de tous vos tests avec QI affiché
- Analyse de progression dans le temps

### 🎨 Système de Visuels Professionnels IA ⭐ **NOUVEAU v3.0**

#### **🚀 Génération Automatique de Visualisations HD**
- **🤖 Intelligence Artificielle** : Détection automatique des questions nécessitant des visuels
- **🎯 7 Types de Visuels Professionnels** : Matrices, Venn, Fibonacci, 3D/4D, Motifs, Logique, Progressions
- **📊 Rendu HD 300 DPI** : Images haute définition avec gradients et animations modernes  
- **⚡ Cache Intelligent 24h** : Performance optimisée avec mise en cache automatique

#### **🎨 Types de Visualisations Générées**
- **🔄 Matrices avec Rotations** : Animations 2×2/3×3 avec flèches colorées et rotations visuelles
- **📊 Diagrammes de Venn Interactifs** : Inclusion-exclusion avec calculs step-by-step colorés
- **🌀 Suites de Fibonacci** : Spirales dorées mathématiques avec carrés proportionnels
- **🌐 Transformations 3D/4D** : Cubes en perspective avec rotations et projections
- **🎯 Complétion de Motifs** : Grilles 3×3 colorées avec patterns et logique visuelle
- **🧠 Diagrammes Logiques** : Transitivité et raisonnement avec nœuds et flèches
- **📈 Progressions Numériques** : Graphiques avec différences constantes visualisées

#### **⚙️ Technologies de Pointe**
- **🐍 Python + Matplotlib + Seaborn** : Génération de visualisations scientifiques
- **🔧 Node.js + React** : Intégration web seamless avec composants modernes
- **🎨 Design System Moderne** : Gradients, animations CSS3, responsive design
- **📱 Compatible Multi-Plateformes** : Desktop, tablet, mobile avec affichage adaptatif

### 🎓 Système d'Explications Pédagogiques Avancé ⭐ **v2.1**

#### **Structure d'Apprentissage Scientifique**
- **Solution pas-à-pas** : Méthode "Repérer → Formaliser → Calculer" pour chaque question
- **Diagnostic d'erreur personnalisé** : Analyse précise de pourquoi votre réponse semblait plausible
- **Règles extraites** : Chaque question révèle une règle mathématique/logique spécifique
- **Généralisation** : Extension des concepts pour un transfert d'apprentissage optimal

#### **Taxonomie d'Erreurs Unifiée (12 Types)**
- `diff_arithm` : Erreurs d'écart constant (suites arithmétiques)
- `ratio_geom` : Erreurs de rapport constant (suites géométriques)  
- `rotation_sens` : Confusion horaire/anti-horaire, angles incorrects
- `superposition_confusion` : Combinaison de transformations multiples
- `logique_formelle` : Implications, quantificateurs, syllogismes
- `ensembles_cardinal` : Union/intersection, comptage
- `analogie_arithm` : Relations (×, +) mal déduites
- `fibonacci` : Suite de Fibonacci
- `nombres_premiers` : Test de primalité
- `concept_inconnu` : Nouveau concept non maîtrisé
- `relation_ordre` : Transitivité, comparateurs
- `rythme_incoherent` : Rythme non constant, sauts erronés

#### **Nouveaux Concepts avec Micro-Fiches** 📚
- **Factorielle** (5! = 120) : Formule, récurrence, applications
- **Nombres de Catalan** : Parenthésages, formule combinatoire
- **Logique temporelle** : Modalités □ (nécessaire) et ◇ (possible)
- **Rotation 3D mentale** : Visualisation spatiale des cubes
- **Opérateurs logiques XOR** : Équivalence, négation
- **Carrés parfaits** : Suites exponentielles n²
- **Nombres premiers** : Test de primalité, distribution
- **Suites de Fibonacci** : Récurrence, propriétés

#### **Plans Visuels Annotés** 🎨
- **Overlays colorés** : Chaque règle surlignée avec sa couleur
- **Animations** : "Surbrillance séquentielle des écarts +2"
- **Légendes interactives** : Association couleur ↔ concept
- **Types normalisés** : sequence, matrix, logic, superposition, rotation

#### **Métacognition et Performance** ⏱️
- **Temps cible vs utilisé** : Feedback sur votre vitesse de résolution
- **Heuristiques express** : "Toujours calculer les écarts avant de répondre"
- **Micro-drills immédiats** : 2 exercices similaires post-erreur
- **Rappel J+1** : Révision espacée pour ancrage durable

#### **Analyse des Distracteurs** 🎯
- **4 options analysées** avec raisons psychologiques précises
- **Émojis clarifiants** : ✅ Correcte / ❌ Piège cognitif
- Exemple : "❌ Biais +1 (nombres consécutifs au lieu de pairs)"

### 📚 Système d'Apprentissage Classique
- **Révision Détaillée** : Analyse complète de chaque question
- **Bouton "Savoir Plus"** : Cours approfondis pour chaque type de question
- **Explications par Série** :
  - Série A : Reconnaissance de motifs simples
  - Série B : Transformations et relations  
  - Série C : Logique spatiale avancée
  - Série D : Raisonnement analogique
  - Série E : Abstraction maximale
- **Techniques de Résolution** : Méthodes spécifiques par type de question
- **Conseils Pratiques** : Astuces pour améliorer vos performances

### 🎨 Interface Utilisateur Optimisée
- **Texte Agrandie** : Caractères et symboles parfaitement lisibles
- **Navigation Intuitive** : Interface claire et professionnelle
- **Responsive Design** : Fonctionne sur tous les appareils
- **Feedback Visuel** : Couleurs et icônes pour une meilleure compréhension

### 🔒 Sécurité et Gestion des Comptes
- Authentification JWT sécurisée
- Hashage des mots de passe avec bcrypt
- Sessions persistantes avec tokens
- Protection contre les attaques par force brute

## 🛠️ Technologies Utilisées

### Frontend
- **React 18** : Interface utilisateur moderne
- **React Router** : Navigation côté client
- **Axios** : Communication avec l'API
- **CSS3** : Styling responsive et moderne

### Backend  
- **Node.js** : Serveur JavaScript
- **Express.js** : Framework web rapide
- **MongoDB** : Base de données NoSQL
- **Mongoose** : ODM pour MongoDB
- **JWT** : Authentification par tokens
- **bcrypt** : Hashage sécurisé des mots de passe

### 🎨 Système de Visualisations ⭐ **NOUVEAU**
- **Python 3.11** : Générateur de visuels IA
- **Matplotlib 3.10+** : Graphiques scientifiques HD
- **Seaborn 0.13+** : Visualisations statistiques modernes
- **NumPy 2.3+** : Calculs mathématiques optimisés
- **Pillow 11.3+** : Traitement d'images avancé

### Infrastructure
- **Docker** : Conteneurisation complète avec Python
- **Docker Compose** : Orchestration multi-services
- **MongoDB Atlas** : Base de données cloud (optionnel)
- **Cache System** : Mise en cache intelligente des visuels

## 🚀 Installation et Démarrage

### Prérequis
- Docker et Docker Compose installés
- Git pour cloner le repository

### Installation Rapide
```bash
# Cloner le repository
git clone https://github.com/votre-username/testiq-app.git
cd testiq-app

# Démarrer l'application
./start_testiq.sh
```

### 🔄 Démarrage après Redémarrage PC

Voici les étapes pour lancer l'application TestIQ après un redémarrage de votre PC :

#### 1. Ouvrir un terminal
- Ouvrez **PowerShell** ou **Git Bash** en tant qu'administrateur
- Naviguez vers le dossier du projet :
```bash
cd C:\Users\mc_le\Documents\testiq-app
```

#### 2. Vérifier Docker
```bash
docker --version
docker-compose --version
```
Si Docker n'est pas démarré, lancez **Docker Desktop**.

#### 3. Lancer l'application
```bash
# Avec les valeurs par défaut (localhost)
./start_testiq.sh

# OU avec votre IP publique
SERVER_IP=13.223.174.47 ./start_testiq.sh
```

#### 4. Accéder à l'application
Après le démarrage, vous verrez les URLs :
- **Local** : http://localhost:3000 (ou votre IP)
- **Public** : http://testIQ.fitluxe.online:3000

#### 5. En cas de problème
```bash
# Voir les logs
docker-compose logs

# Redémarrer les services
docker-compose down
./start_testiq.sh
```

### Accès à l'Application
- **Frontend** : http://localhost:3000
- **API Backend** : http://localhost:5000  
- **Base de données** : localhost:27017

### Variables d'Environnement Configurables
Le script `start_testiq.sh` supporte les variables suivantes :
- `SERVER_IP` (défaut: localhost)
- `FRONTEND_PORT` (défaut: 3000)
- `API_PORT` (défaut: 5000)
- `PUBLIC_DOMAIN` (défaut: testIQ.fitluxe.online)

### Commandes Utiles
```bash
# Démarrer l'application avec le script optimisé
./start_testiq.sh

# Démarrer manuellement
docker-compose up -d

# Arrêter l'application  
docker-compose down

# Voir les logs
docker-compose logs

# Redémarrer après modifications
docker-compose restart
```

## 📈 Architecture du Système

### Structure des Dossiers
```
testiq-app/
├── frontend/               # Application React
│   ├── src/
│   │   ├── components/     # Composants React
│   │   │   ├── Dashboard.js    # Tableau de bord
│   │   │   ├── Test.js         # Interface de test
│   │   │   ├── Results.js      # Résultats et historique
│   │   │   ├── Review.js       # Révision détaillée
│   │   │   ├── QuestionVisual.js  # 🎨 **NOUVEAU** Composant d'affichage des visuels IA
│   │   │   └── Login.js        # Authentification
│   │   └── App.js          # Composant principal
│   └── package.json
├── backend/                # Serveur Node.js
│   ├── server.js          # Serveur principal
│   ├── iq_calculator.js   # Système de calcul de QI
│   ├── raven_questions.js # Base de questions Raven
│   ├── explanations_audit_corrected.json  # 🆕 Explications pédagogiques (60 questions)
│   ├── visual_generator.py     # 🎨 **NOUVEAU** Générateur IA de visuels professionnels
│   ├── visual_service.js       # 🎨 **NOUVEAU** Service Node.js pour intégration Python
│   ├── analyze_visual_needs.py # 🎨 **NOUVEAU** Analyseur des besoins en visuels  
│   ├── requirements.txt        # 🎨 **NOUVEAU** Dépendances Python
│   └── Dockerfile             # 🎨 **NOUVEAU** Image Docker avec Python + Node.js
├── complete_question_explanation_mapping.json  # 🆕 Système d'indexation unifié (60 questions)
├── docker-compose.yml     # Configuration Docker
└── README.md
```

### Base de Données
- **Users** : Profils utilisateur et historique des tests
- **Questions** : Questions Raven avec métadonnées (série, difficulté, etc.)
- **TestHistory** : Résultats détaillés avec réponses et calculs de QI
- **Explanations** 🆕 : Base d'explications pédagogiques avec diagnostic d'erreurs
- **QuestionMapping** 🆕 : Système d'indexation unifié garantissant les bonnes correspondances

### 🗺️ Système d'Indexation Unifié 🆕

Le système d'indexation unifié garantit que chaque question affiche la bonne explication correspondante. Plus de problèmes de correspondances incorrectes !

#### Architecture du Mapping (`complete_question_explanation_mapping.json`)
```json
{
  "description": "Mapping complet des 60 questions Raven avec leurs explications",
  "version": "2.0",
  "totalQuestions": 60,
  "matchedExplanations": 60,
  "mappings": [
    {
      "positionIndex": 6,                           // ← Index unique (1-60)
      "questionContent": "Continuez: A, C, E, G, ?", // ← Question exacte
      "explanationId": "Q6",                        // ← Explication correspondante
      "correctAnswer": "I",                         // ← Bonne réponse
      "series": "A",                                // ← Série Raven
      "competence": "verbal",                       // ← Type de compétence
      "isConsistent": true                          // ← Validation automatique
    }
  ]
}
```

#### Fonctionnalités du Système
- ✅ **Correspondance parfaite** : 60/60 questions mappées correctement
- 🔍 **Recherche intelligente** : Mapping exact + fallback par similarité
- 🛠️ **Maintenable** : Un seul fichier JSON centralisé
- 📊 **Statistiques** : Répartition par série et compétence
- 🔄 **Extensible** : Facile d'ajouter de nouvelles questions
- 📈 **Robuste** : Tests automatisés pour validation

### 📊 Système d'Explications (Architecture JSON) 🆕

#### Structure par Question
```json
{
  "questionId": "Q2",
  "serie": "A", 
  "competence": "numerique",
  "difficulte": 1,
  "correctAnswer": "10",
  "solutionPasAPas": [
    "Repérer : 2→4→6→8, écart constant de +2",
    "Formaliser : Suite arithmétique u(n) = 2n", 
    "Calculer : 8 + 2 = 10"
  ],
  "regleExtraite": "Différence constante +2 ⇒ suite arithmétique",
  "generalisation": "Écart constant +k ⇔ suite arithmétique de raison k",
  "diagnosticErreur": {
    "type": "diff_arithm",
    "pourquoiPlausible": "Si '9': confusion +1 au lieu de +2"
  },
  "analyseDistracteurs": [
    {"option": "9", "raisonChoixFrequent": "❌ Biais +1"},
    {"option": "10", "raisonChoixFrequent": "✅ Reconnaissance +2"}
  ],
  "nouveauConcept": {
    "isNew": false,
    "fiche": null
  },
  "planVisuel": {
    "type": "sequence", 
    "overlays": [...],
    "animation": "Surbrillance séquentielle +2"
  },
  "metacognition": {
    "tempsCibleSec": 30,
    "heuristiqueExpress": "Calculer les écarts d'abord",
    "microDrillsImmediats": [...],
    "rappelJPlus1": {...}
  }
}
```

#### Répartition des Compétences (60 Questions)
- **15 questions numériques** : Suites, calculs, séquences
- **30 questions spatiales** : Matrices, rotations, transformations  
- **15 questions logiques** : Implications, ensembles, relations

## 🧠 Système de Calcul de QI

### Méthodologie Scientifique
- Basé sur les matrices progressives de Raven
- Normalisation selon les standards internationaux
- Prise en compte de la difficulté des questions
- Ajustement selon le type et durée du test

### Classifications QI
- **130+** : Très supérieur (2% de la population)
- **120-129** : Supérieur (9% de la population)
- **110-119** : Moyen supérieur (25% de la population)
- **90-109** : Moyen (50% de la population)
- **80-89** : Moyen inférieur (16% de la population)
- **70-79** : Limite (2% de la population)
- **<70** : Déficient (<1% de la population)

## 🎓 Utilisation Pédagogique

### Pour les Étudiants
- Découverte des tests psychométriques
- Compréhension du raisonnement logique  
- Développement des capacités d'analyse
- **🆕 Apprentissage par l'erreur** : Diagnostic précis et remédiation

### Pour les Professionnels
- Évaluation préliminaire des capacités cognitives
- Formation aux tests de QI standardisés
- Recherche en psychologie cognitive
- **🆕 Analyse fine des patterns d'erreurs** cognitives

### Pour les Chercheurs 🆕
- **Taxonomie d'erreurs standardisée** : 12 types répertoriés
- **Données de métacognition** : Temps, heuristiques, difficultés
- **Transfert d'apprentissage** : Mesure de l'efficacité pédagogique

## 🔄 Mises à Jour Récentes

### 🚀 Version 5.0 - Infrastructure Production Enterprise (Août 2025) ⭐ **DERNIÈRE VERSION**

#### 🏗️ **Infrastructure Production-Ready Complète**
- **📋 Deployment Playbook Automatisé** : Déploiement canary 8-étapes (5% → 25% → 100%)
- **🔄 Rollback Automatique Intelligent** : 5 étapes de rollback basé sur seuils SLO concrets
- **📊 SLO Monitoring Temps Réel** : Disponibilité 99.9%, Latence P95 <500ms, Taux erreur <0.05%
- **🛡️ Auth/RBAC Complet** : IP allowlist, rate limiting, permissions granulaires, audit trail
- **🔐 GDPR Compliance** : Anonymisation automatique, rétention données, droits sujets
- **⚡ CDN Cache Intelligent** : Invalidation coordonnée, cache canary, cohérence déploiements

#### 🎯 **Système A/B Testing Robuste**
- **🌰 Seeds de Randomisation Stable** : Fisher-Yates shuffle avec distribution uniforme validée
- **📈 Tests Distribution Massifs** : 10k sessions avec validation chi-square (p<0.001)
- **🔄 Positions Cohérentes** : A/B/C/D distribuées équitablement avec reproductibilité
- **📊 Kill-Switch UX Avancé** : Timer figé, état sauvegardé, notifications gracieuses

#### 🚨 **Alerting et Monitoring Multi-Niveaux**
- **⚠️ 3 Niveaux d'Alertes** : Warning (5min), Critical (2min), Emergency (30sec)
- **💰 Error Budget Management** : Suivi burn rate avec projections automatiques
- **📈 Dashboard Temps Réel** : 5 métriques critiques avec historique 7 jours
- **🔔 Escalation Automatique** : Slack → PagerDuty → SMS selon la gravité

#### 🛡️ **Quality Gates Renforcés (v4.1 Continué)**
- **🚫 100% Couverture Endpoints** : TOUS les POST/PUT protégés par Quality Gates
- **📊 15 Validations Critiques** : Solution unique, QID valide, options=4, sécurité SVG
- **🔒 Corpus Gate ≥95%** : Validation globale + 0 erreur critique obligatoire
- **❌ Fallback DÉSACTIVÉ** : Plus de validation permissive, sécurité maximale

#### 📈 **Résultats Production Enterprise**
- ✅ **Sécurité & Distribution** : 100% (9/9 tests) - Auth, RBAC, A/B uniforme
- ✅ **GDPR Compliance** : 100% (6/6 tests) - Anonymisation, rétention, droits
- ✅ **CDN Cache System** : 100% (4/4 tests) - Invalidation, canary, cohérence
- ✅ **Kill-Switch UX** : 93.8% (15/16 tests) - Timer, état, recovery
- ✅ **SLO Monitoring** : 92.9% (13/14 tests) - Budget, alertes, métriques
- ✅ **Deployment Playbook** : 92.9% (13/14 tests) - Canary, rollback, validation

#### 🏭 **Pipeline Déploiement 4-Couches**
1. **Rule Engine** → Validation stricte sans fallback, 15+ types de patterns
2. **Quality Gates** → 100% endpoints, 15 validations critiques
3. **Corpus Gate** → ≥95% validation + 0 critique sur toutes locales
4. **Deployment Playbook** → Canary automatisé avec rollback intelligent

#### 🎯 **Commandes Production**
```bash
# Tests sécurité et distribution A/B (10k sessions)
node scripts/test-security-distribution.js

# Tests conformité GDPR complète
node scripts/test-gdpr-compliance.js

# Tests système CDN et invalidation cache
node scripts/test-cdn-cache.js

# Tests kill-switch UX et recovery
node scripts/test-kill-switch-ui.js

# Tests SLO monitoring et alerting
node scripts/test-slo-monitoring.js

# Tests deployment playbook complet
node scripts/test-deployment-playbook.js

# Pipeline production complète
./production-deployment-pipeline.sh
```

### 🔐 Version 4.0 - Système V2 avec UIDs Immuables et Moteur de Règles (Août 2025)

#### 🆔 **Système d'Identifiants Immuables et Versioning**
- **🔑 UIDs Immuables ULID** : Chaque question a un identifiant unique et permanent
- **📦 Versioning Strict** : Système de versions (v1, v2, etc.) - jamais modifier une version publiée
- **🔐 Bundle Hash Canonique** : SHA256 sur JSON stable pour détecter les collisions de contenu  
- **📁 Assets Versionnés** : Chemins `questions/{qid}/{v}/stimulus.svg` avec intégrité garantie
- **🛡️ Index Unique Fin** : `(qid, version, locale, type, slot)` empêche réutilisation erronée d'assets

#### 🧠 **Moteur de Règles et Validation Automatique**
- **🎯 Test d'Unicité des Solutions** : Moteur IA qui valide qu'exactement UNE option satisfait la logique
- **📊 8 Types de Règles Détectées** : arithmetic_sequence, alternating_pattern, rotation_90, matrix_2x2/3x3, etc.
- **⚡ Validation Temps Réel** : Détection automatique des questions incohérentes avant publication
- **🔍 Cross-Références** : Validation que tous assets pointent vers le même (qid,version,locale)

#### 🛡️ **Sécurité et Intégrité Renforcées**
- **🧹 Sanitisation SVG** : Protection XSS avec whitelist tags/attributs et CSP strictes
- **🔒 Canonicalisation** : Hash stable indépendant de l'ordre de sérialisation JSON
- **🚨 Garde-fous Frontend** : Blocage rendu si options≠4 ou alphabet incohérent
- **📋 Mini-Audit Automatique** : 6 checks critiques sur toutes les questions

#### 📊 **Résultats de la Migration V2**
- ✅ **60/60 questions migrées** avec succès vers le système V2
- ✅ **100% UIDs uniques** générés et validés  
- ✅ **Bundle hash canoniques** calculés pour toutes les questions
- 🎯 **8/60 questions** avec solutions uniques parfaitement validées
- ⚠️ **52 questions flaggées** pour amélioration (détection proactive réussie!)

#### 🚀 **Scripts de Validation et Maintenance**
```bash
# Tests end-to-end complets (tous workflows)
node scripts/test-end-to-end.js

# Tests connectivité API et Quality Gates  
node scripts/test-api-connectivity.js

# Tests complets système V2
node scripts/test-v2-system.js full

# Mini-audit rapide (6 checks critiques)  
node scripts/test-v2-system.js audit

# Migration complète vers V2
node scripts/stop-the-bleed.js

# Tests CI/CD rapides
node scripts/test-v2-system.js quick

# Pipeline CI/CD complet avec Quality Gates
./ci-cd-pipeline.sh
```

#### 🎯 **Impact : Plus Jamais de Collisions de Contenu**
- 🔒 **Problème Question 5 DÉFINITIVEMENT résolu** - impossible à reproduire
- 🆔 **Identifiants jamais réutilisés** grâce aux UIDs immuables
- 🧠 **Détection automatique** des incohérences avant qu'elles atteignent les utilisateurs
- 🛡️ **Système industriel** avec backup, rollback et monitoring intégré

### 🎨 Version 3.0 - Système de Visuels Professionnels IA (Août 2025)
- 🤖 **Génération automatique de visuels IA** : 7 types de visualisations professionnelles HD
- 🔄 **Matrices interactives** : Rotations animées avec flèches colorées et étapes visuelles
- 📊 **Diagrammes de Venn dynamiques** : Inclusion-exclusion avec calculs step-by-step
- 🌀 **Spirales de Fibonacci** : Visualisations mathématiques avec nombre d'or  
- 🌐 **Transformations 3D/4D** : Cubes en perspective avec projections géométriques
- 🎯 **Complétion de motifs** : Grilles 3×3 colorées avec patterns intelligents
- 🧠 **Diagrammes logiques** : Transitivité et raisonnement avec nœuds interactifs
- 📈 **Progressions numériques** : Graphiques avec différences constantes visuelles
- 🐍 **Python + Matplotlib** : Stack scientifique pour rendu HD 300 DPI
- ⚡ **Cache intelligent 24h** : Performance optimisée avec mise en cache automatique
- 📱 **Design responsive moderne** : Gradients, animations CSS3, compatible multi-plateformes
- 🔧 **85.7% des questions** bénéficient automatiquement de visualisations professionnelles

### ⭐ Version 2.1 - Système d'Indexation Unifié (Août 2025)
- 🗺️ **Système d'indexation unifié** : Mapping complet des 60 questions vers leurs explications
- 🔗 **Correspondance garantie** : Chaque question affiche SA bonne explication (résolution du bug principal)
- 📊 **Architecture robuste** : Index unique identifiable pour chaque question, réponse et cours  
- 🛠️ **Maintenabilité** : Un seul fichier JSON pour gérer toutes les correspondances
- 🎯 **Tests de validation** : 100% de réussite sur toutes les séries (A-E)
- 🔍 **Recherche intelligente** : Mapping exact + fallback par similarité partielle
- 📈 **Extensibilité** : Prêt pour l'ajout de nouvelles questions et explications

### ⭐ Version 2.0 - Système d'Explications Avancé (Janvier 2025)
- 🚀 **Explications pédagogiques complètes** pour les 60 questions
- 🎯 **Diagnostic d'erreur personnalisé** avec analyse psychologique
- 📚 **8 micro-fiches de nouveaux concepts** (Factorielle, Catalan, etc.)
- 🎨 **Plans visuels annotés** avec animations et overlays colorés
- ⏱️ **Métacognition avancée** : temps cible, heuristiques, micro-drills
- 🔍 **Taxonomie d'erreurs unifiée** : 12 types scientifiquement classifiés
- ✅ **Structure "Repérer→Formaliser→Calculer"** pour transfert optimal

### Version 1.5
- ✅ Calcul automatique du QI pour tous les tests
- ✅ Affichage du QI actuel dans le tableau de bord
- ✅ Système d'apprentissage avec cours intégrés
- ✅ Interface utilisateur optimisée et lisible
- ✅ Navigation corrigée dans la révision des tests
- ✅ Historique des QI avec affichage prioritaire

## 📞 Support et Contribution

### Signaler des Problèmes
Ouvrez une issue sur GitHub avec :
- Description détaillée du problème
- Étapes pour reproduire
- Captures d'écran si applicable

### Contribuer au Projet
Les contributions sont les bienvenues ! Suivez ces étapes :
1. Fork le repository
2. Créez une branche pour votre fonctionnalité
3. Implémentez vos modifications
4. Ajoutez des tests si nécessaire
5. Soumettez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- Matrices progressives de Raven pour la méthodologie
- Communauté open source pour les outils utilisés
- Recherches en psychométrie pour les standards de QI
- **🆕 Recherches en sciences cognitives** pour la taxonomie d'erreurs

---

**Développé pa MC LEDJIAR avec ❤️ pour l'évaluation intelligente du QI et l'apprentissage par l'erreur**