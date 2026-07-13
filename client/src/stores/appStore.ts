import { create } from 'zustand';
import type { SceneName } from '../types/scenes';
import type { ThemeId, ProgrammerKey } from '@shared/constants';

interface AppStoreState {
  currentScene: SceneName;
  previousScene: SceneName | null;
  selectedProgrammer: ProgrammerKey | null;
  selectedTheme: ThemeId | null;
  transitionState: 'idle' | 'entering' | 'exiting';
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
}

export const DEFAULT_ACTIVE_COLOR = '#ffffff';

export const useAppStore = create<AppStoreState>((set) => ({
  currentScene: 'intro',
  previousScene: null,
  selectedProgrammer: null,
  selectedTheme: null,
  transitionState: 'idle',
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
      return {
        previousScene: state.currentScene,
        currentScene: scene,
      };
    }),

  goHome: () =>
    set((state) => ({
      previousScene: state.currentScene,
      currentScene: 'home',
      selectedTheme: null,
      activeColor: DEFAULT_ACTIVE_COLOR,
    })),

  showIntro: () =>
    set((state) => ({
      previousScene: state.currentScene,
      currentScene: 'intro',
      selectedProgrammer: null,
      selectedTheme: null,
      activeColor: DEFAULT_ACTIVE_COLOR,
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
    set(() => ({
      currentScene: 'intro',
      previousScene: null,
      selectedProgrammer: null,
      selectedTheme: null,
      activeColor: DEFAULT_ACTIVE_COLOR,
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
}));
