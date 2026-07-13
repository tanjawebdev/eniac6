import React from 'react';
import type { ProgrammerData } from '../../data/programmers';
import './ProgrammerCard.css';

interface ProgrammerCardProps {
  programmer: ProgrammerData;
  isActive: boolean;
  isNfcPresent: boolean;
  onClick?: () => void;
}

export function ProgrammerCard({ programmer, isActive, isNfcPresent, onClick }: ProgrammerCardProps) {
  // Setup inline CSS custom properties for this specific programmer
  const cardStyle = {
    '--programmer-color': programmer.color,
    '--programmer-glow': `${programmer.color}44`,
  } as React.CSSProperties;

  return (
    <div
      className={`programmer-card glass-panel ${isActive ? 'active' : ''} ${
        isNfcPresent ? 'nfc-in' : ''
      }`}
      style={cardStyle}
      onClick={onClick}
    >
      <div className="card-header-glow" />

      {/* Swatch circle */}
      <div className="card-color-swatch-container">
        <div
          className="card-color-swatch"
          style={{
            background: programmer.color,
            boxShadow: `0 0 16px ${programmer.color}66`,
          }}
        />
        {isNfcPresent && <div className="card-nfc-pulse" />}
      </div>

      {/* Name */}
      <div className="card-info">
        <h3 className="card-name">
          {programmer.name.split('\n').map((line, idx) => (
            <React.Fragment key={idx}>
              {line}
              {idx < programmer.name.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </h3>
        <span className="card-role">{programmer.role}</span>
      </div>

      {isNfcPresent && <div className="card-nfc-label">NFC ACTIVE</div>}
    </div>
  );
}
