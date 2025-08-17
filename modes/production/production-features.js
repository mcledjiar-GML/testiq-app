// Features spécifiques au mode production
const productionFeatures = {
  
  // Routes administrateur
  adminRoutes: {
    '/admin/dashboard': 'Tableau de bord administrateur',
    '/admin/users': 'Gestion des utilisateurs',
    '/admin/questions': 'Gestion des questions',
    '/admin/stats': 'Statistiques détaillées',
    '/admin/backup': 'Sauvegarde système',
    '/admin/logs': 'Consultation des logs'
  },
  
  // Import en masse
  bulkImport: {
    maxFileSize: '10MB',
    supportedFormats: ['json', 'csv', 'xml'],
    validationStrict: true,
    batchSize: 100
  },
  
  // Monitoring avancé
  monitoring: {
    realtime: true,
    metrics: ['cpu', 'memory', 'disk', 'network'],
    alerts: ['email', 'slack', 'webhook'],
    retention: '30 days'
  },
  
  // Analytics complètes
  analytics: {
    userTracking: true,
    performanceMetrics: true,
    errorTracking: true,
    businessMetrics: true
  },
  
  // Notifications email
  emailNotifications: {
    enabled: true,
    templates: ['welcome', 'results', 'alerts', 'reports'],
    providers: ['smtp', 'sendgrid', 'ses']
  }
};

module.exports = { productionFeatures };