// ============================================
// Server Configuration
// Toggle mockMode to switch between simulated hardware (dev)
// and real Arduino serial communication (production).
// ============================================

import { WS_PORT, HTTP_PORT, SERIAL_BAUD_RATE } from '../../shared/constants.js';

export const config = {
  /** When true, uses MockService instead of SerialService */
  mockMode: false,

  /**
   * Serial port for the main Arduino Mega.
   * Handles: POT, BUTTON, CABLE events.
   * (ignored in mock mode)
   */
  mainPort: 'COM3', // macOS: /dev/tty.usbmodem*

  /**
   * Serial ports for the 6 NFC Arduinos, one per card slot.
   * Index 0 = slot 1 (NFC reader 0), index 5 = slot 6 (NFC reader 5).
   * Each NFC Arduino handles: NFC + CONTACT events for its single slot.
   * (ignored in mock mode)
   */
  nfcPorts: [
    'COM4',  // NFC Arduino 1 — slot 0
    'COM10', // NFC Arduino 2 — slot 1
    'COM12',  // NFC Arduino 3 — slot 2
    'COM9',  // NFC Arduino 4 — slot 3
    //'COM8',  // NFC Arduino 5 — slot 4
    'COM13',  // NFC Arduino 6 — slot 5
  ],

  /** Baud rate for all serial connections */
  baudRate: SERIAL_BAUD_RATE,

  /** WebSocket server port */
  wsPort: WS_PORT,

  /** Express HTTP server port */
  httpPort: HTTP_PORT,

  /** Interval between mock event batches (ms) */
  mockIntervalMs: 300,
} as const;
