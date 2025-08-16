// Configuration spécifique Production
const sharedConfig = require('./shared');

module.exports = {
  ...sharedConfig,
  
  // Mode
  mode: 'production',
  demo: false,
  
  // Features Production
  features: {
    authentication: true,
    adminRoutes: true,
    bulkImport: true,
    export: true,
    monitoring: 'full',
    analytics: true,
    emailNotifications: true,
    advancedLogging: true
  },
  
  // Rate limiting Production
  rateLimiting: {
    enabled: true,
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    authMaxRequests: 5
  },
  
  // Sécurité Production
  security: {
    cors: {
      origin: 'http://localhost:3000',
      credentials: true
    },
    jwt: {
      expiresIn: '24h',
      algorithm: 'HS256'
    },
    helmet: {
      contentSecurityPolicy: true,
      hsts: true
    }
  },
  
  // Base de données Production
  database: {
    name: 'iq_test_db',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    }
  },
  
  // Questions source
  questionsSource: './shared/raven_questions.js',
  explanationsSource: './shared/explanations.js',
  
  // Monitoring Production
  monitoring: {
    slo: {
      throughput: 50,
      latency: 200,
      errorRate: 0.01,
      uptime: 0.999
    },
    alerts: {
      email: true,
      slack: true
    }
  },
  
  // Stockage Production
  storage: {
    type: 'filesystem',
    path: './data/assets',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/svg+xml', 'image/png', 'image/jpeg']
  }
};