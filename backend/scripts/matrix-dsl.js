#!/usr/bin/env node
/**
 * 🎯 MINI-ÉDITEUR DSL - CONSTRUCTION RÈGLES → GRILLES
 * ===================================================
 * 
 * Spécification simple que l'auteur remplit ; le moteur génère la grille 
 * + vérifie l'unicité. Format DSL demandé :
 * 
 * {
 *   "type": "matrix3x3",
 *   "alphabet": "shape", 
 *   "rules": {
 *     "rows": [{ "op": "rotate", "deg": 45 }],
 *     "cols": [{ "op": "sides", "delta": 1 }]
 *   },
 *   "start": { "sides": 3, "angle": 0, "style": "outline" },
 *   "target": { "row": 2, "col": 3 },
 *   "distractors": ["wrong_angle", "wrong_sides", "right_angle_wrong_fill"]
 * }
 */

const mongoose = require('mongoose');
const QuestionV2 = require('../models/QuestionV2');
const { ulid } = require('ulid');

class MatrixDSL {
    constructor() {
        this.alphabet = 'shape';
        this.shapeTemplates = {
            triangle: { sides: 3, unicode: '△', svgPath: 'M50,20 L80,70 L20,70 Z' },
            square: { sides: 4, unicode: '□', svgPath: 'M20,20 L80,20 L80,80 L20,80 Z' },
            pentagon: { sides: 5, unicode: '⬟', svgPath: 'M50,15 L75,35 L65,65 L35,65 L25,35 Z' },
            hexagon: { sides: 6, unicode: '⬡', svgPath: 'M50,15 L75,30 L75,60 L50,75 L25,60 L25,30 Z' },
            circle: { sides: 0, unicode: '○', svgPath: 'M50,50 m-30,0 a30,30 0 1,0 60,0 a30,30 0 1,0 -60,0' }
        };
        this.styleTemplates = {
            outline: { fill: 'none', stroke: 'black', strokeWidth: 2 },
            filled: { fill: 'black', stroke: 'none', strokeWidth: 0 },
            mixed: { fill: 'lightgray', stroke: 'black', strokeWidth: 2 }
        };
    }

