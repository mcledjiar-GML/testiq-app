# 📚 MongoDB Configuration - Guide Complet

## 🎯 **Configuration Actuelle**

### **Stratégie de Fallback Intelligente**
```
1️⃣ MongoDB Externe (si configuré) 
    ↓ (si échec)
2️⃣ MongoDB en Mémoire (local automatique)
    ↓ (si échec)  
3️⃣ Crash de l'application
```

### **Code de Configuration** (`server.js:46-68`)
```javascript
const connectDB = async () => {
  try {
    // 1️⃣ Essayer MongoDB externe d'abord
    if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('localhost')) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
      });
      console.log('✅ MongoDB externe connecté');
      return;
    }
    
    // 2️⃣ Fallback: MongoDB en mémoire
    console.log('🔄 Démarrage MongoDB en mémoire...');
    const memoryUri = await startMongoDB();
    console.log('✅ MongoDB en mémoire prêt:', memoryUri);
    
  } catch (err) {
    console.log('❌ Erreur de connexion MongoDB:', err.message);
    process.exit(1);
  }
};
```

---

## 🗄️ **Types de MongoDB Disponibles**

### **1. MongoDB Externe (Production/Cloud)**
- **URI:** `mongodb+srv://user:pass@cluster.mongodb.net/db`
- **Avantages:** Persistance permanente, haute disponibilité
- **Inconvénients:** Nécessite connexion internet, peut avoir des quotas
- **Usage:** Production, développement avec données partagées

### **2. MongoDB en Mémoire (Local)**
- **URI:** `mongodb://127.0.0.1:PORT_DYNAMIQUE/` (ex: `mongodb://127.0.0.1:64308/`)
- **Avantages:** Toujours disponible, rapide, pas de quota
- **Inconvénients:** Données perdues au redémarrage
- **Usage:** Développement local, tests

### **3. MongoDB Docker (Optionnel)**
- **URI:** `mongodb://localhost:27017/db`
- **Avantages:** Persistance locale, isolé
- **Inconvénients:** Nécessite Docker Desktop
- **Usage:** Développement avec persistance locale

---

## 🐳 **Problème de Quota Docker**

### **Pourquoi le Quota Docker est Limité?**

#### **Docker Desktop - Limites Gratuites**
- **Containers simultanés:** ~3-5 containers (dépend de la RAM)
- **Images stockées:** ~2-10 GB d'espace disque
- **CPU/RAM:** Partagé avec le système hôte
- **Réseau:** Limité par la configuration WSL2/Hyper-V

#### **Message d'Erreur Typique**
```
Error: Service quota exceeded
Failed to get a worker: access denied
```

### **Causes Principales**
1. **Trop de containers actifs** - Docker Desktop limite le nombre
2. **Espace disque insuffisant** - Images Docker volumineuses
3. **RAM insuffisante** - Containers consomment la mémoire
4. **Processus Docker corrompus** - Nécessite redémarrage

---

## 🔧 **Solutions aux Limites Docker**

### **1. Gestion des Containers**
```bash
# Voir tous les containers
docker ps -a

# Arrêter tous les containers
docker stop $(docker ps -aq)

# Supprimer containers inutiles
docker container prune

# Supprimer images inutiles  
docker image prune -a
```

### **2. Libérer de l'Espace**
```bash
# Nettoyage complet Docker
docker system prune -a --volumes

# Voir l'utilisation
docker system df
```

### **3. Applications Multiples**

#### **❌ Problème:** Plusieurs apps en simultané
```bash
# App 1 utilise ports 3000, 5000, 27017
docker-compose up testiq-app

# App 2 CONFLIT - mêmes ports
docker-compose up autre-app  # ❌ ECHEC
```

#### **✅ Solution:** Ports différents
```yaml
# docker-compose.app1.yml
services:
  frontend:
    ports: ["3000:3000"]
  backend: 
    ports: ["5000:5000"]
  mongo:
    ports: ["27017:27017"]

# docker-compose.app2.yml  
services:
  frontend:
    ports: ["3001:3000"]  # Port différent
  backend:
    ports: ["5001:5000"]  # Port différent
  mongo:
    ports: ["27018:27017"] # Port différent
```

---

## 🚦 **Stratégies de Développement**

### **Approche 1: Une App à la Fois**
```bash
# Arrêter tout
docker-compose down

# Démarrer app 1
cd /projet1 && docker-compose up

# Changer d'app
docker-compose down
cd /projet2 && docker-compose up
```

### **Approche 2: Ports Séparés** 
```bash
# App 1 sur ports 3000/5000/27017
docker-compose -f docker-compose.app1.yml up

# App 2 sur ports 3001/5001/27018  
docker-compose -f docker-compose.app2.yml up
```

### **Approche 3: MongoDB Partagé**
```bash
# MongoDB central
docker run -d --name shared-mongo -p 27017:27017 mongo

# App 1 se connecte à shared-mongo
MONGODB_URI=mongodb://localhost:27017/app1_db

# App 2 se connecte à shared-mongo  
MONGODB_URI=mongodb://localhost:27017/app2_db
```

---

## 🎯 **Configuration Recommandée TestIQ**

### **Développement Local**
```env
# .env
MONGODB_URI=mongodb://localhost:27017/iq_test_db
```
- **Si Docker disponible:** Utilise MongoDB Docker
- **Si Docker indisponible:** Fallback MongoDB en mémoire automatique

### **Production**
```env
# .env.production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/iq_test_db
```

### **Tests**
```env  
# .env.test
MONGODB_URI=mongodb://localhost:27017/iq_test_test_db
```

---

## 🛠️ **Commandes de Diagnostic**

### **Vérifier Docker**
```bash
# Status Docker
docker info

# Espace utilisé
docker system df

# Containers actifs
docker ps

# Logs containers
docker logs container_name
```

### **Vérifier MongoDB**
```bash
# Test connexion
curl http://localhost:5000/health

# Logs backend
npm run dev

# Base de données
mongo mongodb://localhost:27017/iq_test_db
```

---

## 🎓 **Résumé Cours Instructif**

### **Points Clés à Retenir**

1. **Fallback Intelligent** - TestIQ essaie MongoDB externe puis local automatiquement
2. **Docker Limité** - Quota containers/RAM/espace selon machine
3. **Solutions Multiples** - Ports différents ou alternance d'apps
4. **MongoDB en Mémoire** - Solution robuste pour développement local
5. **Configuration Flexible** - Adaptation automatique selon environnement

### **Best Practices**
- ✅ Toujours avoir un fallback MongoDB
- ✅ Utiliser des ports différents pour plusieurs apps  
- ✅ Nettoyer Docker régulièrement
- ✅ Monitorer l'espace disque et RAM
- ✅ Documenter les ports utilisés par projet

**Avec cette configuration, TestIQ fonctionne toujours, même sans Docker! 🚀**