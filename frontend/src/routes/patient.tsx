import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import { patientApi, Patient } from '../services/patientApi';
import { VoiceInput } from '../components/VoiceInput';
import { VoiceOutput } from '../components/VoiceOutput';

export const Route = createFileRoute('/patient')({
  component: PatientPanel,
});

function PatientPanel() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [voiceResponse, setVoiceResponse] = useState<{
    text: string;
    audio_url: string;
  } | null>(null);
  const [selectedDrug, setSelectedDrug] = useState<string>('');
  const [language, setLanguage] = useState('hi');

  useEffect(() => {
    loadPatient();
  }, []);

  const loadPatient = async () => {
    try {
      const patients = await patientApi.getAllPatients();
      if (patients.length > 0) {
        setPatient(patients[0]);
        if (patients[0].current_medications.length > 0) {
          setSelectedDrug(patients[0].current_medications[0]);
        }
      }
    } catch (error) {
      console.error('Error loading patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTookMedicine = async () => {
    // In a real app, this would record the medication taken
    alert('Medicine recorded! ✅');
  };

  const handleMissedDose = async () => {
    if (!patient || !selectedDrug) {
      alert('Please select a medication');
      return;
    }

    try {
      const result = await patientApi.skipDose({
        drug_name: selectedDrug,
        skips: 1,
        patient_age: patient.age,
        conditions: patient.conditions,
        patient_id: patient.id,
      });
      alert(`Alert sent to doctor! Risk Level: ${result.risk_level}`);
      await loadPatient(); // Refresh patient data
    } catch (error) {
      console.error('Error recording missed dose:', error);
      alert('Failed to record missed dose');
    }
  };

  const handleVoiceQuery = async (audioFile: File) => {
    if (!patient) return;

    try {
      const response = await patientApi.voiceQuery(
        audioFile,
        language,
        patient.id,
      );
      setVoiceResponse(response);
    } catch (error) {
      console.error('Error processing voice query:', error);
      alert('Failed to process voice query');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">No patient found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              MedMentor.AI
            </h1>
            <p className="text-gray-600">Patient Panel</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {patient.name}
            </h2>
            <p className="text-sm text-gray-600">Age: {patient.age}</p>
            <p className="text-sm text-gray-600">
              Conditions: {patient.conditions.join(', ')}
            </p>
            {patient.risk_level && (
              <div className="mt-2">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    patient.risk_level === 'High'
                      ? 'bg-red-100 text-red-800'
                      : patient.risk_level === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  Risk: {patient.risk_level}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Medication
            </label>
            <select
              value={selectedDrug}
              onChange={(e) => setSelectedDrug(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {patient.current_medications.map((med) => (
                <option key={med} value={med}>
                  {med}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleTookMedicine}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
            >
              <CheckCircle className="w-5 h-5" />
              Took Medicine ✅
            </button>

            <button
              onClick={handleMissedDose}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
            >
              <XCircle className="w-5 h-5" />
              Missed Dose ❌
            </button>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Ask MedMentor (Voice)
              </h3>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="hi">Hindi (हिंदी)</option>
                <option value="en">English</option>
                <option value="ta">Tamil (தமிழ்)</option>
                <option value="te">Telugu (తెలుగు)</option>
                <option value="kn">Kannada (ಕನ್ನಡ)</option>
                <option value="ml">Malayalam (മലയാളം)</option>
              </select>
            </div>

            <VoiceInput onTranscribe={handleVoiceQuery} language={language} />

            {voiceResponse && (
              <div className="mt-4">
                <VoiceOutput
                  audioUrl={voiceResponse.audio_url}
                  text={voiceResponse.text}
                  language={language}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

