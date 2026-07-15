import { useEffect, useRef } from 'react';
import { useHardwareStore } from '../../stores/hardwareStore';
import { useAppStore } from '../../stores/appStore';
import { AnimationEngine } from '../../animations/AnimationEngine';
import { THEME_POT_MAPPING } from '@shared/constants';
import { PROGRAMMERS } from '../../data/programmers';
import './CanvasBackground.css';

export function CanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<AnimationEngine | null>(null);

  // Read state from Zustand
  const activeColor = useAppStore((state) => state.activeColor);
  const selectedTheme = useAppStore((state) => state.selectedTheme);
  const currentScene = useAppStore((state) => state.currentScene);
  const pots = useHardwareStore((state) => state.pots);
  const nfc = useHardwareStore((state) => state.nfc);

  const selectedProgrammerKey = useAppStore((state) => state.selectedProgrammer);
  const selectedProgrammer = selectedProgrammerKey ? PROGRAMMERS[selectedProgrammerKey] : null;

  // Check if all NFC readers are occupied (only active in home or intro scenes)
  const allInserted =
    (currentScene === 'home' || currentScene === 'intro') &&
    nfc.length === 6 &&
    nfc.every((n) => n.present && n.uid);

  const getBackgroundColor = () => {
    if (selectedTheme && selectedProgrammer) {
      return selectedProgrammer.colorDark;
    }
    if (currentScene === 'home' && !allInserted) return '#191815';
    return '#0a0a0a';
  };

  const backgroundColor = getBackgroundColor();

  // Choose which shape to draw based on current scene or selected theme
  // Default is circle. Programming could draw squares, recognition triangles, etc.
  const getActiveShape = () => {
    if (!selectedTheme) {
      if (currentScene === 'intro') return 'circle';
      if (currentScene === 'home') return null;
      return 'circle';
    }

    switch (selectedTheme) {
      case 'pioneering':
        return 'circle';
      case 'programming':
        return 'square';
      case 'recognition':
        return 'triangle';
      case 'teamwork':
        return 'heart';
      default:
        return 'circle';
    }
  };

  const activeShape = getActiveShape();

  // Determine active parameters based on active theme
  // If no theme is selected, use default values or read first 4 pots
  const getParams = () => {
    let speed = 5;
    let size = 5;
    let amount = 12;
    let rotate = 0;

    if (selectedTheme && THEME_POT_MAPPING[selectedTheme]) {
      const { potStart } = THEME_POT_MAPPING[selectedTheme];
      // Map 10-bit analog values to visual ranges
      const pot0Val = pots[potStart] ?? 512;
      const pot1Val = pots[potStart + 1] ?? 512;
      const pot2Val = pots[potStart + 2] ?? 512;
      const pot3Val = pots[potStart + 3] ?? 0;

      speed = (pot0Val / 1023) * 10;
      size = 1 + (pot1Val / 1023) * 9; // 1 to 10
      amount = Math.max(1, Math.round((pot2Val / 1023) * 50)); // 1 to 50
      rotate = (pot3Val / 1023) * 10;
    } else {
      // General fallbacks - read pot 0-3 if available, else standard
      const pot0Val = pots[0] ?? 512;
      const pot1Val = pots[1] ?? 512;
      const pot2Val = pots[2] ?? 512;
      const pot3Val = pots[3] ?? 0;

      speed = (pot0Val / 1023) * 10;
      size = 1 + (pot1Val / 1023) * 9;
      amount = Math.max(1, Math.round((pot2Val / 1023) * 50));
      rotate = (pot3Val / 1023) * 10;
    }

    return { speed, size, amount, rotate };
  };

  const params = getParams();

  // Read raw pots for the active theme
  let pot0 = 307;
  let pot1 = 102;
  let pot2 = 716;
  let pot3 = 921;

  if (selectedTheme && THEME_POT_MAPPING[selectedTheme]) {
    const { potStart } = THEME_POT_MAPPING[selectedTheme];
    pot0 = pots[potStart] ?? 307;
    pot1 = pots[potStart + 1] ?? 102;
    pot2 = pots[potStart + 2] ?? 716;
    pot3 = pots[potStart + 3] ?? 921;
  }

  // Instantiate animation engine on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new AnimationEngine(canvasRef.current);
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Sync state changes to engine
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.setConfig('color', activeColor);
    engine.setConfig('shape', activeShape);
    engine.setConfig('speed', params.speed);
    engine.setConfig('size', params.size);
    engine.setConfig('amount', params.amount);
    engine.setConfig('rotate', params.rotate);
    engine.setConfig('allInserted', allInserted);
    engine.setConfig('backgroundColor', backgroundColor);
    engine.setConfig('activeTheme', selectedTheme);
    engine.setConfig('pot0', pot0);
    engine.setConfig('pot1', pot1);
    engine.setConfig('pot2', pot2);
    engine.setConfig('pot3', pot3);
  }, [activeColor, activeShape, params.speed, params.size, params.amount, params.rotate, allInserted, backgroundColor, selectedTheme, pot0, pot1, pot2, pot3]);

  return <canvas ref={canvasRef} className="canvas-background" />;
}
