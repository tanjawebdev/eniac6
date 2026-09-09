import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useHardwareStore } from '../../stores/hardwareStore';
import { CanvasBackground } from '../../components/CanvasBackground/CanvasBackground';
import { SceneManager } from '../../components/SceneManager/SceneManager';
import { GlobalOverlay } from '../../components/GlobalOverlay/GlobalOverlay';
import { Hud } from '../../components/Hud/Hud';
import { DebugOverlay } from '../../components/DebugOverlay/DebugOverlay';
import { ProgrammerCardsOverlay } from '../../components/ProgrammerCardsOverlay/ProgrammerCardsOverlay';
import { PROGRAMMERS } from '../../data/programmers';
import { useSoundManager } from '../../hooks/useSoundManager';
import './AppShell.css';

export function AppShell() {
  // Sound system — only active on the main installation UI, not on /debug
  useSoundManager();
  const debugVisible = useAppStore((state) => state.debugVisible);
  const devScale = useAppStore((state) => state.devScale);
  const activeColor = useAppStore((state) => state.activeColor);
  const currentScene = useAppStore((state) => state.currentScene);
  const selectedTheme = useAppStore((state) => state.selectedTheme);
  const selectedProgKey = useAppStore((state) => state.selectedProgrammer);
  const setCardsVisible = useAppStore((state) => state.setCardsVisible);
  const nfcStates = useHardwareStore((state) => state.nfc);

  const allInserted =
    nfcStates.length === 6 &&
    nfcStates.every((n) => n.present && n.uid);

  const [scale, setScale] = useState(1);

  // When the scene changes to 'home', wait for the SceneManager fade transition
  // (0.6s) plus a settle buffer (500ms), then reveal the programmer cards.
  // Any scene departure resets cardsVisible=false via the store actions.
  useEffect(() => {
    if (currentScene !== 'home') return;
    const timer = window.setTimeout(() => setCardsVisible(true), 550);
    return () => window.clearTimeout(timer);
  }, [currentScene, setCardsVisible]);

  // Dynamic scale calculation to fit portrait 4K screen (2160x3840) on developer screens
  useEffect(() => {
    if (!devScale) {
      setScale(1);
      return;
    }

    const calculateScale = () => {
      const widthScale = window.innerWidth / 2160;
      const heightScale = window.innerHeight / 3840;
      // Fit to screen (contain)
      setScale(Math.min(widthScale, heightScale));
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [devScale]);

  // Set css custom property for dynamic color changes
  useEffect(() => {
    document.documentElement.style.setProperty('--active-color', activeColor);

    // Find the current selected programmer's dark color, or default to a dark tone
    let darkColor = '#222222';
    if (selectedProgKey) {
      const prog = PROGRAMMERS[selectedProgKey];
      if (prog) {
        darkColor = prog.colorDark;
      }
    } else if (selectedTheme) {
      const lastColor = useAppStore.getState().themeColors[selectedTheme];
      if (lastColor && lastColor !== '#333333') {
        const prog = Object.values(PROGRAMMERS).find(p => p.color === lastColor);
        if (prog) {
          darkColor = prog.colorDark;
        }
      }
    }
    document.documentElement.style.setProperty('--active-color-dark', darkColor);

    // Convert hex to rgb for glow
    const hex = activeColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.25)`);
  }, [activeColor, selectedProgKey, selectedTheme]);

  // Set background color property dynamically when any theme is active
  useEffect(() => {
    if (selectedTheme && selectedProgKey) {
      const prog = PROGRAMMERS[selectedProgKey];
      if (prog) {
        document.documentElement.style.setProperty('--bg-primary', prog.colorDark);
        return;
      }
    }
    document.documentElement.style.setProperty('--bg-primary', '#0a0a0a');
  }, [selectedTheme, selectedProgKey]);

  const shellStyle: React.CSSProperties = devScale
    ? {
      width: '2160px',
      height: '3840px',
      transform: `translate(-50%, -50%) scale(${scale})`,
      left: '50%',
      top: '50%',
      position: 'absolute',
    }
    : {};

  return (
    <div className={`app-shell-container ${devScale ? 'scaled-mode' : ''}`}>
      <div className={`app-shell ${currentScene === 'intro' ? 'is-intro' : ''} ${selectedTheme ? 'is-theme' : ''} ${allInserted ? 'all-inserted' : ''} theme-${selectedTheme || 'none'}`} style={shellStyle}>
        {/* Particle/Shape Animation Canvas */}
        <CanvasBackground />

        {/* HUD Info corners */}
        <Hud />

        {/* Dynamic Scene Loader */}
        <SceneManager />

        {/* Persistent Programmer Cards overlay */}
        <ProgrammerCardsOverlay />

        {/* Scanlines & Vignette CRT Filter */}
        <GlobalOverlay />

        {/* Live Dev Diagnostic panel */}
        {debugVisible && <DebugOverlay />}
      </div>
      {devScale && (
        <div className="scale-indicator">
          Dev Fit Scale: {(scale * 100).toFixed(1)}% (Press &apos;S&apos; to exit)
        </div>
      )}
    </div>
  );
}
