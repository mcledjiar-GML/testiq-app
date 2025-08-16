#!/usr/bin/env node

// Script de démarrage pour le mode Production
const ModeLoader = require('../config/mode-loader');
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 DÉMARRAGE TESTIQ - MODE PRODUCTION');
console.log('=====================================');

try {
  // Initialiser la configuration production
  const config = ModeLoader.initialize('production');
  
  console.log('📊 Configuration Production:');
  console.log(`   • Port Backend: ${process.env.PORT || 5000}`);
  console.log(`   • Port Frontend: ${process.env.WEB_PORT || 3000}`);
  console.log(`   • Base de données: ${config.database.name}`);
  console.log(`   • Authentification: ${config.features.authentication ? '✅ Activée' : '❌ Désactivée'}`);
  console.log(`   • Routes Admin: ${config.features.adminRoutes ? '✅ Activées' : '❌ Désactivées'}`);
  console.log(`   • Import Masse: ${config.features.bulkImport ? '✅ Activé' : '❌ Désactivé'}`);
  console.log(`   • Monitoring: ${config.features.monitoring}`);
  
  // Définir les commandes
  const backendCmd = 'npm';
  const backendArgs = ['--prefix', 'backend', 'run', 'dev'];
  
  const frontendCmd = 'npm';
  const frontendArgs = ['--prefix', 'frontend', 'run', 'start'];
  
  console.log('\n🔧 Démarrage des services...');
  
  // Démarrer le backend
  const backend = spawn(backendCmd, backendArgs, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, MODE: 'production' }
  });
  
  // Démarrer le frontend (après 2 secondes)
  setTimeout(() => {
    const frontend = spawn(frontendCmd, frontendArgs, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, MODE: 'production' }
    });
    
    frontend.on('error', (error) => {
      console.error('❌ Erreur frontend:', error);
    });
  }, 2000);
  
  backend.on('error', (error) => {
    console.error('❌ Erreur backend:', error);
  });
  
  // Gestion propre de l'arrêt
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du mode production...');
    backend.kill();
    process.exit(0);
  });
  
  console.log('✅ Mode Production démarré');
  console.log('📱 Frontend: http://localhost:3000');
  console.log('🔧 Backend: http://localhost:5000');
  console.log('\n💡 Ctrl+C pour arrêter');
  
} catch (error) {
  console.error('❌ Erreur démarrage production:', error.message);
  process.exit(1);
}