import React from 'react';

const SemicircleOptionSVG = ({ type = 'empty', size = 56, alt }) => {
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
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      role="img"
      aria-label={alt}
    >
      {renderShape()}
    </svg>
  );
};

export default SemicircleOptionSVG;