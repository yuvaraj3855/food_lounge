import { X, CheckCircle } from 'lucide-react';
import { Alert } from '../services/alertsApi';

interface AlertModalProps {
  alert: Alert | null;
  onClose: () => void;
  onAcknowledge: (alertId: string) => void;
}

export function AlertModal({ alert, onClose, onAcknowledge }: AlertModalProps) {
  if (!alert) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High':
        return 'bg-red-500';
      case 'Medium':
        return 'bg-yellow-500';
      case 'Low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Alert Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${getRiskColor(alert.risk_level)}`}
            />
            <span className="text-lg font-semibold text-gray-800">
              {alert.patient_name}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                alert.risk_level === 'High'
                  ? 'bg-red-100 text-red-800'
                  : alert.risk_level === 'Medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {alert.risk_level} Risk
            </span>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              Medication
            </h3>
            <p className="text-lg font-semibold text-gray-800">
              {alert.drug_name}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Message</h3>
            <p className="text-gray-800">{alert.message}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              AI Explanation
            </h3>
            <p className="text-gray-700 bg-gray-50 rounded-lg p-4">
              {alert.ai_explanation}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              {new Date(alert.timestamp).toLocaleString()}
            </p>
          </div>

          {!alert.acknowledged && (
            <button
              onClick={() => {
                onAcknowledge(alert.id);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              <CheckCircle className="w-5 h-5" />
              Acknowledge Alert
            </button>
          )}

          {alert.acknowledged && (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Alert Acknowledged</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

