import { useEffect } from 'react';
import { useAppStore, DEFAULT_ACTIVE_COLOR } from '../../stores/appStore';
import { useHardwareStore } from '../../stores/hardwareStore';
import { THEME_IDS } from '@shared/constants';
import './HomeScene.css';

export function HomeScene() {
  const selectedProgrammerKey = useAppStore((state) => state.selectedProgrammer);
  const selectProgrammer = useAppStore((state) => state.selectProgrammer);
  const selectTheme = useAppStore((state) => state.selectTheme);
  const goToScene = useAppStore((state) => state.goToScene);
  const setActiveColor = useAppStore((state) => state.setActiveColor);

  // Subscribe to hardware state
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

  // Helper positions matching the mockup grid & column indexes
  const SLIDER_POSITIONS = [12, 54, 10, 20, 48.5, 73, 40, 27, 58, 73, 15, 33];

  return (
    <div className="home-scene">
      {/* Top Left: Rect */}
      <div className="home-rect-top"></div>

      {/* Top Center: Inserted programmers count placeholder (persistent header handles layout) */}
      <div className="home-header-placeholder"></div>

      {/* Right-aligned vertically rotated label */}
      <div className="home-vertical-text">
        world&apos;s first electronic computer programmers
      </div>

      {/* Background track columns */}
      <div className="home-bg-columns">
        {Array.from({ length: 12 }).map((_, colIdx) => {
          const digit = Math.floor((11 - colIdx) / 2) + 1; // 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1
          const repeatingDigits = digit.toString().repeat(87);

          return (
            <div
              key={colIdx}
              className="bg-column"
              style={{ left: `${150 + colIdx * 155}px` }}
            >
              <span className="bg-digits">{repeatingDigits}</span>

              {/* Multiple animated slider handles per track column */}
              {Array.from({ length: 2 }).map((_, handleIdx) => {
                const topPercent = (SLIDER_POSITIONS[colIdx] + handleIdx * 25) % 85 + 1;
                const duration = 5 + ((colIdx * 7 + handleIdx * 13) % 5);
                const delay = -1 - ((colIdx * 11 + handleIdx * 17) % 8);

                return (
                  <div
                    key={handleIdx}
                    className="bg-slider-handle animated-handle"
                    style={{
                      top: `${topPercent}%`,
                      animationDuration: `${duration}s`,
                      animationDelay: `${delay}s`,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Big typography overlay */}
      <div className="home-headlines">
        <h1 className="home-h1">
          THE
          <br />
          ENIAC 6
        </h1>
        <h2 className="home-h2">
          BEHIND THE
          <br />
          MACHINE
        </h2>
      </div>

      {/* Bottom Center: ENIAC details */}
      <div className="home-footer-text">
        eniac - completed 1945
      </div>

      {/* Bottom Center: Rect */}
      <div className="home-rect-bottom"></div>
    </div>
  );
}
