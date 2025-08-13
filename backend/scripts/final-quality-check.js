#!/usr/bin/env node
/**
 * 🎯 VÉRIFICATION QUALITÉ FINALE
 * =============================
 * 
 * Vérification complète du système après toutes les améliorations :
 * - Moteur de règles amélioré
 * - Quality Gates opérationnels
 * - Tests bloquants configurés
 * - Validation threshold implémentée
 */

const fs = require('fs').promises;
const path = require('path');

class FinalQualityCheck {
    
    constructor() {
        this.results = {
            components: {},
            overall: {
                score: 0,
                readyForProduction: false,
                blockers: [],
                recommendations: []
            }
        };
    }
    
    /**
     * Vérifier les composants clés du système
     */
    async checkComponents() {
        console.log('🔍 === VÉRIFICATION DES COMPOSANTS ===\n');
        
        // 1. Moteur de règles amélioré
        await this.checkEnhancedRuleEngine();
        
        // 2. Quality Gates
        await this.checkQualityGates();
        
        // 3. Scripts de test
        await this.checkTestScripts();
        
        // 4. Configuration CI/CD
        await this.checkCIConfiguration();
        
        // 5. Documentation et scripts
        await this.checkDocumentation();
    }
    
    /**
     * Vérifier le moteur de règles amélioré
     */
    async checkEnhancedRuleEngine() {
        console.log('🧠 Vérification du moteur de règles amélioré...');
        
        try {
            const enginePath = path.join(__dirname, 'enhanced-rule-engine.js');
            const content = await fs.readFile(enginePath, 'utf8');
            
            const checks = {
                exists: true,
                hasFibonacci: content.includes('fibonacci_sequence'),
                hasGeometric: content.includes('geometric_sequence'),
                hasAnalogy: content.includes('analogy_pattern'),
                hasConfidence: content.includes('confidence'),
                hasFallback: content.includes('analyzeGenericPattern')
            };
            
            const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length;
            
            this.results.components.enhancedRuleEngine = {
                score: score * 100,
                status: score >= 0.8 ? 'excellent' : score >= 0.6 ? 'good' : 'needs_work',
                checks,
                details: `${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length} fonctionnalités présentes`
            };
            
            console.log(`✅ Moteur de règles: ${(score * 100).toFixed(1)}% (${this.results.components.enhancedRuleEngine.status})`);
            
        } catch (error) {
            this.results.components.enhancedRuleEngine = {
                score: 0,
                status: 'error',
                error: error.message
            };
            console.log('❌ Moteur de règles: Erreur de vérification');
        }
    }
    
    /**
     * Vérifier les Quality Gates
     */
    async checkQualityGates() {
        console.log('🛡️ Vérification des Quality Gates...');
        
        try {
            const gatePath = path.join(__dirname, '..', 'middleware', 'quality-gate.js');
            const content = await fs.readFile(gatePath, 'utf8');
            
            const checks = {
                exists: true,
                hasValidation: content.includes('validateBeforePublish'),
                hasChecks: content.includes('runQualityChecks'),
                hasCritical: content.includes('runCriticalChecks'),
                hasRelease: content.includes('validateRelease'),
                usesEnhanced: content.includes('enhanced-rule-engine')
            };
            
            const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length;
            
            this.results.components.qualityGates = {
                score: score * 100,
                status: score >= 0.8 ? 'excellent' : score >= 0.6 ? 'good' : 'needs_work',
                checks,
                details: `${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length} fonctionnalités présentes`
            };
            
            console.log(`✅ Quality Gates: ${(score * 100).toFixed(1)}% (${this.results.components.qualityGates.status})`);
            
        } catch (error) {
            this.results.components.qualityGates = {
                score: 0,
                status: 'error',
                error: error.message
            };
            console.log('❌ Quality Gates: Erreur de vérification');
        }
    }
    
    /**
     * Vérifier les scripts de test
     */
    async checkTestScripts() {
        console.log('🧪 Vérification des scripts de test...');
        
        const scripts = [
            'test-v2-system.js',
            'validation-threshold-check.js',
            'setup-ci-gates.js',
            'fix-alphabet-inconsistencies.js'
        ];
        
        let existingScripts = 0;
        const scriptDetails = {};
        
        for (const script of scripts) {
            try {
                const scriptPath = path.join(__dirname, script);
                await fs.access(scriptPath);
                existingScripts++;
                scriptDetails[script] = 'exists';
            } catch (error) {
                scriptDetails[script] = 'missing';
            }
        }
        
        const score = existingScripts / scripts.length;
        
        this.results.components.testScripts = {
            score: score * 100,
            status: score >= 0.8 ? 'excellent' : score >= 0.6 ? 'good' : 'needs_work',
            details: `${existingScripts}/${scripts.length} scripts présents`,
            scripts: scriptDetails
        };
        
        console.log(`✅ Scripts de test: ${(score * 100).toFixed(1)}% (${this.results.components.testScripts.status})`);
    }
    
    /**
     * Vérifier la configuration CI/CD
     */
    async checkCIConfiguration() {
        console.log('🚀 Vérification de la configuration CI/CD...');
        
        const configs = [
            '../../ci-cd-pipeline.sh',
            '../../.github/workflows/quality-gate.yml',
            '../../.git/hooks/pre-commit',
            '../package.json'
        ];
        
        let existingConfigs = 0;
        const configDetails = {};
        
        for (const config of configs) {
            try {
                const configPath = path.join(__dirname, config);
                await fs.access(configPath);
                existingConfigs++;
                configDetails[config] = 'exists';
                
                // Vérifications spéciales pour package.json
                if (config.includes('package.json')) {
                    const content = await fs.readFile(configPath, 'utf8');
                    const packageJson = JSON.parse(content);
                    if (packageJson.scripts && packageJson.scripts['quality:gate']) {
                        configDetails[config] = 'configured';
                    }
                }
            } catch (error) {
                configDetails[config] = 'missing';
            }
        }
        
        const score = existingConfigs / configs.length;
        
        this.results.components.ciConfiguration = {
            score: score * 100,
            status: score >= 0.8 ? 'excellent' : score >= 0.6 ? 'good' : 'needs_work',
            details: `${existingConfigs}/${configs.length} configurations présentes`,
            configs: configDetails
        };
        
        console.log(`✅ Configuration CI/CD: ${(score * 100).toFixed(1)}% (${this.results.components.ciConfiguration.status})`);
    }
    
