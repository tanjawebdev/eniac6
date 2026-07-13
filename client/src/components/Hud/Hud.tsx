import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { useHardwareStore } from '../../stores/hardwareStore';
import { useSelectedProgrammer } from '../../hooks/useScene';
import { THEME_POT_MAPPING } from '@shared/constants';
import './Hud.css';

export function Hud() {
  const selectedProgrammer = useSelectedProgrammer();
  const selectedTheme = useAppStore((state) => state.selectedTheme);
  const currentScene = useAppStore((state) => state.currentScene);
  const pots = useHardwareStore((state) => state.pots);

  // Helper to extract values
  const getParamsDisplay = () => {
    let speed = 5.0;
    let size = 5.0;
    let rotate = 0.0;

    if (selectedTheme && THEME_POT_MAPPING[selectedTheme]) {
      const { potStart } = THEME_POT_MAPPING[selectedTheme];
      const pot0Val = pots[potStart] ?? 512;
      const pot1Val = pots[potStart + 1] ?? 512;
      const pot3Val = pots[potStart + 3] ?? 0;

      speed = (pot0Val / 1023) * 10;
      size = 1 + (pot1Val / 1023) * 9;
      rotate = (pot3Val / 1023) * 10;
    } else {
      const pot0Val = pots[0] ?? 512;
      const pot1Val = pots[1] ?? 512;
      const pot3Val = pots[3] ?? 0;

      speed = (pot0Val / 1023) * 10;
      size = 1 + (pot1Val / 1023) * 9;
      rotate = (pot3Val / 1023) * 10;
    }

    return {
      speed: speed.toFixed(1),
      scale: size.toFixed(1),
      rot: rotate.toFixed(1),
    };
  };

  const params = getParamsDisplay();

  const getCenterText = () => {
    if (currentScene === 'intro') {
      return '';
    }
    if (selectedProgrammer) {
      // Split name by \n to insert line break
      return selectedProgrammer.name.split('\n').map((line, idx) => (
        <React.Fragment key={idx}>
          {line}
          {idx < selectedProgrammer.name.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    }
    return (
      <>
        THE
        <br />
        ENIAC 6
      </>
    );
  };

  const centerText = getCenterText();

  // Hide HUD in intro, home, debug and reset scenes for a cleaner experience
  if (currentScene === 'intro' || currentScene === 'home' || currentScene === 'debug' || currentScene === 'reset') {
    return null;
  }

  return (
    <div className="hud-container">
      {/* Top Left: Year */}
      <div className="hud-top-left">
        <span className="hud-label">{selectedProgrammer?.year || '1945'}</span>
      </div>

      {/* Top Right: Realtime parameters */}
      <div className="hud-top-right">
        <span className="hud-param">{params.rot} rot</span>
        <span className="hud-param">{params.scale} scale</span>
        <span className="hud-param">{params.speed} speed</span>
      </div>

      {/* Centerpiece: Active Programmer name / Select instruction */}
      <div className="hud-center">
        <h1 className="hud-name glow-text">{centerText}</h1>
      </div>

      {/* Bottom Left: Role */}
      <div className="hud-bottom-left">
        <span className="hud-label">{selectedProgrammer?.role || 'installation'}</span>
      </div>

      {/* Bottom Right: Theme ID / Selected programmer shape */}
      <div className="hud-bottom-right">
        <span className="hud-label">
          {selectedTheme ? `${selectedTheme}` : '—'}
        </span>
      </div>
    </div>
  );
}
