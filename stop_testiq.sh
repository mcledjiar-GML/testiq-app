#!/bin/bash

echo "🛑 Arrêt de TestIQ..."

# Arrêter les services TestIQ
docker-compose down

echo "✅ TestIQ arrêté avec succès"