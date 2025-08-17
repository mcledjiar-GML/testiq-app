// Features spécifiques au mode démo
const demoFeatures = {
  
  // Tunnels Cloudflare
  cloudflaredTunnels: {
    frontend: 'http://localhost:5173',
    backend: 'http://localhost:4000',
    autoGenerate: true,
    instructions: [
      'Terminal 1: cloudflared tunnel --url http://localhost:5173',
      'Terminal 2: cloudflared tunnel --url http://localhost:4000'
    ]
  },
  
  // Export seul (pas d'import)
  exportOnly: {
    formats: ['json', 'csv'],
    maxRecords: 100,
    anonymized: true
  },
  
  // Monitoring minimal
  monitoring: {
    basic: true,
    metrics: ['response_time', 'error_rate'],
    alerts: false,
    retention: '1 day'
  },
  
  // Limitations démo
  limitations: {
    maxTestsPerSession: 3,
    maxQuestionsPerTest: 12,
    sessionTimeout: '30 minutes',
    noUserAccounts: true
  },
  
  // Sécurité renforcée
  security: {
    noAdminAccess: true,
    readOnlyMode: true,
    rateLimitStrict: true,
    dataAnonymization: true
  }
};

module.exports = { demoFeatures };