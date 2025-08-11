# 📋 MEMO : Procédure de correction d'une question Raven

*Guide complet pour corriger une question de test psychométrique - À consulter pour éviter les erreurs récurrentes*

---

## 🎯 **Contexte d'utilisation**

**Quand utiliser ce memo :**
- Corriger une question existante dans l'application TestIQ
- Problèmes d'affichage, timer, options manquantes
- Améliorer l'UX/accessibilité d'une question

**Technologies :**
- Backend : Node.js + Express + MongoDB + Mongoose
- Frontend : React + Docker
- Base : MongoDB avec collection `questions`

---

## 🔍 **Phase 1 : DIAGNOSTIC (Toujours commencer par là)**

### 1.1 Identifier la source du problème

```bash
# 1. Vérifier l'état des conteneurs
docker ps

# 2. Tester l'API directement
# Obtenir un token valide
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# 3. Tester l'endpoint /api/tests/start avec le token
curl -X POST http://localhost:5000/api/tests/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{"testType": "raven", "level": "short"}'
```

### 1.2 Vérifier la base de données

```bash
# Vérifier la question problématique en base
docker exec testiq-app-mongo-1 mongosh iq_test_db --eval "db.questions.findOne({series: 'A', questionIndex: 1})"
```

**⚠️ Points critiques à vérifier :**
- La question existe-t-elle en base avec les bonnes données ?
- L'API retourne-t-elle les mêmes données que la base ?
- Le schéma Mongoose correspond-il aux données stockées ?

---

## 🛠️ **Phase 2 : CORRECTIONS BACKEND**

### 2.1 Problème de schéma Mongoose

**Erreur courante :** API qui ne retourne pas certains champs

```javascript
// ❌ Problématique
const QuestionSchema = new mongoose.Schema({
  options: [String], // Ne supporte que les strings
});

// ✅ Solution
const QuestionSchema = new mongoose.Schema({
  options: [mongoose.Schema.Types.Mixed], // Support String ET Object
});
```

### 2.2 Mise à jour des données en base

```bash
# Corriger les données d'une question
docker exec testiq-app-mongo-1 mongosh iq_test_db --eval '
db.questions.updateOne(
  {series: "A", questionIndex: 1}, 
  {$set: {
    content: "Libellé corrigé",
    timeLimit: 60,
    options: [
      {text: "◐", alt: "demi-cercle noir à gauche", rotation: "left"},
      {text: "◓", alt: "demi-cercle noir en haut", rotation: "up"},
      {text: "◒", alt: "demi-cercle noir en bas", rotation: "down"},
      {text: "◑", alt: "demi-cercle noir à droite", rotation: "right"}
    ],
    correctAnswer: 1
  }}
)'

# Toujours redémarrer après modification du schéma
docker restart testiq-app-backend-1
```

---

## ⚛️ **Phase 3 : CORRECTIONS FRONTEND**

### 3.1 Gestion robuste du state et timer

**Problème récurrent :** Timer figé, options non affichées

```javascript
// ✅ Solution complète
import React, { useState, useEffect, useMemo } from 'react';

function Test() {
  const [ready, setReady] = useState(false);
  
  // Mapping des options (compatibilité ancien/nouveau format)
  const currentOptions = useMemo(() => {
    const currentQ = questions[currentQuestion];
    return currentQ?.options ?? currentQ?.choices ?? [];
  }, [questions, currentQuestion]);

  // Ready = exactement 4 options
  useEffect(() => {
    if (currentOptions.length === 4 && !loading) {
      setReady(true);
    } else {
      setReady(false);
    }
  }, [currentOptions, loading]);

  // Timer ne démarre QUE quand ready=true
  useEffect(() => {
    if (!ready) return; // Garde-fou principal
    
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleAnswer(-1);
    }
  }, [timeLeft, ready]);

  // Reset à chaque changement de question
  useEffect(() => {
    setReady(false);
    setShowHint(false);
    setHintUsed(false);
  }, [currentQuestion]);
}
```

### 3.2 Garde-fou UI pour questions invalides

```javascript
// Garde-fou : question sans 4 options
if (currentOptions.length !== 4 && !loading) {
  console.error('ERREUR: Question sans options valides!', {
    questionId: questions[currentQuestion]?._id,
    optionsCount: currentOptions.length,
    currentOptions: currentOptions
  });

  return (
    <div className="test-container">
      <h2>⚠️ Question indisponible</h2>
      <p style={{background: '#fff3cd', padding: '15px', borderRadius: '8px'}}>
        Cette question est temporairement indisponible (options manquantes).
      </p>
      <button onClick={() => handleAnswer(-1)}>
        Passer à la question suivante
      </button>
    </div>
  );
}
```

### 3.3 Rendu des options avec compatibilité

```javascript
// Support format ancien ET nouveau
{currentOptions.map((option, index) => {
  const optionText = typeof option === 'string' ? option : option.text;
  const optionAlt = typeof option === 'object' && option.alt ? option.alt : `Option ${index + 1}`;
  const optionRotation = typeof option === 'object' && option.rotation ? option.rotation : null;
  
  const isRotationQuestion = questions[currentQuestion]?.series === 'A' && questions[currentQuestion]?.questionIndex === 1;
  
  return (
    <button key={index} onClick={() => handleAnswer(index)} aria-label={optionAlt}>
      {isRotationQuestion && optionRotation ? (
        <SemicircleSVG rotation={optionRotation} size={56} alt={optionAlt} />
      ) : (
        optionText
      )}
    </button>
  );
})}
```

