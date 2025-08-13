#!/usr/bin/env node
/**
 * 🔧 CONFIGURATION DES QUALITY GATES CI/CD
 * ========================================
 * 
 * Configure les quality gates pour rendre les tests bloquants :
 * 1. Ajoute le middleware quality gate aux routes de publication
 * 2. Configure les seuils de qualité (≥95% validation)
 * 3. Crée les scripts de CI/CD pour les tests bloquants
 * 4. Active les hooks pre-commit pour la validation
 */

const fs = require('fs').promises;
const path = require('path');

class CIGateSetup {
    constructor() {
        this.changes = [];
        this.errors = [];
    }

    /**
     * Ajouter le quality gate aux routes API
     */
    async setupAPIQualityGate() {
        console.log('🔧 Configuration du Quality Gate sur les routes API...');

        try {
            // Chercher le fichier de routes des questions
            const routeFiles = [
                'routes/questions-v2.js',
                'routes/questions.js', 
                'server.js'
            ];

            for (const routeFile of routeFiles) {
                const filePath = path.join(__dirname, '..', routeFile);
                
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    
                    // Vérifier si le quality gate est déjà configuré
                    if (content.includes('quality-gate') || content.includes('QualityGate')) {
                        console.log(`✅ Quality Gate déjà configuré dans ${routeFile}`);
                        continue;
                    }

                    // Ajouter l'import du quality gate
                    if (content.includes('const express = require') || content.includes('const router = require')) {
                        const updatedContent = content.replace(
                            /(const.*require.*['"];?\n)/,
                            `$1const QualityGate = require('../middleware/quality-gate');\n`
                        );

                        // Ajouter le middleware avant les routes de publication
                        const withMiddleware = updatedContent.replace(
                            /(router\.(?:post|put).*['"].*publish.*['"].*,)/g,
                            '$1 QualityGate.validateBeforePublish,'
                        );

                        await fs.writeFile(filePath, withMiddleware);
                        this.changes.push(`Quality Gate ajouté à ${routeFile}`);
                        console.log(`✅ Quality Gate configuré dans ${routeFile}`);
                    }

                } catch (error) {
                    if (error.code !== 'ENOENT') {
                        this.errors.push(`Erreur avec ${routeFile}: ${error.message}`);
                    }
                }
            }

        } catch (error) {
            this.errors.push(`Erreur configuration API: ${error.message}`);
        }
    }

    /**
     * Créer un script de CI/CD pour les tests bloquants
     */
    async createCIScript() {
        console.log('🔧 Création du script CI/CD...');

        const ciScript = `#!/bin/bash
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
MONGODB_URI=\${MONGODB_URI:-"mongodb://localhost:27017/iq_test_db"}

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
TEST_RESULT=\$(node scripts/test-v2-system.js quick 2>&1)
TEST_EXIT_CODE=\$?

if [ \$TEST_EXIT_CODE -ne 0 ]; then
    echo "\$TEST_RESULT"
    fail_deployment "Critical tests failed"
fi
echo "✅ Critical tests passed"

# 4. Exécuter tous les tests de qualité
echo "🧪 Running full quality tests..."
FULL_TEST_RESULT=\$(node scripts/test-v2-system.js full 2>&1)
FULL_EXIT_CODE=\$?

if [ \$FULL_EXIT_CODE -ne 0 ]; then
    echo "\$FULL_TEST_RESULT"
    fail_deployment "Quality tests failed - 15/15 tests must pass"
fi
echo "✅ All quality tests passed (15/15)"

# 5. Vérifier le seuil de validation
echo "📊 Checking validation rate..."
AUDIT_RESULT=\$(node scripts/test-v2-system.js audit 2>&1)
AUDIT_EXIT_CODE=\$?

if [ \$AUDIT_EXIT_CODE -ne 0 ]; then
    echo "\$AUDIT_RESULT"
    fail_deployment "Validation rate below 95% threshold"
fi
echo "✅ Validation rate above 95%"

# 6. Quality Gate final
echo "🛡️ Running final Quality Gate..."
GATE_RESULT=\$(node -e "
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
GATE_EXIT_CODE=\$?

if [ \$GATE_EXIT_CODE -ne 0 ]; then
    echo "\$GATE_RESULT"
    fail_deployment "Quality Gate failed"
fi
echo "✅ Quality Gate passed"

# 7. Build et vérifications finales
echo "🔨 Building application..."
if [ -f "package.json" ] && grep -q "build" package.json; then
    npm run build
    echo "✅ Build successful"
fi

# ✅ Déploiement autorisé
echo ""
echo "🎯 === DEPLOYMENT AUTHORIZED ==="
echo "✅ All tests passed (15/15)"
echo "✅ Validation rate ≥95%"
echo "✅ Quality Gate passed"
echo "✅ Build successful"
echo ""
echo "🚀 Ready for production deployment!"
exit 0
`;

        try {
            await fs.writeFile(path.join(__dirname, '..', '..', 'ci-cd-pipeline.sh'), ciScript);
            this.changes.push('Script CI/CD créé : ci-cd-pipeline.sh');
            console.log('✅ Script CI/CD créé');
        } catch (error) {
            this.errors.push(`Erreur création script CI: ${error.message}`);
        }
    }

    /**
     * Créer le hook pre-commit
     */
    async createPreCommitHook() {
        console.log('🔧 Configuration du hook pre-commit...');

        const preCommitHook = `#!/bin/sh
# 🛡️ PRE-COMMIT HOOK - TESTIQ QUALITY CHECK
# ==========================================
# Empêche les commits si les tests de qualité échouent

echo "🔍 Pre-commit quality check..."

# Aller dans le dossier backend
cd backend

# Vérifier si MongoDB est disponible
if ! nc -z localhost 27017 2>/dev/null; then
    echo "⚠️  MongoDB not available - skipping quality checks"
    echo "🚨 IMPORTANT: Run full quality checks before pushing!"
    exit 0
fi

# Exécuter les tests critiques
echo "⚡ Running critical tests..."
if ! node scripts/test-v2-system.js quick >/dev/null 2>&1; then
    echo "❌ Critical tests failed"
    echo "💡 Run 'npm run test:quality' to see details"
    echo "🚫 Commit blocked - fix the issues and try again"
    exit 1
fi

echo "✅ Pre-commit checks passed"
exit 0
`;

        try {
            const gitHooksDir = path.join(__dirname, '..', '..', '.git', 'hooks');
            const preCommitPath = path.join(gitHooksDir, 'pre-commit');
            
            // Créer le répertoire s'il n'existe pas
            try {
                await fs.mkdir(gitHooksDir, { recursive: true });
            } catch (error) {
                // Ignore l'erreur si le répertoire existe déjà
            }
            
            await fs.writeFile(preCommitPath, preCommitHook, { mode: 0o755 });
            this.changes.push('Hook pre-commit configuré');
            console.log('✅ Hook pre-commit configuré');
        } catch (error) {
            this.errors.push(`Erreur hook pre-commit: ${error.message}`);
        }
    }

    /**
     * Mettre à jour package.json avec les scripts de qualité
     */
    async updatePackageScripts() {
        console.log('🔧 Mise à jour des scripts package.json...');

        try {
            const packagePath = path.join(__dirname, '..', 'package.json');
            const packageContent = await fs.readFile(packagePath, 'utf8');
            const packageJson = JSON.parse(packageContent);

            // Ajouter les scripts de qualité
            if (!packageJson.scripts) {
                packageJson.scripts = {};
            }

            packageJson.scripts = {
                ...packageJson.scripts,
                'test:quality': 'node scripts/test-v2-system.js full',
                'test:quick': 'node scripts/test-v2-system.js quick',
                'test:audit': 'node scripts/test-v2-system.js audit',
                'quality:gate': 'node -e "require(\'./middleware/quality-gate\').validateRelease().then(r=>process.exit(r.ready_for_release?0:1))"',
                'quality:report': 'node scripts/test-v2-system.js full && node scripts/test-v2-system.js audit',
                'ci:test': 'npm run test:quality && npm run test:audit',
                'precommit': 'npm run test:quick'
            };

            await fs.writeFile(packagePath, JSON.stringify(packageJson, null, 2));
            this.changes.push('Scripts package.json mis à jour');
            console.log('✅ Scripts package.json mis à jour');
        } catch (error) {
            this.errors.push(`Erreur package.json: ${error.message}`);
        }
    }

    /**
     * Créer la configuration GitHub Actions (optionnel)
     */
    async createGitHubActions() {
        console.log('🔧 Création de la configuration GitHub Actions...');

        const workflowYaml = `name: TestIQ Quality Gate

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:5.0
        ports:
          - 27017:27017
        options: >-
          --health-cmd mongosh
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json

    - name: Install dependencies
      run: |
        cd backend
        npm ci

    - name: Wait for MongoDB
      run: |
        timeout 30s bash -c 'until nc -z localhost 27017; do sleep 1; done'

    - name: Run Quality Gate Tests
      run: |
        cd backend
        npm run ci:test

    - name: Generate Quality Report
      if: always()
      run: |
        cd backend
        npm run quality:report

    - name: Upload Quality Reports
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: quality-reports
        path: |
          backend/scripts/*report*.json
          backend/scripts/test-report-v2.json
`;

        try {
            const actionsDir = path.join(__dirname, '..', '..', '.github', 'workflows');
            await fs.mkdir(actionsDir, { recursive: true });
            
            const workflowPath = path.join(actionsDir, 'quality-gate.yml');
            await fs.writeFile(workflowPath, workflowYaml);
            
            this.changes.push('GitHub Actions workflow créé');
            console.log('✅ GitHub Actions workflow créé');
        } catch (error) {
            this.errors.push(`Erreur GitHub Actions: ${error.message}`);
        }
    }

    /**
     * Configuration complète
     */
    async setupAll() {
        console.log('🔧 === CONFIGURATION QUALITY GATES CI/CD ===\n');

        await this.setupAPIQualityGate();
        await this.updatePackageScripts();
        await this.createCIScript();
        await this.createPreCommitHook();
        await this.createGitHubActions();

        console.log('\n🎯 === RÉSUMÉ ===');
        console.log(`✅ Changements: ${this.changes.length}`);
        console.log(`❌ Erreurs: ${this.errors.length}`);

        if (this.changes.length > 0) {
            console.log('\n📋 Changements appliqués:');
            this.changes.forEach(change => console.log(`   • ${change}`));
        }

        if (this.errors.length > 0) {
            console.log('\n🚨 Erreurs rencontrées:');
            this.errors.forEach(error => console.log(`   • ${error}`));
        }

        console.log('\n🚀 ACTIONS SUIVANTES:');
        console.log('1. Tester les scripts: npm run test:quick');
        console.log('2. Exécuter le quality gate: npm run quality:gate');
        console.log('3. Faire un commit de test pour vérifier le hook');
        console.log('4. Configurer la CI sur votre plateforme (GitHub Actions inclus)');

        return {
            success: this.errors.length === 0,
            changes: this.changes.length,
            errors: this.errors.length
        };
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const setup = new CIGateSetup();
    
    setup.setupAll()
        .then(result => {
            console.log(`\n${result.success ? '✅' : '❌'} Configuration terminée`);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur:', error);
            process.exit(1);
        });
}

module.exports = CIGateSetup;