import React from 'react';

const SemicircleSVG = ({ rotation, size = 56, alt }) => {
  // Définir les rotations pour chaque orientation selon votre spéc
  const rotations = {
    'up': 0,      // ◓ - demi-cercle noir en haut
    'right': 90,  // ◑ - demi-cercle noir à droite 
    'down': 180,  // ◒ - demi-cercle noir en bas
    'left': 270   // ◐ - demi-cercle noir à gauche
  };

  const rotate = rotations[rotation] || 0;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      style={{ display: 'block' }}
      role="img"
      aria-label={alt}
    >
      <defs>
        <clipPath id={`semicircle-${rotation}-${size}`}>
          <rect x="0" y="0" width="100" height="50" />
        </clipPath>
      </defs>
      <g transform={`rotate(${rotate} 50 50)`}>
        {/* Demi-cercle noir parfait - strictement identique pour tous */}
        <circle 
          cx="50" 
          cy="50" 
          r="35" 
          fill="#000000"
          clipPath={`url(#semicircle-${rotation}-${size})`}
          stroke="#000000"
          strokeWidth="3"
        />
      </g>
    </svg>
  );
};

export default SemicircleSVG;