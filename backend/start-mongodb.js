const { MongoMemoryServer } = require('mongodb-memory-server-core');
const mongoose = require('mongoose');

let mongod = null;

const startMongoDB = async (persistent = false) => {
  try {
    const mode = persistent ? 'avec persistance démo' : 'temporaire';
    console.log(`🚀 Démarrage MongoDB en mémoire ${mode}...`);
    
    const config = {
      instance: {
        dbName: persistent ? 'testiq_demo' : 'iq_test_db'
      }
    };
    
    // Si mode persistant, utiliser un répertoire de données
    if (persistent) {
      const fs = require('fs');
      const path = require('path');
      const dataDir = path.join(__dirname, '../data/demo-persistent');
      
      // Créer le répertoire s'il n'existe pas
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('📁 Répertoire de données démo créé:', dataDir);
      }
      
      config.instance.storageEngine = 'wiredTiger';
      config.instance.args = ['--noprealloc', '--smallfiles'];
      config.binary = {
        systemBinary: undefined // Laisser mongodb-memory-server gérer le binaire
      };
    }
    
    mongod = await MongoMemoryServer.create(config);
    
    const uri = mongod.getUri();
    console.log(`✅ MongoDB en mémoire démarré sur: ${uri}`);
    
    // Connecter Mongoose
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Mongoose connecté à MongoDB en mémoire');
    
    // Garder le processus en vie
    process.env.MONGODB_URI = uri;
    console.log('🎯 Variable MONGODB_URI mise à jour');
    
    return uri;
  } catch (error) {
    console.error('❌ Erreur MongoDB en mémoire:', error);
    process.exit(1);
  }
};

const stopMongoDB = async () => {
  if (mongod) {
    await mongod.stop();
    console.log('🛑 MongoDB en mémoire arrêté');
  }
};

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  await stopMongoDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await stopMongoDB();
  process.exit(0);
});

if (require.main === module) {
  startMongoDB();
}

module.exports = { startMongoDB, stopMongoDB };