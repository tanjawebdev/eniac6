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

  // 1. Monitor NFC card changes to auto-select programmer based on card UIDs
  useEffect(() => {
    // Find all readers that have a card present with a valid UID
    const presentCards = nfcStates.filter((n) => n.present && n.uid);

    if (presentCards.length === 0) {
      // If no cards are present, clear the selection and restore default color
      if (selectedProgrammerKey !== null) {
        selectProgrammer(null);
        setActiveColor('#c89b3c'); // Default warm gold
      }
      return;
    }

    // Find the card that was inserted/detected most recently
    const mostRecentCard = presentCards.reduce((prev, curr) =>
      curr.lastSeen > prev.lastSeen ? curr : prev
    );

    // Find the programmer associated with this card's UID
    const programmer = PROGRAMMER_LIST.find((p) => p.uid === mostRecentCard.uid);
    if (programmer && selectedProgrammerKey !== programmer.key) {
      selectProgrammer(programmer.key);
      setActiveColor(programmer.color);
    }
  }, [nfcStates, selectedProgrammerKey, selectProgrammer, setActiveColor]);

  // 2. Monitor banana plug connections to auto-open theme
  useEffect(() => {
    // Find if any theme is currently plugged in
    const activeTheme = THEME_IDS.find((themeId) => {
      const tState = bananas[themeId];
      return tState && (tState.socket0 !== null || tState.socket1 !== null);
    });

    if (activeTheme) {
      const currentScene = useAppStore.getState().currentScene;
      const selectedTheme = useAppStore.getState().selectedTheme;
      if (currentScene === 'home' && selectedTheme !== activeTheme) {
        selectTheme(activeTheme);
        goToScene('theme');
      }
    }
  }, [bananas, selectTheme, goToScene]);

  const handleCardClick = (programmer: ProgrammerData) => {
    selectProgrammer(programmer.key);
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
              // Check if this programmer's card is present in ANY of the slots
              const isNfcIn = nfcStates.some((n) => n.present && n.uid === prog.uid);
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
                const themeState = bananas[themeId];
                const isConnected = themeState && (themeState.socket0 !== null || themeState.socket1 !== null);
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
