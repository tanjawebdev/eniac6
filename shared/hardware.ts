import type { ProgrammerKey, ThemeId } from './constants';

/** State of a single NFC reader. */
export interface NfcReaderState {
  present: boolean;
  uid: string;
  lastSeen: number; // timestamp (ms)
}

/** State of a theme's banana jacks. Up to two cards can be plugged into a theme at once. */
export interface ThemeBananaState {
  socket0: ProgrammerKey | null;
  socket1: ProgrammerKey | null;
}

/** Complete hardware state snapshot. */
export interface HardwareState {
  /** 16 potentiometer values, each 0–1023. */
  pots: number[];

  /** Banana plug connection state per theme. */
  banana: Record<ThemeId, ThemeBananaState>;

  /** 6 contact sensor states. */
  contacts: boolean[];

  /** Button states. */
  buttons: {
    home: boolean;
    intro: boolean;
  };

  /** 6 NFC reader states. */
  nfc: NfcReaderState[];
}

/** Creates a default (zeroed) hardware state. */
export function createDefaultHardwareState(): HardwareState {
  return {
    pots: Array(16).fill(0),
    banana: {
      pioneering: { socket0: null, socket1: null },
      programming: { socket0: null, socket1: null },
      recognition: { socket0: null, socket1: null },
      teamwork: { socket0: null, socket1: null },
    },
    contacts: Array(6).fill(false),
    buttons: {
      home: false,
      intro: false,
    },
    nfc: Array.from({ length: 6 }, () => ({
      present: false,
      uid: '',
      lastSeen: 0,
    })),
  };
}
