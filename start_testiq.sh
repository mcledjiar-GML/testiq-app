#!/bin/bash

# Configuration
SERVER_IP=${SERVER_IP:-"localhost"}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
API_PORT=${API_PORT:-5000}
PUBLIC_DOMAIN=${PUBLIC_DOMAIN:-"testIQ.fitluxe.online"}
COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-"testiq-app"}

echo "🚀 Démarrage de TestIQ..."

# Démarrer les services TestIQ
docker-compose up -d

# Vérifier que les services sont bien démarrés
echo "⏳ Attente du démarrage des services..."
sleep 15

# Vérification plus robuste des conteneurs
if docker-compose ps | grep -q "Up"; then
    echo "✅ TestIQ démarré avec succès"
    echo "🌐 Frontend: http://${SERVER_IP}:${FRONTEND_PORT}"
    echo "📊 API: http://${SERVER_IP}:${API_PORT}"
    if [ "$PUBLIC_DOMAIN" != "" ]; then
        echo "🌍 URL publique: http://${PUBLIC_DOMAIN}:${FRONTEND_PORT}"
    fi
    echo ""
    echo "📋 Statut des conteneurs:"
    docker-compose ps
else
    echo "❌ Erreur lors du démarrage de TestIQ"
    echo "📋 Statut des conteneurs:"
    docker-compose ps
    echo ""
    echo "📋 Logs des conteneurs:"
    docker-compose logs --tail=20
    exit 1
fi