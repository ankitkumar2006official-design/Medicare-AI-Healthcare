import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useAlertSound } from './AlertSoundContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { token } = useAuth();
  const { playCriticalAlarm, playWarningChime } = useAlertSound();
  const [isConnected, setIsConnected] = useState(false);
  const [latestVitals, setLatestVitals] = useState({});
  const [latestRisks, setLatestRisks] = useState({});
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // If in dev proxy, default to ws://localhost:8000/ws if needed
    const wsUrl = import.meta.env.VITE_WS_URL || `${protocol}//${host}/ws${token ? `?token=${token}` : ''}`;

    try {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsConnected(true);
        console.log('MediGuard Ward Telemetry WebSocket connected.');
      };

      socket.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          const { event: eventType, data, patient_id } = packet;

          // Add to recent events feed
          setRecentEvents((prev) => [
            { type: eventType, data, patient_id, timestamp: new Date() },
            ...prev.slice(0, 49),
          ]);

          if (eventType === 'vital_update' && data?.patient_id) {
            setLatestVitals((prev) => ({
              ...prev,
              [data.patient_id]: data,
            }));
          } else if (eventType === 'risk_update' && data?.patient_id) {
            setLatestRisks((prev) => ({
              ...prev,
              [data.patient_id]: data,
            }));
          } else if (eventType === 'alert_created') {
            setActiveAlerts((prev) => [data, ...prev.filter((a) => a.id !== data.id)]);
            if (data.severity === 'critical') {
              playCriticalAlarm();
            } else {
              playWarningChime();
            }
          } else if (eventType === 'alert_acknowledged' || eventType === 'alert_escalated') {
            setActiveAlerts((prev) =>
              prev.map((a) => (a.id === data.id ? { ...a, ...data } : a))
            );
          } else if (eventType === 'alert_resolved') {
            setActiveAlerts((prev) => prev.filter((a) => a.id !== data.id));
          }
        } catch (err) {
          console.warn('Error parsing incoming WS message:', err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.warn('MediGuard WS connection closed. Reconnecting in 3s...');
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.warn('MediGuard WS error:', err);
        socket.close();
      };

      wsRef.current = socket;
    } catch (e) {
      console.warn('WS connection setup error:', e);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [token, playCriticalAlarm, playWarningChime]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const subscribePatient = (patientId) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'subscribe_patient', patient_id: patientId }));
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        latestVitals,
        latestRisks,
        activeAlerts,
        recentEvents,
        subscribePatient,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);

