// ============================================
// Mock Service — Simulated Hardware for Development
// Creates a silent simulation source that emits a connection status
// but does not generate automatic periodic random events.
// Instead, it relies on manual client-driven WebSocket emulation events.
// ============================================

import { EventEmitter } from 'events';
import type { IHardwareSource } from '../types/server.js';

export class MockService extends EventEmitter implements IHardwareSource {
  private running = false;

  start(): void {
    if (this.running) return;
    this.running = true;
    console.log('[Mock] Silent mode active. Awaiting manual simulation inputs from client UI...');
    
    // Notify server that hardware source is connected
    this.emit('connected');
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    this.emit('disconnected');
    console.log('[Mock] Stopped.');
  }
}
