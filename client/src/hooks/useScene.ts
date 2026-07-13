import { useAppStore } from '../stores/appStore';
import { PROGRAMMERS, type ProgrammerData } from '../data/programmers';
import type { ThemeId } from '@shared/constants';

export function useScene() {
  const currentScene = useAppStore((state) => state.currentScene);
  const previousScene = useAppStore((state) => state.previousScene);
  const goToScene = useAppStore((state) => state.goToScene);
  const goHome = useAppStore((state) => state.goHome);
  const showIntro = useAppStore((state) => state.showIntro);
  const resetInstallation = useAppStore((state) => state.resetInstallation);

  return {
    currentScene,
    previousScene,
    goToScene,
    goHome,
    showIntro,
    resetInstallation,
  };
}

export function useSelectedProgrammer(): ProgrammerData | null {
  const key = useAppStore((state) => state.selectedProgrammer);
  if (!key) return null;
  return PROGRAMMERS[key] || null;
}

export function useSelectedTheme(): ThemeId | null {
  return useAppStore((state) => state.selectedTheme);
}

export function useAppColors() {
  const activeColor = useAppStore((state) => state.activeColor);
  const themeColors = useAppStore((state) => state.themeColors);
  const setActiveColor = useAppStore((state) => state.setActiveColor);
  const setThemeColor = useAppStore((state) => state.setThemeColor);

  return {
    activeColor,
    themeColors,
    setActiveColor,
    setThemeColor,
  };
}

export function useDebug() {
  const debugVisible = useAppStore((state) => state.debugVisible);
  const toggleDebug = useAppStore((state) => state.toggleDebug);
  const wsConnected = useAppStore((state) => state.wsConnected);
  const mockMode = useAppStore((state) => state.mockMode);

  return {
    debugVisible,
    toggleDebug,
    wsConnected,
    mockMode,
  };
}

export function useDevScale() {
  const devScale = useAppStore((state) => state.devScale);
  const toggleDevScale = useAppStore((state) => state.toggleDevScale);

  return {
    devScale,
    toggleDevScale,
  };
}
