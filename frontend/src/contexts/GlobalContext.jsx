import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsMessage, setWsMessage] = useState(null);
  const isAuthenticated = !!localStorage.getItem('access_token');
  const wsRef = useRef(null);

  const playNotificationSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // A6
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.log('Audio de notificación no soportado o bloqueado');
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/integraciones/whatsapp/unread-count/');
      setUnreadCount(res.data.unread_count || 0);
      
      // Update app badge if supported
      if ('setAppBadge' in navigator) {
        if (res.data.unread_count > 0) {
          navigator.setAppBadge(res.data.unread_count).catch(console.error);
        } else if ('clearAppBadge' in navigator) {
          navigator.clearAppBadge().catch(console.error);
        }
      }
    } catch (err) {
      console.error("Error fetching unread count", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchUnreadCount();

    let reconnectTimer = null;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let host = window.location.host;
      if (import.meta.env.VITE_API_URL) {
        host = new URL(import.meta.env.VITE_API_URL).host;
      }
      
      const wsUrl = `${protocol}//${host}/ws/chat/`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Global WebSocket Connected');
        fetchUnreadCount();
      };

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'chat_message') {
          setWsMessage(payload);
          
          if (payload.data.mensaje.direction === 'INBOUND') {
            playNotificationSound();
            
            // Re-fetch total unread count to be safe and accurate
            fetchUnreadCount();
          }
        }
      };

      ws.onerror = (err) => {
        console.error('Global WebSocket Error:', err);
      };

      ws.onclose = () => {
        console.log('Global WebSocket Disconnected. Reconnecting in 3s...');
        reconnectTimer = setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, fetchUnreadCount, playNotificationSound]);

  return (
    <GlobalContext.Provider value={{ unreadCount, setUnreadCount, wsMessage, fetchUnreadCount }}>
      {children}
    </GlobalContext.Provider>
  );
};
