#!/usr/bin/env node
/**
 * 🛠️ AUTO-FIX QUALITÉ - SCRIPTS QUICK-WINS
 * =========================================
 * 
 * Scripts automatiques pour corriger rapidement les problèmes mineurs
 * détectés par le triage de qualité :
 * 
 * - Repères d'angle sur formes symétriques
 * - Conversion monochrome (suppression couleurs décoratives)
 * - Homogénéisation des options (dimensions, stroke)
 * - Suppression indices visibles
 * - Correction alphabet automatique
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const QuestionV2 = require('../models/QuestionV2');
require('dotenv').config();

class QualityAutoFix {
    constructor() {
        this.stats = {
            processed: 0,
            fixed: 0,
            errors: 0,
            fixes: {
                angle_markers: 0,
                monochrome: 0,
                option_homogeneity: 0,
                visible_hints: 0,
                alphabet_correction: 0
            }
        };
        this.errorLog = [];
    }

    async connect() {
        const mongoUri = process.env.MONGODB_URI?.replace('mongo:', 'localhost:') || 'mongodb://localhost:27017/iq_test_db';
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connecté à MongoDB');
    }

    async disconnect() {
        await mongoose.disconnect();
        console.log('📌 Connexion fermée');
    }

    /**
     * Exécuter toutes les corrections automatiques
     */
    async runAutoFix(options = {}) {
        console.log('🛠️ === AUTO-FIX QUALITÉ - QUICK WINS ===\n');

        try {
            await this.connect();

            // Charger les questions avec problèmes depuis le rapport CSV
            const questionsToFix = await this.loadProblematicQuestions();
            console.log(`📊 ${questionsToFix.length} questions à corriger\n`);

            // Appliquer les corrections par catégorie
            if (options.all || options.alphabet) {
                await this.fixAlphabetIssues(questionsToFix);
            }

            if (options.all || options.hints) {
                await this.fixVisibleHints(questionsToFix);
            }

            if (options.all || options.colors) {
                await this.fixDecorativeColors(questionsToFix);
            }

            if (options.all || options.angles) {
                await this.addAngleMarkers(questionsToFix);
            }

            if (options.all || options.homogeneity) {
                await this.fixOptionHomogeneity(questionsToFix);
            }

            // Générer le rapport de corrections
            await this.generateFixReport();
            this.displaySummary();

            return this.stats;

        } finally {
            await this.disconnect();
        }
    }

    /**
     * Charger les questions problématiques depuis le rapport CSV
     */
    async loadProblematicQuestions() {
        try {
            // Chercher le dernier rapport CSV
            const scriptDir = __dirname;
            const files = await fs.readdir(scriptDir);
            const csvFiles = files.filter(f => f.startsWith('quality-issues-') && f.endsWith('.csv'));
            
            if (csvFiles.length === 0) {
                console.log('⚠️ Aucun rapport CSV trouvé. Lancement du triage...');
                // Lancer le triage d'abord
                const QualityTriage = require('./triage-quality-issues');
                const triage = new QualityTriage();
                await triage.runTriage();
                return await this.loadProblematicQuestions();
            }

            const latestCsv = csvFiles.sort().pop();
            const csvPath = path.join(scriptDir, latestCsv);
            console.log(`📄 Chargement du rapport: ${latestCsv}`);

            const csvContent = await fs.readFile(csvPath, 'utf8');
            const lines = csvContent.split('\n').slice(1); // Skip header

            const problematicQuestions = [];
            for (const line of lines) {
                if (line.trim()) {
                    const [qid, version, questionIndex, tags, reason] = this.parseCsvLine(line);
                    if (qid) {
                        problematicQuestions.push({
                            qid,
                            version: parseInt(version),
                            questionIndex: questionIndex !== 'N/A' ? parseInt(questionIndex) : null,
                            tags: tags.split(';').filter(t => t),
                            reason
                        });
                    }
                }
            }

            return problematicQuestions;

        } catch (error) {
            console.error('❌ Erreur chargement rapport:', error.message);
            return [];
        }
    }

    /**
     * Parser une ligne CSV en gérant les guillemets
     */
    parseCsvLine(line) {
        const columns = [];
        let currentColumn = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Double quote - add a single quote to the column
                    currentColumn += '"';
                    i++; // Skip the next quote
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // End of column
                columns.push(currentColumn.trim());
                currentColumn = '';
            } else {
                currentColumn += char;
            }
        }
        
        // Add the last column
        columns.push(currentColumn.trim());
        
        return columns;
    }

    /**
     * Corriger les problèmes d'alphabet automatiquement
     */
    async fixAlphabetIssues(problematicQuestions) {
        console.log('🔤 Correction des incohérences d\'alphabet...');

        const alphabetIssues = problematicQuestions.filter(q => 
            q.tags.includes('alphabet_mismatch')
        );

        for (const issue of alphabetIssues) {
            try {
                const question = await QuestionV2.findOne({ qid: issue.qid, version: issue.version });
                if (!question) continue;

                this.stats.processed++;

                // Détecter le bon alphabet depuis le contenu
                const detectedAlphabet = this.detectAlphabetFromContent(
                    question.content + ' ' + (question.stimulus || '')
                );

                console.log(`   Q${question.questionIndex}: alphabet '${question.alphabet}' vs détecté '${detectedAlphabet}'`);

                if (detectedAlphabet !== 'unknown' && detectedAlphabet !== question.alphabet) {
                    // Corriger l'alphabet principal
                    const oldAlphabet = question.alphabet;
                    question.alphabet = detectedAlphabet;
                    await question.save();

                    this.stats.fixes.alphabet_correction++;
                    this.stats.fixed++;
                    console.log(`   ✅ Q${question.questionIndex}: ${oldAlphabet} → ${detectedAlphabet}`);
                } else {
                    console.log(`   ⚪ Q${question.questionIndex}: alphabet déjà correct ou non détectable`);
                }

            } catch (error) {
                this.stats.errors++;
                this.errorLog.push({
                    qid: issue.qid,
                    error: 'alphabet_fix',
                    message: error.message
                });
            }
        }
    }

    /**
     * Supprimer les indices visibles
     */
    async fixVisibleHints(problematicQuestions) {
        console.log('👁️ Suppression des indices visibles...');

        const hintIssues = problematicQuestions.filter(q => 
            q.tags.includes('visible_hint')
        );

        for (const issue of hintIssues) {
            try {
                const question = await QuestionV2.findOne({ qid: issue.qid, version: issue.version });
                if (!question) continue;

                this.stats.processed++;
                let fixed = false;

                // Supprimer les formules mathématiques explicites
                const originalContent = question.content;
                let cleanedContent = question.content;

                // Nettoyer les formules visibles comme "+2", "×3", etc.
                cleanedContent = cleanedContent.replace(/[+\-×÷]\s*\d+/g, '?');
                cleanedContent = cleanedContent.replace(/=\s*\d+/g, '?');

                // Supprimer les mots d'indices
                const hintWords = ['indice', 'astuce', 'conseil', 'aide', 'solution', 'méthode', 'technique'];
                for (const word of hintWords) {
                    const regex = new RegExp(`\\b${word}\\b[^.]*\\.?`, 'gi');
                    cleanedContent = cleanedContent.replace(regex, '');
                }

                // Nettoyer les explications causales
                cleanedContent = cleanedContent.replace(/,?\s*car\s+[^.]*\.?/gi, '');
                cleanedContent = cleanedContent.replace(/,?\s*parce que\s+[^.]*\.?/gi, '');

                if (cleanedContent !== originalContent) {
                    question.content = cleanedContent.trim();
                    await question.save();
                    fixed = true;
                }

                if (fixed) {
                    this.stats.fixes.visible_hints++;
                    this.stats.fixed++;
                    console.log(`   ✅ Q${question.questionIndex}: indices supprimés`);
                }

            } catch (error) {
                this.stats.errors++;
                this.errorLog.push({
                    qid: issue.qid,
                    error: 'hint_fix',
                    message: error.message
                });
            }
        }
    }

    /**
     * Supprimer les couleurs décoratives
     */
    async fixDecorativeColors(problematicQuestions) {
        console.log('🎨 Conversion monochrome (suppression couleurs décoratives)...');

        const colorIssues = problematicQuestions.filter(q => 
            q.tags.includes('decorative_colors')
        );

        for (const issue of colorIssues) {
            try {
                const question = await QuestionV2.findOne({ qid: issue.qid, version: issue.version });
                if (!question) continue;

                this.stats.processed++;
                let fixed = false;

                // Nettoyer le stimulus SVG
                if (question.stimulus && question.stimulus.includes('<svg')) {
                    const cleanedStimulus = this.convertToMonochrome(question.stimulus);
                    if (cleanedStimulus !== question.stimulus) {
                        question.stimulus = cleanedStimulus;
                        fixed = true;
                    }
                }

                // Nettoyer les options avec SVG
                for (const option of question.options || []) {
                    if (option.text && option.text.includes('<svg')) {
                        const cleanedOption = this.convertToMonochrome(option.text);
                        if (cleanedOption !== option.text) {
                            option.text = cleanedOption;
                            fixed = true;
                        }
                    }
                }

                if (fixed) {
                    await question.save();
                    this.stats.fixes.monochrome++;
                    this.stats.fixed++;
                    console.log(`   ✅ Q${question.questionIndex}: converti en monochrome`);
                }

            } catch (error) {
                this.stats.errors++;
                this.errorLog.push({
                    qid: issue.qid,
                    error: 'color_fix',
                    message: error.message
                });
            }
        }
    }

    /**
     * Ajouter des repères d'angle sur les formes symétriques
     */
    async addAngleMarkers(problematicQuestions) {
        console.log('📐 Ajout de repères d\'angle sur formes symétriques...');

        const symmetryIssues = problematicQuestions.filter(q => 
            q.tags.includes('symmetry_ambiguous')
        );

        for (const issue of symmetryIssues) {
            try {
                const question = await QuestionV2.findOne({ qid: issue.qid, version: issue.version });
                if (!question) continue;

                this.stats.processed++;
                let fixed = false;

                // Ajouter repères sur stimulus
                if (question.stimulus && question.stimulus.includes('<svg')) {
                    const markedStimulus = this.addAngleMarkersToSvg(question.stimulus);
                    if (markedStimulus !== question.stimulus) {
                        question.stimulus = markedStimulus;
                        fixed = true;
                    }
                }

                // Ajouter repères sur options
                for (const option of question.options || []) {
                    if (option.text && option.text.includes('<svg')) {
                        const markedOption = this.addAngleMarkersToSvg(option.text);
                        if (markedOption !== option.text) {
                            option.text = markedOption;
                            fixed = true;
                        }
                    }
                }

                if (fixed) {
                    await question.save();
                    this.stats.fixes.angle_markers++;
                    this.stats.fixed++;
                    console.log(`   ✅ Q${question.questionIndex}: repères d'angle ajoutés`);
                }

            } catch (error) {
                this.stats.errors++;
                this.errorLog.push({
                    qid: issue.qid,
                    error: 'angle_fix',
                    message: error.message
                });
            }
        }
    }

    /**
     * Homogénéiser les options (dimensions, stroke)
     */
    async fixOptionHomogeneity(problematicQuestions) {
        console.log('📏 Homogénéisation des options...');

        // Pour toutes les questions, normaliser les viewBox et styles
        const allQuestions = await QuestionV2.find({});

        for (const question of allQuestions) {
            try {
                this.stats.processed++;
                let fixed = false;

                if (question.options && question.options.length > 0) {
                    // Normaliser les viewBox et styles
                    const standardViewBox = '0 0 100 100';
                    const standardStroke = 'stroke-width="2"';

                    for (const option of question.options) {
                        if (option.text && option.text.includes('<svg')) {
                            let normalizedSvg = option.text;

                            // Normaliser viewBox
                            normalizedSvg = normalizedSvg.replace(/viewBox="[^"]*"/, `viewBox="${standardViewBox}"`);
                            
                            // Normaliser stroke-width
                            normalizedSvg = normalizedSvg.replace(/stroke-width="[^"]*"/g, standardStroke);
                            
                            // Ajouter viewBox si manquant
                            if (!normalizedSvg.includes('viewBox=')) {
                                normalizedSvg = normalizedSvg.replace('<svg', `<svg viewBox="${standardViewBox}"`);
                            }

                            if (normalizedSvg !== option.text) {
                                option.text = normalizedSvg;
                                fixed = true;
                            }
                        }
                    }
                }

                if (fixed) {
                    await question.save();
                    this.stats.fixes.option_homogeneity++;
                    this.stats.fixed++;
                    console.log(`   ✅ Q${question.questionIndex}: options homogénéisées`);
                }

            } catch (error) {
                this.stats.errors++;
                this.errorLog.push({
                    qid: question.qid,
                    error: 'homogeneity_fix',
                    message: error.message
                });
            }
        }
    }

    /**
     * Détecter l'alphabet depuis le contenu
     */
    detectAlphabetFromContent(content) {
        if (!content) return 'unknown';

        if (/[◼◻▦▪⬛⬜□■]/.test(content)) return 'shape';
        if (/[◐◑◒◓]/.test(content)) return 'semicircle';
        if (/[↑↓←→⬆⬇⬅➡]/.test(content)) return 'arrow';
        if (/[●○⚫⚪]/.test(content)) return 'dot';
        if (/\b[0-9]+\b/.test(content)) return 'number';
        if (/\b[A-Z]\b/.test(content)) return 'letter';

        return 'shape'; // Par défaut
    }

    /**
     * Convertir SVG en monochrome
     */
    convertToMonochrome(svgContent) {
        let monochrome = svgContent;

        // Remplacer toutes les couleurs par noir/blanc
        monochrome = monochrome.replace(/fill="[^"]*"/g, 'fill="black"');
        monochrome = monochrome.replace(/stroke="[^"]*"/g, 'stroke="black"');
        
        // Supprimer les gradients
        monochrome = monochrome.replace(/<defs>[\s\S]*?<\/defs>/g, '');
        monochrome = monochrome.replace(/fill="url\([^)]*\)"/g, 'fill="black"');

        return monochrome;
    }

    /**
     * Ajouter des repères d'angle à un SVG
     */
    addAngleMarkersToSvg(svgContent) {
        let marked = svgContent;

        // Ajouter un petit cercle rouge en haut-droite pour indiquer l'orientation
        const marker = '<circle cx="90" cy="10" r="3" fill="red" />';
        
        // Insérer avant la fermeture du SVG
        marked = marked.replace('</svg>', `  ${marker}\n</svg>`);

        return marked;
    }

    /**
     * Générer le rapport de corrections
     */
    async generateFixReport() {
        const timestamp = new Date().toISOString().split('T')[0];
        
        const report = {
            metadata: {
                generatedAt: new Date().toISOString(),
                totalProcessed: this.stats.processed,
                totalFixed: this.stats.fixed,
                totalErrors: this.stats.errors
            },
            fixes: this.stats.fixes,
            errors: this.errorLog
        };

        const filePath = path.join(__dirname, `auto-fix-report-${timestamp}.json`);
        await fs.writeFile(filePath, JSON.stringify(report, null, 2));
        console.log(`\n📋 Rapport de corrections: ${filePath}`);
    }

    /**
     * Afficher le résumé
     */
    displaySummary() {
        console.log('\n🎯 === RÉSUMÉ DES CORRECTIONS ===');
        console.log(`📊 Questions traitées: ${this.stats.processed}`);
        console.log(`✅ Questions corrigées: ${this.stats.fixed}`);
        console.log(`❌ Erreurs: ${this.stats.errors}`);

        console.log('\n🛠️ Corrections appliquées:');
        for (const [fix, count] of Object.entries(this.stats.fixes)) {
            if (count > 0) {
                console.log(`   ${fix}: ${count}`);
            }
        }
    }
}

// Exécution si appelé directement
if (require.main === module) {
    const autoFix = new QualityAutoFix();
    
    const args = process.argv.slice(2);
    const options = {
        all: args.includes('--all'),
        alphabet: args.includes('--alphabet'),
        hints: args.includes('--hints'),
        colors: args.includes('--colors'),
        angles: args.includes('--angles'),
        homogeneity: args.includes('--homogeneity')
    };

    // Si aucune option spécifique, faire tout
    if (!Object.values(options).some(v => v)) {
        options.all = true;
    }

    autoFix.runAutoFix(options)
        .then(stats => {
            console.log('\n🎉 Auto-fix terminé avec succès !');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Erreur lors de l\'auto-fix:', error);
            process.exit(1);
        });
}

module.exports = QualityAutoFix;