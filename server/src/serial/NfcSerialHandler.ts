// ============================================
// NFC Serial Handler
// Manages one serial connection to a single NFC Arduino.
// Each NFC Arduino controls exactly one NFC reader and one
// contact sensor (its "slot").
//
// The NFC Arduino uses the same CSV protocol as the main sketch:
//   NFC,1,PRESENT,<uid>   — card detected
//   NFC,1,REMOVED         — card no longer detected (ignored; contact governs presence)
//   CONTACT,1,ACTIVE      — contact sensor closed
//   CONTACT,1,INACTIVE    — contact sensor opened
//
// This handler translates all reader/contact IDs to the global
// slot index (0–5) before forwarding events to the SerialService.
// ============================================

import { EventEmitter } from 'events';
import { parseSerialLine } from './SerialParser.js';
import { config } from '../config.js';
import type { HardwareEvent, HardwareEventTiming } from '../../../shared/events.js';

/** Reconnect delay after port close or error (ms) */
const RECONNECT_DELAY_MS = 3000;

/**
 * Manages the serial connection to a single NFC Arduino.
 * Emits 'data' events with slot-corrected NFC and CONTACT events.
 */
export class NfcSerialHandler extends EventEmitter {
  private readonly slotIndex: number; // 0-based global slot index (0–5)
  private readonly portPath: string;

  private port: InstanceType<typeof import('serialport').SerialPort> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

  /** Accumulates partial serial data between newlines. */
  private lineBuffer = '';

  constructor(slotIndex: number, portPath: string) {
    super();
    this.slotIndex = slotIndex;
    this.portPath = portPath;
  }

  /** Open the serial connection and begin reading events. */
  start(): void {
    this.stopped = false;
    console.log(`[NFC-${this.slotIndex + 1}] Opening ${this.portPath} at ${config.baudRate} baud…`);
    this.openPort();
  }

  /** Close the serial connection and cancel any pending reconnects. */
  stop(): void {
    this.stopped = true;
    this.clearReconnect();

    if (this.port?.isOpen) {
      this.port.close((err) => {
        if (err) console.warn(`[NFC-${this.slotIndex + 1}] Error closing port:`, err.message);
      });
    }
    this.port = null;
    console.log(`[NFC-${this.slotIndex + 1}] Stopped.`);
  }

  /** Open the serial port with auto-reconnect on failure. */
  private async openPort(): Promise<void> {
    try {
      const { SerialPort } = await import('serialport');

      this.port = new SerialPort({
        path: this.portPath,
        baudRate: config.baudRate,
        autoOpen: false,
        highWaterMark: 64,
      });

      this.port.on('open', () => {
        console.log(`[NFC-${this.slotIndex + 1}] Port ${this.portPath} opened.`);
        this.lineBuffer = '';

        // Pulse DTR to reset the NFC Arduino so it reports its current state.
        const openedPort = this.port;
        openedPort?.set({ dtr: false, rts: false }, (resetErr) => {
          if (resetErr) {
            console.warn(`[NFC-${this.slotIndex + 1}] Warning clearing DTR/RTS:`, resetErr.message);
          }

          setTimeout(() => {
            if (!openedPort?.isOpen) return;
            openedPort.set({ dtr: true, rts: true }, (assertErr) => {
              if (assertErr) {
                console.warn(`[NFC-${this.slotIndex + 1}] Warning setting DTR/RTS:`, assertErr.message);
              }
            });
          }, 100);
        });

        this.emit('connected');
      });

      this.port.on('close', () => {
        console.log(`[NFC-${this.slotIndex + 1}] Port ${this.portPath} closed.`);
        this.emit('disconnected');
        this.scheduleReconnect();
      });

      this.port.on('error', (err: Error) => {
        console.error(`[NFC-${this.slotIndex + 1}] Port error:`, err.message);
        this.emit('error', err);
        this.scheduleReconnect();
      });

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
          console.error(`[NFC-${this.slotIndex + 1}] Failed to open ${this.portPath}:`, err.message);
          this.emit('error', err);
          this.scheduleReconnect();
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[NFC-${this.slotIndex + 1}] Failed to import serialport module:`, message);
      this.emit('error', new Error(`Serial module unavailable: ${message}`));
      this.scheduleReconnect();
    }
  }

  /**
   * Parse a single line and re-emit NFC/CONTACT events with the
   * correct global slot index substituted in.
   */
  private handleLine(line: string, serialReceivedAt: number): void {
    const trimmed = line.trim();
    if (!trimmed) return;

    const result = parseSerialLine(trimmed);
    const timing: HardwareEventTiming = { serialReceivedAt };

    if (!result) {
      console.warn(`[NFC-${this.slotIndex + 1}] Unrecognised line:`, trimmed.slice(0, 120));
      return;
    }

    if (result.kind === 'ignored') return;

    if (result.kind === 'system') {
      console.log(`[NFC-${this.slotIndex + 1}] ${result.line}`);
      return;
    }

    if (result.kind !== 'event') {
      // Cable events are not expected from NFC Arduinos
      console.warn(`[NFC-${this.slotIndex + 1}] Unexpected parse result kind: ${result.kind}`);
      return;
    }

    const event = result.event;

    // Re-map the reader/contact id to the global slot index.
    let remappedEvent: HardwareEvent;

    switch (event.type) {
      case 'nfc': {
        const time = new Date().toISOString().slice(11, 23);
        remappedEvent = { ...event, reader: this.slotIndex };
        if (event.present) {
          console.log(
            `[${time}] [NFC-${this.slotIndex + 1}] NFC PRESENT → UID: ${event.uid}`,
          );
        }
        break;
      }

      case 'contact': {
        const time = new Date().toISOString().slice(11, 23);
        remappedEvent = { ...event, id: this.slotIndex };
        console.log(
          `[${time}] [NFC-${this.slotIndex + 1}] Contact: ${event.active ? 'ACTIVE' : 'INACTIVE'}`,
        );
        break;
      }

      default:
        // POT, BUTTON, CABLE events are not expected from NFC Arduinos
        console.warn(
          `[NFC-${this.slotIndex + 1}] Unexpected event type from NFC Arduino: ${event.type}`,
        );
        return;
    }

    this.emit('data', remappedEvent, timing);
  }

  // ============================================
  // Reconnection
  // ============================================

  private scheduleReconnect(): void {
    if (this.stopped) return;
    this.clearReconnect();

    console.log(`[NFC-${this.slotIndex + 1}] Reconnecting in ${RECONNECT_DELAY_MS / 1000}s…`);
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
