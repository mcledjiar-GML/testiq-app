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

### 📚 Système d'Apprentissage Avancé
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
docker-compose up -d
```

### Accès à l'Application
- **Frontend** : http://localhost:3000
- **API Backend** : http://localhost:5000  
- **Base de données** : localhost:27017

### Commandes Utiles
```bash
# Démarrer l'application
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
├── docker-compose.yml     # Configuration Docker
└── README.md
```

### Base de Données
- **Users** : Profils utilisateur et historique des tests
- **Questions** : Questions Raven avec métadonnées (série, difficulté, etc.)
- **TestHistory** : Résultats détaillés avec réponses et calculs de QI

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

### Pour les Professionnels
- Évaluation préliminaire des capacités cognitives
- Formation aux tests de QI standardisés
- Recherche en psychologie cognitive

## 🔄 Mises à Jour Récentes

### Version Actuelle
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

---

**Développé avec ❤️ pour l'évaluation intelligente du QI**
