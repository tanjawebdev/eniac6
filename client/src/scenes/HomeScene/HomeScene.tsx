import { useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useHardwareStore } from '../../stores/hardwareStore';
import { PROGRAMMER_LIST, type ProgrammerData } from '../../data/programmers';
import { ProgrammerCard } from '../../components/ProgrammerCard/ProgrammerCard';
import { THEME_IDS, type ThemeId } from '@shared/constants';
import './HomeScene.css';

export function HomeScene() {
  const selectedProgrammerKey = useAppStore((state) => state.selectedProgrammer);
  const selectProgrammer = useAppStore((state) => state.selectProgrammer);
  const selectTheme = useAppStore((state) => state.selectTheme);
  const goToScene = useAppStore((state) => state.goToScene);
  const themeColors = useAppStore((state) => state.themeColors);
  const setActiveColor = useAppStore((state) => state.setActiveColor);
  const setThemeColor = useAppStore((state) => state.setThemeColor);

  // Subscribe to hardware state
  const nfcStates = useHardwareStore((state) => state.nfc);
  const bananas = useHardwareStore((state) => state.banana);

  // 1. Monitor NFC card changes to auto-select programmer
  useEffect(() => {
    // Check if any reader has a card present
    const activeReaderIdx = nfcStates.findIndex((n) => n.present);
    if (activeReaderIdx !== -1) {
      const programmer = PROGRAMMER_LIST.find((p) => p.nfcReader === activeReaderIdx);
      if (programmer && selectedProgrammerKey !== programmer.key) {
        selectProgrammer(programmer.key as any);
        setActiveColor(programmer.color);
      }
    }
  }, [nfcStates, selectedProgrammerKey, selectProgrammer, setActiveColor]);

  // 2. Monitor banana plug connections to set theme colors and auto-open theme
  useEffect(() => {
    bananas.forEach((connected, index) => {
      if (connected) {
        const themeId = THEME_IDS[index];
        if (themeId) {
          // If a programmer is currently selected, map her color to this theme
          if (selectedProgrammerKey) {
            const prog = PROGRAMMER_LIST.find((p) => p.key === selectedProgrammerKey);
            if (prog && themeColors[themeId] !== prog.color) {
              setThemeColor(themeId, prog.color);
            }
          }
          
          // Auto-navigate to this theme scene when banana is plugged
          selectTheme(themeId);
          goToScene('theme');
        }
      }
    });
  }, [bananas, selectedProgrammerKey, themeColors, setThemeColor, selectTheme, goToScene]);

  const handleCardClick = (programmer: ProgrammerData) => {
    selectProgrammer(programmer.key as any);
    setActiveColor(programmer.color);
  };

  const handleThemeClick = (themeId: ThemeId) => {
    // If a programmer is selected, connect her to this theme
    if (selectedProgrammerKey) {
      const prog = PROGRAMMER_LIST.find((p) => p.key === selectedProgrammerKey);
      if (prog) {
        setThemeColor(themeId, prog.color);
      }
    }
    selectTheme(themeId);
    goToScene('theme');
  };

  return (
    <div className="home-scene container-full">
      <header className="home-header">
        <span className="home-pre">installation hub</span>
        <h2 className="home-title">ENIAC PROGRAMMERS</h2>
      </header>

      <div className="home-layout">
        {/* Left Column: Grid of 6 Programmer Cards */}
        <div className="programmers-section">
          <div className="programmer-grid">
            {PROGRAMMER_LIST.map((prog) => {
              const isActive = selectedProgrammerKey === prog.key;
              const isNfcIn = nfcStates[prog.nfcReader]?.present ?? false;
              return (
                <ProgrammerCard
                  key={prog.key}
                  programmer={prog}
                  isActive={isActive}
                  isNfcPresent={isNfcIn}
                  onClick={() => handleCardClick(prog)}
                />
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Themes (Banana Connectors) */}
        <div className="themes-section">
          <div className="theme-connection-card glass-panel">
            <h3 className="section-headline">THEME PLUGBOARD</h3>
            <p className="section-desc">
              Connect a programmer to a theme using the banana plugs, or select one below.
            </p>

            <div className="theme-list">
              {THEME_IDS.map((themeId, idx) => {
                const isConnected = bananas[idx] ?? false;
                const activeColor = themeColors[themeId];
                const hasColor = activeColor !== '#333333';

                return (
                  <div
                    key={themeId}
                    className={`theme-list-item ${isConnected ? 'banana-connected' : ''}`}
                    style={{
                      borderLeft: `4px solid ${hasColor ? activeColor : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: isConnected ? `0 0 15px ${activeColor}22` : 'none',
                    }}
                    onClick={() => handleThemeClick(themeId)}
                  >
                    <div className="theme-meta">
                      <span className="theme-jack">JACK 0{idx + 1}</span>
                      <h4
                        className="theme-name"
                        style={{ color: hasColor ? activeColor : 'var(--text-primary)' }}
                      >
                        {themeId.toUpperCase()}
                      </h4>
                    </div>

                    <div className="theme-status-group">
                      {isConnected ? (
                        <span className="banana-dot pulse-dot" style={{ background: activeColor }} />
                      ) : (
                        <span className="banana-dot disconnected" />
                      )}
                      <span className="theme-status-label">
                        {isConnected ? 'PLUGGED' : 'OPEN'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
