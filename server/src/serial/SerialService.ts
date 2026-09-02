// ============================================
// Serial Service — Main Arduino (COM3 / Mega)
// Opens a USB serial connection to the main Arduino Mega,
// reads newline-delimited CSV, parses each line, and emits
// typed hardware events: POT, BUTTON, CABLE.
//
// NFC and CONTACT events are NO LONGER handled here.
// They are received from the 6 dedicated NFC Arduinos via
// NfcSerialHandler instances (one per slot), whose events
// are forwarded through this service's 'data' emitter so
// the rest of the backend (HardwareStateManager, WebSocket)
// has a single unified source.
//
// Auto-reconnects on disconnect with a 3-second backoff.
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
import { NfcSerialHandler } from './NfcSerialHandler.js';
import type { IHardwareSource } from '../types/server.js';
import type {
  BananaEvent,
  HardwareEvent,
  HardwareEventTiming,
} from '../../../shared/events.js';
import type { ThemeId, ProgrammerKey } from '../../../shared/constants.js';
import { UID_TO_PROGRAMMER } from '../../../shared/constants.js';

/** Reconnect delay after port close or error (ms) */
const RECONNECT_DELAY_MS = 3000;

/**
 * Maps each 0-based socket index to its theme.
 * Socket pairs share a theme; the sub-socket index
 * within the theme is simply socketId % 2.
 */
const SOCKET_TO_THEME: readonly ThemeId[] = [
  'recognition',   // socket 0 (Arduino socket 1)
  'recognition',   // socket 1 (Arduino socket 2)
  'teamwork',      // socket 2 (Arduino socket 3)
  'teamwork',      // socket 3 (Arduino socket 4)
  'programming',   // socket 4 (Arduino socket 5)
  'programming',   // socket 5 (Arduino socket 6)
  'pioneering',    // socket 6 (Arduino socket 7)
  'pioneering',    // socket 7 (Arduino socket 8)
] as const;

export class SerialService extends EventEmitter implements IHardwareSource {
  private port: InstanceType<typeof import('serialport').SerialPort> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  /** NFC Arduino handlers — one per slot (0–5). */
  private nfcHandlers: NfcSerialHandler[] = [];

  /**
   * Tracks the active NFC UID on each reader (0-based index → UID string).
   * Used to resolve which programmer a cable carries when plugged in.
   * Populated by events forwarded from the NFC Arduinos.
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

  /** Start the main serial connection and all NFC handlers. */
  start(): void {
    this.stopped = false;
    console.log(`[Serial] Opening main Arduino on ${config.mainPort} at ${config.baudRate} baud…`);
    this.openPort();
    this.startNfcHandlers();
  }

  /** Stop everything and cancel any pending reconnects. */
  stop(): void {
    this.stopped = true;
    this.clearReconnect();

    if (this.port?.isOpen) {
      this.port.close((err) => {
        if (err) console.warn('[Serial] Error closing port:', err.message);
      });
    }
    this.port = null;

    for (const handler of this.nfcHandlers) {
      handler.stop();
    }
    this.nfcHandlers = [];

    console.log('[Serial] Stopped.');
  }

  // ============================================
  // NFC Handlers
  // ============================================

  /** Instantiate and start one NfcSerialHandler per configured NFC port. */
  private startNfcHandlers(): void {
    config.nfcPorts.forEach((portPath, slotIndex) => {
      const handler = new NfcSerialHandler(slotIndex, portPath);

      // Forward all hardware events from NFC Arduinos through this service.
      handler.on('data', (event: HardwareEvent, timing?: HardwareEventTiming) => {
        this.processNfcHandlerEvent(event, timing ?? {});
      });

      handler.on('connected', () => {
        console.log(`[Serial] NFC Arduino ${slotIndex + 1} (${portPath}) connected.`);
      });

      handler.on('disconnected', () => {
        console.log(`[Serial] NFC Arduino ${slotIndex + 1} (${portPath}) disconnected.`);
      });

      handler.on('error', (err: Error) => {
        console.error(`[Serial] NFC Arduino ${slotIndex + 1} (${portPath}) error:`, err.message);
      });

      handler.start();
      this.nfcHandlers.push(handler);
    });
  }

