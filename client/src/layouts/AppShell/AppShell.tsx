import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { CanvasBackground } from '../../components/CanvasBackground/CanvasBackground';
import { SceneManager } from '../../components/SceneManager/SceneManager';
import { GlobalOverlay } from '../../components/GlobalOverlay/GlobalOverlay';
import { Hud } from '../../components/Hud/Hud';
import { DebugOverlay } from '../../components/DebugOverlay/DebugOverlay';
import './AppShell.css';

export function AppShell() {
  const debugVisible = useAppStore((state) => state.debugVisible);
  const devScale = useAppStore((state) => state.devScale);
  const activeColor = useAppStore((state) => state.activeColor);
  const [scale, setScale] = useState(1);

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
    
    // Convert hex to rgb for glow
    const hex = activeColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.25)`);
  }, [activeColor]);

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
      <div className="app-shell" style={shellStyle}>
        {/* Particle/Shape Animation Canvas */}
        <CanvasBackground />

        {/* HUD Info corners */}
        <Hud />

        {/* Dynamic Scene Loader */}
        <SceneManager />

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
