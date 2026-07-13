import { useHardwareStore } from '../stores/hardwareStore';
import { useAppStore } from '../stores/appStore';
import type { WSMessage, HardwareEvent } from '@shared/events';
import { WS_PORT } from '@shared/constants';

export class WebSocketService {
  private static instance: WebSocketService | null = null;
  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 10000;
  private isIntentionalDisconnect = false;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isIntentionalDisconnect = false;
    const url = `ws://${window.location.hostname}:${WS_PORT}`;
    
    console.log(`[WS] Connecting to ${url}...`);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[WS] Connected successfully');
      useAppStore.getState().setWsConnected(true);
      this.reconnectDelay = 1000; // Reset reconnect delay
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        
        switch (message.type) {
          case 'hardware':
            useHardwareStore.getState().updateFromEvent(message.event);
            break;
          case 'state':
            useHardwareStore.getState().setFullState(message.state);
            break;
          case 'system':
            if (message.event.type === 'mode') {
              useAppStore.getState().setMockMode(message.event.mock);
            }
            break;
          default:
            console.warn('[WS] Unknown message type:', message);
        }
      } catch (err) {
        console.error('[WS] Error parsing message:', err);
      }
    };

    this.ws.onclose = (event) => {
      useAppStore.getState().setWsConnected(false);
      
      if (!this.isIntentionalDisconnect) {
        console.warn(`[WS] Connection closed (code: ${event.code}). Reconnecting in ${this.reconnectDelay}ms...`);
        this.scheduleReconnect();
      } else {
        console.log('[WS] Connection closed intentionally');
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WS] WebSocket error:', error);
      // Let onclose handle reconnect
    };
  }

  public sendEvent(event: HardwareEvent): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const msg: WSMessage = { type: 'hardware', event };
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('[WS] Cannot send event, socket is not open');
    }
  }

  public disconnect(): void {
    this.isIntentionalDisconnect = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    useAppStore.getState().setWsConnected(false);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connect();
    }, this.reconnectDelay);
  }
}
