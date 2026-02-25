import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef(null);
  const listenersRef = useRef(new Map());
  const shouldReconnect = useRef(false);

  // subscribe lives in a ref — its reference NEVER changes
  const subscribeRef = useRef((eventType, callback) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType).add(callback);
    return () => {
      listenersRef.current.get(eventType)?.delete(callback);
    };
  });

  useEffect(() => {
    if (!isAuthenticated) {
      shouldReconnect.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      setConnected(false);
      return;
    }

    // isAuthenticated is true — connect now
    shouldReconnect.current = true;

    const doConnect = () => {
      if (!shouldReconnect.current) return;
      // Don't double-connect
      if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) return;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('[WS] No token — cannot connect');
        return;
      }

      const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + `?token=${token}`;
      console.log('[WS] Connecting...');

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] ✅ Connected');
        setConnected(true);
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WS] 📨 Received:', data);
          const callbacks = listenersRef.current.get(data.type);
          if (callbacks && callbacks.size > 0) {
            callbacks.forEach((cb) => cb(data));
          } else {
            console.warn('[WS] No subscribers for type:', data.type);
          }
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('[WS] Disconnected, code:', event.code);
        setConnected(false);
        wsRef.current = null;
        if (shouldReconnect.current) {
          reconnectTimer.current = setTimeout(doConnect, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
      };
    };

    doConnect();

    return () => {
      shouldReconnect.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ connected, subscribe: subscribeRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};