# 📁 Documentation Démo TestIQ

## 🗂️ **INDEX DES GUIDES DÉMO**

### 🚀 **Guides Principaux**
- **[GUIDE-DEMARRAGE-APRES-PC.md](GUIDE-DEMARRAGE-APRES-PC.md)** - **⭐ Guide principal** - Étapes exactes après redémarrage PC
- **[COMMANDES-URGENTES.md](COMMANDES-URGENTES.md)** - **🆘 SOS** - Commandes rapides d'urgence pendant démo
- **[SECURITY-AUDIT-FINAL.md](SECURITY-AUDIT-FINAL.md)** - **🛡️ Sécurité** - Checklist audit pré-démo

### 📊 **Guides Techniques**
- **[../GUIDE-LANCEMENT-COMPLET-DEMO.md](../GUIDE-LANCEMENT-COMPLET-DEMO.md)** - Guide maître technique détaillé
- **[../DATABASE-OPTIONS-EVOLUTION.md](../DATABASE-OPTIONS-EVOLUTION.md)** - Options base de données
- **[../RESTE-A-FAIRE.md](../RESTE-A-FAIRE.md)** - Suivi progression (100% terminé)

## 🎯 **UTILISATION RAPIDE**

### **Après redémarrage PC :**
```bash
# Ouvrir ce guide et suivre les étapes 1-13
cat docs/demo/GUIDE-DEMARRAGE-APRES-PC.md
```

### **Pendant démo client :**
```bash  
# Avoir ce guide ouvert en secours
cat docs/demo/COMMANDES-URGENTES.md
```

### **Démarrage ultra-rapide :**
```bash
cd C:\Users\mc_le\Documents\testiq-app
docker-compose up -d mongo; Start-Sleep 30; npm run seed:demo; npm run demo:up
```

## 📋 **CONFIGURATION DÉMO**

### **Architecture :**
- **MongoDB Local** (Docker) - Base `testiq_demo`
- **Tunnels Cloudflare** gratuits pour exposition publique
- **CORS strict** + **RBAC viewer** + **Quality Gates 100%**

### **URLs Finales :**
- **Frontend Public** : `<FRONT_TUNNEL_URL>` 
- **API Backend** : `<API_TUNNEL_URL>`

### **Comptes Démo :**
- **Principal** : demo@testiq.com / demo123
- **Test** : client@example.com / client123

### **Coût :** 0€  
### **Durée :** 24h par session

---

**🚀 DÉMO TESTIQ PRÊTE ! Suivre GUIDE-DEMARRAGE-APRES-PC.md pour lancer 🚀**