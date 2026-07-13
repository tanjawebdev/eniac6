import { useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useAppStore } from './stores/appStore';
import { useHardwareStore } from './stores/hardwareStore';
import { AppShell } from './layouts/AppShell/AppShell';
import { PROGRAMMERS } from './data/programmers';
import type { ProgrammerKey } from '@shared/constants';

export default function App() {
  // Connect WebSocket to backend to stream hardware state
  useWebSocket();
  const toggleDebug = useAppStore((state) => state.toggleDebug);
  const toggleDevScale = useAppStore((state) => state.toggleDevScale);
  const goToScene = useAppStore((state) => state.goToScene);
  const selectProgrammer = useAppStore((state) => state.selectProgrammer);
  const themeColors = useAppStore((state) => state.themeColors);
  const setThemeColor = useAppStore((state) => state.setThemeColor);
  const currentScene = useAppStore((state) => state.currentScene);

  // Monitor hardware buttons (Home, Intro) for global navigation triggers
  const homePressed = useHardwareStore((state) => state.buttons.home);
  const introPressed = useHardwareStore((state) => state.buttons.intro);

  useEffect(() => {
    if (homePressed) {
      const goHome = useAppStore.getState().goHome;
      goHome();
    }
  }, [homePressed]);

  useEffect(() => {
    if (introPressed) {
      const showIntro = useAppStore.getState().showIntro;
      showIntro();
    }
  }, [introPressed]);

  // Monitor contact sensors to auto-select programmers in HomeScene
  const contacts = useHardwareStore((state) => state.contacts);
  useEffect(() => {
    // Only trigger in home scene
    if (currentScene !== 'home') return;
    
    // Find if any contact sensor is activated
    const activeContactIndex = contacts.findIndex((active) => active);
    if (activeContactIndex !== -1) {
      // Map contact index (0-5) to programmer key
      const keys: ProgrammerKey[] = ['mcnulty', 'jennings', 'snyder', 'wescoff', 'bilas', 'lichterman'];
      const key = keys[activeContactIndex];
      if (key) {
        const prog = PROGRAMMERS[key];
        selectProgrammer(key);
        useAppStore.getState().setActiveColor(prog.color);
      }
    }
  }, [contacts, currentScene, selectProgrammer]);

  // Monitor banana plug connections to select themes
  // Theme 0: pioneering, Theme 1: programming, Theme 2: recognition, Theme 3: teamwork
  const bananas = useHardwareStore((state) => state.banana);
  const selectedProgrammer = useAppStore((state) => state.selectedProgrammer);

  useEffect(() => {
    // Check if any banana plug is newly connected and we have an active programmer selected
    // Note: If a banana plug (0-3) is connected, we update that theme's design color
    // to match the active programmer's color.
    bananas.forEach((connected, index) => {
      if (connected && selectedProgrammer) {
        const prog = PROGRAMMERS[selectedProgrammer];
        if (prog) {
          const themes: ('pioneering' | 'programming' | 'recognition' | 'teamwork')[] = [
            'pioneering',
            'programming',
            'recognition',
            'teamwork',
          ];
          const themeId = themes[index];
          if (themeId && themeColors[themeId] !== prog.color) {
            setThemeColor(themeId, prog.color);
          }
        }
      }
    });
  }, [bananas, selectedProgrammer, themeColors, setThemeColor]);

  // Global Keyboard Event Handlers for development (Debug, Scaler)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Dev Overlay with 'D' / 'd'
      if (e.key === 'd' || e.key === 'D') {
        toggleDebug();
      }
      // Toggle Dev scale fit mode with 'S' / 's'
      if (e.key === 's' || e.key === 'S') {
        toggleDevScale();
      }
      // Reset installation back to intro with 'R' / 'r'
      if (e.key === 'r' || e.key === 'R') {
        goToScene('reset');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleDebug, toggleDevScale, goToScene]);

  return <AppShell />;
}
