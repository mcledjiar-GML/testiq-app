// Chargeur de configuration dynamique selon le mode
const path = require('path');
const fs = require('fs');

class ModeLoader {
  
  /**
   * Charge la configuration selon le mode spécifié
   * @param {string} mode - 'production' ou 'demo'
   * @returns {object} Configuration complète
   */
  static loadConfig(mode = 'production') {
    try {
      console.log(`🔧 Chargement configuration mode: ${mode}`);
      
      // Valider le mode
      if (!['production', 'demo'].includes(mode)) {
        throw new Error(`Mode invalide: ${mode}. Modes supportés: production, demo`);
      }
      
      // Charger configuration partagée
      const sharedConfig = require('./shared.js');
      
      // Charger configuration spécifique au mode
      const modeConfigPath = path.join(__dirname, `${mode}.js`);
      if (!fs.existsSync(modeConfigPath)) {
        throw new Error(`Fichier de configuration manquant: ${modeConfigPath}`);
      }
      
      const modeConfig = require(modeConfigPath);
      
      // Fusionner les configurations
      const finalConfig = this.mergeConfigs(sharedConfig, modeConfig);
      
      console.log(`✅ Configuration ${mode} chargée avec succès`);
      console.log(`📊 Features activées:`, Object.keys(finalConfig.features || {}));
      
      return finalConfig;
      
    } catch (error) {
      console.error(`❌ Erreur chargement configuration ${mode}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Fusionne les configurations avec priorité au mode spécifique
   * @param {object} sharedConfig - Configuration partagée
   * @param {object} modeConfig - Configuration spécifique au mode
   * @returns {object} Configuration fusionnée
   */
  static mergeConfigs(sharedConfig, modeConfig) {
    return {
      ...sharedConfig,
      ...modeConfig,
      features: {
        ...(sharedConfig.features || {}),
        ...(modeConfig.features || {})
      },
      security: {
        ...(sharedConfig.security || {}),
        ...(modeConfig.security || {})
      },
      monitoring: {
        ...(sharedConfig.monitoring || {}),
        ...(modeConfig.monitoring || {})
      }
    };
  }
  
  /**
   * Charge les variables d'environnement selon le mode
   * @param {string} mode - Mode de fonctionnement
   */
  static loadEnvFile(mode) {
    const envFile = path.join(__dirname, `${mode}.env`);
    
    if (fs.existsSync(envFile)) {
      console.log(`🔧 Chargement variables d'environnement: ${envFile}`);
      require('dotenv').config({ path: envFile });
    } else {
      console.warn(`⚠️ Fichier .env manquant: ${envFile}`);
    }
  }
  
  /**
   * Détermine le mode à partir des variables d'environnement
   * @returns {string} Mode détecté
   */
  static detectMode() {
    const nodeEnv = process.env.NODE_ENV || 'production';
    const demoMode = process.env.DEMO_MODE === 'true';
    
    if (demoMode || nodeEnv === 'demo') {
      return 'demo';
    }
    
    return 'production';
  }
  
  /**
   * Initialise la configuration complète
   * @param {string} forcedMode - Mode forcé (optionnel)
   * @returns {object} Configuration complète
   */
  static initialize(forcedMode = null) {
    const mode = forcedMode || this.detectMode();
    
    console.log(`🚀 Initialisation TestIQ en mode: ${mode.toUpperCase()}`);
    
    // Charger variables d'environnement
    this.loadEnvFile(mode);
    
    // Charger configuration
    const config = this.loadConfig(mode);
    
    // Valider configuration
    this.validateConfig(config);
    
    return config;
  }
  
  /**
   * Valide la configuration chargée
   * @param {object} config - Configuration à valider
   */
  static validateConfig(config) {
    const required = ['mode', 'features', 'database'];
    
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Configuration invalide: champ manquant '${field}'`);
      }
    }
    
    console.log(`✅ Configuration validée`);
  }
}

module.exports = ModeLoader;