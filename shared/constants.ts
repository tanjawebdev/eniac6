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
// Each card represents a programmer and can have multiple static UIDs (primary + backup tag).
export const PROGRAMMER_UIDS = {
  mcnulty: ['048E4CA18C2681', '048B45A18C2681'],
  jennings: ['042D36A18C2681', '048B3FA18C2681'],
  snyder: ['049F88A18C2681', '04C15DA18C2681'],
  wescoff: ['04CF8DA18C2681', '045D53A18C2681'],
  bilas: ['04367FA18C2681', '045F64A18C2681'],
  lichterman: ['047E93A18C2681', '04ED69A18C2681'],
} as const;

export type ProgrammerUid = (typeof PROGRAMMER_UIDS)[ProgrammerKey][number];

/** Maps card UIDs back to their respective programmer key (dynamically derived from PROGRAMMER_UIDS). */
export const UID_TO_PROGRAMMER: Record<string, ProgrammerKey> = Object.fromEntries(
  (Object.entries(PROGRAMMER_UIDS) as [ProgrammerKey, readonly string[]][]).flatMap(
    ([programmer, uids]) => uids.map((uid) => [uid, programmer])
  )
);

// --- Display ---
export const EXHIBITION_WIDTH = 2160;
export const EXHIBITION_HEIGHT = 3840;
