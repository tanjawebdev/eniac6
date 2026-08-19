// ============================================
// Shared Constants — used by both client and server
// ============================================

// --- Network ---
export const WS_PORT = 3001;
export const HTTP_PORT = 3000;

// --- Serial ---
export const SERIAL_BAUD_RATE = 115200;

// --- Hardware counts ---
export const POT_COUNT = 16;
export const BANANA_COUNT = 4;
export const CONTACT_COUNT = 6;
export const NFC_READER_COUNT = 6;
export const BUTTON_NAMES = ['home', 'intro'] as const;

// --- Themes ---
export const THEME_IDS = ['pioneering', 'programming', 'recognition', 'teamwork'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export interface ThemePotConfig {
  bananaId: number;
  potIds: [number, number, number, number]; // 1-based hardware pot numbers (1 to 16)
  potLabels: [string, string, string, string];
}

/** Each theme maps to a banana plug and 4 specific potentiometers (1-based: 1..16) with parameter labels. */
export const THEME_POT_MAPPING: Record<ThemeId, ThemePotConfig> = {
  recognition: {
    bananaId: 0,
    potIds: [1, 2, 5, 6],
    potLabels: ['SPEED', 'SIZE', 'BLUR', 'CONTRAST'],
  },
  teamwork: {
    bananaId: 1,
    potIds: [3, 4, 7, 8],
    potLabels: ['SPEED', 'SIZE', 'COUNT', 'LINES'],
  },
  programming: {
    bananaId: 2,
    potIds: [9, 10, 13, 14],
    potLabels: ['SPEED', 'SIZE', 'GAMMA', 'CONTRAST'],
  },
  pioneering: {
    bananaId: 3,
    potIds: [11, 12, 15, 16],
    potLabels: ['SPEED', 'SIZE', 'COUNT', 'RASTER'],
  },
};

// --- Programmer keys ---
export const PROGRAMMER_KEYS = [
  'mcnulty',
  'jennings',
  'snyder',
  'wescoff',
  'bilas',
  'lichterman',
] as const;
export type ProgrammerKey = (typeof PROGRAMMER_KEYS)[number];

// --- Programmer NFC UIDs ---
// Each card represents a programmer and has a unique, static UID.
export const PROGRAMMER_UIDS = {
  mcnulty: '04A17C00', // Kay McNulty
  jennings: '042D36A18C2681', // Jean Jennings
  snyder: '04A17C02', // Betty Snyder
  wescoff: '04A17C03', // Marlyn Wescoff
  bilas: '04A17C04', // Fran Bilas
  lichterman: '04A17C05', // Ruth Lichterman
} as const;

export type ProgrammerUid = (typeof PROGRAMMER_UIDS)[keyof typeof PROGRAMMER_UIDS];

/** Maps card UIDs back to their respective programmer key. */
export const UID_TO_PROGRAMMER: Record<string, ProgrammerKey> = {
  [PROGRAMMER_UIDS.mcnulty]: 'mcnulty',
  [PROGRAMMER_UIDS.jennings]: 'jennings',
  [PROGRAMMER_UIDS.snyder]: 'snyder',
  [PROGRAMMER_UIDS.wescoff]: 'wescoff',
  [PROGRAMMER_UIDS.bilas]: 'bilas',
  [PROGRAMMER_UIDS.lichterman]: 'lichterman',
};

// --- Display ---
export const EXHIBITION_WIDTH = 2160;
export const EXHIBITION_HEIGHT = 3840;
