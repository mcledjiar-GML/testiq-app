// Configuration spécifique Démo
const sharedConfig = require('./shared');

module.exports = {
  ...sharedConfig,
  
  // Mode
  mode: 'demo',
  demo: true,
  
  // Features Démo Limitées
  features: {
    authentication: false,
    adminRoutes: false,
    bulkImport: false,
    export: true,
    monitoring: 'basic',
    analytics: false,
    emailNotifications: false,
    advancedLogging: false,
    cloudflaredTunnels: true
  },
  
  // Rate limiting Démo (plus strict)
  rateLimiting: {
    enabled: true,
    maxRequests: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes
    authMaxRequests: 3
  },
  
  // Sécurité Démo Renforcée
  security: {
    cors: {
      origin: '<FRONT_TUNNEL_URL>', // À remplacer par tunnel
      credentials: false
    },
    jwt: {
      expiresIn: '24h',
      algorithm: 'HS256'
    },
    helmet: {
      contentSecurityPolicy: true,
      hsts: false // Pas de HTTPS en démo locale
    }
  },
  
  // Base de données Démo (séparée)
  database: {
    name: 'testiq_demo',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 3000
    }
  },
  
  // Questions source Démo
  questionsSource: './modes/demo/demo-questions.js',
  explanationsSource: './modes/demo/demo-explanations.js',
  
  // Monitoring Démo Minimal
  monitoring: {
    slo: {
      throughput: 10,
      latency: 500,
      errorRate: 0.05,
      uptime: 0.95
    },
    alerts: {
      email: false,
      slack: false
    }
  },
  
  // Stockage Démo
  storage: {
    type: 'filesystem',
    path: './data/demo-assets',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/svg+xml']
  },
  
  // Limitations Démo
  limits: {
    maxTestsPerSession: 3,
    maxQuestionsPerTest: 12,
    sessionTimeoutMs: 30 * 60 * 1000 // 30 minutes
  }
};