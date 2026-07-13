import { create } from 'zustand';
import type { HardwareState } from '@shared/hardware';
import type { HardwareEvent } from '@shared/events';
import { createDefaultHardwareState } from '@shared/hardware';
import { THEME_IDS } from '@shared/constants';

import { PROGRAMMERS } from '../data/programmers';
import { useAppStore } from './appStore';
import { WebSocketService } from '../services/WebSocketService';

interface HardwareStoreState extends HardwareState {
  updateFromEvent: (event: HardwareEvent) => void;
  setFullState: (state: HardwareState) => void;
}

export const useHardwareStore = create<HardwareStoreState>((set) => ({
  ...createDefaultHardwareState(),

  setFullState: (state) => set(() => ({ ...state })),

  updateFromEvent: (event) =>
    set((state) => {
      switch (event.type) {
        case 'pot': {
          const nextPots = [...state.pots];
          if (event.id >= 0 && event.id < nextPots.length) {
            nextPots[event.id] = event.value;
          }
          return { pots: nextPots };
        }
        case 'banana': {
          const nextBanana = { ...state.banana };
          const key = event.socket === 0 ? 'socket0' : 'socket1';
          nextBanana[event.theme] = {
            ...nextBanana[event.theme],
            [key]: event.connected ? event.programmer : null,
          };

          const appState = useAppStore.getState();
          const tState = nextBanana[event.theme];

          // Update theme color dynamically based on plugged woman
          if (event.connected && event.programmer) {
            const prog = PROGRAMMERS[event.programmer];
            if (prog) {
              appState.setThemeColor(event.theme, prog.color);

              // Switch active view and programmer to the newest banana connection
              appState.selectTheme(event.theme);
              appState.selectProgrammer(event.programmer);
              appState.setActiveColor(prog.color);

              // If not already in the theme scene, transition to it (unless in debug mode)
              const currentScene = appState.currentScene;
              if (currentScene === 'home' || currentScene === 'intro') {
                appState.goToScene('theme');
              }
            }
          } else {
            if (tState.socket0 === null && tState.socket1 === null) {
              appState.setThemeColor(event.theme, '#333333');

              // Check if all themes are now empty
              const allEmpty = THEME_IDS.every((tId) => {
                const bananaThemeState = nextBanana[tId];
                return !bananaThemeState || (bananaThemeState.socket0 === null && bananaThemeState.socket1 === null);
              });
              if (allEmpty) {
                appState.selectProgrammer(null);
                appState.setActiveColor('#c89b3c');
              }
            } else {
              // One socket was disconnected, but the other is still plugged in.
              // Select the programmer in the remaining socket if it's the active theme.
              const remainingProgKey = tState.socket0 || tState.socket1;
              if (remainingProgKey && appState.selectedTheme === event.theme) {
                const prog = PROGRAMMERS[remainingProgKey];
                if (prog) {
                  appState.selectProgrammer(remainingProgKey);
                  appState.setActiveColor(prog.color);
                }
              }
            }
          }

          return { banana: nextBanana };
        }
        case 'contact': {
          const nextContacts = [...state.contacts];
          if (event.id >= 0 && event.id < nextContacts.length) {
            nextContacts[event.id] = event.active;
          }
          return { contacts: nextContacts };
        }
        case 'button': {
          const nextButtons = {
            ...state.buttons,
            [event.name]: event.pressed,
          };

          if ((event.name === 'home' || event.name === 'intro') && event.pressed) {
            const appState = useAppStore.getState();
            if (event.name === 'home') {
              appState.goHome();
            } else {
              appState.showIntro();
            }
            appState.selectProgrammer(null);
            appState.setActiveColor('#c89b3c');
            THEME_IDS.forEach((tId) => {
              appState.setThemeColor(tId, '#333333');
            });

            const nextBanana = { ...state.banana };
            THEME_IDS.forEach((tId) => {
              nextBanana[tId] = { socket0: null, socket1: null };
            });

            if (appState.mockMode) {
              const wsService = WebSocketService.getInstance();
              THEME_IDS.forEach((tId) => {
                wsService.sendEvent({
                  type: 'banana',
                  theme: tId,
                  socket: 0,
                  connected: false,
                  programmer: null,
                });
                wsService.sendEvent({
                  type: 'banana',
                  theme: tId,
                  socket: 1,
                  connected: false,
                  programmer: null,
                });
              });
            }

            return {
              buttons: nextButtons,
              banana: nextBanana,
            };
          }

          return {
            buttons: nextButtons,
          };
        }
        case 'nfc': {
          const nextNfc = [...state.nfc];
          if (event.reader >= 0 && event.reader < nextNfc.length) {
            nextNfc[event.reader] = {
              present: event.present,
              uid: event.uid,
              lastSeen: Date.now(),
            };
          }
          return { nfc: nextNfc };
        }
        default:
          return {};
      }
    }),
}));
