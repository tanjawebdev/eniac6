import { useEffect } from 'react';
import { CanvasBackground } from '../../components/CanvasBackground/CanvasBackground';
import { GlobalOverlay } from '../../components/GlobalOverlay/GlobalOverlay';
import { DebugOverlay } from '../../components/DebugOverlay/DebugOverlay';
import { useAppStore } from '../../stores/appStore';
import './DebugPage.css';

export function DebugPage() {
  const activeColor = useAppStore((state) => state.activeColor);

  // Set css custom property for dynamic color changes (similar to AppShell.tsx)
  useEffect(() => {
    document.documentElement.style.setProperty('--active-color', activeColor);
    
    // Convert hex to rgb for glow
    const hex = activeColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.25)`);
  }, [activeColor]);

  return (
    <div className="debug-page-container">
      {/* Dynamic Visuals in the Background */}
      <CanvasBackground />

      <div className="debug-page-wrapper">
        <header className="debug-page-header">
          <div className="debug-page-brand">
            <span className="brand-pre">ENIAC SIX</span>
            <h1 className="brand-main">HARDWARE CONTROL PANEL</h1>
          </div>
          <div className="debug-page-status">
            <span className="status-indicator-dot animate-pulse"></span>
            <span className="status-text font-monospace">ONLINE STATE BROADCAST CHANNEL</span>
          </div>
        </header>

        <main className="debug-page-main">
          <DebugOverlay standalone={true} />
        </main>

        <footer className="debug-page-footer font-monospace">
          <span>&copy; {new Date().getFullYear()} ENIAC Six Museum Installation. Emulator console active.</span>
        </footer>
      </div>

      {/* Screen noise and CRT overlay effects */}
      <GlobalOverlay />
    </div>
  );
}
