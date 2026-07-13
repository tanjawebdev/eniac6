// ============================================
// ENIAC Six — Server Entry Point
// Wires together: Express HTTP, hardware source (mock/serial),
// state manager, and WebSocket broadcaster.
// ============================================

import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { HardwareStateManager } from './state/HardwareState.js';
import { WebSocketServerWrapper } from './websocket/WebSocketServer.js';
import { healthRouter } from './routes/health.js';
import type { IHardwareSource } from './types/server.js';

// ============================================
// Bootstrap
// ============================================

async function main(): Promise<void> {
  // --- Express HTTP server ---
  const app = express();
  app.use(cors());
  app.use(healthRouter);

  const httpServer = app.listen(config.httpPort, () => {
    console.log(`[HTTP] Server listening on port ${config.httpPort}`);
  });

  // --- Hardware source (mock or serial) ---
  let hardwareSource: IHardwareSource;

  if (config.mockMode) {
    const { MockService } = await import('./mock/MockService.js');
    hardwareSource = new MockService();
    console.log('[Main] Using MockService (simulated hardware).');
  } else {
    const { SerialService } = await import('./serial/SerialService.js');
    hardwareSource = new SerialService();
    console.log(`[Main] Using SerialService (${config.serialPort}).`);
  }

  // --- Hardware state manager ---
  const stateManager = new HardwareStateManager();

  // Feed hardware events into the state manager
  hardwareSource.on('data', (event) => {
    stateManager.applyEvent(event);
  });

  // Log hardware source lifecycle events
  hardwareSource.on('connected', () => {
    console.log('[Main] Hardware source connected.');
  });

  hardwareSource.on('disconnected', () => {
    console.log('[Main] Hardware source disconnected.');
  });

  hardwareSource.on('error', (err) => {
    console.error('[Main] Hardware source error:', err.message);
  });

  // --- WebSocket server ---
  const wsServer = new WebSocketServerWrapper(config.wsPort);
  wsServer.setupConnectionHandler(stateManager);
  wsServer.subscribeToState(stateManager);

  // --- Start hardware source ---
  hardwareSource.start();

  // --- Startup banner ---
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║         ENIAC Six — Server Ready         ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Mode:       ${config.mockMode ? 'MOCK (simulated)' : 'PRODUCTION (serial)'}  ║`);
  console.log(`║  HTTP:       http://localhost:${config.httpPort}        ║`);
  console.log(`║  WebSocket:  ws://localhost:${config.wsPort}          ║`);
  if (!config.mockMode) {
    console.log(`║  Serial:     ${config.serialPort.padEnd(25)}  ║`);
  }
  console.log('╚══════════════════════════════════════════╝');
  console.log('');

  // ============================================
  // Graceful Shutdown
  // ============================================

  let isShuttingDown = false;

  async function shutdown(signal: string): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\n[Main] Received ${signal}. Shutting down gracefully…`);

    // Stop hardware source
    hardwareSource.stop();

    // Close WebSocket server
    try {
      await wsServer.close();
      console.log('[Main] WebSocket server closed.');
    } catch (err) {
      console.warn('[Main] Error closing WebSocket server:', err);
    }

    // Close HTTP server
    httpServer.close(() => {
      console.log('[Main] HTTP server closed.');
      console.log('[Main] Goodbye!');
      process.exit(0);
    });

    // Force exit after 5 seconds if graceful shutdown hangs
    setTimeout(() => {
      console.error('[Main] Forced exit after timeout.');
      process.exit(1);
    }, 5000).unref();
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// --- Run ---
main().catch((err) => {
  console.error('[Main] Fatal error during startup:', err);
  process.exit(1);
});
