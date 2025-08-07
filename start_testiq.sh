#!/bin/bash

echo "🚀 Démarrage de TestIQ..."

# Démarrer les services TestIQ
docker-compose up -d

# Vérifier que les services sont bien démarrés
sleep 15
if docker ps | grep -q testiq-app_frontend_1; then
    echo "✅ TestIQ démarré avec succès"
    echo "🌐 Frontend: http://13.223.174.47:3000"
    echo "📊 API: http://13.223.174.47:5000"
    echo "🌍 URL publique: http://testIQ.fitluxe.online:3000"
else
    echo "❌ Erreur lors du démarrage de TestIQ"
    docker-compose logs
    exit 1
fi