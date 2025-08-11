import React from 'react';
import SemicircleSVG from './SemicircleSVG';

const RotationSequence = ({ showHint, onHintClick }) => {
  const sequence = [
    { rotation: 'up', alt: 'demi-cercle noir en haut' },
    { rotation: 'right', alt: 'demi-cercle noir à droite' },
    { rotation: 'down', alt: 'demi-cercle noir en bas' },
    { rotation: 'left', alt: 'demi-cercle noir à gauche' }
  ];

  return (
    <div style={{ 
      background: '#ffffff', 
      padding: '24px', 
      borderRadius: '12px',
      border: '1px solid #e0e0e0',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
    }}>
      {/* Bouton indice optionnel - pas d'overlay qui bloque */}
      {!showHint && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '16px',
          position: 'relative',
          zIndex: 1 // Reste au-dessus mais sans bloquer les options
        }}>
          <button
            onClick={onHintClick}
            style={{
              background: 'none',
              border: '1px solid #667eea',
              color: '#667eea',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              pointerEvents: 'auto' // Bouton cliquable
            }}
          >
            💡 Voir un indice (−10% du score)
          </button>
        </div>
      )}

      {/* Message d'indice si activé */}
      {showHint && (
        <div style={{
          background: '#f0f2ff',
          border: '1px solid #667eea',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#333'
        }}>
          💡 La forme tourne de 90° vers la droite à chaque étape
        </div>
      )}

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        {sequence.map((item, index) => (
          <div key={index} style={{ 
            display: 'flex', 
            alignItems: 'center',
            margin: '16px'
          }}>
            <SemicircleSVG 
              rotation={item.rotation} 
              size={64} 
              alt={item.alt}
            />
            {index < sequence.length - 1 && (
              <div style={{
                fontSize: '24px',
                color: '#667eea',
                margin: '0 8px',
                fontWeight: 'bold'
              }}>
                →
              </div>
            )}
          </div>
        ))}
        
        {/* Flèche vers point d'interrogation */}
        <div style={{
          fontSize: '24px',
          color: '#667eea',
          margin: '0 8px',
          fontWeight: 'bold'
        }}>
          →
        </div>

        {/* Point d'interrogation pour la position à compléter */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          margin: '16px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            border: '3px dashed #000000',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#000000',
            background: '#ffffff'
          }}>
            ?
          </div>
        </div>
      </div>
    </div>
  );
};

export default RotationSequence;