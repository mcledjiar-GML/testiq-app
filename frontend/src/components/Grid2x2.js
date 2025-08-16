import React from 'react';

const Grid2x2 = ({ showHint, onHintClick, mode = 'grid' }) => {
  // Mode 'grid' pour grille 2×2, mode 'alternating' pour séquences alternées
  const isAlternating = mode === 'alternating';
  
  // Grille 2×2 avec règle d'équilibrage des formes ou séquence alternée
  const gridData = isAlternating 
    ? ['square_black', 'square_white', 'square_black', 'missing']
    : [
        ['triangle', 'square'],
        ['diamond', 'missing']
      ];

  const renderShape = (shape, size = 48) => {
    const commonStyles = {
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    switch (shape) {
      case 'triangle':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" style={commonStyles}>
            <polygon 
              points="50,15 85,75 15,75" 
              fill="#000000" 
              stroke="#000000" 
              strokeWidth="2"
            />
          </svg>
        );
      case 'square':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" style={commonStyles}>
            <rect 
              x="20" y="20" 
              width="60" height="60" 
              fill="#000000" 
              stroke="#000000" 
              strokeWidth="2"
            />
          </svg>
        );
      case 'square_black':
        return (
          <div style={{
            ...commonStyles,
            fontSize: Math.floor(size * 1.2),
            fontFamily: 'monospace'
          }}>
            ◼
          </div>
        );
      case 'square_white':
        return (
          <div style={{
            ...commonStyles,
            fontSize: Math.floor(size * 1.2),
            fontFamily: 'monospace'
          }}>
            ◻
          </div>
        );
      case 'diamond':
        return (
          <svg width={size} height={size} viewBox="0 0 100 100" style={commonStyles}>
            <polygon 
              points="50,15 85,50 50,85 15,50" 
              fill="none" 
              stroke="#000000" 
              strokeWidth="3"
            />
          </svg>
        );
      case 'missing':
        return (
          <div style={{
            ...commonStyles,
            border: '2px dashed #667eea',
            borderRadius: '8px',
            backgroundColor: '#f8f9ff',
            fontSize: Math.floor(size * 0.6),
            fontWeight: 'bold',
            color: '#667eea'
          }}>
            ?
          </div>
        );
      default:
        return null;
    }
  };

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
          💡 {isAlternating 
            ? 'Alternance simple entre carrés noirs (◼) et blancs (◻)'
            : 'Chaque forme doit apparaître une seule fois dans la grille 2×2'
          }
        </div>
      )}

      {/* Titre de la grille */}
      <div style={{
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '16px',
        color: '#333'
      }}>
        {isAlternating 
          ? 'Séquence alternée - Trouvez l\'élément suivant'
          : 'Grille 2×2 - Trouvez la forme manquante'
        }
      </div>

      {/* Grille ou séquence */}
      {isAlternating ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          margin: '20px 0'
        }}>
          {gridData.map((shape, index) => (
            <React.Fragment key={index}>
              <div style={{
                minWidth: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: shape === 'missing' ? '2px dashed #667eea' : '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: shape === 'missing' ? '#f8f9ff' : '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                {renderShape(shape, 48)}
              </div>
              {index < gridData.length - 1 && shape !== 'missing' && (
                <span style={{ color: '#667eea', fontSize: '24px', fontWeight: 'bold' }}>
                  →
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 80px)',
          gridTemplateRows: 'repeat(2, 80px)',
          gap: '12px',
          justifyContent: 'center',
          margin: '20px 0'
        }}>
          {gridData.flat().map((shape, index) => (
            <div
              key={index}
              style={{
                width: '80px',
                height: '80px',
                border: shape === 'missing' ? '2px dashed #667eea' : '2px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: shape === 'missing' ? '#f8f9ff' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              role={shape === 'missing' ? 'img' : undefined}
              aria-label={shape === 'missing' ? 'Case vide à compléter' : `Forme: ${shape}`}
            >
              {renderShape(shape, 48)}
            </div>
          ))}
        </div>
      )}

      {/* Explication de la règle */}
      <div style={{
        fontSize: '14px',
        color: '#666',
        fontStyle: 'italic',
        marginTop: '16px'
      }}>
        Règle : {isAlternating 
          ? 'Alternance ◼ → ◻ → ◼ → ◻'
          : 'Une forme de chaque type (△, □, ◇, ○)'
        }
      </div>
    </div>
  );
};

export default Grid2x2;