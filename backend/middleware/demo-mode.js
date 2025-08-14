/**
 * Middleware Demo Mode - Restrictions pour démo publique
 */

const demoModeRestrictions = (req, res, next) => {
    // Forcer le rôle viewer pour tous les utilisateurs en démo
    if (process.env.DEMO_MODE === 'true' && req.user) {
        req.user.role = 'viewer';
        req.user.permissions = ['read'];
    }
    
    next();
};

const blockAdminRoutes = (req, res, next) => {
    if (process.env.DISABLE_ADMIN_ROUTES === 'true') {
        const adminRoutes = ['/admin', '/management', '/settings', '/users'];
        
        if (adminRoutes.some(route => req.path.startsWith(route))) {
            return res.status(403).json({
                error: 'Accès administrateur désactivé en mode démo',
                message: 'Cette fonctionnalité n\'est pas disponible en démonstration'
            });
        }
    }
    
    next();
};

const demoRateLimit = (req, res, next) => {
    // Rate limiting renforcé pour démo publique
    if (process.env.DEMO_MODE === 'true') {
        req.rateLimit = {
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 50,
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000 // 15 min
        };
    }
    
    next();
};

module.exports = {
    demoModeRestrictions,
    blockAdminRoutes,
    demoRateLimit
};