// ============================================
// WebSocket Server
// Broadcasts hardware events and state snapshots
// to all connected browser clients.
// ============================================

import { WebSocketServer as WsServer, WebSocket } from 'ws';
import type { WSMessage } from '../../../shared/events.js';
import { config } from '../config.js';
import type { HardwareStateManager } from '../state/HardwareState.js';
import type { HardwareEvent, HardwareEventTiming } from '../../../shared/events.js';

export class WebSocketServerWrapper {
  private wss: WsServer;
  private clientCount = 0;
  private lastPotLatencyLogTimes = new Array(16).fill(0);

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
      const snapshot = stateManager.getSnapshot();
      const stateMsg: WSMessage = {
        type: 'state',
        state: snapshot,
      };
      console.log(`[WS] Sending snapshot to client (${clientIp}):`, JSON.stringify(snapshot.nfc.map((n, i) => ({ slot: i + 1, present: n.present, uid: n.uid }))));
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
    stateManager.on('change', (event: HardwareEvent, timing: HardwareEventTiming = {}) => {
      if (event.type !== 'pot') {
        console.log(`[WS Broadcast] Event: ${event.type} -> ${this.wss.clients.size} active WS clients`);
      }

      const serverSentAt = Date.now();
      let maxClientBufferedBytes = 0;
      this.wss.clients.forEach((client) => {
        maxClientBufferedBytes = Math.max(maxClientBufferedBytes, client.bufferedAmount);
      });

      const messageTiming: HardwareEventTiming = {
        ...timing,
        serverSentAt,
        maxClientBufferedBytes,
      };

      if (this.shouldLogLatency(event, serverSentAt)) {
        const serialToState = this.duration(timing.serialReceivedAt, timing.stateAppliedAt);
        const stateToWs = this.duration(timing.stateAppliedAt, serverSentAt);
        const backendTotal = this.duration(timing.serialReceivedAt, serverSentAt);
        console.log(
          `[Latency Backend] ${this.eventLabel(event)} | Serial→State ${serialToState} | State→WS ${stateToWs} | total ${backendTotal} | WS queued ${maxClientBufferedBytes} B`,
        );
      }

      const msg: WSMessage = { type: 'hardware', event, timing: messageTiming };
      this.broadcast(msg);
    });
  }

  private shouldLogLatency(event: HardwareEvent, now: number): boolean {
    if (event.type !== 'pot') return true;

    if (now - this.lastPotLatencyLogTimes[event.id] < 250) return false;
    this.lastPotLatencyLogTimes[event.id] = now;
    return true;
  }

  private eventLabel(event: HardwareEvent): string {
    if (event.type === 'pot') return `pot ${event.id + 1}`;
    if (event.type === 'contact') return `contact ${event.id + 1}`;
    if (event.type === 'button') return `button ${event.name}`;
    if (event.type === 'nfc') return `nfc ${event.reader + 1}`;
    return `banana ${event.theme}/${event.socket}`;
  }

  private duration(start: number | undefined, end: number | undefined): string {
    if (start === undefined || end === undefined) return 'n/a';
    return `${Math.max(0, end - start)} ms`;
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
    // wss.close() waits for every connected browser to disconnect. During a
    // dev-server reload those clients stay open and used to stall restarts for
    // roughly 20 seconds, so close them before waiting for the server itself.
    this.wss.clients.forEach((client) => client.terminate());
    this.clientCount = 0;

    return new Promise((resolve, reject) => {
      this.wss.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
