import type { HardwareState } from './hardware';
import type { ThemeId, ProgrammerKey } from './constants';

export interface PotEvent {
  type: 'pot';
  id: number; // 0–15
  value: number; // 0–1023 (10-bit ADC)
}

export interface ButtonEvent {
  type: 'button';
  id: number;
  name: 'home' | 'intro';
  pressed: boolean;
}

export interface ContactEvent {
  type: 'contact';
  id: number; // 0–5
  active: boolean;
}

export interface BananaEvent {
  type: 'banana';
  theme: ThemeId;
  socket: 0 | 1; // 2 banana plug sockets per theme
  connected: boolean;
  programmer: ProgrammerKey | null; // Which woman is connected
}

export interface NfcEvent {
  type: 'nfc';
  reader: number; // 0–5
  present: boolean;
  uid: string;
}

/** Discriminated union of all hardware events from the Arduino. */
export type HardwareEvent = PotEvent | ButtonEvent | ContactEvent | BananaEvent | NfcEvent;

// --- System events (backend → frontend) ---

export type SystemEvent =
  | { type: 'connected' }
  | { type: 'disconnected' }
  | { type: 'error'; message: string }
  | { type: 'mode'; mock: boolean };

// --- WebSocket message envelope ---

export type WSMessage =
  | { type: 'hardware'; event: HardwareEvent }
  | { type: 'state'; state: HardwareState }
  | { type: 'system'; event: SystemEvent };
