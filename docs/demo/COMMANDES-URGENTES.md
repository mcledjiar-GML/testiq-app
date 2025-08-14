# ⚡ COMMANDES URGENTES - TestIQ Démo

## 🚀 **DÉMARRAGE ULTRA-RAPIDE**

### **Tout en une commande (copier-coller) :**
```powershell
cd C:\Users\mc_le\Documents\testiq-app; docker-compose up -d mongo; Start-Sleep 30; npm run seed:demo; npm run demo:up
```

### **Si Docker pas encore démarré :**
```powershell
# 1. Démarrer Docker Desktop manuellement (icône bureau)
# 2. Attendre 2-3 minutes
# 3. Puis lancer la commande ci-dessus
```

---

## 🔥 **URGENCE - PENDANT DÉMO CLIENT**

### **Redémarrage rapide si problème :**
```powershell
npm run demo:down; Start-Sleep 5; npm run demo:up
```

### **Si tout plante, restart complet :**
```powershell
pkill -f "npm run"; docker-compose down; docker-compose up -d mongo; Start-Sleep 30; npm run seed:demo; npm run demo:up
```

### **API ne répond plus :**
```powershell
kill-port 5000; npm run api:demo
```

### **Frontend ne charge pas :**
```powershell
kill-port 3000; npm run web:demo
```

---

## 🌐 **TUNNELS CLOUDFLARE**

### **Recréer tunnels si URLs mortes :**
```powershell
# Terminal 2 :
cloudflared tunnel --url http://localhost:3000

# Terminal 3 :
cloudflared tunnel --url http://localhost:5000
```

### **Configurer nouvelles URLs rapidement :**
```powershell
# Remplacer YOUR_FRONT_URL et YOUR_API_URL par les vraies URLs
(Get-Content .env.demo) -replace '<FRONT_TUNNEL_URL>', 'YOUR_FRONT_URL' | Set-Content .env.demo
echo "REACT_APP_API_BASE=YOUR_API_URL" > frontend/.env.local
npm run api:demo
```

---

## 🛡️ **VÉRIFICATIONS EXPRESS**

### **Status santé :**
```powershell
npm run check:demo
```

### **MongoDB OK :**
```powershell
docker ps | findstr mongo
```

### **Ports libres :**
```powershell
netstat -an | findstr ":3000 :5000"
```

### **Logs en direct :**
```powershell
docker logs -f testiq-app_mongo_1
```

---

## 🆘 **SOS - DÉMO EN DANGER**

### **KILL SWITCH TOTAL :**
```powershell
pkill -f "npm"; pkill -f "cloudflared"; docker-compose down; echo "DÉMO ARRÊTÉE"
```

### **RESTART DEPUIS ZÉRO :**
```powershell
cd C:\Users\mc_le\Documents\testiq-app
docker-compose down
docker-compose up -d mongo
Start-Sleep 30
npm run seed:demo
npm run demo:up
echo "Créer 2 nouveaux tunnels cloudflared maintenant !"
```

---

## 📞 **SUPPORT CLIENT EN DIRECT**

### **Infos à donner au client si problème :**
- "Redémarrage technique en cours - 2 minutes"
- "Nouvelle URL en préparation"
- "TestIQ fonctionne en local, synchronisation tunnel"

### **URLs de secours locales :**
- http://localhost:3000 (si tunnels morts)
- http://localhost:5000/health (vérif API)

---

## 💾 **BACKUP EXPRESS**

### **Sauver état avant manip risquée :**
```powershell
copy .env.demo .env.demo.backup.$(Get-Date -Format "yyyyMMdd-HHmmss")
docker exec testiq-app_mongo_1 mongodump --db testiq_demo --out /backup
```

---

## 🎯 **CONTACT D'URGENCE**

En cas de panique totale pendant démo :

1. **KILL SWITCH** → Arrêter tout
2. **Dire au client** : "Problème technique, on redémarre"  
3. **Lancer RESTART DEPUIS ZÉRO**
4. **2 minutes** → Nouveaux tunnels → **Nouvelle démo**

**Respirer. Ça va marcher. 💪**