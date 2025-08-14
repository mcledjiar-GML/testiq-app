# 🚀 RUNBOOK PRODUCTION TESTIQ v5.0
**Procédures d'urgence et opérations critiques - 1 page imprimable**

---

## 🔥 URGENCES (< 2min)

### Kill-Switch d'urgence
```bash
curl -X POST https://api.testiq.com/api/monitoring/kill-switch/emergency \
  -H "X-API-Key: emergency-key-killswitch" \
  -d '{"reason":"Emergency stop"}'
```
📞 **Contact d'urgence:** DevOps Lead +33-X-XX-XX-XX-XX

### Rollback immédiat
```bash
# Via API
curl -X POST https://api.testiq.com/api/deployment/rollback/DEPLOYMENT_ID \
  -H "X-API-Key: admin-key-monitoring"

# Via serveur
ssh prod-server "cd /app && ./scripts/emergency-rollback.sh"
```

---

## 🎯 GO/NO-GO CANARY DEPLOYMENT

### Étapes de déploiement
1. **5% (10min)** → Surveiller: `unique_solution_fail`, `questions_render_blocked`
2. **25% (15min)** → Vérifier: P95 < 250ms, erreurs front < 2%
3. **100%** → Validation complète

### Seuils de rollback automatique
- ❌ **unique_solution_fail > 0** → Rollback immédiat
- ❌ **questions_render_blocked ≥ 1%/15min** → Rollback immédiat  
- ❌ **P95 > 250ms pendant 10min** → Rollback immédiat
- ❌ **Erreurs frontend ≥ 2%** → Rollback immédiat

### Monitoring URLs
- **Dashboard:** https://monitoring.testiq.com/dashboard
- **SLO Status:** https://monitoring.testiq.com/slo
- **Canary Status:** https://api.testiq.com/api/monitoring/kill-switch/status

---

## 🛠️ PROCÉDURES DE RÉCUPÉRATION

### 1. Activer Kill-Switch (30sec)
```bash
# Mode maintenance
curl -X POST https://api.testiq.com/api/monitoring/kill-switch/readonly \
  -H "X-API-Key: admin-key-monitoring" \
  -d '{"reason":"Maintenance mode"}'
```

### 2. Invalider CDN (2min)
```bash
# Invalider cache complet
curl -X POST https://cdn-api.testiq.com/invalidate-all \
  -H "Authorization: Bearer CDN_TOKEN"

# Vérifier propagation
dig @8.8.8.8 testiq.com
```

### 3. Restaurer Base de données (5min)
```bash
# Dernière sauvegarde automatique
cd /backups && ls -la *.sql | tail -1
mysql -u admin -p testiq_prod < latest-backup.sql

# Vérifier intégrité
mysql -u admin -p -e "SELECT COUNT(*) FROM questions WHERE state='published';"
```

### 4. Restaurer objets statiques (3min)
```bash
# Synchroniser depuis backup S3
aws s3 sync s3://testiq-backup/static/ /var/www/static/
systemctl restart nginx
```

### 5. Relancer Corpus Gate (1min)
```bash
cd /app && npm run corpus:validate
# Doit retourner: ✅ Corpus Gate: 95%+ validé
```

---

## 📊 MÉTRIQUES CRITIQUES À SURVEILLER

| Métrique | Seuil Normal | Seuil Critique | Action |
|----------|-------------|----------------|---------|
| **P95 Latence** | < 150ms | > 250ms | Rollback |
| **Taux erreur** | < 0.5% | > 1% | Rollback |
| **unique_solution_fail** | 0 | > 0 | Kill-Switch |
| **questions_render_blocked** | < 0.1% | > 1% | Rollback |
| **CPU Backend** | < 70% | > 90% | Scale-up |
| **Mémoire** | < 80% | > 95% | Restart |

---

## 👥 CONTACTS CRITIQUES

| Rôle | Contact | Disponibilité |
|------|---------|---------------|
| **DevOps Lead** | +33-X-XX-XX | 24/7 |
| **Tech Lead** | +33-Y-YY-YY | 8h-20h |
| **Product Owner** | +33-Z-ZZ-ZZ | 9h-18h |
| **Infra On-Call** | +33-W-WW-WW | 24/7 |

**Slack d'urgence:** #prod-incidents  
**Email d'escalade:** incidents@testiq.com

---

## 📋 CHECKLIST POST-INCIDENT

- [ ] Services restaurés et fonctionnels
- [ ] Métriques revenue à la normale (< 30min)
- [ ] CDN propagé globalement (< 10min)
- [ ] Tests smoke réussis (/health, /api/health)
- [ ] Notification équipe et stakeholders
- [ ] Post-mortem planifié (< 48h)
- [ ] Documentation incident mise à jour

---

## 🎛️ COMMANDES RAPIDES

```bash
# Status complet
curl -s https://api.testiq.com/api/monitoring/dashboard \
  -H "X-API-Key: readonly-key" | jq '.overview'

# Logs d'erreur temps réel
tail -f /var/log/testiq/error.log | grep ERROR

# Redémarrage service complet
systemctl restart testiq-backend testiq-frontend nginx

# Vérification santé
curl https://testiq.com/health && \
curl https://api.testiq.com/api/monitoring/health
```

---

**Version:** v5.0.1 | **Dernière MAJ:** 2025-01-14 | **Révision:** Tous les trimestrielle  
**⚠️ Garder cette page accessible hors ligne et imprimée**