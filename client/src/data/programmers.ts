import { PROGRAMMER_UIDS, UID_TO_PROGRAMMER, type ProgrammerKey } from '@shared/constants';

export interface ProgrammerData {
  key: ProgrammerKey;
  name: string;        // Display name with \n for line break
  firstName: string;   // Short name
  fullName: string;    // Full name
  color: string;       // Hex color (updated to new colors)
  colorDark: string;       // Hex color (updated to new colors)
  year: string;
  role: string;
  uid: string;         // Unique NFC UID associated with this programmer's card
}

export const PROGRAMMERS: Record<ProgrammerKey, ProgrammerData> = {
  mcnulty: {
    key: 'mcnulty',
    name: 'Kay\nMcNulty',
    firstName: 'Kay',
    fullName: 'Kathleen McNulty',
    color: '#F0CA38',
    colorDark: '#d0b030ff',
    year: '1945',
    role: 'programmer',
    uid: PROGRAMMER_UIDS.mcnulty,
  },
  jennings: {
    key: 'jennings',
    name: 'Jean\nJennings',
    firstName: 'Jean',
    fullName: 'Betty Jean Jennings Bartik',
    color: '#E78C2B',
    colorDark: '#cb7121ff',
    year: '1945',
    role: 'programmer',
    uid: PROGRAMMER_UIDS.jennings,
  },
  snyder: {
    key: 'snyder',
    name: 'Betty\nSnyder',
    firstName: 'Betty',
    fullName: 'Betty Snyder Holberton',
    color: '#D84A1C',
    colorDark: '#b63413ff',
    year: '1945',
    role: 'programmer',
    uid: PROGRAMMER_UIDS.snyder,
  },
  wescoff: {
    key: 'wescoff',
    name: 'Marlyn\nWescoff',
    firstName: 'Marlyn',
    fullName: 'Marlyn Wescoff Meltzer',
    color: '#9B3A3D',
    colorDark: '#803033ff',
    year: '1945',
    role: 'programmer',
    uid: PROGRAMMER_UIDS.wescoff,
  },
  bilas: {
    key: 'bilas',
    name: 'Fran\nBilas',
    firstName: 'Fran',
    fullName: 'Frances Bilas Spence',
    color: '#805383ff',
    colorDark: '#5C3D5E',
    year: '1945',
    role: 'programmer',
    uid: PROGRAMMER_UIDS.bilas,
  },
  lichterman: {
    key: 'lichterman',
    name: 'Ruth\nLichterman',
    firstName: 'Ruth',
    fullName: 'Ruth Lichterman Teitelbaum',
    color: '#4769a1ff',
    colorDark: '#0B3D7D',
    year: '1945',
    role: 'programmer',
    uid: PROGRAMMER_UIDS.lichterman,
  },
};

export const PROGRAMMER_LIST = Object.values(PROGRAMMERS);

/** Look up a programmer by NFC UID. */
export function getProgrammerByUid(uid: string): ProgrammerData | undefined {
  const key = UID_TO_PROGRAMMER[uid];
  if (key) return PROGRAMMERS[key];
  return undefined;
}
