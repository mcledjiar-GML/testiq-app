import React from 'react';

const AlternatingSequence = ({ showHint, onHintClick, sequenceType = 'circles' }) => {
  // Définir les séquences selon le type
  const sequences = {
    circles: {
      items: ['⬤', '○', '⬤', '○'],
      missing: '⬤',
      rule: 'Alternance entre cercles noirs (⬤) et blancs (○)'
    },
    squares: {
      items: ['◼', '◻', '◼'],
      missing: '◻',
      rule: 'Alternance entre carrés noirs (◼) et blancs (◻)'
    },
    stars: {
      items: ['★', '☆', '★', '☆'],
      missing: '★',
      rule: 'Alternance entre étoiles pleines (★) et étoiles contour (☆)'
    }
  };

  const currentSequence = sequences[sequenceType] || sequences.circles;

  return (
    <div style={{ 
      background: '#ffffff', 
      padding: '24px', 
      borderRadius: '12px',
      border: '1px solid #e0e0e0',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      textAlign: 'center'
    }}>
      {/* Bouton indice */}
      {!showHint && (
        <div style={{ 
          marginBottom: '20px'
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
              fontSize: '12px'
            }}
          >
            💡 Voir un indice (−10% du score)
          </button>
        </div>
      )}

      {/* Message d'indice */}
      {showHint && (
        <div style={{
          background: '#f0f2ff',
          border: '1px solid #667eea',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#333'
        }}>
          💡 {currentSequence.rule}
        </div>
      )}

      {/* Titre de la séquence */}
      <div style={{
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '16px',
        color: '#333'
      }}>
        Séquence alternée - Trouvez l'élément suivant
      </div>

      {/* Séquence visuelle */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
        margin: '20px 0',
        fontSize: '48px',
        fontFamily: 'monospace'
      }}>
        {currentSequence.items.map((item, index) => (
          <React.Fragment key={index}>
            <div style={{
              minWidth: '70px',
              height: '70px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: '#ffffff',
              fontSize: '56px',
              fontFamily: 'Arial, sans-serif',
              color: item === '⬤' ? '#000' : 
                     item === '○' ? '#333' : 'inherit',
              fontWeight: item === '○' ? 'bold' : 'normal'
            }}>
              {item}
            </div>
            {index < currentSequence.items.length - 1 && (
              <span style={{ color: '#667eea', fontSize: '24px', fontWeight: 'bold' }}>
                →
              </span>
            )}
          </React.Fragment>
        ))}
        
        {/* Flèche vers point d'interrogation */}
        <span style={{ color: '#667eea', fontSize: '24px', fontWeight: 'bold' }}>
          →
        </span>

        {/* Point d'interrogation pour l'élément à compléter */}
        <div style={{
          minWidth: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #667eea',
          borderRadius: '8px',
          backgroundColor: '#f8f9ff',
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#667eea'
        }}>
          ?
        </div>
      </div>

      {/* Règle explicative */}
      <div style={{
        fontSize: '14px',
        color: '#666',
        fontStyle: 'italic',
        marginTop: '16px'
      }}>
        Règle : {currentSequence.rule}
      </div>
    </div>
  );
};

export default AlternatingSequence;