// ============================================
// Server-Specific Types
// IHardwareSource is the common interface for both
// SerialService (production) and MockService (development).
// ============================================

import { EventEmitter } from 'events';
import type { HardwareEvent } from '../../../shared/events.js';

/**
 * Common interface for hardware data sources.
 * Both SerialService and MockService implement this,
 * allowing the server to swap between real and simulated hardware.
 */
export interface IHardwareSource extends EventEmitter {
  /** Begin producing hardware events. */
  start(): void;

  /** Stop producing hardware events and release resources. */
  stop(): void;

  // --- Typed event overloads ---
  on(event: 'data', listener: (data: HardwareEvent) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'connected', listener: () => void): this;
  on(event: 'disconnected', listener: () => void): this;

  emit(event: 'data', data: HardwareEvent): boolean;
  emit(event: 'error', error: Error): boolean;
  emit(event: 'connected'): boolean;
  emit(event: 'disconnected'): boolean;
}
