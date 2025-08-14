#!/usr/bin/env node
/**
 * 🎯 VALIDATION CONTENU PRODUCTION
 * ================================
 * 
 * Échantillonnage de 30 items couvrant tous les alphabets pour validation production :
 * - Options cliquables vérifiées
 * - Indices non visibles confirmés 
 * - Alt-text présent pour accessibilité
 * - Options homogènes (même type, longueur équilibrée)
 * - Unicité vérifiée (moteur = 1 match unique)
 */

const QuestionV2 = require('../models/QuestionV2');
const EnhancedRuleEngine = require('./enhanced-rule-engine');

class ContentProductionValidator {
    
    constructor() {
        this.ruleEngine = new EnhancedRuleEngine();
        this.results = {
            sample: [],
            validation: {
                clickableOptions: { passed: 0, failed: 0, issues: [] },
                noVisibleHints: { passed: 0, failed: 0, issues: [] },
                altTextPresent: { passed: 0, failed: 0, issues: [] },
                homogeneousOptions: { passed: 0, failed: 0, issues: [] },
                uniqueSolution: { passed: 0, failed: 0, issues: [] }
            },
            coverage: {
                alphabets: new Set(),
                locales: new Set(),
                questionTypes: new Set()
            },
            summary: {
                totalSampled: 0,
                totalValidation: 0,
                overallScore: 0,
                readyForProduction: false
            }
        };
    }
    
    /**
     * Créer échantillon représentatif de 30 questions
     */
    async createRepresentativeSample() {
        console.log('🎯 Création échantillon représentatif...');
        
        // Récupérer toutes les questions publiées
        const allQuestions = await QuestionV2.find({ state: 'published' }).lean();
        
        if (allQuestions.length === 0) {
            throw new Error('Aucune question publiée trouvée');
        }
        
        console.log(`📊 ${allQuestions.length} questions publiées trouvées`);
        
        // Grouper par alphabet/type pour assurer diversité
        const groupedQuestions = this.groupQuestionsByAlphabet(allQuestions);
        
        // Sélectionner équitablement dans chaque groupe
        const sample = this.selectBalancedSample(groupedQuestions, 30);
        
        console.log(`✅ Échantillon de ${sample.length} questions créé`);
        console.log(`📋 Alphabets couverts: ${Array.from(this.results.coverage.alphabets).join(', ')}`);
        
        this.results.sample = sample;
        this.results.summary.totalSampled = sample.length;
        
        return sample;
    }
    
    /**
     * Grouper questions par alphabet/pattern
     */
    groupQuestionsByAlphabet(questions) {
        const groups = {};
        
        questions.forEach(question => {
            try {
                // Extraire l'alphabet des options si possible
                const alphabet = this.extractAlphabet(question);
                const locale = question.locale || 'default';
                
                const groupKey = `${alphabet}_${locale}`;
                
                if (!groups[groupKey]) {
                    groups[groupKey] = [];
                }
                
                groups[groupKey].push({
                    ...question,
                    _alphabet: alphabet,
                    _groupKey: groupKey
                });
                
                this.results.coverage.alphabets.add(alphabet);
                this.results.coverage.locales.add(locale);
                
            } catch (error) {
                // Groupe par défaut si extraction échoue
                const defaultKey = `unknown_${question.locale || 'default'}`;
                if (!groups[defaultKey]) {
                    groups[defaultKey] = [];
                }
                groups[defaultKey].push(question);
            }
        });
        
        console.log(`📂 ${Object.keys(groups).length} groupes créés`);
        
        return groups;
    }
    