---

## 🎨 **Phase 4 : COMPOSANTS VISUELS**

### 4.1 SVG robuste pour formes géométriques

```javascript
// SemicircleSVG.js - Rendu identique cross-device
const SemicircleSVG = ({ rotation, size = 56, alt }) => {
  const rotations = {
    'up': 0,     'right': 90,
    'down': 180, 'left': 270
  };

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={alt}>
      <defs>
        <clipPath id={`semicircle-${rotation}-${size}`}>
          <rect x="0" y="0" width="100" height="50" />
        </clipPath>
      </defs>
      <g transform={`rotate(${rotations[rotation] || 0} 50 50)`}>
        <circle cx="50" cy="50" r="35" fill="#000000" 
                clipPath={`url(#semicircle-${rotation}-${size})`} 
                stroke="#000000" strokeWidth="3" />
      </g>
    </svg>
  );
};
```

### 4.2 Composant de séquence avec indice

```javascript
const RotationSequence = ({ showHint, onHintClick }) => (
  <div style={{background: '#ffffff', padding: '24px', borderRadius: '12px'}}>
    {/* Bouton indice sans overlay bloquant */}
    {!showHint && (
      <div style={{textAlign: 'center', marginBottom: '16px', zIndex: 1}}>
        <button onClick={onHintClick} style={{pointerEvents: 'auto'}}>
          💡 Voir un indice (−10% du score)
        </button>
      </div>
    )}
    
    {showHint && (
      <div style={{background: '#f0f2ff', padding: '12px'}}>
        💡 La forme tourne de 90° vers la droite à chaque étape
      </div>
    )}
    
    {/* Séquence visuelle avec flèches */}
    <div style={{display: 'flex', alignItems: 'center', gap: '24px'}}>
      {sequence.map((item, index) => (
        <div key={index}>
          <SemicircleSVG rotation={item.rotation} size={64} alt={item.alt} />
          {index < sequence.length - 1 && <span>→</span>}
        </div>
      ))}
      <span>→</span>
      <div style={{border: '3px dashed #000', borderRadius: '50%'}}>?</div>
    </div>
  </div>
);
```

---

## 🔄 **Phase 5 : DÉPLOIEMENT**

### 5.1 Séquence de redémarrage

```bash
# 1. Redémarrer backend si schéma modifié
docker restart testiq-app-backend-1

# 2. Attendre que backend soit prêt
timeout 15 sh -c 'until docker logs testiq-app-backend-1 2>&1 | grep -q "Serveur TestIQ démarré"; do sleep 1; done'

# 3. Redémarrer frontend si code React modifié
docker restart testiq-app-frontend-1

# 4. Attendre que frontend soit compilé
timeout 20 sh -c 'until docker logs testiq-app-frontend-1 2>&1 | grep -q "webpack compiled successfully"; do sleep 1; done'
```

### 5.2 Validation finale

```bash
# Test complet de l'API
curl -s -X POST http://localhost:5000/api/tests/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [TOKEN]" \
  -d '{"testType": "raven", "level": "short"}' | head -c 800
```

---

## ⚠️ **PIÈGES À ÉVITER**

### Backend
- ❌ Modifier les données en base sans adapter le schéma Mongoose
- ❌ Oublier de redémarrer après changement de schéma
- ❌ Utiliser `[String]` pour des objets complexes

### Frontend  
- ❌ Timer qui démarre avant le chargement des options
- ❌ Pas de garde-fou pour questions invalides
- ❌ Oublier la compatibilité ancien/nouveau format
- ❌ Overlays avec `pointer-events` qui bloquent les clics

### UX/Accessibilité
- ❌ Glyphes Unicode au lieu de SVG (rendu variable)
- ❌ Manque d'alt-text sur les éléments visuels
- ❌ Touch targets < 44px sur mobile

---

## 🎯 **CHECKLIST DE VALIDATION**

- [ ] API retourne bien les données de la question
- [ ] 4 options exactement dans la réponse  
- [ ] Timer démarre uniquement quand ready=true
- [ ] Options cliquables avec bonne accessibilité
- [ ] Garde-fou UI si question invalide
- [ ] SVG rendus identiques sur tous devices
- [ ] Logs de debug retirés en production

---

## 📞 **EN CAS DE PROBLÈME**

1. **Toujours vérifier l'API en premier** (curl)
2. **Comparer base vs API** si incohérence  
3. **Logs des conteneurs** pour erreurs runtime
4. **Console navigateur** pour erreurs frontend
5. **Se référer à ce memo** avant de réinventer

 Emplacement : C:\Users\mc_le\Documents\testiq-app\docs\memo-correction-questions.md

  Avantages de cet emplacement :
  - ✅ Dans votre projet (avec le code)
  - ✅ Versionné avec Git (si vous faites des commits)
  - ✅ Accessible facilement depuis votre IDE
  - ✅ Partageable avec votre équipe

  🚀 Comment l'utiliser dans un autre chat :

  1. Copiez le contenu du fichier :
  code docs/memo-correction-questions.md
  2. Dans votre nouveau chat, écrivez :
  "J'ai un problème avec une question dans mon app TestIQ. Voici le memo de procédure qui avait bien        
  fonctionné la dernière fois : [coller le contenu]"
  3. Claude pourra suivre exactement cette procédure éprouvée


*Memo créé suite à la correction réussie de la Question 1 Raven - Bug d'intégration résolu*