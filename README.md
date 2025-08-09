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

### 🎓 Système d'Explications Pédagogiques Avancé ⭐ **NOUVEAU**

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

### Infrastructure
- **Docker** : Conteneurisation complète
- **Docker Compose** : Orchestration des services
- **MongoDB Atlas** : Base de données cloud (optionnel)

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
│   │   │   └── Login.js        # Authentification
│   │   └── App.js          # Composant principal
│   └── package.json
├── backend/                # Serveur Node.js
│   ├── server.js          # Serveur principal
│   ├── iq_calculator.js   # Système de calcul de QI
│   └── raven_questions.js # Base de questions Raven
├── explanations_audit_corrected.json  # 🆕 Explications pédagogiques (60 questions)
├── docker-compose.yml     # Configuration Docker
└── README.md
```

### Base de Données
- **Users** : Profils utilisateur et historique des tests
- **Questions** : Questions Raven avec métadonnées (série, difficulté, etc.)
- **TestHistory** : Résultats détaillés avec réponses et calculs de QI
- **Explanations** 🆕 : Base d'explications pédagogiques avec diagnostic d'erreurs

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

**Développé avec ❤️ pour l'évaluation intelligente du QI et l'apprentissage par l'erreur**