    /**
     * Extraire l'alphabet d'une question
     */
    extractAlphabet(question) {
        if (!question.options || question.options.length === 0) {
            return 'no-options';
        }
        
        // Analyser les contenus d'options pour détecter l'alphabet
        const contents = question.options.map(opt => opt.content || '').join(' ');
        
        // Patterns d'alphabet courants
        const alphabetPatterns = {
            'latin': /[A-Za-z]/,
            'numbers': /[0-9]/,
            'geometric': /[△▲◇◆○●□■]/,
            'arrows': /[→↑←↓⇒⇑⇐⇓]/,
            'symbols': /[+\-×÷=<>]/,
            'greek': /[αβγδεζηθικλμνξοπρστυφχψω]/
        };
        
        for (const [name, pattern] of Object.entries(alphabetPatterns)) {
            if (pattern.test(contents)) {
                return name;
            }
        }
        
        // Détection spéciale pour matrices de formes
        if (question.image || contents.includes('matrix') || contents.includes('pattern')) {
            return 'visual-pattern';
        }
        
        return 'text-based';
    }
    
    /**
     * Sélection équilibrée dans chaque groupe
     */
    selectBalancedSample(groups, targetSize) {
        const sample = [];
        const groupKeys = Object.keys(groups);
        const samplesPerGroup = Math.max(1, Math.floor(targetSize / groupKeys.length));
        
        // Première passe : échantillonner équitablement
        groupKeys.forEach(groupKey => {
            const groupQuestions = groups[groupKey];
            const groupSample = this.randomSample(groupQuestions, samplesPerGroup);
            sample.push(...groupSample);
        });
        
        // Compléter si nécessaire avec échantillonnage aléatoire
        while (sample.length < targetSize && sample.length < Object.values(groups).flat().length) {
            const allRemaining = Object.values(groups).flat()
                .filter(q => !sample.find(s => s._id.toString() === q._id.toString()));
            
            if (allRemaining.length === 0) break;
            
            const randomQuestion = allRemaining[Math.floor(Math.random() * allRemaining.length)];
            sample.push(randomQuestion);
        }
        
        return sample.slice(0, targetSize);
    }
    
