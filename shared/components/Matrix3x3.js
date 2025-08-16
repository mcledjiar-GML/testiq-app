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
  // Matrice cohérente avec les options Q7
  // Progression de remplissage croisée : ○ → ◐ → ◑ → ●
  // Case manquante: position (1,1) = centre
  
  const matrix = [
    // Ligne 0: ○ ◐ ◑ (empty → half-left → half-right)
    [
      { type: 'empty', symbol: '○', alt: 'Cercle vide' },
      { type: 'half_left', symbol: '◐', alt: 'Demi-remplissage à gauche' },
      { type: 'half_right', symbol: '◑', alt: 'Demi-remplissage à droite' }
    ],
    // Ligne 1: ◐ ? ● (half-left → MANQUANT → full)
    [
      { type: 'half_left', symbol: '◐', alt: 'Demi-remplissage à gauche' },
      { type: 'missing', symbol: '?', alt: 'Case manquante: demi-remplissage à droite attendu' },
      { type: 'full', symbol: '●', alt: 'Remplissage complet' }
    ],
    // Ligne 2: ◑ ● ○ (half-right → full → empty)
    [
      { type: 'half_right', symbol: '◑', alt: 'Demi-remplissage à droite' },
      { type: 'full', symbol: '●', alt: 'Remplissage complet' },
      { type: 'empty', symbol: '○', alt: 'Cercle vide' }
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
          const isMissingCell = cell.type === 'missing';
          
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
            
            // Mapper les types Q7 vers les types Matrix3x3
            const typeMapping = {
              'empty': 'empty',
              'half_left': 'half_left', 
              'half_right': 'half_right',
              'full': 'full'
            };
            
            const mappedType = typeMapping[cell.type] || cell.type;
            return <SemicircleSVG type={mappedType} alt={cell.alt} />;
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
          💡 <strong>Progression croisée :</strong> ○ → ◐ → ◑ → ● <br/>
          <strong>Case manquante :</strong> centre (1,1) = ◑ demi-droite
        </div>
      )}
    </div>
  );
};

export default Matrix3x3;