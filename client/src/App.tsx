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
      // Toggle Dev mode (mock vs serial) with 'X' / 'x'
      if (e.key === 'x' || e.key === 'X') {
        goToScene('debug');
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
