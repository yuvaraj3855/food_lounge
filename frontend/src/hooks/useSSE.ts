import { useEffect, useState, useRef } from 'react';
import { alertsApi, Alert } from '../services/alertsApi';

export function useSSE() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const eventSource = alertsApi.createSSEConnection();
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const alert: Alert = JSON.parse(event.data);
        setAlerts((prev) => [alert, ...prev]);
        
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {
          // Fallback: use browser notification if audio fails
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Alert', {
              body: `${alert.patient_name}: ${alert.message}`,
              icon: '/logo192.png',
            });
          }
        });
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const acknowledgeAlert = async (alertId: string) => {
    await alertsApi.acknowledgeAlert(alertId);
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert,
      ),
    );
  };

  return { alerts, isConnected, acknowledgeAlert };
}