  /**
   * Handle events from NFC Arduinos. Applies NFC UID tracking for
   * banana-plug resolution, then re-emits to the state manager.
   */
  private processNfcHandlerEvent(event: HardwareEvent, timing: HardwareEventTiming): void {
    switch (event.type) {
      case 'nfc': {
        if (event.present) {
          this.nfcReaderUids.set(event.reader, event.uid);

          // If the cable for this slot is already in a socket, update banana state.
          const socket = this.cableToSocket.get(event.reader);
          if (socket !== undefined) {
            this.emitBananaEvent(event.reader, socket, true, timing);
          }
        } else {
          this.nfcReaderUids.delete(event.reader);

          const socket = this.cableToSocket.get(event.reader);
          if (socket !== undefined) {
            this.emitBananaEvent(event.reader, socket, true, timing);
          }
        }
        // Always forward the raw NFC event to the state manager.
        this.emit('data', event, timing);
        break;
      }

      case 'contact': {
        // Forward raw contact event; NFC Arduino handles the coupled NFC logic.
        this.emit('data', event, timing);
        break;
      }

      default:
        // Unexpected event type from an NFC Arduino — forward anyway.
        this.emit('data', event, timing);
        break;
    }
  }

  // ============================================
  // Main Arduino serial port
  // ============================================

  /** Dynamically import 'serialport' and open the main Arduino port. */
  private async openPort(): Promise<void> {
    try {
      const { SerialPort } = await import('serialport');

      this.port = new SerialPort({
        path: config.mainPort,
        baudRate: config.baudRate,
        autoOpen: false,
        // Keep Windows/USB reads small without creating one callback per byte.
        highWaterMark: 64,
      });

      // --- Event handlers ---

      this.port.on('open', () => {
        console.log('[Serial] Main port opened.');
        this.lineBuffer = '';

        // Pulse DTR so a fast backend reload also resets the Arduino.
        const openedPort = this.port;
        openedPort?.set({ dtr: false, rts: false }, (resetErr) => {
          if (resetErr) {
            console.warn('[Serial] Warning clearing DTR/RTS:', resetErr.message);
          }

          setTimeout(() => {
            if (!openedPort?.isOpen) return;
            openedPort.set({ dtr: true, rts: true }, (assertErr) => {
              if (assertErr) {
                console.warn('[Serial] Warning setting DTR/RTS:', assertErr.message);
              }
            });
          }, 100);
        });

        this.emit('connected');
      });

      this.port.on('close', () => {
        console.log('[Serial] Main port closed.');
        this.emit('disconnected');
        this.scheduleReconnect();
      });

      this.port.on('error', (err: Error) => {
        console.error('[Serial] Main port error:', err.message);
        this.emit('error', err);
        this.scheduleReconnect();
      });

      // Timestamp each low-latency chunk, then split complete lines.
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

      this.port.open((err) => {
        if (err) {
          console.error('[Serial] Failed to open main port:', err.message);
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
        this.processMainEvent(result.event, timing);
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
   * Process hardware events from the main Arduino.
   * Only POT and BUTTON events are expected here;
   * NFC and CONTACT come from the NFC Arduinos.
   */
  private processMainEvent(event: HardwareEvent, timing: HardwareEventTiming): void {
    switch (event.type) {
      case 'pot': {
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
        // NFC and CONTACT events from the main port are unexpected but
        // forwarded anyway to avoid silently dropping data.
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

    // Resolve programmer: cable N ↔ NFC slot N (UID stored by NFC handler events)
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
      `[Serial] Banana Event: Cable ${cableId + 1} → Socket ${socketId + 1} (${theme} [${socket}]) | Connected: ${connected} | Programmer: ${programmer ?? 'none'}`
    );

    this.emit('data', event, timing);
  }

  // ============================================
  // Reconnection (main port only)
  // ============================================

  private scheduleReconnect(): void {
    if (this.stopped) return;
    this.clearReconnect();

    console.log(`[Serial] Reconnecting main port in ${RECONNECT_DELAY_MS / 1000}s…`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.stopped) {
        this.openPort();
      }
    }, RECONNECT_DELAY_MS);
  }

  private clearReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
