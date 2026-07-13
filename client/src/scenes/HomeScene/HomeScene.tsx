import { useEffect } from 'react';
import { useAppStore, DEFAULT_ACTIVE_COLOR } from '../../stores/appStore';
import { useHardwareStore } from '../../stores/hardwareStore';
import { PROGRAMMER_LIST, type ProgrammerData } from '../../data/programmers';
import { ProgrammerCard } from '../../components/ProgrammerCard/ProgrammerCard';
import { THEME_IDS } from '@shared/constants';
import './HomeScene.css';

export function HomeScene() {
  const selectedProgrammerKey = useAppStore((state) => state.selectedProgrammer);
  const selectProgrammer = useAppStore((state) => state.selectProgrammer);
  const selectTheme = useAppStore((state) => state.selectTheme);
  const goToScene = useAppStore((state) => state.goToScene);
  const setActiveColor = useAppStore((state) => state.setActiveColor);

  // Subscribe to hardware state
  const nfcStates = useHardwareStore((state) => state.nfc);
  const bananas = useHardwareStore((state) => state.banana);

  // 1. Clear selected programmer if no banana plugs are connected (prevent cards from headlining on card inserts)
  useEffect(() => {
    // Check if there are any active banana connections across all themes
    const hasActiveBanana = THEME_IDS.some((themeId) => {
      const tState = bananas[themeId];
      return tState && (tState.socket0 !== null || tState.socket1 !== null);
    });

    // If no banana plugs are connected, clear the selection and restore default color
    if (!hasActiveBanana) {
      if (selectedProgrammerKey !== null) {
        selectProgrammer(null);
        setActiveColor(DEFAULT_ACTIVE_COLOR);
      }
    }
  }, [bananas, selectedProgrammerKey, selectProgrammer, setActiveColor]);

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
      </div>
    </div>
  );
}
