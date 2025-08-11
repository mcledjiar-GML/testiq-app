import React from 'react';

const PentagonSVG = ({ rotation = 0, size = 56, alt, withMarker = false }) => {
  // Pentagone régulier avec point de repère optionnel
  const centerX = 50;
  const centerY = 50;
  const radius = 35;
  
  // Calcul des 5 points du pentagone (commençant par le haut)
  const points = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i * 72 - 90 + rotation) * Math.PI / 180; // -90 pour commencer en haut
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  
  // Point de repère (petit cercle sur le premier sommet)
  const markerAngle = (-90 + rotation) * Math.PI / 180;
  const markerX = centerX + (radius + 8) * Math.cos(markerAngle);
  const markerY = centerY + (radius + 8) * Math.sin(markerAngle);

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      role="img"
      aria-label={alt}
    >
      {/* Pentagone avec contour uniquement (style uniforme) */}
      <polygon 
        points={points.join(' ')} 
        fill="none" 
        stroke="#000000" 
        strokeWidth="2.5"
      />
      
      {/* Point de repère pour indiquer l'orientation */}
      {withMarker && (
        <circle 
          cx={markerX} 
          cy={markerY} 
          r="3" 
          fill="#667eea"
        />
      )}
    </svg>
  );
};

export default PentagonSVG;