// ============================================
// Serial Service — Real Arduino Communication
// Opens a USB serial connection, reads newline-delimited CSV,
// parses each line, and emits typed hardware events.
// Auto-reconnects on disconnect with a 3-second backoff.
//
// Contact + NFC Coupling:
//   The microswitch / contact sensor is the physical ground truth
//   for card presence. When a card is inserted, PN532 reads the UID.
//   Even if PN532 sends NFC REMOVED (due to RF drops), the card
//   remains ACTIVE as long as the contact sensor is ACTIVE.
//   Only when the contact sensor becomes INACTIVE is the card removed.
//
// Cable→Banana Resolution:
//   Cable N inherits the programmer from NFC reader / slot N.
//   The socket determines the theme:
//     Sockets 1&2 → pioneering   (socket 0 / 1)
//     Sockets 3&4 → programming  (socket 0 / 1)
//     Sockets 5&6 → teamwork     (socket 0 / 1)
//     Sockets 7&8 → recognition  (socket 0 / 1)
// ============================================

import { EventEmitter } from 'events';
import { config } from '../config.js';
import { parseSerialLine } from './SerialParser.js';
import type { IHardwareSource } from '../types/server.js';
import type {
  BananaEvent,
  HardwareEvent,
  HardwareEventTiming,
  NfcEvent,
} from '../../../shared/events.js';
import type { ThemeId, ProgrammerKey } from '../../../shared/constants.js';
import { UID_TO_PROGRAMMER, CONTACT_COUNT } from '../../../shared/constants.js';

/** Reconnect delay after port close or error (ms) */
const RECONNECT_DELAY_MS = 3000;

/**
 * Maps each 0-based socket index to its theme.
 * Socket pairs share a theme; the sub-socket index
 * within the theme is simply socketId % 2.
 */
const SOCKET_TO_THEME: readonly ThemeId[] = [
  'pioneering',   // socket 0 (Arduino socket 1)
  'pioneering',   // socket 1 (Arduino socket 2)
  'programming',  // socket 2 (Arduino socket 3)
  'programming',  // socket 3 (Arduino socket 4)
  'teamwork',     // socket 4 (Arduino socket 5)
  'teamwork',     // socket 5 (Arduino socket 6)
  'recognition',  // socket 6 (Arduino socket 7)
  'recognition',  // socket 7 (Arduino socket 8)
] as const;

export class SerialService extends EventEmitter implements IHardwareSource {
  private port: InstanceType<typeof import('serialport').SerialPort> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  /**
   * Current physical contact sensor states (0-based slot index -> active boolean).
   */
  private contactActive: boolean[] = new Array(CONTACT_COUNT).fill(false);

  /**
   * Cached last known UID detected for each slot (0-based index -> UID string).
   */
  private slotUids = new Map<number, string>();

  /**
   * Tracks the active NFC UID on each reader (0-based index -> UID string).
   * Used to resolve which programmer a cable carries when plugged in.
   */
  private nfcReaderUids = new Map<number, string>();

  /**
   * Tracks which socket each cable is currently plugged into (0-based).
   * Needed to emit the correct BananaEvent on cable removal.
   */
  private cableToSocket = new Map<number, number>();

  /** Accumulates partial serial data between newlines. */
  private lineBuffer = '';

  /** Rate limiter for POT console logging (per-pot timestamp) */
  private lastLoggedPotValues = new Array(16).fill(-1);
  private lastPotLogTimes = new Array(16).fill(0);

  /** Start the serial connection. */
  start(): void {
    this.stopped = false;
    console.log(`[Serial] Opening ${config.serialPort} at ${config.baudRate} baud…`);
    this.openPort();
  }

  /** Stop the serial connection and cancel any pending reconnects. */
  stop(): void {
    this.stopped = true;
    this.clearReconnect();

    if (this.port?.isOpen) {
      this.port.close((err) => {
        if (err) console.warn('[Serial] Error closing port:', err.message);
      });
    }
    this.port = null;
    console.log('[Serial] Stopped.');
  }

