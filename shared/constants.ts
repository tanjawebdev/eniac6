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

/** Each theme maps to a banana plug and a range of 4 potentiometers. */
export const THEME_POT_MAPPING: Record<ThemeId, { bananaId: number; potStart: number }> = {
  pioneering: { bananaId: 0, potStart: 0 },
  programming: { bananaId: 1, potStart: 4 },
  recognition: { bananaId: 2, potStart: 8 },
  teamwork: { bananaId: 3, potStart: 12 },
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
  jennings: '04A17C01', // Jean Jennings
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
