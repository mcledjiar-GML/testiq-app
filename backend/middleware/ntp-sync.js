/**
 * ⏰ NTP SYNCHRONIZATION & TIME COHERENCE
 * ======================================
 * 
 * Synchronisation serveurs NTP pour cohérence métriques/alertes/timers
 */

const { execSync } = require('child_process');

class NTPSync {
    
    constructor() {
        this.ntpServers = [
            'pool.ntp.org',
            'time.google.com',
            'time.cloudflare.com'
        ];
        this.maxDriftMs = 1000; // 1 seconde max de dérive
    }
    
    /**
     * Vérifier synchronisation NTP
     */
    async checkNTPSync() {
        try {
            // Obtenir l'offset NTP actuel
            const offset = await this.getNTPOffset();
            
            const status = {
                synchronized: Math.abs(offset) < this.maxDriftMs,
                offsetMs: offset,
                timestamp: new Date().toISOString(),
                server: this.ntpServers[0]
            };
            
            if (!status.synchronized) {
                console.log(`⚠️ NTP: Dérive détectée ${offset}ms > ${this.maxDriftMs}ms`);
                global.monitoringSystem?.recordAlert('ntp_drift', { offset });
            }
            
            return status;
            
        } catch (error) {
            console.error('❌ NTP check failed:', error.message);
            return { synchronized: false, error: error.message };
        }
    }
    
    /**
     * Obtenir l'offset NTP (simulation - en prod utiliser ntpdate/chrony)
     */
    async getNTPOffset() {
        // En production, utiliser:
        // const output = execSync('ntpdate -q pool.ntp.org').toString();
        // Ou chrony: chronyc tracking
        
        // Simulation pour démo
        return Math.random() * 200 - 100; // -100 à +100ms
    }
    
    /**
     * Middleware pour injecter timestamp cohérent
     */
    static timestampMiddleware() {
        return (req, res, next) => {
            req.timestamp = Date.now();
            req.isoTimestamp = new Date().toISOString();
            next();
        };
    }
}

global.ntpSync = new NTPSync();
module.exports = NTPSync;