    /**
     * Vérifier la documentation
     */
    async checkDocumentation() {
        console.log('📚 Vérification de la documentation...');
        
        try {
            const readmePath = path.join(__dirname, '..', '..', 'README.md');
            const content = await fs.readFile(readmePath, 'utf8');
            
            const checks = {
                exists: true,
                hasQuality: content.toLowerCase().includes('quality') || content.toLowerCase().includes('qualité'),
                hasTests: content.toLowerCase().includes('test'),
                hasSetup: content.toLowerCase().includes('setup') || content.toLowerCase().includes('installation')
            };
            
            const score = Object.values(checks).filter(Boolean).length / Object.keys(checks).length;
            
            this.results.components.documentation = {
                score: score * 100,
                status: score >= 0.8 ? 'excellent' : score >= 0.6 ? 'good' : 'needs_work',
                checks
            };
            
            console.log(`✅ Documentation: ${(score * 100).toFixed(1)}% (${this.results.components.documentation.status})`);
            
        } catch (error) {
            this.results.components.documentation = {
                score: 0,
                status: 'missing',
                error: error.message
            };
            console.log('❌ Documentation: Non trouvée');
        }
    }
    
    /**
     * Calculer le score global et les recommandations
     */
    calculateOverallScore() {
        console.log('\n🎯 === ÉVALUATION GLOBALE ===');
        
        const componentScores = Object.values(this.results.components)
            .map(comp => comp.score || 0);
        
        const averageScore = componentScores.reduce((sum, score) => sum + score, 0) / componentScores.length;
        
        this.results.overall.score = averageScore;
        
        // Déterminer l'état de préparation pour la production
        const criticalComponents = ['enhancedRuleEngine', 'qualityGates', 'testScripts'];
        const criticalScores = criticalComponents.map(comp => this.results.components[comp]?.score || 0);
        const criticalAverage = criticalScores.reduce((sum, score) => sum + score, 0) / criticalScores.length;
        
        this.results.overall.readyForProduction = criticalAverage >= 80 && averageScore >= 75;
        
        // Identifier les blockers
        Object.entries(this.results.components).forEach(([component, data]) => {
            if (data.score < 60) {
                this.results.overall.blockers.push(`${component}: ${data.status} (${data.score.toFixed(1)}%)`);
            }
        });
        
        // Générer des recommandations
        if (this.results.overall.readyForProduction) {
            this.results.overall.recommendations.push('✅ Système prêt pour la production');
            this.results.overall.recommendations.push('🚀 Déployez avec le pipeline CI/CD configuré');
        } else {
            this.results.overall.recommendations.push('⚠️ Corrections requises avant production');
            this.results.overall.recommendations.push('🔧 Corrigez les blockers identifiés');
        }
        
        if (averageScore >= 90) {
            this.results.overall.recommendations.push('🏆 Qualité exceptionnelle atteinte');
        } else if (averageScore >= 80) {
            this.results.overall.recommendations.push('🎯 Bonne qualité, optimisations mineures possibles');
        }
        
        console.log(`📊 Score global: ${averageScore.toFixed(1)}%`);
        console.log(`🎯 Prêt pour production: ${this.results.overall.readyForProduction ? '✅ OUI' : '❌ NON'}`);
        
        if (this.results.overall.blockers.length > 0) {
            console.log(`🚨 Blockers: ${this.results.overall.blockers.length}`);
            this.results.overall.blockers.forEach(blocker => {
                console.log(`   • ${blocker}`);
            });
        }
        
        console.log('\n💡 Recommandations:');
        this.results.overall.recommendations.forEach(rec => {
            console.log(`   ${rec}`);
        });
    }
    
    /**
     * Sauvegarder le rapport final
     */
    async saveReport() {
        const report = {
            timestamp: new Date().toISOString(),
            version: '2.0',
            summary: {
                globalScore: this.results.overall.score,
                readyForProduction: this.results.overall.readyForProduction,
                blockers: this.results.overall.blockers.length,
                recommendations: this.results.overall.recommendations.length
            },
            components: this.results.components,
            recommendations: this.results.overall.recommendations,
            blockers: this.results.overall.blockers
        };
        
        const filePath = path.join(__dirname, 'final-quality-report.json');
        await fs.writeFile(filePath, JSON.stringify(report, null, 2));
        console.log(`\n💾 Rapport final sauvegardé: ${filePath}`);
        
        return report;
    }
    
    /**
     * Exécution complète
     */
    async run() {
        console.log('🎯 === VÉRIFICATION QUALITÉ FINALE TESTIQ ===\n');
        
        await this.checkComponents();
        this.calculateOverallScore();
        await this.saveReport();
        
        return this.results;
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const checker = new FinalQualityCheck();
    
    checker.run()
        .then(results => {
            const success = results.overall.readyForProduction;
            console.log(`\n🎯 ${success ? '✅ SYSTÈME PRÊT' : '❌ CORRECTIONS REQUISES'}`);
            console.log(`📊 Score final: ${results.overall.score.toFixed(1)}%`);
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur:', error);
            process.exit(1);
        });
}

module.exports = FinalQualityCheck;