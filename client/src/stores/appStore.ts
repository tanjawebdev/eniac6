import { create } from 'zustand';
import type { SceneName } from '../types/scenes';
import type { ThemeId, ProgrammerKey } from '@shared/constants';

interface AppStoreState {
  currentScene: SceneName;
  introRunId: number;
  previousScene: SceneName | null;
  selectedProgrammer: ProgrammerKey | null;
  selectedTheme: ThemeId | null;
  transitionState: 'idle' | 'entering' | 'exiting';
  /**
   * Controls whether the ProgrammerCardsOverlay cards are visible.
   * Set to false immediately when leaving/entering home so cards don't
   * appear during the SceneManager transition animation. AppShell fires
   * a delayed setCardsVisible(true) after the scene transition settles.
   */
  cardsVisible: boolean;
  debugVisible: boolean;
  devScale: boolean;
  activeColor: string; // Dynamic accent color, defaults to general amber/gold or active woman color
  themeColors: Record<ThemeId, string>; // Stores last connected programmer's color for each theme
  wsConnected: boolean; // WebSocket connection status
  mockMode: boolean; // Backend run mode (mock vs serial)

  // Actions
  goToScene: (scene: SceneName) => void;
  goHome: () => void;
  showIntro: () => void;
  selectProgrammer: (key: ProgrammerKey | null) => void;
  selectTheme: (themeId: ThemeId | null) => void;
  resetInstallation: () => void;
  toggleDebug: () => void;
  toggleDevScale: () => void;
  setActiveColor: (color: string) => void;
  setThemeColor: (themeId: ThemeId, color: string) => void;
  setTransitionState: (state: 'idle' | 'entering' | 'exiting') => void;
  setWsConnected: (connected: boolean) => void;
  setMockMode: (mock: boolean) => void;
  setCardsVisible: (visible: boolean) => void;
}

export const DEFAULT_ACTIVE_COLOR = '#ffffff';

export const useAppStore = create<AppStoreState>((set) => ({
  currentScene: 'intro',
  introRunId: 0,
  previousScene: null,
  selectedProgrammer: null,
  selectedTheme: null,
  transitionState: 'idle',
  cardsVisible: false,
  debugVisible: false,
  devScale: false,
  activeColor: DEFAULT_ACTIVE_COLOR,
  wsConnected: false,
  mockMode: true,
  themeColors: {
    pioneering: '#333333', // Default neutral dark colors
    programming: '#333333',
    recognition: '#333333',
    teamwork: '#333333',
  },

  goToScene: (scene) =>
    set((state) => {
      if (state.currentScene === scene) return {};
      // When going home→theme the cards must stay visible (no hide/reveal flash).
      // Only reset cardsVisible when actually leaving the card-overlay flow entirely.
      const keepCards = scene === 'theme';
      return {
        previousScene: state.currentScene,
        currentScene: scene,
        cardsVisible: keepCards ? state.cardsVisible : false,
      };
    }),

  goHome: () =>
    set((state) => ({
      previousScene: state.currentScene,
      currentScene: 'home',
      selectedTheme: null,
      activeColor: DEFAULT_ACTIVE_COLOR,
      // Preserve cardsVisible when coming from theme or already on home so cards stay in place.
      // Only reset it when coming from elsewhere (e.g. intro, reset) so the staggered entrance still plays on a fresh load.
      cardsVisible:
        state.currentScene === 'theme' || state.currentScene === 'home'
          ? state.cardsVisible
          : false,
    })),

  showIntro: () =>
    set((state) => ({
      introRunId: state.introRunId + 1,
      previousScene: state.currentScene,
      currentScene: 'intro',
      selectedProgrammer: null,
      selectedTheme: null,
      activeColor: DEFAULT_ACTIVE_COLOR,
      cardsVisible: false,
    })),

  selectProgrammer: (programmerKey) =>
    set(() => ({
      selectedProgrammer: programmerKey,
    })),

  selectTheme: (themeId) =>
    set((state) => {
      // When a theme is selected, update active color to this theme's last connected color if it exists
      const color = themeId ? state.themeColors[themeId] : DEFAULT_ACTIVE_COLOR;
      return {
        selectedTheme: themeId,
        activeColor: color === '#333333' ? DEFAULT_ACTIVE_COLOR : color,
      };
    }),

  resetInstallation: () =>
    set((state) => ({
      introRunId: state.introRunId + 1,
      currentScene: 'intro',
      previousScene: null,
      selectedProgrammer: null,
      selectedTheme: null,
      activeColor: DEFAULT_ACTIVE_COLOR,
      cardsVisible: false,
      themeColors: {
        pioneering: '#333333',
        programming: '#333333',
        recognition: '#333333',
        teamwork: '#333333',
      },
    })),

  toggleDebug: () => set((state) => ({ debugVisible: !state.debugVisible })),

  toggleDevScale: () => set((state) => ({ devScale: !state.devScale })),

  setActiveColor: (color) => set(() => ({ activeColor: color })),

  setThemeColor: (themeId, color) =>
    set((state) => {
      const nextThemeColors = { ...state.themeColors, [themeId]: color };
      // If we are currently viewing this theme, also update the active color
      const isCurrentTheme = state.selectedTheme === themeId;
      return {
        themeColors: nextThemeColors,
        activeColor: isCurrentTheme ? color : state.activeColor,
      };
    }),

  setTransitionState: (transitionState) => set(() => ({ transitionState })),
  setWsConnected: (connected) => set(() => ({ wsConnected: connected })),
  setMockMode: (mock) => set(() => ({ mockMode: mock })),
  setCardsVisible: (visible) => set(() => ({ cardsVisible: visible })),
}));
