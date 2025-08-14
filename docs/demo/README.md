# TestIQ Demo Mode

## Objectif
Démonstration 100% locale de TestIQ (Raven) avec base de données SQLite et stockage filesystem. Mode sécurisé pour présentations et tests.

## Configuration Active
- **Viewer Only**: Accès lecture seule par défaut
- **Admin Désactivé**: Routes d'administration bloquées
- **CORS Strict**: Origine contrôlée via tunnel
- **Sanitizer SVG**: Protection contre XSS activée

## Prérequis
- Node.js 18+
- npm
- Git

## Lancement Rapide

### Étapes
1. **Seed**: `npm run seed:demo`
2. **API Demo**: `npm run api:demo` (port 4000)
3. **Web Demo**: `npm run web:demo` (port 5173)
4. **Tunnels**: Configurer tunnels pour accès externe
5. **CORS**: Mettre à jour CORS_ALLOWED_ORIGIN dans .env.demo
6. **Check**: `npm run check:demo` pour validation

### Ports
- API: 4000
- Web: 5173