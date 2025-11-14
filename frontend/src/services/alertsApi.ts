const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Alert {
  id: string;
  patient_id: string;
  patient_name: string;
  drug_name: string;
  risk_level: 'Low' | 'Medium' | 'High';
  message: string;
  ai_explanation: string;
  timestamp: string;
  acknowledged: boolean;
}

export const alertsApi = {
  createSSEConnection(): EventSource {
    return new EventSource(`${API_BASE_URL}/alerts/stream`);
  },

  async acknowledgeAlert(alertId: string) {
    const response = await fetch(`${API_BASE_URL}/alerts/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertId }),
    });
    if (!response.ok) throw new Error('Failed to acknowledge alert');
    return response.json();
  },
};

