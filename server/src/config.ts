// ============================================
// Server Configuration
// Toggle mockMode to switch between simulated hardware (dev)
// and real Arduino serial communication (production).
// ============================================

import { WS_PORT, HTTP_PORT, SERIAL_BAUD_RATE } from '../../shared/constants.js';

export const config = {
  /** When true, uses MockService instead of SerialService */
  mockMode: true,

  /** Serial port for the Arduino Mega (ignored in mock mode) */
  serialPort: 'COM3', // macOS: /dev/tty.usbmodem*

  /** Baud rate for serial communication */
  baudRate: SERIAL_BAUD_RATE,

  /** WebSocket server port */
  wsPort: WS_PORT,

  /** Express HTTP server port */
  httpPort: HTTP_PORT,

  /** Interval between mock event batches (ms) */
  mockIntervalMs: 300,
} as const;
