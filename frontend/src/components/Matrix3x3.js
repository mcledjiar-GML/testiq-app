import React from 'react';

// Composants SVG demi-disques monochromes
const SemicircleSVG = ({ type = 'empty', alt }) => {
  const renderShape = () => {
    switch (type) {
      case 'empty':
        return (
          <circle 
            cx="50" 
            cy="50" 
            r="28" 
            fill="none" 
            stroke="#000000" 
            strokeWidth="2.5" 
          />
        );
      case 'half_up':
        return (
          <>
            <circle 
              cx="50" 
              cy="50" 
              r="28" 
              fill="none" 
              stroke="#000000" 
              strokeWidth="2.5" 
            />
            <path 
              d="M 22 50 A 28 28 0 0 1 78 50 Z" 
              fill="#000000" 
            />
          </>
        );
      case 'half_right':
        return (
          <>
            <circle 
              cx="50" 
              cy="50" 
              r="28" 
              fill="none" 
              stroke="#000000" 
              strokeWidth="2.5" 
            />
            <path 
              d="M 50 22 A 28 28 0 0 1 50 78 Z" 
              fill="#000000" 
            />
          </>
        );
      case 'half_down':
        return (
          <>
            <circle 
              cx="50" 
              cy="50" 
              r="28" 
              fill="none" 
              stroke="#000000" 
              strokeWidth="2.5" 
            />
            <path 
              d="M 78 50 A 28 28 0 0 1 22 50 Z" 
              fill="#000000" 
            />
          </>
        );
      case 'half_left':
        return (
          <>
            <circle 
              cx="50" 
              cy="50" 
              r="28" 
              fill="none" 
              stroke="#000000" 
              strokeWidth="2.5" 
            />
            <path 
              d="M 50 78 A 28 28 0 0 1 50 22 Z" 
              fill="#000000" 
            />
          </>
        );
      case 'full':
        return (
          <circle 
            cx="50" 
            cy="50" 
            r="28" 
            fill="#000000" 
            stroke="#000000" 
            strokeWidth="2.5" 
          />
        );
      default:
        return null;
    }
  };

  return (
    <svg width="60" height="60" viewBox="0 0 100 100" aria-label={alt}>
      {renderShape()}
    </svg>
  );
};

const Matrix3x3 = ({ showHint, onHintClick }) => {
  // Matrice demi-disques monochromes
  // Colonnes: vide → demi → plein (remplissage progresse)
  // Lignes: orientation tourne de +90° horaire
  
  const matrix = [
    // Ligne 1: empty → half_up → full
    [
      { type: 'empty', alt: 'cercle vide' },
      { type: 'half_up', alt: 'demi-cercle noir vers le haut' },
      { type: 'full', alt: 'cercle plein noir' }
    ],
    // Ligne 2: half_left → ? → half_right  
    [
      { type: 'half_left', alt: 'demi-cercle noir vers la gauche' },
      { type: 'empty_missing', alt: 'case à compléter' }, // Case manquante
      { type: 'half_right', alt: 'demi-cercle noir vers la droite' }
    ],
    // Ligne 3: full → half_down → empty
    [
      { type: 'full', alt: 'cercle plein noir' },
      { type: 'half_down', alt: 'demi-cercle noir vers le bas' },
      { type: 'empty', alt: 'cercle vide' }
    ]
  ];

  return (
    <div style={{
      background: '#ffffff',
      padding: '24px',
      borderRadius: '12px',
      border: '1px solid #e0e0e0',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        maxWidth: '300px',
        margin: '0 auto'
      }}>
        {matrix.flat().map((cell, index) => {
          const isMissingCell = cell.type === 'empty_missing';
          
          const renderShape = () => {
            if (isMissingCell) {
              return (
                <div style={{ 
                  fontSize: '32px', 
                  color: '#667eea', 
                  fontWeight: 'bold' 
                }}>
                  ?
                </div>
              );
            }
            
            return <SemicircleSVG type={cell.type} alt={cell.alt} />;
          };
          
          return (
            <div
              key={index}
              style={{
                width: '80px',
                height: '80px',
                border: isMissingCell ? '3px dashed #667eea' : '2px solid #e0e0e0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff'
              }}
              title={cell.alt}
              aria-label={cell.alt}
            >
              {renderShape()}
            </div>
          );
        })}
      </div>

      {/* Système d'indice optionnel */}
      {!showHint && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '16px'
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
              pointerEvents: 'auto'
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
          marginTop: '16px',
          fontSize: '13px',
          color: '#333',
          textAlign: 'center'
        }}>
          💡 <strong>Colonnes :</strong> remplissage vide → demi → plein <br/>
          <strong>Lignes :</strong> orientation tourne +90° horaire
        </div>
      )}
    </div>
  );
};

export default Matrix3x3;