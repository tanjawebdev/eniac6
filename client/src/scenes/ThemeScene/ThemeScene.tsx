import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useHardwareStore } from '../../stores/hardwareStore';
import { THEME_POT_MAPPING } from '@shared/constants';
import { PROGRAMMERS } from '../../data/programmers';
import './ThemeScene.css';

// Pot label config per theme
const THEME_POT_LABELS: Record<string, [string, string, string, string]> = {
  programming: ['SCALE', 'SPEED', 'CONTRAST', 'AMPLITUDE'],
  pioneering: ['RASTER', 'SPEED', 'DOT SIZE', 'CONTRAST'],
  recognition: ['DENSITY', 'SPEED', 'BLUR', 'ALPHA'],
  teamwork: ['SIZE', 'SPEED', 'COUNT', 'LINE DIST'],
};

export function ThemeScene() {
  const selectedTheme = useAppStore((state) => state.selectedTheme);
  const goHome = useAppStore((state) => state.goHome);

  const pots = useHardwareStore((state) => state.pots);
  const bananas = useHardwareStore((state) => state.banana);

  // Return to home if banana plug disconnects
  useEffect(() => {
    if (selectedTheme) {
      const tState = bananas[selectedTheme];
      const isConnected = tState && (tState.socket0 !== null || tState.socket1 !== null);
      // If the jack is unplugged, automatically kick back to home
      if (!isConnected) {
        goHome();
      }
    }
  }, [bananas, selectedTheme, goHome]);

  // Synchronize the selected programmer with the banana plugs connected to this theme
  useEffect(() => {
    if (selectedTheme) {
      const tState = bananas[selectedTheme];
      if (tState) {
        const activeProgKey = tState.socket0 || tState.socket1;
        if (activeProgKey) {
          const selectProgrammer = useAppStore.getState().selectProgrammer;
          const setActiveColor = useAppStore.getState().setActiveColor;
          const currentProgKey = useAppStore.getState().selectedProgrammer;

          if (currentProgKey !== activeProgKey) {
            selectProgrammer(activeProgKey);
            const prog = PROGRAMMERS[activeProgKey];
            if (prog) {
              setActiveColor(prog.color);
            }
          }
        }
      }
    }
  }, [bananas, selectedTheme]);

  // Read the 4 pots mapping to this theme
  const getPotValues = () => {
    if (!selectedTheme || !THEME_POT_MAPPING[selectedTheme]) {
      return { p0: 0, p1: 0, p2: 0, p3: 0 };
    }
    const { potStart } = THEME_POT_MAPPING[selectedTheme];
    return {
      p0: pots[potStart] ?? 0,
      p1: pots[potStart + 1] ?? 0,
      p2: pots[potStart + 2] ?? 0,
      p3: pots[potStart + 3] ?? 0,
    };
  };

  const { p0, p1, p2, p3 } = getPotValues();

  if (!selectedTheme) return null;

  const potLabels = THEME_POT_LABELS[selectedTheme] || ['POT 1', 'POT 2', 'POT 3', 'POT 4'];

  const pot0Percent = Math.round((p0 / 1023) * 100);
  const pot1Percent = Math.round((p1 / 1023) * 100);
  const pot2Percent = Math.round((p2 / 1023) * 100);
  const pot3Percent = Math.round((p3 / 1023) * 100);

  return (
    <div className="theme-scene programming-theme container-full">

      {/* Bottom Left: Name of the current theme */}
      <div className="programming-theme-label font-monospace" onClick={goHome}>
        {selectedTheme.toUpperCase()}
      </div>

      {/* Bottom Right: Potentiometer values */}
      <div className="programming-pot-dashboard font-monospace">
        <div className="pot-indicator-row">
          <span className="pot-label">{potLabels[0]}</span>
          <span className="pot-value">{pot0Percent}%</span>
        </div>
        <div className="pot-indicator-row">
          <span className="pot-label">{potLabels[1]}</span>
          <span className="pot-value">{pot1Percent}%</span>
        </div>
        <div className="pot-indicator-row">
          <span className="pot-label">{potLabels[2]}</span>
          <span className="pot-value">{pot2Percent}%</span>
        </div>
        <div className="pot-indicator-row">
          <span className="pot-label">{potLabels[3]}</span>
          <span className="pot-value">{pot3Percent}%</span>
        </div>
      </div>
    </div>
  );
}
