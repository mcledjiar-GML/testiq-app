# 🚀 Guide Démarrage Après Redémarrage PC - TestIQ Démo

## 📋 **ÉTAPES EXACTES - COPIER-COLLER**

### 1️⃣ **DÉMARRER DOCKER DESKTOP**
```
👆 Cliquer sur l'icône Docker Desktop dans la barre des tâches
OU
👆 Cliquer Start → Taper "Docker Desktop" → Entrée
```
**⏳ Attendre** que Docker affiche "Docker Desktop is running" (≈2-3 minutes)

### 2️⃣ **OUVRIR POWERSHELL**
```
👆 Clic droit sur Start → Windows PowerShell (Admin)
OU
👆 Touche Windows + X → Windows PowerShell (Admin)
```

### 3️⃣ **NAVIGUER VERS LE PROJET**
```powershell
cd C:\Users\mc_le\Documents\testiq-app
```

### 4️⃣ **VÉRIFIER DOCKER PRÊT**
```powershell
docker --version
```
**✅ Résultat attendu :** `Docker version XX.X.X, build XXXXXXX`

### 5️⃣ **DÉMARRER MONGODB**
```powershell
docker-compose up -d mongo
```
**✅ Résultat attendu :** `Creating testiq-app_mongo_1 ... done`

### 6️⃣ **ATTENDRE MONGODB PRÊT (30 SECONDES)**
```powershell
Start-Sleep 30
```

### 7️⃣ **VÉRIFIER MONGODB**
```powershell
docker ps | findstr mongo
```
**✅ Résultat attendu :** Ligne avec `mongo:5` et `Up X seconds`

### 8️⃣ **INITIALISER BASE DÉMO**
```powershell
npm run seed:demo
```
**✅ Résultat attendu :** `🎉 [SEED] Seed démo terminé avec succès !`

### 9️⃣ **LANCER L'APPLICATION DÉMO**
```powershell
npm run demo:up
```
**✅ Résultat attendu :** 
```
=== OUVRE 2 TERMINAUX SEPARES POUR LES TUNNELS CLOUDFLARED ===
> cloudflared tunnel --url http://localhost:3000
> cloudflared tunnel --url http://localhost:5000

[API] 🚀 Serveur API démarré sur port 5000
[WEB] webpack compiled successfully
```

### 🔟 **OUVRIR 2 NOUVEAUX TERMINAUX POWERSHELL**

#### Terminal 2 (Front Tunnel) :
```powershell
cd C:\Users\mc_le\Documents\testiq-app
cloudflared tunnel --url http://localhost:3000
```
**📝 Noter l'URL :** `https://xyz-abc-def.trycloudflare.com` = **FRONT_TUNNEL_URL**

#### Terminal 3 (API Tunnel) :
```powershell
cd C:\Users\mc_le\Documents\testiq-app
cloudflared tunnel --url http://localhost:5000
```
**📝 Noter l'URL :** `https://api-123-456.trycloudflare.com` = **API_TUNNEL_URL**

### 1️⃣1️⃣ **CONFIGURER LES URLS TUNNELS**

#### Dans le Terminal 1 (principal), mettre à jour CORS :
```powershell
# Remplacer <FRONT_TUNNEL_URL> par votre vraie URL tunnel front
(Get-Content .env.demo) -replace '<FRONT_TUNNEL_URL>', 'https://xyz-abc-def.trycloudflare.com' | Set-Content .env.demo
```

#### Configurer l'API pour React :
```powershell
# Remplacer <API_TUNNEL_URL> par votre vraie URL tunnel API
echo "REACT_APP_API_BASE=https://api-123-456.trycloudflare.com" > frontend/.env.local
```

### 1️⃣2️⃣ **REDÉMARRER L'API (Terminal 1)**
```powershell
# Arrêter l'API (Ctrl+C dans le terminal)
# Puis relancer pour appliquer le nouveau CORS :
npm run api:demo
```

### 1️⃣3️⃣ **VALIDATION FINALE**
```powershell
npm run check:demo
```
**✅ Résultat attendu :** `🎉 Validation réussie ! La démo est prête.`

---

## 🌐 **URLS DE DÉMO PRÊTES**

### **À partager avec le client :**
- **Application Web :** `https://xyz-abc-def.trycloudflare.com`
- **API Santé :** `https://api-123-456.trycloudflare.com/health`

### **Comptes de démonstration :**
- **Principal :** demo@testiq.com / demo123
- **Test :** client@example.com / client123

---

## 🛑 **ARRÊT PROPRE APRÈS DÉMO**

### Dans les 3 terminaux PowerShell :
```powershell
# Terminals 2 & 3 (tunnels) : Ctrl+C
# Terminal 1 (app) : Ctrl+C puis :
npm run demo:down
```

### Arrêter MongoDB si souhaité :
```powershell
docker-compose down mongo
```

---

## 🚨 **DÉPANNAGE RAPIDE**

### ❌ "Docker not found"
```powershell
# Vérifier Docker Desktop ouvert dans la barre des tâches
# Redémarrer Docker Desktop si nécessaire
```

### ❌ "Port 5000 already in use"
```powershell
kill-port 5000
npm run api:demo
```

### ❌ "MongoDB connection failed"
```powershell
docker-compose down mongo
docker-compose up -d mongo
Start-Sleep 30
npm run seed:demo
```

### ❌ "CORS Error" dans le navigateur
```powershell
# Vérifier .env.demo contient la bonne URL tunnel
Get-Content .env.demo | findstr CORS_ALLOWED_ORIGIN
# Doit afficher votre FRONT_TUNNEL_URL exacte
```

---

## ⚡ **COMMANDES ULTRA-RAPIDES**

### **Démarrage complet en une fois :**
```powershell
# Copier-coller tout d'un coup :
cd C:\Users\mc_le\Documents\testiq-app; docker-compose up -d mongo; Start-Sleep 30; npm run seed:demo; npm run demo:up
```

### **En cas de redémarrage d'urgence :**
```powershell
npm run demo:down; Start-Sleep 5; npm run demo:up
```

---

## 📊 **CHECKLIST DÉMARRAGE**

- [ ] ✅ Docker Desktop ouvert et running
- [ ] ✅ PowerShell ouvert en Admin
- [ ] ✅ Dans le bon répertoire (`testiq-app`)
- [ ] ✅ MongoDB démarré (`docker ps | findstr mongo`)
- [ ] ✅ Base seed OK (`🎉 Seed démo terminé`)
- [ ] ✅ App lancée (`npm run demo:up`)
- [ ] ✅ 2 tunnels créés (Front + API)
- [ ] ✅ URLs configurées (.env.demo + .env.local)
- [ ] ✅ API redémarrée (nouveau CORS)
- [ ] ✅ Validation OK (`npm run check:demo`)

## 🎯 **RÉSULTAT FINAL**

**Temps total :** 5-10 minutes  
**URLs démo :** Tunnels Cloudflare publics  
**Coût :** 0€  
**Durée :** 24h par session  

**🚀 DÉMO TESTIQ PRÊTE POUR CLIENT ! 🚀**

---

## 💡 **MÉMO POUR LA PROCHAINE FOIS**

1. **Docker Desktop** → **PowerShell Admin** → **Projet**
2. **`docker-compose up -d mongo`** → **`npm run seed:demo`**
3. **`npm run demo:up`** → **2 tunnels cloudflared**
4. **Configurer URLs** → **Redémarrer API** → **`check:demo`**
5. **Partager FRONT_TUNNEL_URL** avec client

**C'est tout ! 🎉**