import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { useHardwareStore } from '../../stores/hardwareStore';
import { PROGRAMMER_LIST } from '../../data/programmers';
import './ProgrammerCardsOverlay.css';

import { type ProgrammerKey } from '@shared/constants';

export function ProgrammerCardsOverlay() {
  const currentScene = useAppStore((state) => state.currentScene);
  const nfcStates = useHardwareStore((state) => state.nfc);

  // Only show cards overlay in home and theme scenes
  if (currentScene !== 'home' && currentScene !== 'theme') {
    return null;
  }

  // 12 columns are positioned left: 100 + idx * 150.
  // Center of each column is left + 45.
  const CARD_POSITIONS: Record<string, { x: number; y: number }> = {
    mcnulty: { x: 100 + 7 * 150 + 45, y: 960 },      // Kay (Col 7)
    jennings: { x: 100 + 5 * 150 + 45, y: 1171 },     // Jean (Col 5)
    wescoff: { x: 100 + 1 * 150 + 45, y: 1843 },      // Marlyn (Col 1)
    snyder: { x: 100 + 1 * 150 + 45, y: 3091 },       // Betty (Col 1)
    bilas: { x: 100 + 1 * 150 + 45, y: 3340 },        // Fran (Col 1)
    lichterman: { x: 100 + 5 * 150 + 45, y: 3340 },   // Ruth (Col 5)
  };

  const handleCardClick = (key: ProgrammerKey) => {
    const prog = PROGRAMMER_LIST.find((p) => p.key === key);
    if (prog) {
      useAppStore.getState().selectProgrammer(key);
      useAppStore.getState().setActiveColor(prog.color);
    }
  };

  return (
    <div className="programmer-cards-overlay">
      {PROGRAMMER_LIST.map((prog) => {
        const isNfcIn = nfcStates.some((n) => n.present && n.uid === prog.uid);
        const pos = CARD_POSITIONS[prog.key];
        const displayName = prog.key === 'wescoff' ? 'MARYL' : prog.firstName.toUpperCase();

        return (
          <div
            key={prog.key}
            className={`overlay-programmer-card ${isNfcIn ? 'inserted' : ''}`}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              '--accent-color': isNfcIn ? prog.color : 'rgba(255, 255, 255, 0.12)',
              '--accent-glow': isNfcIn ? `${prog.color}40` : 'rgba(255, 255, 255, 0.05)',
            } as React.CSSProperties}
            onClick={() => handleCardClick(prog.key)}
          >
            <span>{displayName}</span>
          </div>
        );
      })}
    </div>
  );
}
