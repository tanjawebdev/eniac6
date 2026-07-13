// ============================================
// Mock Service — Simulated Hardware for Development
// Generates realistic fake hardware events so the frontend
// can be developed without a physical Arduino connected.
// Each sensor type runs on its own independent timer.
// ============================================

import { EventEmitter } from 'events';
import { config } from '../config.js';
import {
  POT_COUNT,
  BANANA_COUNT,
  CONTACT_COUNT,
  NFC_READER_COUNT,
} from '../../../shared/constants.js';
import type { HardwareEvent } from '../../../shared/events.js';
import type { IHardwareSource } from '../types/server.js';

// --- Helpers ---

/** Random integer in [min, max] inclusive. */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random hex string of given byte length. */
function randomHexUid(bytes = 4): string {
  return Array.from({ length: bytes }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('').toUpperCase();
}

// ============================================
// MockService
// ============================================

export class MockService extends EventEmitter implements IHardwareSource {
  private timers: ReturnType<typeof setTimeout>[] = [];
  private intervals: ReturnType<typeof setInterval>[] = [];
  private running = false;

  // --- Pot simulation state ---
  /** Each pot has a unique frequency and phase for smooth sinusoidal output. */
  private potParams = Array.from({ length: POT_COUNT }, (_, i) => ({
    freq: 0.0005 + i * 0.00012,   // slightly different speed per pot
    phase: (i * Math.PI) / 4,      // staggered phases
  }));

  // --- NFC simulation state ---
  /** Track which NFC readers currently have a card inserted. */
  private nfcPresent = Array(NFC_READER_COUNT).fill(false) as boolean[];

  start(): void {
    if (this.running) return;
    this.running = true;
    console.log('[Mock] Silent mode active. Awaiting manual simulation inputs from client UI...');

    this.emit('connected');
    // Disable automatic random updates for manual control
    // this.startPotSimulation();
    // this.startNfcSimulation();
    // this.startButtonSimulation();
    // this.startContactSimulation();
    // this.startBananaSimulation();
  }

  stop(): void {
    this.running = false;
    this.intervals.forEach(clearInterval);
    this.timers.forEach(clearTimeout);
    this.intervals = [];
    this.timers = [];
    this.emit('disconnected');
    console.log('[Mock] Stopped.');
  }

  // ============================================
  // Potentiometers — smooth sinusoidal curves
  // ============================================

  private startPotSimulation(): void {
    const interval = setInterval(() => {
      if (!this.running) return;

      for (let id = 0; id < POT_COUNT; id++) {
        const { freq, phase } = this.potParams[id];
        const value = Math.round(512 + 511 * Math.sin(Date.now() * freq + phase));
        const event: HardwareEvent = { type: 'pot', id, value };
        this.emit('data', event);
      }
    }, config.mockIntervalMs);

    this.intervals.push(interval);
  }

  // ============================================
  // NFC — periodic insert/remove cycles
  // ============================================

  private startNfcSimulation(): void {
    for (let reader = 0; reader < NFC_READER_COUNT; reader++) {
      this.scheduleNfcCycle(reader);
    }
  }

  private scheduleNfcCycle(reader: number): void {
    if (!this.running) return;

    // Wait 3–8s before inserting a card
    const insertDelay = randInt(3000, 8000);

    const insertTimer = setTimeout(() => {
      if (!this.running) return;

      // Insert card
      const uid = randomHexUid(4);
      this.nfcPresent[reader] = true;
      this.emit('data', { type: 'nfc', reader, present: true, uid } as HardwareEvent);

      // Keep inserted for 5–15s, then remove
      const holdDuration = randInt(5000, 15000);
      const removeTimer = setTimeout(() => {
        if (!this.running) return;

        this.nfcPresent[reader] = false;
        this.emit('data', { type: 'nfc', reader, present: false, uid: '' } as HardwareEvent);

        // Schedule next cycle
        this.scheduleNfcCycle(reader);
      }, holdDuration);

      this.timers.push(removeTimer);
    }, insertDelay);

    this.timers.push(insertTimer);
  }

  // ============================================
  // Buttons — occasional press/release pairs
  // ============================================

  private startButtonSimulation(): void {
    const buttonDefs: Array<{ id: number; name: 'home' | 'intro' }> = [
      { id: 0, name: 'home' },
      { id: 1, name: 'intro' },
    ];

    for (const btn of buttonDefs) {
      this.scheduleButtonPress(btn);
    }
  }

  private scheduleButtonPress(btn: { id: number; name: 'home' | 'intro' }): void {
    if (!this.running) return;

    const delay = randInt(5000, 20000);
    const pressTimer = setTimeout(() => {
      if (!this.running) return;

      // Press
      this.emit('data', {
        type: 'button', id: btn.id, name: btn.name, pressed: true,
      } as HardwareEvent);

      // Release after 200ms
      const releaseTimer = setTimeout(() => {
        if (!this.running) return;
        this.emit('data', {
          type: 'button', id: btn.id, name: btn.name, pressed: false,
        } as HardwareEvent);
        this.scheduleButtonPress(btn);
      }, 200);

      this.timers.push(releaseTimer);
    }, delay);

    this.timers.push(pressTimer);
  }

  // ============================================
  // Contacts — random toggles
  // ============================================

  private startContactSimulation(): void {
    for (let id = 0; id < CONTACT_COUNT; id++) {
      this.scheduleContactToggle(id, false);
    }
  }

  private scheduleContactToggle(id: number, currentState: boolean): void {
    if (!this.running) return;

    const delay = randInt(3000, 10000);
    const timer = setTimeout(() => {
      if (!this.running) return;

      const nextState = !currentState;
      this.emit('data', { type: 'contact', id, active: nextState } as HardwareEvent);
      this.scheduleContactToggle(id, nextState);
    }, delay);

    this.timers.push(timer);
  }

  // ============================================
  // Banana plugs — random connect/disconnect
  // ============================================

  private startBananaSimulation(): void {
    for (let id = 0; id < BANANA_COUNT; id++) {
      this.scheduleBananaToggle(id, false);
    }
  }

  private scheduleBananaToggle(id: number, currentState: boolean): void {
    if (!this.running) return;

    const delay = randInt(4000, 12000);
    const timer = setTimeout(() => {
      if (!this.running) return;

      const nextState = !currentState;
      this.emit('data', { type: 'banana', id, connected: nextState } as HardwareEvent);
      this.scheduleBananaToggle(id, nextState);
    }, delay);

    this.timers.push(timer);
  }
}
