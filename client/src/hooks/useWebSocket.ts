import { useEffect } from 'react';
import { WebSocketService } from '../services/WebSocketService';
import { useAppStore } from '../stores/appStore';

export function useWebSocket() {
  const connected = useAppStore((state) => state.wsConnected);

  useEffect(() => {
    const wsService = WebSocketService.getInstance();
    wsService.connect();

    return () => {
      wsService.disconnect();
    };
  }, []);

  return { connected };
}