    /**
     * Échantillonnage aléatoire
     */
    randomSample(array, size) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(size, array.length));
    }
    
    /**
     * Valider options cliquables
     */
    validateClickableOptions(question) {
        const issues = [];
        
        if (!question.options || question.options.length === 0) {
            issues.push('Aucune option présente');
            return { passed: false, issues };
        }
        
        if (question.options.length !== 4) {
            issues.push(`${question.options.length} options au lieu de 4`);
        }
        
        question.options.forEach((option, index) => {
            if (!option.content || option.content.trim() === '') {
                issues.push(`Option ${index + 1}: contenu vide`);
            }
            
            // Vérifier présence de balisage pour interactivité
            if (typeof option.content === 'string' && option.content.length > 50) {
                issues.push(`Option ${index + 1}: contenu trop long (${option.content.length} chars)`);
            }
        });
        
        return {
            passed: issues.length === 0,
            issues
        };
    }
    
    /**
     * Valider absence d'indices visibles
     */
    validateNoVisibleHints(question) {
        const issues = [];
        const hintsPatterns = [
            /réponse|solution|correct/gi,
            /^\s*[A-D]\s*[:.]/m, // Pattern "A:" au début de ligne
            /\b(a|b|c|d)\s*est\s+(correct|faux|vrai)/gi,
            /indice|hint|clue/gi,
            /(attention|note|remarque)\s*:/gi
        ];
        
        // Vérifier dans le contenu principal
        if (question.content) {
            hintsPatterns.forEach(pattern => {
                if (pattern.test(question.content)) {
                    issues.push(`Indice potentiel dans contenu: ${pattern.source}`);
                }
            });
        }
        
        // Vérifier dans les options
        if (question.options) {
            question.options.forEach((option, index) => {
                if (option.content) {
                    hintsPatterns.forEach(pattern => {
                        if (pattern.test(option.content)) {
                            issues.push(`Indice potentiel option ${index + 1}: ${pattern.source}`);
                        }
                    });
                }
            });
        }
        
        // Vérifier patterns dans l'explication (si visible)
        if (question.explanation && !question.hideExplanation) {
            issues.push('Explication visible - pourrait révéler la réponse');
        }
        
        return {
            passed: issues.length === 0,
            issues
        };
    }
    
    /**
     * Valider présence alt-text pour accessibilité
     */
    validateAltTextPresent(question) {
        const issues = [];
        
        // Vérifier image principale
        if (question.image) {
            if (!question.imageAlt || question.imageAlt.trim() === '') {
                issues.push('Image principale sans alt-text');
            } else if (question.imageAlt.length < 10) {
                issues.push('Alt-text trop court (< 10 caractères)');
            }
        }
        
        // Vérifier images dans les options
        if (question.options) {
            question.options.forEach((option, index) => {
                if (option.image) {
                    if (!option.imageAlt || option.imageAlt.trim() === '') {
                        issues.push(`Option ${index + 1}: image sans alt-text`);
                    }
                }
                
                // Vérifier contenu HTML pour images
                if (option.content && option.content.includes('<img')) {
                    const altMatch = option.content.match(/alt\s*=\s*["']([^"']*)["']/i);
                    if (!altMatch || altMatch[1].trim() === '') {
                        issues.push(`Option ${index + 1}: image HTML sans alt`);
                    }
                }
            });
        }
        
        return {
            passed: issues.length === 0,
            issues
        };
    }
    
    /**
     * Valider homogénéité des options
     */
    validateHomogeneousOptions(question) {
        const issues = [];
        
        if (!question.options || question.options.length < 2) {
            issues.push('Pas assez d\'options pour vérifier homogénéité');
            return { passed: false, issues };
        }
        
        const options = question.options;
        const lengths = options.map(opt => (opt.content || '').length);
        const types = options.map(opt => this.classifyOptionType(opt));
        
        // Vérifier homogénéité des longueurs
        const maxLength = Math.max(...lengths);
        const minLength = Math.min(...lengths);
        const lengthRatio = maxLength / (minLength || 1);
        
        if (lengthRatio > 3) {
            issues.push(`Longueurs déséquilibrées: ${minLength}-${maxLength} chars (ratio ${lengthRatio.toFixed(1)})`);
        }
        
        // Vérifier homogénéité des types
        const uniqueTypes = [...new Set(types)];
        if (uniqueTypes.length > 1) {
            issues.push(`Types mixtes: ${uniqueTypes.join(', ')}`);
        }
        
        // Vérifier pattern cohérent pour contenus numériques
        if (types[0] === 'number') {
            const numbers = options.map(opt => parseFloat(opt.content));
            const hasPattern = this.detectNumberPattern(numbers);
            if (!hasPattern) {
                issues.push('Nombres sans pattern logique détectable');
            }
        }
        
        return {
            passed: issues.length === 0,
            issues
        };
    }
    
    /**
     * Classifier le type d'une option
     */
    classifyOptionType(option) {
        if (!option.content) return 'empty';
        
        const content = option.content.trim();
        
        if (/^\d+(\.\d+)?$/.test(content)) return 'number';
        if (/^[A-Za-z]+$/.test(content)) return 'text';
        if (option.image) return 'image';
        if (/[△▲◇◆○●□■]/.test(content)) return 'shape';
        if (/[→↑←↓⇒⇑⇐⇓]/.test(content)) return 'arrow';
        
        return 'mixed';
    }
    
    /**
     * Détecter un pattern dans les nombres
     */
    detectNumberPattern(numbers) {
        if (numbers.length < 3) return true; // Pas assez pour pattern
        
        const validNumbers = numbers.filter(n => !isNaN(n));
        if (validNumbers.length < 3) return false;
        
        // Pattern arithmétique
        const diff1 = validNumbers[1] - validNumbers[0];
        const diff2 = validNumbers[2] - validNumbers[1];
        if (Math.abs(diff1 - diff2) < 0.01) return true;
        
        // Pattern géométrique
        if (validNumbers[0] !== 0) {
            const ratio1 = validNumbers[1] / validNumbers[0];
            const ratio2 = validNumbers[2] / validNumbers[1];
            if (Math.abs(ratio1 - ratio2) < 0.01) return true;
        }
        
        return false;
    }
    
    /**
     * Valider unicité de la solution
     */
    async validateUniqueSolution(question) {
        const issues = [];
        
        try {
            // Utiliser le moteur de règles pour analyser
            const analysis = await this.ruleEngine.analyzeQuestion(question);
            
            if (!analysis.hasUniqueSolution) {
                issues.push('Solution non unique détectée par le moteur');
            }
            
            if (analysis.confidence < 0.7) {
                issues.push(`Confiance faible du moteur: ${(analysis.confidence * 100).toFixed(1)}%`);
            }
            
            // Vérifications supplémentaires
            const correctOptions = question.options?.filter(opt => opt.isCorrect) || [];
            
            if (correctOptions.length !== 1) {
                issues.push(`${correctOptions.length} options correctes au lieu de 1`);
            }
            
            // Vérifier que la règle détectée est cohérente
            if (analysis.detectedPattern && analysis.appliedToOptions) {
                const consistentOptions = analysis.appliedToOptions.filter(result => result.confidence > 0.5);
                if (consistentOptions.length < question.options?.length * 0.75) {
                    issues.push('Pattern incohérent appliqué aux options');
                }
            }
            
        } catch (error) {
            issues.push(`Erreur analyse moteur: ${error.message}`);
        }
        
        return {
            passed: issues.length === 0,
            issues
        };
    }
    
    /**
     * Exécuter toutes les validations sur l'échantillon
     */
    async validateSample() {
        console.log('🔍 Validation contenu échantillon...');
        
        let totalChecks = 0;
        
        for (const question of this.results.sample) {
            console.log(`   Validation Q${question.qid}...`);
            
            // 1. Options cliquables
            const clickableResult = this.validateClickableOptions(question);
            if (clickableResult.passed) {
                this.results.validation.clickableOptions.passed++;
            } else {
                this.results.validation.clickableOptions.failed++;
                this.results.validation.clickableOptions.issues.push({
                    qid: question.qid,
                    issues: clickableResult.issues
                });
            }
            
            // 2. Pas d'indices visibles
            const hintsResult = this.validateNoVisibleHints(question);
            if (hintsResult.passed) {
                this.results.validation.noVisibleHints.passed++;
            } else {
                this.results.validation.noVisibleHints.failed++;
                this.results.validation.noVisibleHints.issues.push({
                    qid: question.qid,
                    issues: hintsResult.issues
                });
            }
            
            // 3. Alt-text présent
            const altTextResult = this.validateAltTextPresent(question);
            if (altTextResult.passed) {
                this.results.validation.altTextPresent.passed++;
            } else {
                this.results.validation.altTextPresent.failed++;
                this.results.validation.altTextPresent.issues.push({
                    qid: question.qid,
                    issues: altTextResult.issues
                });
            }
            
            // 4. Options homogènes
            const homogeneousResult = this.validateHomogeneousOptions(question);
            if (homogeneousResult.passed) {
                this.results.validation.homogeneousOptions.passed++;
            } else {
                this.results.validation.homogeneousOptions.failed++;
                this.results.validation.homogeneousOptions.issues.push({
                    qid: question.qid,
                    issues: homogeneousResult.issues
                });
            }
            
            // 5. Solution unique
            const uniqueResult = await this.validateUniqueSolution(question);
            if (uniqueResult.passed) {
                this.results.validation.uniqueSolution.passed++;
            } else {
                this.results.validation.uniqueSolution.failed++;
                this.results.validation.uniqueSolution.issues.push({
                    qid: question.qid,
                    issues: uniqueResult.issues
                });
            }
            
            totalChecks += 5; // 5 validations par question
        }
        
        this.results.summary.totalValidation = totalChecks;
        
        // Calculer score global
        const totalPassed = Object.values(this.results.validation)
            .reduce((sum, category) => sum + category.passed, 0);
        
        this.results.summary.overallScore = (totalPassed / totalChecks) * 100;
        this.results.summary.readyForProduction = this.results.summary.overallScore >= 95;
        
        console.log(`✅ Validation terminée: ${this.results.summary.overallScore.toFixed(1)}% de réussite`);
    }
    
    /**
     * Générer rapport détaillé
     */
    generateReport() {
        console.log('\n📊 === RAPPORT VALIDATION CONTENU PRODUCTION ===');
        
        const categories = [
            { key: 'clickableOptions', name: 'Options cliquables' },
            { key: 'noVisibleHints', name: 'Pas d\'indices visibles' },
            { key: 'altTextPresent', name: 'Alt-text présent' },
            { key: 'homogeneousOptions', name: 'Options homogènes' },
            { key: 'uniqueSolution', name: 'Solution unique' }
        ];
        
        categories.forEach(({ key, name }) => {
            const result = this.results.validation[key];
            const total = result.passed + result.failed;
            const rate = total > 0 ? (result.passed / total) * 100 : 0;
            const status = rate >= 95 ? '✅' : '❌';
            
            console.log(`\n${status} ${name}: ${result.passed}/${total} (${rate.toFixed(1)}%)`);
            
            if (result.failed > 0) {
                console.log(`   ⚠️ ${result.failed} échecs détectés:`);
                result.issues.slice(0, 3).forEach(issue => {
                    console.log(`   • Q${issue.qid}: ${issue.issues.join(', ')}`);
                });
                if (result.issues.length > 3) {
                    console.log(`   • ... et ${result.issues.length - 3} autres`);
                }
            }
        });
        
        console.log('\n📋 COUVERTURE ÉCHANTILLON:');
        console.log(`• Questions échantillonnées: ${this.results.summary.totalSampled}`);
        console.log(`• Alphabets couverts: ${this.results.coverage.alphabets.size} (${Array.from(this.results.coverage.alphabets).join(', ')})`);
        console.log(`• Locales couvertes: ${this.results.coverage.locales.size} (${Array.from(this.results.coverage.locales).join(', ')})`);
        
        console.log('\n🎯 RÉSULTAT GLOBAL:');
        console.log(`• Score global: ${this.results.summary.overallScore.toFixed(1)}%`);
        console.log(`• Prêt pour production: ${this.results.summary.readyForProduction ? '✅ OUI' : '❌ NON'}`);
        
        if (!this.results.summary.readyForProduction) {
            console.log('\n🔧 ACTIONS REQUISES:');
            const failedCategories = categories.filter(({ key }) => {
                const result = this.results.validation[key];
                const total = result.passed + result.failed;
                return total > 0 && (result.passed / total) < 0.95;
            });
            
            failedCategories.forEach(({ name }) => {
                console.log(`• Corriger les problèmes de: ${name}`);
            });
        }
        
        return {
            timestamp: new Date().toISOString(),
            summary: this.results.summary,
            coverage: {
                alphabets: Array.from(this.results.coverage.alphabets),
                locales: Array.from(this.results.coverage.locales)
            },
            validation: this.results.validation,
            readyForProduction: this.results.summary.readyForProduction
        };
    }
    
    /**
     * Exécution complète
     */
    async run() {
        try {
            await this.createRepresentativeSample();
            await this.validateSample();
            const report = this.generateReport();
            
            return report;
            
        } catch (error) {
            console.error('💥 Erreur validation contenu:', error.message);
            throw error;
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const validator = new ContentProductionValidator();
    
    validator.run()
        .then(report => {
            console.log(`\n🎯 ${report.readyForProduction ? '✅ CONTENU VALIDÉ' : '❌ CORRECTIONS REQUISES'}`);
            console.log(`📊 Score: ${report.summary.overallScore.toFixed(1)}%`);
            process.exit(report.readyForProduction ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Erreur:', error);
            process.exit(1);
        });
}

module.exports = ContentProductionValidator;