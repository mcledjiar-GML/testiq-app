# 🚀 Modes d'Utilisation TestIQ - Guide Complet

## 📖 Vue d'ensemble

TestIQ propose **2 modes distincts** pour différents cas d'usage :

1. **Mode Production/Développement** - Application complète avec toutes les fonctionnalités
2. **Mode Démo** - Version simplifiée pour démonstrations et tests publics

---

## 🔧 Mode Production/Développement

### Configuration
- **Fichier** : `.env`
- **Base de données** : `iq_test_db`
- **Authentification** : Requise
- **Fonctionnalités** : Complètes

### Ports
```
Backend API  : http://localhost:5000
Frontend     : http://localhost:3000
```

### Démarrage
```bash
# Installation complète
npm run install:all

# Démarrage classique
npm start

# Ou séparément
npm --prefix backend run dev    # API sur port 5000
npm --prefix frontend run start # Frontend sur port 3000
```

### Caractéristiques
- ✅ Authentification JWT complète
- ✅ Toutes les fonctionnalités activées
- ✅ Rate limiting : 100 requêtes
- ✅ Monitoring complet
- ✅ Base de données persistante

---

## 🎯 Mode Démo

### Configuration
- **Fichier** : `.env.demo`
- **Base de données** : `testiq_demo` (séparée)
- **Authentification** : Désactivée
- **Fonctionnalités** : Limitées et sécurisées

### Ports
```
Backend API  : http://localhost:4000
Frontend     : http://localhost:5173
```

### Démarrage
```bash
# Prérequis : MongoDB via Docker
docker-compose up -d mongo

# Attendre 30 secondes puis
npm run seed:demo    # Données de démonstration
npm run demo:up      # Démarrage complet
```

### Méthodes d'Accès

#### 1. **Accès Local (Navigateur)**
- ✅ **Simple** : Ouvrir directement dans le navigateur
- ✅ **Gratuit** : Aucun service externe requis
- ❌ **Local uniquement** : Seul votre ordinateur peut y accéder

```
Frontend : http://localhost:5173
API      : http://localhost:4000
```

#### 2. **Accès Externe (Tunnels Cloudflare)**
- ✅ **Partage mondial** : URLs publiques générées
- ✅ **Démo publique** : Montrer à d'autres personnes
- ❌ **Plus complexe** : Requiert 2 terminaux PowerShell séparés

```bash
# Terminal PowerShell #1 (nouvelle fenêtre)
cloudflared tunnel --url http://localhost:5173

# Terminal PowerShell #2 (autre nouvelle fenêtre)  
cloudflared tunnel --url http://localhost:4000
```

**Résultat** : Vous obtenez des URLs comme `https://abc123.trycloudflare.com`

### Caractéristiques
- ❌ Authentification désactivée (`AUTH_REQUIRED=false`)
- 🔒 Routes admin bloquées (`DISABLE_ADMIN_ROUTES=true`)
- 📊 Rate limiting réduit : 50 requêtes/15min
- 🚫 Import en masse désactivé
- ✅ Export autorisé
- 🌐 Compatible tunnels Cloudflare

---

## ⚠️ Éviter les Conflits

### 🚨 Problème Courant : Conflit de Ports

**Symptôme** : `Error: listen EADDRINUSE: address already in use`

**Cause** : Les deux modes tentent d'utiliser le même port

### ✅ Solutions

#### 1. **Vérifier les Processus Actifs**
```bash
# Windows
netstat -ano | findstr :5000
netstat -ano | findstr :4000

# Identifier le processus
powershell "Get-Process -Id [PID]"
```

#### 2. **Arrêter Proprement**
```bash
# Arrêt du mode normal
Ctrl+C dans les terminaux

# Arrêt du mode démo
npm run demo:down
```

#### 3. **Kill Forcé (si nécessaire)**
```bash
# Windows
taskkill /F /PID [PID]

# Ou kill tous les ports
npx kill-port 3000 4000 5000 5173
```

### 📋 Règles de Bonne Pratique

1. **Un seul mode à la fois** - Ne jamais lancer les deux simultanément
2. **Vérifier avant démarrage** - Contrôler que les ports sont libres
3. **Arrêt propre** - Toujours utiliser Ctrl+C ou les scripts d'arrêt
4. **Base de données** - Chaque mode a sa propre base (pas de conflit)

---

## 🔍 Diagnostic et Dépannage

### Vérifier l'État Actuel
```bash
# Ports utilisés
netstat -ano | findstr ":3000 :4000 :5000 :5173"

# Processus Node.js actifs
powershell "Get-Process node"

# État Docker MongoDB
docker ps | findstr mongo
```

### Tests de Connectivité
```bash
# Mode Production
curl http://localhost:5000/health
curl http://localhost:3000

# Mode Démo  
curl http://localhost:4000/health
curl http://localhost:5173
```

### Logs Utiles
```bash
# Mode Production
# Voir les terminaux backend/frontend

# Mode Démo
# Logs API : Terminal marqué [API]
# Logs Web : Terminal marqué [WEB]
```

---

## 📊 Comparaison Détaillée

| Caractéristique | Production | Démo |
|------------------|------------|------|
| **Ports** | 5000 + 3000 | 4000 + 5173 |
| **Base de données** | `iq_test_db` | `testiq_demo` |
| **Authentification** | ✅ Requise | ❌ Désactivée |
| **Routes Admin** | ✅ Actives | ❌ Bloquées |
| **Rate Limiting** | 100 req | 50 req |
| **Import Masse** | ✅ Activé | ❌ Désactivé |
| **Export** | ✅ Activé | ✅ Activé |
| **Tunnels** | ❌ Non requis | ✅ Cloudflare |
| **Logs** | Complets | Minimaux |
| **Sécurité** | Standard | Renforcée |

---

## 🎯 Cas d'Usage

### Mode Production
- Développement local
- Tests complets
- Déploiement production
- Accès aux fonctionnalités admin

### Mode Démo
- Démonstrations publiques
- Tests sans authentification
- Partage via tunnels
- Environnement sécurisé pour visiteurs

---

## 🚀 Commandes de Référence

```bash
# === MODE PRODUCTION ===
npm start                     # Démarrage complet
npm --prefix backend run dev  # Backend seul
npm --prefix frontend run start # Frontend seul

# === MODE DÉMO ===
npm run demo:up              # Démarrage complet démo
npm run demo:down            # Arrêt démo
npm run seed:demo            # Données démo
npm run check:demo           # Vérification démo

# === UTILITAIRES ===
npm run install:all          # Installation complète
npx kill-port 3000 4000 5000 5173  # Nettoyer les ports
docker-compose up -d mongo   # MongoDB seul
```

---

> 💡 **Conseil** : Toujours vérifier que les ports sont libres avant de démarrer un mode, et utiliser un seul mode à la fois pour éviter les conflits.