
import { useState, useEffect, useRef, useCallback } from 'react';
import { createWebSocketConnection } from '@/lib/api/solarCryptoApi';
import { toast } from 'sonner';

interface WebSocketOptions {
  onMessage?: (data: any) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  showToasts?: boolean;
}

export function useSolarCryptoWebSocket(options: WebSocketOptions = {}) {
  const { 
    onMessage,
    autoReconnect = true,
    reconnectInterval = 5000,
    showToasts = true
  } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const connectionRef = useRef<ReturnType<typeof createWebSocketConnection> | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    // Clear any existing connection
    if (connectionRef.current) {
      connectionRef.current.close();
    }

    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      connectionRef.current = createWebSocketConnection(
        (data) => {
          setLastMessage(data);
          if (onMessage) onMessage(data);
          setIsConnected(true);
        },
        (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
          
          if (showToasts) {
            toast.error('Conexão com servidor de fluxos perdida', {
              description: 'Tentando reconectar...'
            });
          }
          
          // Attempt reconnect if enabled
          if (autoReconnect) {
            reconnectTimeoutRef.current = window.setTimeout(() => {
              connect();
            }, reconnectInterval);
          }
        }
      );

      if (showToasts) {
        toast.info('Conectado ao servidor de fluxos');
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      setIsConnected(false);
      
      if (showToasts) {
        toast.error('Falha ao conectar com servidor de fluxos');
      }
    }
    
    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [onMessage, autoReconnect, reconnectInterval, showToasts]);

  useEffect(() => {
    connect();
    
    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (connectionRef.current) {
      connectionRef.current.send(data);
    } else {
      console.error('Cannot send message: WebSocket not connected');
    }
  }, []);

  return { isConnected, lastMessage, send, connect };
}
