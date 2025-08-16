#!/usr/bin/env node

// Script de démarrage pour le mode Démo
const ModeLoader = require('../config/mode-loader');
const { spawn } = require('child_process');
const path = require('path');

console.log('🎯 DÉMARRAGE TESTIQ - MODE DÉMO');
console.log('===============================');

try {
  // Initialiser la configuration démo
  const config = ModeLoader.initialize('demo');
  
  console.log('📊 Configuration Démo:');
  console.log(`   • Port Backend: ${process.env.PORT || 4000}`);
  console.log(`   • Port Frontend: ${process.env.WEB_PORT || 5173}`);
  console.log(`   • Base de données: ${config.database.name}`);
  console.log(`   • Authentification: ${config.features.authentication ? '✅ Activée' : '❌ Désactivée'}`);
  console.log(`   • Routes Admin: ${config.features.adminRoutes ? '✅ Activées' : '❌ Bloquées'}`);
  console.log(`   • Import Masse: ${config.features.bulkImport ? '✅ Activé' : '❌ Désactivé'}`);
  console.log(`   • Tunnels Cloudflare: ${config.features.cloudflaredTunnels ? '✅ Supportés' : '❌ Non'}`);
  
  console.log('\n🔗 Instructions Tunnels Cloudflare:');
  console.log('   Terminal 1: cloudflared tunnel --url http://localhost:5173');
  console.log('   Terminal 2: cloudflared tunnel --url http://localhost:4000');
  
  // Définir les commandes
  const backendCmd = 'npm';
  const backendArgs = ['run', 'api:demo'];
  
  const frontendCmd = 'npm';
  const frontendArgs = ['run', 'web:demo'];
  
  console.log('\n🔧 Démarrage des services démo...');
  
  // Démarrer le backend démo
  const backend = spawn(backendCmd, backendArgs, {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, MODE: 'demo' }
  });
  
  // Démarrer le frontend démo (après 2 secondes)
  setTimeout(() => {
    const frontend = spawn(frontendCmd, frontendArgs, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, MODE: 'demo' }
    });
    
    frontend.on('error', (error) => {
      console.error('❌ Erreur frontend démo:', error);
    });
  }, 2000);
  
  backend.on('error', (error) => {
    console.error('❌ Erreur backend démo:', error);
  });
  
  // Gestion propre de l'arrêt
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du mode démo...');
    backend.kill();
    process.exit(0);
  });
  
  console.log('✅ Mode Démo démarré');
  console.log('📱 Frontend: http://localhost:5173');
  console.log('🔧 Backend: http://localhost:4000');
  console.log('\n💡 Ctrl+C pour arrêter');
  console.log('🌐 Utilisez cloudflared pour l\'accès externe');
  
} catch (error) {
  console.error('❌ Erreur démarrage démo:', error.message);
  process.exit(1);
}