import { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useHardwareStore } from '../../stores/hardwareStore';
import { useSelectedProgrammer } from '../../hooks/useScene';
import { THEME_POT_MAPPING } from '@shared/constants';
import { PROGRAMMERS } from '../../data/programmers';
import './ThemeScene.css';

export function ThemeScene() {
  const selectedTheme = useAppStore((state) => state.selectedTheme);
  const activeColor = useAppStore((state) => state.activeColor);
  const goHome = useAppStore((state) => state.goHome);
  const selectedProgrammer = useSelectedProgrammer();

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

  // Mapped visual parameters
  const speed = (p0 / 1023) * 10;
  const size = 1 + (p1 / 1023) * 9;
  const amount = Math.max(1, Math.round((p2 / 1023) * 50));
  const rotate = (p3 / 1023) * 10;

  // Custom ASCII code generator state for the "programming" theme
  const [asciiLines, setAsciiLines] = useState<string[]>([]);
  useEffect(() => {
    if (selectedTheme !== 'programming') return;

    const chars = '01011001 ENIAC SUBROUTINE PROGRAM PROGRAMMER DEBUG ACCUMULATOR PUNCHCARD LOOPS FUNCTION';
    const interval = setInterval(() => {
      // Speed pot controls speed of ASCII generation
      const lineCount = Math.max(5, Math.round(size * 1.5));
      const newLines: string[] = [];
      for (let i = 0; i < lineCount; i++) {
        let line = '';
        const len = Math.round(30 + Math.random() * 20);
        for (let j = 0; j < len; j++) {
          line += chars[Math.floor(Math.random() * chars.length)];
        }
        newLines.push(line);
      }
      setAsciiLines((prev) => [...prev.slice(-30), ...newLines]);
    }, Math.max(50, 600 - speed * 50));

    return () => clearInterval(interval);
  }, [selectedTheme, speed, size]);

  // Custom stars/radar coordinates for "pioneering" theme
  const [radarAngle, setRadarAngle] = useState(0);
  useEffect(() => {
    if (selectedTheme !== 'pioneering') return;
    const interval = setInterval(() => {
      setRadarAngle((prev) => (prev + speed * 0.5) % 360);
    }, 16);
    return () => clearInterval(interval);
  }, [selectedTheme, speed]);

  const renderThemeDesign = () => {
    switch (selectedTheme) {
      case 'pioneering':
        // Radar/navigation style interface
        return (
          <div className="theme-design-container pioneering-radar">
            <div className="radar-circle" style={{ borderColor: activeColor }}>
              <div
                className="radar-sweep"
                style={{
                  transform: `rotate(${radarAngle}deg)`,
                  background: `linear-gradient(${radarAngle}deg, ${activeColor}55 0%, transparent 50%)`,
                }}
              />
              <div className="radar-grid" style={{ borderColor: `${activeColor}22` }} />
              {Array.from({ length: Math.min(amount, 10) }).map((_, i) => (
                <div
                  key={i}
                  className="radar-blip"
                  style={{
                    left: `${20 + (i * 13 + rotate * 4) % 60}%`,
                    top: `${15 + (i * 17) % 70}%`,
                    background: activeColor,
                    boxShadow: `0 0 10px ${activeColor}`,
                  }}
                />
              ))}
            </div>
            <div className="theme-description">
              <p>THE CALCULATED PATH: TRAJECTORIES &amp; BALLISTICS TABLES</p>
            </div>
          </div>
        );

      case 'programming':
        // Scrolling binary/ASCII code lines
        return (
          <div className="theme-design-container programming-ascii font-monospace">
            <div className="ascii-viewport" style={{ color: `${activeColor}cc`, fontSize: `${10 + size * 0.8}px` }}>
              {asciiLines.map((line, idx) => (
                <div key={idx} className="ascii-line">
                  {line}
                </div>
              ))}
            </div>
            <div className="theme-description">
              <p>DEBUGGING THE FUTURE: ENIAC LOGIC, ACCUMULATORS &amp; NESTED LOOPS</p>
            </div>
          </div>
        );

      case 'recognition':
        // Geometrics/Constellation mapping
        return (
          <div className="theme-design-container recognition-constellation">
            <svg className="constellation-svg" viewBox="0 0 400 400" style={{ stroke: activeColor }}>
              <g transform={`rotate(${rotate * 36} 200 200)`}>
                <polygon
                  points="200,80 320,290 80,290"
                  fill="none"
                  strokeWidth="2"
                  style={{ stroke: activeColor, opacity: 0.3 }}
                />
                <circle cx="200" cy="80" r={size} fill={activeColor} />
                <circle cx="320" cy="290" r={size} fill={activeColor} />
                <circle cx="80" cy="290" r={size} fill={activeColor} />

                {amount > 5 && (
                  <line x1="200" y1="80" x2="200" y2="220" strokeWidth="1" strokeDasharray="4 4" />
                )}
                {amount > 10 && (
                  <line x1="320" y1="290" x2="200" y2="220" strokeWidth="1" strokeDasharray="4 4" />
                )}
                {amount > 15 && (
                  <line x1="80" y1="290" x2="200" y2="220" strokeWidth="1" strokeDasharray="4 4" />
                )}
                <circle cx="200" cy="220" r={size * 1.5} fill="none" strokeWidth="1" />
              </g>
            </svg>
            <div className="theme-description">
              <p>CODE &amp; LEGACY: RECOGNIZING THE INVISIBLE PROGRAMMERS</p>
            </div>
          </div>
        );

      case 'teamwork':
        // Grid nodes link network
        return (
          <div className="theme-design-container teamwork-network">
            <div className="network-viewport" style={{ color: activeColor }}>
              {Array.from({ length: Math.min(amount, 12) }).map((_, i) => (
                <div
                  key={i}
                  className="network-node"
                  style={{
                    left: `${15 + (i * 21) % 70}%`,
                    top: `${15 + (i * 29) % 70}%`,
                    borderColor: activeColor,
                    transform: `scale(${1 + Math.sin(radarAngle * 0.05 + i) * 0.1})`,
                  }}
                >
                  <div className="node-inner" style={{ background: activeColor }} />
                  <span className="node-label">NODE_0{i}</span>
                </div>
              ))}
            </div>
            <div className="theme-description">
              <p>PATTERNS OF PERSISTENCE: THE COLLABORATIVE SYNERGY</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="theme-scene container-full">
      <header className="theme-header">
        <div className="theme-title-group">
          <span className="theme-pre">interactive theme module</span>
          <h2 className="theme-title">{selectedTheme?.toUpperCase()}</h2>
        </div>
        <button className="theme-back-btn" onClick={goHome}>
          RETURN HOME
        </button>
      </header>

      {/* Main thematic content visualization */}
      <div className="theme-content-area glass-panel">
        <div className="theme-visualizer">{renderThemeDesign()}</div>

        {/* Dashboard parameters footer */}
        <div className="theme-dashboard" style={{ borderColor: `${activeColor}22` }}>
          <div className="dashboard-item">
            <span className="db-label">SPEED</span>
            <span className="db-val glow-text">{speed.toFixed(1)}</span>
            <span className="db-sub">pot_01</span>
          </div>
          <div className="dashboard-item">
            <span className="db-label">SCALE</span>
            <span className="db-val glow-text">{size.toFixed(1)}</span>
            <span className="db-sub">pot_02</span>
          </div>
          <div className="dashboard-item">
            <span className="db-label">DENSITY</span>
            <span className="db-val glow-text">{amount}</span>
            <span className="db-sub">pot_03</span>
          </div>
          <div className="dashboard-item">
            <span className="db-label">ROTATION</span>
            <span className="db-val glow-text">{rotate.toFixed(1)}</span>
            <span className="db-sub">pot_04</span>
          </div>
        </div>
      </div>

      {selectedProgrammer && (
        <div className="theme-programmer-indicator" style={{ borderLeft: `3px solid ${activeColor}` }}>
          <span>CONNECTED TO:</span>
          <strong style={{ color: activeColor }}>{selectedProgrammer.fullName.toUpperCase()}</strong>
        </div>
      )}
    </div>
  );
}
