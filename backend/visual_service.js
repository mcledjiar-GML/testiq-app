/**
 * 🎨 SERVICE DE GÉNÉRATION DE VISUELS TESTIQ
 * =========================================
 * 
 * Interface Node.js pour le générateur Python de visuels professionnels
 * Génère des images SVG/PNG/Base64 pour les questions IQ
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class VisualService {
    constructor() {
        this.pythonPath = 'python3'; // ou 'python' selon l'installation
        this.generatorScript = path.join(__dirname, 'visual_generator.py');
        this.cacheDir = path.join(__dirname, 'visual_cache');
        this.initializeCache();
    }

    async initializeCache() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
        } catch (error) {
            console.log('📁 Cache directory already exists or could not be created');
        }
    }

    /**
     * Génère un visuel pour une question donnée
     * @param {string} questionId - ID de la question (ex: Q14)  
     * @param {Object} questionData - Données de la question
     * @returns {Promise<string>} - Image en base64 ou URL
     */
    async generateVisual(questionId, questionData) {
        try {
            console.log(`🎨 Génération du visuel pour ${questionId}...`);
            
            // Vérifier le cache d'abord
            const cacheKey = this.generateCacheKey(questionId, questionData);
            const cachedVisual = await this.getCachedVisual(cacheKey);
            
            if (cachedVisual) {
                console.log(`📋 Visuel trouvé en cache pour ${questionId}`);
                return cachedVisual;
            }

            // Générer le visuel via Python
            const visualBase64 = await this.runPythonGenerator(questionId, questionData);
            
            // Mettre en cache
            await this.setCachedVisual(cacheKey, visualBase64);
            
            console.log(`✅ Visuel généré pour ${questionId}: ${visualBase64.length} caractères`);
            return visualBase64;
            
        } catch (error) {
            console.error(`❌ Erreur génération visuel ${questionId}:`, error);
            return null;
        }
    }

    /**
     * Exécute le script Python de génération
     */
    async runPythonGenerator(questionId, questionData) {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn(this.pythonPath, [
                '-c',
                `
import sys
import os
sys.path.append('${__dirname}')

from visual_generator import generate_visual_for_question
import json

# Données de la question depuis Node.js
question_data = ${JSON.stringify(questionData)}
question_id = "${questionId}"

try:
    # Génération du visuel
    visual_b64 = generate_visual_for_question(question_id, question_data)
    print(visual_b64)
except Exception as e:
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
                `
            ]);

            let result = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0 && result.trim()) {
                    resolve(result.trim());
                } else {
                    reject(new Error(`Python script failed: ${error || 'Unknown error'}`));
                }
            });

            pythonProcess.on('error', (err) => {
                reject(new Error(`Failed to spawn Python process: ${err.message}`));
            });
        });
    }

    /**
     * Gestion du cache des visuels
     */
    generateCacheKey(questionId, questionData) {
        const content = questionData.content || '';
        const category = questionData.category || '';
        const hash = require('crypto')
            .createHash('md5')
            .update(`${questionId}_${content}_${category}`)
            .digest('hex');
        return `visual_${hash}.json`;
    }

    async getCachedVisual(cacheKey) {
        try {
            const cachePath = path.join(this.cacheDir, cacheKey);
            const cacheData = await fs.readFile(cachePath, 'utf8');
            const cache = JSON.parse(cacheData);
            
            // Vérifier l'expiration (24h)
            const now = Date.now();
            const cacheAge = now - cache.timestamp;
            const maxAge = 24 * 60 * 60 * 1000; // 24 heures
            
            if (cacheAge < maxAge) {
                return cache.visual;
            } else {
                // Cache expiré, supprimer
                await fs.unlink(cachePath);
                return null;
            }
        } catch (error) {
            return null; // Pas de cache trouvé
        }
    }

    async setCachedVisual(cacheKey, visualData) {
        try {
            const cachePath = path.join(this.cacheDir, cacheKey);
            const cacheData = {
                timestamp: Date.now(),
                visual: visualData
            };
            await fs.writeFile(cachePath, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('⚠️ Impossible de mettre en cache le visuel:', error.message);
        }
    }

    /**
     * Nettoie le cache des visuels expirés
     */
    async cleanCache() {
        try {
            const files = await fs.readdir(this.cacheDir);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000;

            for (const file of files) {
                const filePath = path.join(this.cacheDir, file);
                const stats = await fs.stat(filePath);
                
                if (now - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath);
                    console.log(`🗑️ Cache expiré supprimé: ${file}`);
                }
            }
        } catch (error) {
            console.warn('⚠️ Erreur nettoyage cache:', error.message);
        }
    }

    /**
     * Détecte si un visuel est nécessaire pour une question
     */
    requiresVisual(questionData) {
        const content = (questionData.content || '').toLowerCase();
        const category = questionData.category || '';
        
        // Questions nécessitant des visuels
        const visualKeywords = [
            'matrice', 'rotation', 'transformation',
            'ensemble', 'inclusion-exclusion', 'venn',
            'fibonacci', 'spirale', 'géométrie',
            'graphe', 'diagramme', 'spatial'
        ];
        
        return visualKeywords.some(keyword => content.includes(keyword)) || 
               category === 'spatial';
    }
}

// Export singleton
const visualService = new VisualService();

// Nettoyage automatique du cache au démarrage
visualService.cleanCache();

module.exports = visualService;