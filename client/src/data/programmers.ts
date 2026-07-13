export interface ProgrammerData {
  key: string;
  name: string;        // Display name with \n for line break
  firstName: string;   // Short name
  fullName: string;    // Full name
  color: string;       // Hex color (updated to new colors)
  year: string;
  role: string;
  nfcReader: number;   // Which NFC reader (0-5)
}

export const PROGRAMMERS: Record<string, ProgrammerData> = {
  mcnulty: {
    key: 'mcnulty',
    name: 'Kay\nMcNulty',
    firstName: 'Kay',
    fullName: 'Kathleen McNulty',
    color: '#F0CA38',
    year: '1945',
    role: 'programmer',
    nfcReader: 0,
  },
  jennings: {
    key: 'jennings',
    name: 'Jean\nJennings',
    firstName: 'Jean',
    fullName: 'Betty Jean Jennings Bartik',
    color: '#E78C2B',
    year: '1945',
    role: 'programmer',
    nfcReader: 1,
  },
  snyder: {
    key: 'snyder',
    name: 'Betty\nSnyder',
    firstName: 'Betty',
    fullName: 'Betty Snyder Holberton',
    color: '#D84A1C',
    year: '1945',
    role: 'programmer',
    nfcReader: 2,
  },
  wescoff: {
    key: 'wescoff',
    name: 'Marlyn\nWescoff',
    firstName: 'Marlyn',
    fullName: 'Marlyn Wescoff Meltzer',
    color: '#9B3A3D',
    year: '1945',
    role: 'programmer',
    nfcReader: 3,
  },
  bilas: {
    key: 'bilas',
    name: 'Fran\nBilas',
    firstName: 'Fran',
    fullName: 'Frances Bilas Spence',
    color: '#5C3D5E',
    year: '1945',
    role: 'programmer',
    nfcReader: 4,
  },
  lichterman: {
    key: 'lichterman',
    name: 'Ruth\nLichterman',
    firstName: 'Ruth',
    fullName: 'Ruth Lichterman Teitelbaum',
    color: '#0B3D7D',
    year: '1945',
    role: 'programmer',
    nfcReader: 5,
  },
};

export const PROGRAMMER_LIST = Object.values(PROGRAMMERS);

/** Look up a programmer by their NFC reader index. */
export function getProgrammerByReader(reader: number): ProgrammerData | undefined {
  return PROGRAMMER_LIST.find((p) => p.nfcReader === reader);
}

/** Configured UIDs mapped to programmer keys (helpful for real exhibition) */
export const NFC_UID_MAPPING: Record<string, string> = {
  // Example UIDs - update these with real NFC card UIDs during deployment
  '04A17C92': 'mcnulty',
  // 'UID_HERE': 'jennings',
};

/** Look up a programmer by NFC UID. */
export function getProgrammerByUid(uid: string): ProgrammerData | undefined {
  const key = NFC_UID_MAPPING[uid];
  if (key) return PROGRAMMERS[key];
  return undefined;
}
