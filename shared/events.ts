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

/** Optional end-to-end timestamps added by the backend for latency diagnostics. */
export interface HardwareEventTiming {
  /** Complete newline-terminated event received from the serial port. */
  serialReceivedAt?: number;
  /** Event applied to the canonical backend state. */
  stateAppliedAt?: number;
  /** WebSocket broadcast started. */
  serverSentAt?: number;
  /** Bytes already queued across the busiest WebSocket client before this send. */
  maxClientBufferedBytes?: number;
}

// --- System events (backend → frontend) ---

export type SystemEvent =
  | { type: 'connected' }
  | { type: 'disconnected' }
  | { type: 'error'; message: string }
  | { type: 'mode'; mock: boolean };

// --- WebSocket message envelope ---

export type WSMessage =
  | { type: 'hardware'; event: HardwareEvent; timing?: HardwareEventTiming }
  | { type: 'state'; state: HardwareState }
  | { type: 'system'; event: SystemEvent };
