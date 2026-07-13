// ============================================
// Hardware State Manager
// Maintains the single source of truth for all hardware values.
// Emits 'change' whenever state is mutated by an incoming event.
// ============================================

import { EventEmitter } from 'events';
import { createDefaultHardwareState } from '../../../shared/hardware.js';
import type { HardwareState as HardwareStateType } from '../../../shared/hardware.js';
import type { HardwareEvent } from '../../../shared/events.js';

export class HardwareStateManager extends EventEmitter {
  private state: HardwareStateType;

  constructor() {
    super();
    this.state = createDefaultHardwareState();
  }

  /**
   * Apply a hardware event to update the canonical state.
   * Emits 'change' with the originating event after mutation.
   */
  applyEvent(event: HardwareEvent): void {
    switch (event.type) {
      case 'pot':
        this.state.pots[event.id] = event.value;
        break;

      case 'button':
        this.state.buttons[event.name] = event.pressed;
        break;

      case 'contact':
        this.state.contacts[event.id] = event.active;
        break;

      case 'banana':
        this.state.banana[event.id] = event.connected;
        break;

      case 'nfc':
        this.state.nfc[event.reader] = {
          present: event.present,
          uid: event.uid,
          lastSeen: event.present ? Date.now() : this.state.nfc[event.reader].lastSeen,
        };
        break;

      default: {
        // Exhaustive check — TypeScript will error if a case is missing
        const _exhaustive: never = event;
        console.warn('[State] Unknown event type:', _exhaustive);
        return;
      }
    }

    this.emit('change', event);
  }

  /** Returns a deep copy of the current state (safe to serialize). */
  getSnapshot(): HardwareStateType {
    return structuredClone(this.state);
  }
}
