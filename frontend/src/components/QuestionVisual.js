import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';

/**
 * 🎨 COMPOSANT D'AFFICHAGE DES VISUELS PROFESSIONNELS
 * ================================================
 * 
 * Affiche les visualisations générées par le système Python backend
 * pour les questions nécessitant des supports visuels (matrices, diagrammes de Venn, etc.)
 */

function QuestionVisual({ questionId, questionContent, category, className = "" }) {
  const [visual, setVisual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasVisual, setHasVisual] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadVisual = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🎨 Chargement du visuel pour ${questionId}...`);
        
        const response = await api.post('/api/visual', {
          questionId,
          questionContent,
          category
        });

        if (response.data.success && response.data.hasVisual) {
          setVisual(response.data.visual);
          setHasVisual(true);
          console.log(`✅ Visuel chargé pour ${questionId}`);
        } else {
          setHasVisual(false);
          console.log(`ℹ️ Pas de visuel nécessaire pour ${questionId}`);
        }
        
      } catch (error) {
        console.error(`❌ Erreur chargement visuel ${questionId}:`, error);
        setError(error.message);
        setHasVisual(false);
      } finally {
        setLoading(false);
      }
    };

    if (questionId && questionContent) {
      loadVisual();
    }
  }, [questionId, questionContent, category]);

  // Pas de rendu si pas de visuel
  if (!hasVisual && !loading) {
    return null;
  }

  // État de chargement
  if (loading) {
    return (
      <div className={`question-visual-container ${className}`} style={{
        padding: '20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '15px',
        marginBottom: '20px',
        color: 'white'
      }}>
        <div style={{ 
          display: 'inline-block',
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '10px'
        }}></div>
        <p style={{ margin: '0', fontSize: '16px', fontWeight: '500' }}>
          🎨 Génération du visuel professionnel...
        </p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // État d'erreur
  if (error && !visual) {
    return (
      <div className={`question-visual-error ${className}`} style={{
        padding: '15px',
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '10px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <p style={{ 
          margin: '0', 
          color: '#856404', 
          fontSize: '14px',
          fontWeight: '500' 
        }}>
          ⚠️ Visuel temporairement indisponible
        </p>
      </div>
    );
  }

  // Affichage du visuel
  if (visual) {
    return (
      <div className={`question-visual-container ${className}`} style={{
        marginBottom: '25px',
        padding: '0',
        borderRadius: '15px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        background: 'white',
        border: '1px solid #e0e6ed'
      }}>
        {/* Header du visuel */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '12px 20px',
          fontWeight: '600',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>🎨</span>
          Visualisation Interactive
        </div>
        
        {/* Contenu du visuel */}
        <div style={{
          padding: '20px',
          textAlign: 'center',
          background: '#fafbfc'
        }}>
          <img 
            src={visual} 
            alt={`Visualisation pour ${questionId}`}
            style={{
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '10px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              background: 'white',
              padding: '10px'
            }}
            onError={(e) => {
              console.error('Erreur chargement image visuel:', e);
              setError('Impossible de charger le visuel');
            }}
          />
        </div>
        
        {/* Footer informatif */}
        <div style={{
          background: '#f8f9fa',
          padding: '10px 20px',
          fontSize: '12px',
          color: '#6c757d',
          textAlign: 'center',
          borderTop: '1px solid #e9ecef'
        }}>
          💡 Visuel généré par IA pour faciliter la compréhension
        </div>
      </div>
    );
  }

  return null;
}

export default QuestionVisual;