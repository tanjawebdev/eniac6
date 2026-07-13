import { create } from 'zustand';
import type { HardwareState } from '@shared/hardware';
import type { HardwareEvent } from '@shared/events';
import { createDefaultHardwareState } from '@shared/hardware';

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
          const nextBanana = [...state.banana];
          if (event.id >= 0 && event.id < nextBanana.length) {
            nextBanana[event.id] = event.connected;
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
          return {
            buttons: {
              ...state.buttons,
              [event.name]: event.pressed,
            },
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
