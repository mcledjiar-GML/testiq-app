const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.demo' });

// Import existing models
const User = require('../backend/models/User');
const Question = require('../backend/models/QuestionV2');

class DemoSeeder {
    constructor() {
        this.demoDbName = 'testiq_demo';
        this.mongoUri = process.env.MONGODB_URI || `mongodb://localhost:27017/${this.demoDbName}`;
    }

    async connect() {
        console.log(`[SEED] Connexion à MongoDB : ${this.mongoUri}`);
        await mongoose.connect(this.mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('[SEED] ✅ Connecté à MongoDB Demo');
    }

    async clearDatabase() {
        console.log('[SEED] 🧹 Nettoyage base demo...');
        const collections = await mongoose.connection.db.collections();
        
        for (let collection of collections) {
            await collection.deleteMany({});
            console.log(`[SEED] - Collection ${collection.collectionName} vidée`);
        }
    }

    async seedUsers() {
        console.log('[SEED] 👤 Création utilisateurs demo...');
        
        const demoUsers = [
            {
                name: 'Demo Viewer',
                email: 'demo@testiq.com',
                password: await bcrypt.hash('demo123', 10),
                role: 'viewer',
                isActive: true,
                createdAt: new Date()
            },
            {
                name: 'Test Client',
                email: 'client@example.com', 
                password: await bcrypt.hash('client123', 10),
                role: 'viewer',
                isActive: true,
                createdAt: new Date()
            }
        ];

        const users = await User.insertMany(demoUsers);
        console.log(`[SEED] ✅ ${users.length} utilisateurs créés`);
        return users;
    }

    async seedQuestions() {
        console.log('[SEED] 🧠 Import questions Raven...');
        
        // Importer questions depuis raven_questions.js
        const ravenQuestionsPath = path.join(__dirname, '../backend/raven_questions.js');
        
        if (!fs.existsSync(ravenQuestionsPath)) {
            throw new Error(`Fichier questions introuvable : ${ravenQuestionsPath}`);
        }

        // Import dynamique des questions
        delete require.cache[require.resolve('../backend/raven_questions.js')];
        const { ravenQuestions } = require('../backend/raven_questions.js');
        
        console.log(`[SEED] 📊 ${ravenQuestions.length} questions trouvées`);

        // Sélection représentative pour démo (15 questions max)
        const demoQuestions = this.selectDemoQuestions(ravenQuestions);
        
        console.log(`[SEED] 🎯 ${demoQuestions.length} questions sélectionnées pour démo`);

        // Validation Quality Gates sur chaque question
        let validQuestions = 0;
        const questionsToSeed = [];

        for (const question of demoQuestions) {
            const validation = this.validateQuestion(question);
            if (validation.isValid) {
                questionsToSeed.push({
                    ...question,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    version: 'demo-v1',
                    status: 'active'
                });
                validQuestions++;
            } else {
                console.warn(`[SEED] ⚠️ Question ${question.qid} échouée: ${validation.errors.join(', ')}`);
            }
        }

        if (questionsToSeed.length === 0) {
            throw new Error('Aucune question valide pour la démo');
        }

        const questions = await Question.insertMany(questionsToSeed);
        console.log(`[SEED] ✅ ${questions.length}/${demoQuestions.length} questions importées (${validQuestions} valides)`);
        
        return questions;
    }

    selectDemoQuestions(allQuestions) {
        // Sélection équilibrée par série (3 par série max)
        const seriesCount = {};
        const selected = [];
        
        for (const question of allQuestions) {
            const series = question.series || 'A';
            
            if (!seriesCount[series]) {
                seriesCount[series] = 0;
            }
            
            if (seriesCount[series] < 3 && selected.length < 15) {
                selected.push(question);
                seriesCount[series]++;
            }
        }
        
        console.log(`[SEED] 📈 Répartition: ${Object.entries(seriesCount).map(([s, c]) => `${s}:${c}`).join(', ')}`);
        return selected;
    }

    validateQuestion(question) {
        const errors = [];
        
        // 1. Options présentes (exactement 4)
        const options = question.options || question.choices || [];
        if (options.length !== 4) {
            errors.push(`${options.length} options au lieu de 4`);
        }
        
        // 2. Solution unique identifiable
        let correctCount = 0;
        if (question.correctAnswer !== undefined) correctCount++;
        if (question.solution !== undefined) correctCount++;
        if (question.answer !== undefined) correctCount++;
        
        if (correctCount === 0) {
            errors.push('Aucune solution identifiée');
        }
        
        // 3. Pas d'indices visibles
        const hintFields = ['hint', 'explanation', 'indice'];
        for (const field of hintFields) {
            if (question[field] && question[field].length > 0) {
                errors.push(`Indice visible: ${field}`);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    async createDemoData() {
        console.log('[SEED] 📊 Création données demo...');
        
        // Créer dossiers assets si nécessaire
        const assetsDir = path.join(process.cwd(), 'data', 'assets');
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
            console.log(`[SEED] 📁 Dossier assets créé: ${assetsDir}`);
        }
        
        // Stats demo dans la console
        const userCount = await User.countDocuments();
        const questionCount = await Question.countDocuments();
        
        console.log(`[SEED] 📈 Stats démo:`);
        console.log(`[SEED] - Utilisateurs: ${userCount}`);
        console.log(`[SEED] - Questions: ${questionCount}`);
        console.log(`[SEED] - Base: ${this.demoDbName}`);
    }

    async run() {
        try {
            console.log('🚀 [SEED] Démarrage seed démo TestIQ...\n');
            
            await this.connect();
            await this.clearDatabase();
            
            const users = await this.seedUsers();
            const questions = await this.seedQuestions();
            
            await this.createDemoData();
            
            console.log('\n🎉 [SEED] Seed démo terminé avec succès !');
            console.log(`[SEED] 🔗 Connexion démo: demo@testiq.com / demo123`);
            console.log(`[SEED] 🗄️ Base MongoDB: ${this.demoDbName}`);
            
        } catch (error) {
            console.error('\n💥 [SEED] Erreur lors du seed:', error.message);
            console.error(error.stack);
            process.exit(1);
        } finally {
            await mongoose.connection.close();
            console.log('[SEED] 📴 Connexion MongoDB fermée');
        }
    }
}

// Exécution si script appelé directement
if (require.main === module) {
    const seeder = new DemoSeeder();
    seeder.run();
}

module.exports = DemoSeeder;