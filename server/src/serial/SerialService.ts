// ============================================
// Serial Service — Real Arduino Communication
// Opens a USB serial connection, reads newline-delimited JSON,
// validates each line, and emits typed hardware events.
// Auto-reconnects on disconnect with a 3-second backoff.
// ============================================

import { EventEmitter } from 'events';
import { config } from '../config.js';
import { validateHardwareEvent } from './SerialParser.js';
import type { IHardwareSource } from '../types/server.js';

/** Reconnect delay after port close or error (ms) */
const RECONNECT_DELAY_MS = 3000;

export class SerialService extends EventEmitter implements IHardwareSource {
  private port: InstanceType<typeof import('serialport').SerialPort> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;

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
   * Dynamic import ensures the server doesn't crash if the native
   * addon isn't available (e.g., in CI or mock-only environments).
   */
  private async openPort(): Promise<void> {
    try {
      const { SerialPort } = await import('serialport');
      const { ReadlineParser } = await import('@serialport/parser-readline');

      this.port = new SerialPort({
        path: config.serialPort,
        baudRate: config.baudRate,
        autoOpen: false,
      });

      const parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

      // --- Event handlers ---

      this.port.on('open', () => {
        console.log('[Serial] Port opened.');
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

      parser.on('data', (line: string) => {
        this.handleLine(line);
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

  /** Parse a single line of serial JSON and emit if valid. */
  private handleLine(line: string): void {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const parsed: unknown = JSON.parse(trimmed);
      const event = validateHardwareEvent(parsed);

      if (event) {
        this.emit('data', event);
      } else {
        console.warn('[Serial] Invalid event shape:', trimmed);
      }
    } catch {
      // Arduino often sends debug text or partial JSON on startup — ignore
      console.warn('[Serial] Non-JSON line:', trimmed.slice(0, 80));
    }
  }

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