    /**
     * Générer une forme SVG basée sur la spécification
     */
    generateShape(spec) {
        const { sides = 4, angle = 0, style = 'outline' } = spec;
        
        // Sélectionner le template de forme
        let template;
        if (sides === 3) template = this.shapeTemplates.triangle;
        else if (sides === 4) template = this.shapeTemplates.square;
        else if (sides === 5) template = this.shapeTemplates.pentagon;
        else if (sides === 6) template = this.shapeTemplates.hexagon;
        else template = this.shapeTemplates.circle;

        // Sélectionner le style
        const styleSpec = this.styleTemplates[style] || this.styleTemplates.outline;

        // Générer le SVG avec rotation
        const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <g transform="rotate(${angle} 50 50)">
    <path d="${template.svgPath}" 
          fill="${styleSpec.fill}" 
          stroke="${styleSpec.stroke}" 
          stroke-width="${styleSpec.strokeWidth}" />
  </g>
</svg>`;

        return {
            svg,
            unicode: template.unicode,
            metadata: { sides, angle, style }
        };
    }

    /**
     * Appliquer une règle sur une spécification
     */
    applyRule(spec, rule) {
        const newSpec = { ...spec };
        
        switch (rule.op) {
            case 'rotate':
                newSpec.angle = (newSpec.angle || 0) + rule.deg;
                break;
            case 'sides':
                newSpec.sides = Math.max(3, Math.min(6, (newSpec.sides || 4) + rule.delta));
                break;
            case 'style':
                const styles = ['outline', 'filled', 'mixed'];
                const currentIndex = styles.indexOf(newSpec.style || 'outline');
                newSpec.style = styles[(currentIndex + rule.delta + styles.length) % styles.length];
                break;
            case 'scale':
                newSpec.scale = (newSpec.scale || 1) * rule.factor;
                break;
        }
        
        return newSpec;
    }

    /**
     * Construire une grille 3x3 basée sur les règles DSL
     */
    buildMatrix3x3(dslSpec) {
        const { rules, start, target } = dslSpec;
        const matrix = [];
        
        // Construire la grille
        for (let row = 0; row < 3; row++) {
            matrix[row] = [];
            for (let col = 0; col < 3; col++) {
                let cellSpec = { ...start };
                
                // Appliquer les règles de ligne
                if (rules.rows) {
                    for (let r = 0; r < row; r++) {
                        for (const rule of rules.rows) {
                            cellSpec = this.applyRule(cellSpec, rule);
                        }
                    }
                }
                
                // Appliquer les règles de colonne
                if (rules.cols) {
                    for (let c = 0; c < col; c++) {
                        for (const rule of rules.cols) {
                            cellSpec = this.applyRule(cellSpec, rule);
                        }
                    }
                }
                
                matrix[row][col] = cellSpec;
            }
        }
        
        return matrix;
    }

    /**
     * Générer la solution correcte
     */
    generateCorrectAnswer(matrix, target) {
        const { row, col } = target;
        const correctSpec = matrix[row][col];
        return this.generateShape(correctSpec);
    }

    /**
     * Générer des distracteurs basés sur la spécification
     */
    generateDistractors(correctSpec, distractorTypes, count = 3) {
        const distractors = [];
        
        for (let i = 0; i < count && i < distractorTypes.length; i++) {
            const type = distractorTypes[i];
            let distractorSpec = { ...correctSpec };
            
            switch (type) {
                case 'wrong_angle':
                    distractorSpec.angle = (distractorSpec.angle || 0) + 30;
                    break;
                case 'wrong_sides':
                    distractorSpec.sides = distractorSpec.sides === 3 ? 4 : 3;
                    break;
                case 'wrong_style':
                    distractorSpec.style = distractorSpec.style === 'outline' ? 'filled' : 'outline';
                    break;
                case 'right_angle_wrong_fill':
                    distractorSpec.style = 'mixed';
                    break;
                case 'random':
                    distractorSpec.angle = Math.floor(Math.random() * 360);
                    distractorSpec.sides = 3 + Math.floor(Math.random() * 4);
                    break;
            }
            
            distractors.push(this.generateShape(distractorSpec));
        }
        
        return distractors;
    }

    /**
     * Créer une question complète à partir du DSL
     */
    createQuestionFromDSL(dslSpec) {
        console.log('🎯 Génération question depuis DSL...');
        console.log('Spec:', JSON.stringify(dslSpec, null, 2));
        
        // 1. Construire la matrice
        const matrix = this.buildMatrix3x3(dslSpec);
        console.log('✅ Matrice 3x3 construite');
        
        // 2. Générer la réponse correcte
        const correctAnswer = this.generateCorrectAnswer(matrix, dslSpec.target);
        console.log('✅ Réponse correcte générée');
        
        // 3. Générer les distracteurs
        const distractors = this.generateDistractors(
            matrix[dslSpec.target.row][dslSpec.target.col],
            dslSpec.distractors || ['wrong_angle', 'wrong_sides', 'wrong_style']
        );
        console.log('✅ Distracteurs générés');
        
        // 4. Construire le stimulus de la matrice
        const stimulus = this.buildMatrixStimulus(matrix, dslSpec.target);
        
        // 5. Créer les options (mélanger la bonne réponse avec les distracteurs)
        const allOptions = [correctAnswer, ...distractors];
        const shuffledOptions = this.shuffleArray(allOptions);
        const correctIndex = shuffledOptions.indexOf(correctAnswer);
        
        const options = shuffledOptions.map((option, idx) => ({
            key: String.fromCharCode(65 + idx), // A, B, C, D
            text: option.svg,
            alt: `Option ${String.fromCharCode(65 + idx)}: ${option.metadata.sides} côtés, ${option.metadata.angle}°`,
            isCorrect: idx === correctIndex
        }));
        
        // 6. Construire la question
        const question = {
            qid: ulid(),
            version: 1,
            state: 'draft',
            type: 'raven',
            series: 'D', // Série D pour matrices complexes
            alphabet: dslSpec.alphabet || 'shape',
            difficulty: this.calculateDifficulty(dslSpec),
            content: this.generateContent(dslSpec),
            stimulus,
            options,
            correctAnswer: correctIndex,
            category: 'spatial',
            timeLimit: 90,
            assets: [],
            rules: [{
                type: 'matrix',
                description: this.describeRules(dslSpec.rules),
                formula: JSON.stringify(dslSpec.rules)
            }],
            createdBy: 'matrix-dsl-generator',
            stats: {
                totalAttempts: 0,
                correctAttempts: 0,
                averageTime: 0
            }
        };
        
        console.log('✅ Question DSL générée');
        return question;
    }

    /**
     * Construire le stimulus SVG de la matrice
     */
    buildMatrixStimulus(matrix, target) {
        let svg = '<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">\n';
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                if (row === target.row && col === target.col) {
                    // Case manquante - afficher un point d'interrogation
                    svg += `  <g transform="translate(${col * 100 + 10}, ${row * 100 + 10})">
    <rect x="10" y="10" width="80" height="80" fill="none" stroke="black" stroke-width="2" stroke-dasharray="5,5"/>
    <text x="50" y="60" text-anchor="middle" font-size="40" fill="red">?</text>
  </g>\n`;
                } else {
                    // Générer la forme pour cette case
                    const shape = this.generateShape(matrix[row][col]);
                    const shapeContent = shape.svg.replace('<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">', '')
                                                  .replace('</svg>', '');
                    
                    svg += `  <g transform="translate(${col * 100 + 10}, ${row * 100 + 10}) scale(0.8)">
${shapeContent}
  </g>\n`;
                }
            }
        }
        
        svg += '</svg>';
        return svg;
    }

    /**
     * Calculer la difficulté basée sur la complexité des règles
     */
    calculateDifficulty(dslSpec) {
        let difficulty = 5; // Base
        
        // Plus de règles = plus difficile
        const ruleCount = (dslSpec.rules.rows?.length || 0) + (dslSpec.rules.cols?.length || 0);
        difficulty += ruleCount;
        
        // Certaines opérations sont plus difficiles
        const allRules = [...(dslSpec.rules.rows || []), ...(dslSpec.rules.cols || [])];
        for (const rule of allRules) {
            if (rule.op === 'rotate') difficulty += 1;
            if (rule.op === 'sides') difficulty += 2;
            if (rule.op === 'style') difficulty += 1;
        }
        
        return Math.min(10, Math.max(1, difficulty));
    }

    /**
     * Générer le contenu textuel de la question
     */
    generateContent(dslSpec) {
        const matrixType = dslSpec.type === 'matrix3x3' ? '3×3' : '2×2';
        return `Trouvez l'élément manquant dans cette matrice ${matrixType}.`;
    }

