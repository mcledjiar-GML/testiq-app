#!/usr/bin/env node
/**
 * 🚨 STOP-THE-BLEED - MIGRATION OPÉRATIONNELLE V2
 * ===============================================
 * 
 * Script de migration d'urgence pour arrêter les collisions de contenu
 * et mettre en place le nouveau système UID/versioning.
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Import des modules
const MigrationV2 = require('./migrate-to-v2');
const TestSystemV2 = require('./test-v2-system');

require('dotenv').config();

class StopTheBleed {
    constructor() {
        this.backupPath = path.join(__dirname, 'emergency-backup');
        this.logPath = path.join(__dirname, 'stop-the-bleed.log');
        this.steps = [];
    }

    /**
     * Logger avec timestamp
     */
    log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level}] ${message}`;
        console.log(logMessage);
        this.steps.push(logMessage);
    }

    /**
     * Sauvegarder les logs
     */
    async saveLogs() {
        const logContent = this.steps.join('\n');
        await fs.writeFile(this.logPath, logContent);
        this.log(`Logs sauvegardés: ${this.logPath}`);
    }

    /**
     * ÉTAPE 1: Freeze publication (mode lecture seule)
     */
    async freezePublication() {
        this.log('🔒 ÉTAPE 1: Freeze publication (mode lecture seule)', 'CRITICAL');
        
        try {
            // Créer un fichier de verrou
            const lockFile = path.join(__dirname, '../.publication-lock');
            await fs.writeFile(lockFile, JSON.stringify({
                locked: true,
                timestamp: new Date().toISOString(),
                reason: 'Emergency migration to V2 system',
                operator: process.env.USER || 'system'
            }, null, 2));
            
            this.log('✅ Mode lecture seule activé');
            this.log(`📁 Fichier de verrou créé: ${lockFile}`);
            
            // TODO: Ici vous pourriez aussi notifier votre système de monitoring
            // ou envoyer un webhook à votre équipe
            
            return true;
            
        } catch (error) {
            this.log(`❌ Erreur lors du freeze: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * ÉTAPE 2: Backup complet
     */
    async createBackup() {
        this.log('💾 ÉTAPE 2: Backup complet MongoDB + fichiers', 'CRITICAL');
        
        try {
            // Créer le dossier de backup
            await fs.mkdir(this.backupPath, { recursive: true });
            
            // Backup MongoDB
            const mongoBackupPath = path.join(this.backupPath, 'mongodb');
            await fs.mkdir(mongoBackupPath, { recursive: true });
            
            const mongodumpCmd = `mongodump --uri="${process.env.MONGODB_URI}" --out="${mongoBackupPath}"`;
            this.log(`Exécution: ${mongodumpCmd}`);
            
            const { stdout, stderr } = await execAsync(mongodumpCmd);
            if (stderr) this.log(`Warnings mongodump: ${stderr}`, 'WARN');
            
            // Backup des fichiers assets (si applicable)
            const assetsPath = path.join(__dirname, '../visual_cache');
            const assetsBackupPath = path.join(this.backupPath, 'visual_cache');
            
            try {
                await execAsync(`cp -r "${assetsPath}" "${assetsBackupPath}"`);
                this.log('✅ Backup assets terminé');
            } catch (error) {
                this.log(`⚠️  Backup assets ignoré: ${error.message}`, 'WARN');
            }
            
            this.log('✅ Backup complet terminé');
            this.log(`📁 Backup sauvegardé: ${this.backupPath}`);
            
            return true;
            
        } catch (error) {
            this.log(`❌ Erreur lors du backup: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * ÉTAPE 3: Audit et rapport des collisions
     */
    async auditCollisions() {
        this.log('🔍 ÉTAPE 3: Audit des collisions existantes', 'CRITICAL');
        
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            
            const migration = new MigrationV2();
            await migration.connect();
            
            const auditResults = await migration.auditCollisions();
            const reportPath = await migration.generateCollisionReport();
            
            this.log(`📊 ${auditResults.totalQuestions} questions analysées`);
            this.log(`⚠️  ${auditResults.collisions} collisions détectées`);
            this.log(`📋 Rapport détaillé: ${reportPath}`);
            
            await migration.disconnect();
            
            return auditResults;
            
        } catch (error) {
            this.log(`❌ Erreur lors de l'audit: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * ÉTAPE 4: Génération des QIDs et migration
     */
    async runMigration() {
        this.log('🔄 ÉTAPE 4: Migration vers système V2', 'CRITICAL');
        
        try {
            const migration = new MigrationV2();
            const results = await migration.runFullMigration();
            
            this.log(`✅ ${results.migration.migrated} questions migrées`);
            this.log(`❌ ${results.migration.errors} erreurs`);
            
            if (results.migration.errors > 0) {
                this.log('⚠️  Des erreurs de migration ont été détectées', 'WARN');
                this.log('📋 Voir migration-errors.json pour les détails');
            }
            
            return results;
            
        } catch (error) {
            this.log(`❌ Erreur lors de la migration: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * ÉTAPE 5: Création des index uniques
     */
    async createUniqueIndexes() {
        this.log('🗂️  ÉTAPE 5: Création des index uniques', 'CRITICAL');
        
        try {
            const QuestionV2 = require('../models/QuestionV2');
            
            // Les index sont définis dans le schéma, mais on peut les forcer
            await QuestionV2.collection.createIndex(
                { qid: 1, version: 1 }, 
                { unique: true, name: 'qid_version_unique' }
            );
            
            await QuestionV2.collection.createIndex(
                { bundleHash: 1 }, 
                { unique: true, name: 'bundle_hash_unique' }
            );
            
            await QuestionV2.collection.createIndex(
                { state: 1, type: 1, series: 1 }, 
                { name: 'state_type_series' }
            );
            
            this.log('✅ Index uniques créés');
            
            return true;
            
        } catch (error) {
            this.log(`❌ Erreur lors de la création des index: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * ÉTAPE 6: Tests de validation
     */
    async runValidationTests() {
        this.log('🧪 ÉTAPE 6: Tests de validation du système V2', 'CRITICAL');
        
        try {
            const tester = new TestSystemV2();
            const results = await tester.runAllTests();
            
            this.log(`📊 Tests: ${results.passed}/${results.total} réussis`);
            
            if (results.failed > 0) {
                this.log(`⚠️  ${results.failed} tests échoués`, 'WARN');
                this.log('📋 Voir test-report-v2.json pour les détails');
                
                // En cas d'échec critique, on peut décider d'arrêter
                const criticalFailures = results.tests.filter(t => 
                    !t.passed && ['QID Uniqueness', 'Bundle Hash Uniqueness'].includes(t.name)
                );
                
                if (criticalFailures.length > 0) {
                    throw new Error(`Tests critiques échoués: ${criticalFailures.map(t => t.name).join(', ')}`);
                }
            }
            
            return results;
            
        } catch (error) {
            this.log(`❌ Erreur lors des tests: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * ÉTAPE 7: Activation des validations API
     */
    async activateValidations() {
        this.log('🛡️  ÉTAPE 7: Activation des validations API', 'CRITICAL');
        
        try {
            // Créer un fichier de configuration pour activer les validations
            const configFile = path.join(__dirname, '../config/validation-config.json');
            const validationConfig = {
                enabled: true,
                strict: true,
                alphabetValidation: true,
                optionsValidation: true,
                bundleHashValidation: true,
                assetIntegrityCheck: true,
                activatedAt: new Date().toISOString()
            };
            
            await fs.mkdir(path.dirname(configFile), { recursive: true });
            await fs.writeFile(configFile, JSON.stringify(validationConfig, null, 2));
            
            this.log('✅ Validations API activées');
            this.log(`📁 Configuration: ${configFile}`);
            
            return true;
            
        } catch (error) {
            this.log(`❌ Erreur lors de l'activation des validations: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * ÉTAPE 8: Défreeze et nettoyage
     */
    async unfreeze() {
        this.log('🔓 ÉTAPE 8: Défreeze et nettoyage', 'CRITICAL');
        
        try {
            // Supprimer le fichier de verrou
            const lockFile = path.join(__dirname, '../.publication-lock');
            try {
                await fs.unlink(lockFile);
                this.log('✅ Mode lecture seule désactivé');
            } catch (error) {
                this.log(`⚠️  Fichier de verrou non trouvé: ${error.message}`, 'WARN');
            }
            
            // Invalider le cache (si applicable)
            const cacheDir = path.join(__dirname, '../visual_cache');
            try {
                const cacheFiles = await fs.readdir(cacheDir);
                for (const file of cacheFiles) {
                    if (file.endsWith('.json')) {
                        await fs.unlink(path.join(cacheDir, file));
                    }
                }
                this.log('✅ Cache vidé');
            } catch (error) {
                this.log(`⚠️  Nettoyage cache ignoré: ${error.message}`, 'WARN');
            }
            
            return true;
            
        } catch (error) {
            this.log(`❌ Erreur lors du défreeze: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    /**
     * Vérification des prérequis
     */
    async checkPrerequisites() {
        this.log('✅ Vérification des prérequis...', 'INFO');
        
        const checks = [
            { name: 'MongoDB URI', check: () => !!process.env.MONGODB_URI },
            { name: 'mongodump disponible', check: async () => {
                try {
                    await execAsync('mongodump --version');
                    return true;
                } catch { return false; }
            }},
            { name: 'Espace disque suffisant', check: async () => {
                try {
                    const { stdout } = await execAsync('df -h .');
                    return !stdout.includes('100%');
                } catch { return true; } // Assume OK if can't check
            }}
        ];
        
        for (const check of checks) {
            const result = await check.check();
            this.log(`${result ? '✅' : '❌'} ${check.name}: ${result ? 'OK' : 'ÉCHEC'}`, 
                    result ? 'INFO' : 'ERROR');
            if (!result) {
                throw new Error(`Prérequis non satisfait: ${check.name}`);
            }
        }
    }

    /**
     * Pipeline complet "Stop-the-bleed"
     */
    async execute() {
        this.log('🚨 === DÉMARRAGE STOP-THE-BLEED ===', 'CRITICAL');
        this.log('Migration d\'urgence vers système V2', 'CRITICAL');
        
        const startTime = Date.now();
        
        try {
            // Vérifications préalables
            await this.checkPrerequisites();
            
            // Étapes critiques
            await this.freezePublication();
            await this.createBackup();
            const auditResults = await this.auditCollisions();
            const migrationResults = await this.runMigration();
            await this.createUniqueIndexes();
            const testResults = await this.runValidationTests();
            await this.activateValidations();
            await this.unfreeze();
            
            const duration = Math.round((Date.now() - startTime) / 1000);
            
            this.log('🎉 === MIGRATION TERMINÉE AVEC SUCCÈS ===', 'CRITICAL');
            this.log(`⏱️  Durée totale: ${duration} secondes`, 'INFO');
            this.log(`📊 ${migrationResults.migration.migrated} questions migrées`, 'INFO');
            this.log(`🧪 ${testResults.passed}/${testResults.total} tests réussis`, 'INFO');
            
            // Résumé final
            const summary = {
                success: true,
                duration,
                audit: auditResults,
                migration: migrationResults.migration,
                tests: {
                    passed: testResults.passed,
                    failed: testResults.failed,
                    total: testResults.total
                }
            };
            
            const summaryPath = path.join(__dirname, 'stop-the-bleed-summary.json');
            await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
            this.log(`📋 Résumé sauvegardé: ${summaryPath}`, 'INFO');
            
            return summary;
            
        } catch (error) {
            this.log(`💥 ERREUR CRITIQUE: ${error.message}`, 'CRITICAL');
            this.log('📞 INTERVENTION MANUELLE REQUISE', 'CRITICAL');
            
            // En cas d'erreur, on peut tenter un rollback automatique
            await this.emergencyRollback();
            
            throw error;
            
        } finally {
            await this.saveLogs();
            
            if (mongoose.connection.readyState === 1) {
                await mongoose.disconnect();
            }
        }
    }

    /**
     * Rollback d'urgence en cas d'échec
     */
    async emergencyRollback() {
        this.log('🔄 ROLLBACK D\'URGENCE EN COURS...', 'CRITICAL');
        
        try {
            // Restaurer depuis le backup
            const mongoBackupPath = path.join(this.backupPath, 'mongodb');
            const restoreCmd = `mongorestore --uri="${process.env.MONGODB_URI}" --drop "${mongoBackupPath}"`;
            
            await execAsync(restoreCmd);
            this.log('✅ Base de données restaurée depuis le backup', 'INFO');
            
            // Supprimer le verrou
            await this.unfreeze();
            
            this.log('✅ Rollback terminé', 'INFO');
            
        } catch (rollbackError) {
            this.log(`❌ Erreur lors du rollback: ${rollbackError.message}`, 'ERROR');
            this.log('🆘 INTERVENTION MANUELLE CRITIQUE REQUISE', 'CRITICAL');
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const stopTheBleed = new StopTheBleed();
    
    stopTheBleed.execute()
        .then((summary) => {
            console.log('\n✅ Migration réussie!');
            console.log('📊 Résumé:', JSON.stringify(summary, null, 2));
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Migration échouée:', error.message);
            console.error('📋 Consultez les logs pour plus de détails');
            process.exit(1);
        });
}

module.exports = StopTheBleed;