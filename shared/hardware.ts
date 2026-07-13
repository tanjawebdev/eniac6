// ============================================
// Shared Hardware State — mirrors the physical installation
// Used by both server (source of truth) and client (Zustand store).
// ============================================

/** State of a single NFC reader. */
export interface NfcReaderState {
  present: boolean;
  uid: string;
  lastSeen: number; // timestamp (ms)
}

/** Complete hardware state snapshot. */
export interface HardwareState {
  /** 16 potentiometer values, each 0–1023. */
  pots: number[];

  /** 4 banana plug connection states. */
  banana: boolean[];

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
    banana: Array(4).fill(false),
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
