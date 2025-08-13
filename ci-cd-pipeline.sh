#!/bin/bash
# 🧪 CI/CD SCRIPT - TESTS BLOQUANTS TESTIQ
# ========================================
# Script pour CI/CD qui refuse le déploiement si les tests échouent

set -e

echo "🚀 === TESTIQ CI/CD PIPELINE ==="
echo "Timestamp: $(date)"
echo ""

# Variables
REQUIRED_SUCCESS_RATE=100
REQUIRED_VALIDATION_RATE=95
MONGODB_URI=${MONGODB_URI:-"mongodb://localhost:27017/iq_test_db"}

# Fonction d'échec
fail_deployment() {
    echo "❌ DEPLOYMENT BLOCKED: $1"
    echo "📋 Check the issues above and fix them before deploying"
    exit 1
}

# 1. Vérifier la connexion MongoDB
echo "🔍 Checking MongoDB connection..."
if ! nc -z localhost 27017; then
    fail_deployment "MongoDB not available"
fi
echo "✅ MongoDB connected"

# 2. Installer les dépendances
echo "📦 Installing dependencies..."
cd backend
npm ci --silent
echo "✅ Dependencies installed"

# 3. Exécuter les tests critiques (rapides)
echo "⚡ Running critical tests..."
TEST_RESULT=$(node scripts/test-v2-system.js quick 2>&1)
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo "$TEST_RESULT"
    fail_deployment "Critical tests failed"
fi
echo "✅ Critical tests passed"

# 4. Exécuter tous les tests de qualité
echo "🧪 Running full quality tests..."
FULL_TEST_RESULT=$(node scripts/test-v2-system.js full 2>&1)
FULL_EXIT_CODE=$?

if [ $FULL_EXIT_CODE -ne 0 ]; then
    echo "$FULL_TEST_RESULT"
    fail_deployment "Quality tests failed - 15/15 tests must pass"
fi
echo "✅ All quality tests passed (15/15)"

# 5. Vérifier le seuil de validation
echo "📊 Checking validation rate..."
AUDIT_RESULT=$(node scripts/test-v2-system.js audit 2>&1)
AUDIT_EXIT_CODE=$?

if [ $AUDIT_EXIT_CODE -ne 0 ]; then
    echo "$AUDIT_RESULT"
    fail_deployment "Validation rate below 95% threshold"
fi
echo "✅ Validation rate above 95%"

# 6. Quality Gate final
echo "🛡️ Running final Quality Gate..."
GATE_RESULT=$(node -e "
const QualityGate = require('./middleware/quality-gate');
QualityGate.validateRelease().then(result => {
    if (!result.ready_for_release) {
        console.error('Quality Gate FAILED');
        console.error(JSON.stringify(result.blocking_issues, null, 2));
        process.exit(1);
    }
    console.log('Quality Gate PASSED');
    process.exit(0);
}).catch(err => {
    console.error('Quality Gate ERROR:', err.message);
    process.exit(1);
});
" 2>&1)
GATE_EXIT_CODE=$?

if [ $GATE_EXIT_CODE -ne 0 ]; then
    echo "$GATE_RESULT"
    fail_deployment "Quality Gate failed"
fi
echo "✅ Quality Gate passed"

# 7. Build et vérifications finales
echo "🔨 Building application..."
if [ -f "package.json" ] && grep -q "build" package.json; then
    npm run build
    echo "✅ Build successful"
fi

# 🚨 CORPUS GATE CRITIQUE (≥95% + 0 critique + toutes locales)
echo "🔒 Running CORPUS GATE (CRITICAL)..."
CORPUS_RESULT=$(node -e "
const CorpusGate = require('./middleware/corpus-gate');
CorpusGate.validateCorpus().then(result => {
    if (!result.passed) {
        console.error('CORPUS GATE FAILED - DEPLOYMENT BLOCKED');
        console.error('Failed criteria:', result.failedCriteria);
        console.error('Must fix:', result.mustFix);
        process.exit(1);
    }
    console.log('CORPUS GATE PASSED');
    console.log('Global validation rate:', result.summary.globalValidationRate);
    process.exit(0);
}).catch(err => {
    console.error('CORPUS GATE ERROR:', err.message);
    process.exit(1);
});
" 2>&1)
CORPUS_EXIT_CODE=$?

if [ $CORPUS_EXIT_CODE -ne 0 ]; then
    echo "$CORPUS_RESULT"
    fail_deployment "CORPUS GATE FAILED - Critères qualité non respectés"
fi
echo "✅ Corpus Gate passed"

# ✅ Déploiement autorisé
echo ""
echo "🎯 === DEPLOYMENT AUTHORIZED ==="
echo "✅ All tests passed (15/15)"
echo "✅ Validation rate ≥95%"
echo "✅ Quality Gate passed"
echo "✅ Corpus Gate passed (≥95% + 0 critical)"
echo "✅ Build successful"
echo ""
echo "🚀 Ready for production deployment!"
exit 0