  /**
   * Dynamically import 'serialport' and open the configured port.
   */
  private async openPort(): Promise<void> {
    try {
      const { SerialPort } = await import('serialport');

      this.port = new SerialPort({
        path: config.serialPort,
        baudRate: config.baudRate,
        autoOpen: false,
        highWaterMark: 1024,
      });

      // --- Event handlers ---

      this.port.on('open', () => {
        console.log('[Serial] Port opened.');
        this.lineBuffer = '';

        // Assert DTR / RTS signals (standard for Arduino serial comms)
        this.port?.set({ dtr: true, rts: true }, (err) => {
          if (err) console.warn('[Serial] Warning setting DTR/RTS:', err.message);
        });

        this.emit('connected');
      });

      this.port.on('close', () => {
        console.log('[Serial] Port closed.');
        this.emit('disconnected');
        this.scheduleReconnect();
      });

      this.port.on('error', (err: Error) => {
        console.error('[Serial] Port error:', err.message);
        this.emit('error', err);
        this.scheduleReconnect();
      });

      // Timestamp each raw chunk, then split complete lines for latency diagnostics.
      this.port.on('data', (chunk: Buffer) => {
        const serialReceivedAt = Date.now();
        this.lineBuffer += chunk.toString('utf-8');
        let idx: number;
        while ((idx = this.lineBuffer.indexOf('\n')) !== -1) {
          const line = this.lineBuffer.slice(0, idx);
          this.lineBuffer = this.lineBuffer.slice(idx + 1);
          this.handleLine(line, serialReceivedAt);
        }
      });

      // Open the port
      this.port.open((err) => {
        if (err) {
          console.error('[Serial] Failed to open port:', err.message);
          this.emit('error', err);
          this.scheduleReconnect();
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[Serial] Failed to import serialport module:', message);
      this.emit('error', new Error(`Serial module unavailable: ${message}`));
      this.scheduleReconnect();
    }
  }

  /** Parse a single CSV line and emit typed events. */
  private handleLine(line: string, serialReceivedAt: number): void {
    const trimmed = line.trim();
    if (!trimmed) return;

    const result = parseSerialLine(trimmed);
    const timing: HardwareEventTiming = { serialReceivedAt };

    if (!result) {
      // Truly unrecognised line (partial output, debug noise, etc.)
      console.warn('[Serial] Unrecognised line:', trimmed.slice(0, 120));
      return;
    }

    switch (result.kind) {
      case 'event':
        this.processHardwareEvent(result.event, timing);
        break;

      case 'cable':
        this.handleCableConnect(result.cableId, result.socketId, timing);
        break;

      case 'cable-removed':
        this.handleCableRemoved(result.cableId, timing);
        break;

      case 'system':
        console.log(`[Serial] ${result.line}`);
        break;

      case 'ignored':
        break;
    }
  }

  /**
   * Handle incoming HardwareEvent with coupled Contact/NFC logic
   * and clean non-blocking console logging.
   */
  private processHardwareEvent(event: HardwareEvent, timing: HardwareEventTiming): void {
    switch (event.type) {
      case 'contact': {
        const slot = event.id;
        this.contactActive[slot] = event.active;
        const time = new Date().toISOString().slice(11, 23);
        console.log(`[${time}] [Serial] Contact ${slot + 1}: ${event.active ? 'ACTIVE' : 'INACTIVE'}`);

        // Emit contact event
        this.emit('data', event, timing);

        if (event.active) {
          // Contact activated: if we have a known UID for this slot, make sure NFC is present
          const cachedUid = this.slotUids.get(slot);
          if (cachedUid) {
            this.nfcReaderUids.set(slot, cachedUid);
            const nfcEv: NfcEvent = { type: 'nfc', reader: slot, present: true, uid: cachedUid };
            const prog = UID_TO_PROGRAMMER[cachedUid] ?? 'unknown';
            console.log(`[${time}] [Serial] NFC Slot ${slot + 1} ACTIVE -> Programmer: ${prog} (${cachedUid})`);
            this.emit('data', nfcEv, timing);

            // If cable for this slot is in a socket, update the banana event
            const socket = this.cableToSocket.get(slot);
            if (socket !== undefined) {
              this.emitBananaEvent(slot, socket, true, timing);
            }
          }
        } else {
          // Contact deactivated: physically removed from slot!
          this.nfcReaderUids.delete(slot);
          const nfcEv: NfcEvent = { type: 'nfc', reader: slot, present: false, uid: '' };
          console.log(`[Serial] NFC Slot ${slot + 1} REMOVED (Contact opened)`);
          this.emit('data', nfcEv, timing);

          // If cable for this slot is in a socket, clear programmer from banana plug
          const socket = this.cableToSocket.get(slot);
          if (socket !== undefined) {
            this.emitBananaEvent(slot, socket, true, timing);
          }
        }
        break;
      }

      case 'nfc': {
        const slot = event.reader;
        if (event.present) {
          // Store UID for this slot
          this.slotUids.set(slot, event.uid);
          this.nfcReaderUids.set(slot, event.uid);

          const prog = UID_TO_PROGRAMMER[event.uid] ?? 'unknown';
          console.log(`[Serial] NFC Reader ${slot + 1} SCANNED -> UID: ${event.uid} (${prog})`);

          // Emit NFC present event
          this.emit('data', event, timing);

          // If cable for this slot is currently in a socket, update the banana plug
          const socket = this.cableToSocket.get(slot);
          if (socket !== undefined) {
            this.emitBananaEvent(slot, socket, true, timing);
          }
        } else {
          // PN532 lost card RF sync. Check if the physical microswitch is still closed.
          if (this.contactActive[slot]) {
            // IGNORE removal: card is still physically seated in the slot!
            // Do not emit removal event.
          } else {
            // Contact is also inactive -> emit removal
            this.nfcReaderUids.delete(slot);
            this.emit('data', event, timing);
          }
        }
        break;
      }

      case 'pot': {
        // Always emit POT event to state/WebSocket for real-time responsiveness
        this.emit('data', event, timing);

        // Responsive per-pot console logging
        const now = Date.now();
        const prevVal = this.lastLoggedPotValues[event.id];
        const lastLog = this.lastPotLogTimes[event.id];

        if (prevVal === -1 || Math.abs(event.value - prevVal) >= 10 || event.value === 0 || event.value >= 1000) {
          if (now - lastLog > 50 || event.value === 0 || event.value >= 1000) {
            this.lastLoggedPotValues[event.id] = event.value;
            this.lastPotLogTimes[event.id] = now;
            const time = new Date().toISOString().slice(11, 23);
            console.log(`[${time}] [Serial] POT ${event.id + 1}: ${event.value}`);
          }
        }
        break;
      }

      case 'button': {
        const time = new Date().toISOString().slice(11, 23);
        console.log(`[${time}] [Serial] Button ${event.name.toUpperCase()} (${event.id + 1}): ${event.pressed ? 'PRESSED' : 'RELEASED'}`);
        this.emit('data', event, timing);
        break;
      }

      default:
        this.emit('data', event, timing);
        break;
    }
  }

  // ============================================
  // Cable → BananaEvent Resolution
  // ============================================

  /**
   * Handle a cable being plugged into a socket.
   * If the cable was previously in a different socket, emit a
   * disconnection event for the old socket first.
   */
  private handleCableConnect(
    cableId: number,
    socketId: number,
    timing: HardwareEventTiming,
  ): void {
    const prevSocket = this.cableToSocket.get(cableId);

    // Cable moved from one socket to another — disconnect the old one
    if (prevSocket !== undefined && prevSocket !== socketId) {
      this.emitBananaEvent(cableId, prevSocket, false, timing);
    }

    this.cableToSocket.set(cableId, socketId);
    this.emitBananaEvent(cableId, socketId, true, timing);
  }

  /** Handle a cable being unplugged. */
  private handleCableRemoved(cableId: number, timing: HardwareEventTiming): void {
    const prevSocket = this.cableToSocket.get(cableId);

    if (prevSocket !== undefined) {
      this.emitBananaEvent(cableId, prevSocket, false, timing);
      this.cableToSocket.delete(cableId);
    }
  }

  /**
   * Emit a BananaEvent by resolving:
   *  - socketId → theme + sub-socket (0 or 1)
   *  - cableId  → NFC reader / slot → UID → ProgrammerKey
   */
  private emitBananaEvent(
    cableId: number,
    socketId: number,
    connected: boolean,
    timing: HardwareEventTiming,
  ): void {
    const theme = SOCKET_TO_THEME[socketId];
    if (!theme) return;

    const socket = (socketId % 2) as 0 | 1;

    // Resolve programmer: cable N ↔ NFC slot N
    let programmer: ProgrammerKey | null = null;
    if (connected) {
      const uid = this.nfcReaderUids.get(cableId);
      if (uid) {
        programmer = UID_TO_PROGRAMMER[uid] ?? null;
      }
    }

    const event: BananaEvent = {
      type: 'banana',
      theme,
      socket,
      connected,
      programmer,
    };

    console.log(
      `[Serial] Banana Event: Cable ${cableId + 1} -> Socket ${socketId + 1} (${theme} [${socket}]) | Connected: ${connected} | Programmer: ${programmer ?? 'none'}`
    );

    this.emit('data', event, timing);
  }

  // ============================================
  // Reconnection
  // ============================================

  /** Schedule a reconnect attempt after a delay. */
  private scheduleReconnect(): void {
    if (this.stopped) return;
    this.clearReconnect();

    console.log(`[Serial] Reconnecting in ${RECONNECT_DELAY_MS / 1000}s…`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.stopped) {
        this.openPort();
      }
    }, RECONNECT_DELAY_MS);
  }

  /** Clear any pending reconnect timer. */
  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
