import { Patient } from '../services/patientApi';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface PatientCardProps {
  patient: Patient;
  onClick: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'High':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'Medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'Low':
        return 'bg-green-100 border-green-300 text-green-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getRiskIcon = (risk?: string) => {
    if (risk === 'High' || risk === 'Medium') {
      return <AlertCircle className="w-5 h-5" />;
    }
    return <CheckCircle className="w-5 h-5" />;
  };

  return (
    <div
      onClick={onClick}
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${getRiskColor(
        patient.risk_level,
      )}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{patient.name}</h3>
          <p className="text-sm opacity-75">Age: {patient.age}</p>
          <p className="text-sm opacity-75 mt-1">
            {patient.conditions.join(', ')}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {patient.current_medications.slice(0, 3).map((med) => (
              <span
                key={med}
                className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded"
              >
                {med}
              </span>
            ))}
            {patient.current_medications.length > 3 && (
              <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded">
                +{patient.current_medications.length - 3} more
              </span>
            )}
          </div>
        </div>
        <div className="ml-4">
          {patient.risk_level ? (
            <div className="flex items-center gap-1">
              {getRiskIcon(patient.risk_level)}
              <span className="font-semibold">{patient.risk_level}</span>
            </div>
          ) : (
            <div className="text-sm opacity-50">No alerts</div>
          )}
        </div>
      </div>
      {patient.last_alert && (
        <p className="text-xs mt-2 opacity-60">
          Last alert: {new Date(patient.last_alert).toLocaleString()}
        </p>
      )}
    </div>
  );
}