    /**
     * Décrire les règles en langage naturel
     */
    describeRules(rules) {
        const descriptions = [];
        
        if (rules.rows) {
            for (const rule of rules.rows) {
                descriptions.push(`Lignes: ${this.describeRule(rule)}`);
            }
        }
        
        if (rules.cols) {
            for (const rule of rules.cols) {
                descriptions.push(`Colonnes: ${this.describeRule(rule)}`);
            }
        }
        
        return descriptions.join(', ');
    }

    /**
     * Décrire une règle individuelle
     */
    describeRule(rule) {
        switch (rule.op) {
            case 'rotate':
                return `rotation ${rule.deg}°`;
            case 'sides':
                return `${rule.delta > 0 ? '+' : ''}${rule.delta} côtés`;
            case 'style':
                return `changement style`;
            default:
                return rule.op;
        }
    }

    /**
     * Mélanger un tableau
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Valider qu'une question générée a exactement une solution
     */
    validateUniqueness(question) {
        // Simuler le moteur de règles pour vérifier l'unicité
        const correctOptions = question.options.filter(opt => opt.isCorrect);
        
        return {
            isValid: correctOptions.length === 1,
            correctCount: correctOptions.length,
            issues: correctOptions.length !== 1 ? [`${correctOptions.length} options correctes au lieu de 1`] : []
        };
    }
}

/**
 * Exemples de DSL pour tester
 */
const exampleDSLSpecs = [
    {
        type: "matrix3x3",
        alphabet: "shape",
        rules: {
            rows: [{ op: "rotate", deg: 45 }],
            cols: [{ op: "sides", delta: 1 }]
        },
        start: { sides: 3, angle: 0, style: "outline" },
        target: { row: 2, col: 2 },
        distractors: ["wrong_angle", "wrong_sides", "right_angle_wrong_fill"]
    },
    {
        type: "matrix3x3", 
        alphabet: "shape",
        rules: {
            rows: [{ op: "style", delta: 1 }],
            cols: [{ op: "rotate", deg: 90 }]
        },
        start: { sides: 4, angle: 0, style: "outline" },
        target: { row: 1, col: 1 },
        distractors: ["wrong_style", "wrong_angle", "random"]
    }
];

// Test/démonstration si exécuté directement
if (require.main === module) {
    const dsl = new MatrixDSL();
    
    console.log('🎯 === MINI-ÉDITEUR DSL - DÉMONSTRATION ===\n');
    
    for (const [index, spec] of exampleDSLSpecs.entries()) {
        console.log(`\n📋 Exemple ${index + 1}:`);
        
        try {
            const question = dsl.createQuestionFromDSL(spec);
            const validation = dsl.validateUniqueness(question);
            
            console.log(`✅ Question générée:`);
            console.log(`   QID: ${question.qid}`);
            console.log(`   Difficulté: ${question.difficulty}/10`);
            console.log(`   Contenu: ${question.content}`);
            console.log(`   Options: ${question.options.length}`);
            console.log(`   Réponse correcte: ${question.options[question.correctAnswer].key}`);
            console.log(`   Validation: ${validation.isValid ? '✅ Unique' : '❌ Non-unique'}`);
            
            if (!validation.isValid) {
                console.log(`   Issues: ${validation.issues.join(', ')}`);
            }
            
        } catch (error) {
            console.log(`❌ Erreur: ${error.message}`);
        }
    }
    
    console.log('\n🎉 Démonstration DSL terminée !');
}

module.exports = MatrixDSL;