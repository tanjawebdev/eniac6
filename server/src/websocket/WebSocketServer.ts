// ============================================
// WebSocket Server
// Broadcasts hardware events and state snapshots
// to all connected browser clients.
// ============================================

import { WebSocketServer as WsServer, WebSocket } from 'ws';
import type { WSMessage } from '../../../shared/events.js';
import { config } from '../config.js';
import type { HardwareStateManager } from '../state/HardwareState.js';
import type { HardwareEvent } from '../../../shared/events.js';

export class WebSocketServerWrapper {
  private wss: WsServer;
  private clientCount = 0;

  constructor(port: number) {
    this.wss = new WsServer({ port });

    this.wss.on('listening', () => {
      console.log(`[WS] WebSocket server listening on port ${port}`);
    });

    this.wss.on('error', (err) => {
      console.error('[WS] Server error:', err.message);
    });
  }

  /**
   * Set up connection handling.
   * Each new client receives the full state snapshot and current mode.
   */
  setupConnectionHandler(stateManager: HardwareStateManager): void {
    this.wss.on('connection', (ws, req) => {
      this.clientCount++;
      const clientIp = req.socket.remoteAddress ?? 'unknown';
      console.log(`[WS] Client connected (${clientIp}). Total: ${this.clientCount}`);

      // Send full state snapshot to new client
      const stateMsg: WSMessage = {
        type: 'state',
        state: stateManager.getSnapshot(),
      };
      this.send(ws, stateMsg);

      // Send current mode
      const modeMsg: WSMessage = {
        type: 'system',
        event: { type: 'mode', mock: config.mockMode },
      };
      this.send(ws, modeMsg);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as WSMessage;
          if (message.type === 'hardware') {
            // Apply simulated event to server state
            stateManager.applyEvent(message.event);
          }
        } catch (err) {
          console.error('[WS] Error processing client message:', err);
        }
      });

      ws.on('close', () => {
        this.clientCount--;
        console.log(`[WS] Client disconnected (${clientIp}). Total: ${this.clientCount}`);
      });

      ws.on('error', (err) => {
        console.warn(`[WS] Client error (${clientIp}):`, err.message);
      });
    });
  }

  /**
   * Subscribe to hardware state changes and broadcast each event
   * to all connected clients.
   */
  subscribeToState(stateManager: HardwareStateManager): void {
    stateManager.on('change', (event: HardwareEvent) => {
      const msg: WSMessage = { type: 'hardware', event };
      this.broadcast(msg);
    });
  }

  /** Broadcast a message to all connected clients. */
  broadcast(message: WSMessage): void {
    const json = JSON.stringify(message);

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(json);
      }
    });
  }

  /** Send a message to a single client. */
  private send(ws: WebSocket, message: WSMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /** Get the current connected client count. */
  getClientCount(): number {
    return this.clientCount;
  }

  /** Gracefully close the WebSocket server. */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
