import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { useHardwareStore } from '../../stores/hardwareStore';
import { PROGRAMMER_LIST } from '../../data/programmers';
import { QuoteBlock } from '../QuoteBlock/QuoteBlock';
import './ProgrammerCardsOverlay.css';

import { UID_TO_PROGRAMMER, type ProgrammerKey } from '@shared/constants';

// Stagger config
const STAGGER_MS = 120;
const ENTER_ANIM_MS = 700;
const NUM_CARDS = 6;
// After this long the last card's entrance is fully done
const FULL_ENTER_DURATION = (NUM_CARDS - 1) * STAGGER_MS + ENTER_ANIM_MS + 50;

export function ProgrammerCardsOverlay() {
  const currentScene = useAppStore((state) => state.currentScene);
  const selectedTheme = useAppStore((state) => state.selectedTheme);
  const selectedProgrammer = useAppStore((state) => state.selectedProgrammer);
  const cardsVisible = useAppStore((state) => state.cardsVisible);
  const nfcStates = useHardwareStore((state) => state.nfc);

  /**
   * `hasEntered` tracks whether the cards have already completed their
   * stagger-entrance animation. Once true, cards use the `cards-visible`
   * class which only contains the pulse animation — NOT `card-enter`.
   *
   * This prevents the entrance from replaying during home↔theme transitions,
   * where the `animation` shorthand would otherwise change (pulse type switch)
   * and force the browser to restart ALL animations including `card-enter`.
   *
   * Reset to false only when cardsVisible goes false→true again (fresh entrance).
   */
  const [hasEntered, setHasEntered] = useState(false);
  const prevCardsVisibleRef = useRef(cardsVisible);

  useEffect(() => {
    const wasVisible = prevCardsVisibleRef.current;
    prevCardsVisibleRef.current = cardsVisible;

    if (!wasVisible && cardsVisible) {
      // Cards just became visible — play entrance, then lock into stable state
      setHasEntered(false);
      const timer = window.setTimeout(() => setHasEntered(true), FULL_ENTER_DURATION);
      return () => window.clearTimeout(timer);
    }

    if (wasVisible && !cardsVisible) {
      // Cards hidden again (going to intro/reset) — reset so next home entry re-plays
      setHasEntered(false);
    }
  }, [cardsVisible]);

  // Only show cards overlay in home and theme scenes
  if (currentScene !== 'home' && currentScene !== 'theme') {
    return null;
  }

  const CARD_POSITIONS: Record<string, { x: number; y: number }> = {
    mcnulty: { x: 150 + 8 * 155 + 45, y: 900 },
    jennings: { x: 150 + 5 * 155 + 45, y: 1230 },
    wescoff: { x: 150 + 2 * 155 + 45, y: 1843 },
    snyder: { x: 150 + 2 * 155 + 45, y: 3091 },
    bilas: { x: 150 + 2 * 155 + 45, y: 3340 },
    lichterman: { x: 150 + 5 * 155 + 45, y: 3340 },
  };

  const handleCardClick = (key: ProgrammerKey) => {
    const prog = PROGRAMMER_LIST.find((p) => p.key === key);
    if (prog) {
      useAppStore.getState().selectProgrammer(key);
      useAppStore.getState().setActiveColor(prog.color);
    }
  };

  const isThemeActive = currentScene === 'theme' && !!selectedTheme;
  const showQuoteBlock = isThemeActive && !!selectedProgrammer;

  const allInserted =
    currentScene === 'home' &&
    nfcStates.length === 6 &&
    nfcStates.every((n) => n.present && n.uid);

  // Theme: always visible. Home: controlled by delayed cardsVisible flag.
  const shouldShow = currentScene === 'theme' ? true : cardsVisible;

  return (
    <div className={`programmer-cards-overlay ${isThemeActive ? 'programming-theme-mode' : ''}`}>
      {PROGRAMMER_LIST.map((prog, idx) => {
        const matchingReader = nfcStates.find(
          (n) => n.present && UID_TO_PROGRAMMER[n.uid.trim().toUpperCase()] === prog.key
        );
        const isNfcIn = !!matchingReader;
        const pos = CARD_POSITIONS[prog.key];
        const displayName = prog.firstName.toUpperCase();

        const isSelected = selectedProgrammer === prog.key;
        const hideCard = showQuoteBlock && isSelected;

        // Which animation class to use:
        //   cards-hidden  — invisible, no pointer events, shifted down 32px
        //   cards-enter   — plays card-enter keyframe with stagger, then pulse
        //   cards-visible — stable at full opacity, only pulse loop (NO card-enter)
        //
        // We graduate to `cards-visible` after the entrance finishes so that
        // any future animation-shorthand change (e.g. pulse type swap on
        // home↔theme) cannot restart card-enter.
        let animClass: string;
        if (!shouldShow) {
          animClass = 'cards-hidden';
        } else if (hasEntered) {
          animClass = 'cards-visible';
        } else {
          animClass = 'cards-enter';
        }

        // Stagger delay only during the initial entrance, not once stable
        const staggerDelay = animClass === 'cards-enter' ? `${idx * STAGGER_MS}ms` : '0ms';

        return (
          <div
            key={prog.key}
            className={`overlay-programmer-card ${isNfcIn ? 'inserted' : ''} ${allInserted ? 'all-inserted' : ''} ${hideCard ? 'hidden-by-quote' : ''} ${animClass}`}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              '--accent-color': allInserted
                ? '#ffffff'
                : isNfcIn
                  ? prog.color
                  : 'rgba(255, 255, 255, 0.12)',
              '--accent-glow': allInserted
                ? 'rgba(255, 255, 255, 0.25)'
                : isNfcIn
                  ? `${prog.color}40`
                  : 'rgba(255, 255, 255, 0.05)',
              '--card-stagger-delay': staggerDelay,
            } as React.CSSProperties}
            onClick={() => handleCardClick(prog.key)}
          >
            {allInserted && (
              <div className="card-portrait-wrapper">
                <img src={prog.portrait} alt={prog.fullName} className="card-portrait-img" />
              </div>
            )}
            <span>{displayName}</span>
          </div>
        );
      })}

      {showQuoteBlock && <QuoteBlock />}
    </div>
  );
}
