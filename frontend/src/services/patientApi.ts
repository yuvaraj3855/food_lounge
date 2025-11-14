const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Patient {
  id: string;
  name: string;
  age: number;
  conditions: string[];
  current_medications: string[];
  risk_level?: 'Low' | 'Medium' | 'High';
  last_alert?: string;
}

export interface SkipDoseRequest {
  drug_name: string;
  skips: number;
  patient_age: number;
  conditions: string[];
  patient_id?: string;
}

export interface VoiceQueryResponse {
  text: string;
  audio_url: string;
}

export const patientApi = {
  async getAllPatients(): Promise<Patient[]> {
    const response = await fetch(`${API_BASE_URL}/patient`);
    if (!response.ok) throw new Error('Failed to fetch patients');
    return response.json();
  },

  async getPatient(id: string): Promise<Patient> {
    const response = await fetch(`${API_BASE_URL}/patient/${id}`);
    if (!response.ok) throw new Error('Failed to fetch patient');
    return response.json();
  },

  async skipDose(data: SkipDoseRequest) {
    const response = await fetch(`${API_BASE_URL}/patient/skip-dose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to record skip dose');
    return response.json();
  },

  async voiceQuery(
    audioFile: File,
    language: string = 'hi',
    patientId?: string,
  ): Promise<VoiceQueryResponse> {
    const formData = new FormData();
    formData.append('audio_file', audioFile);
    if (language) formData.append('language', language);
    if (patientId) formData.append('patient_id', patientId);

    const response = await fetch(
      `${API_BASE_URL}/patient/voice-query?language=${language}${patientId ? `&patient_id=${patientId}` : ''}`,
      {
        method: 'POST',
        body: formData,
      },
    );
    if (!response.ok) throw new Error('Failed to process voice query');
    return response.json();
  },
};

