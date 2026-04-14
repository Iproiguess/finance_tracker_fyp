import { useState } from 'react';

export function ScenarioSimulateButton({ onClick, style }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      style={{
        width: '100%',
        background: isHovered 
          ? 'linear-gradient(90deg, #1a5a8a 0%, #5ac5dd 100%)' 
          : 'linear-gradient(90deg, #2176ae 0%, #6dd5ed 100%)',
        color: '#232323',
        border: 'none',
        borderRadius: 8,
        padding: '14px',
        marginTop: 16,
        fontWeight: 700,
        fontSize: 16,
        cursor: 'pointer',
        boxShadow: isHovered 
          ? '0 6px 20px rgba(33,118,174,0.2)' 
          : '0 4px 16px rgba(33,118,174,0.10)',
        letterSpacing: '0.5px',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        ...style
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      Simulate Scenario
    </button>
  );
}
