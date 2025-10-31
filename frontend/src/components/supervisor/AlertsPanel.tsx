import React from 'react';
import { AlertCircle, Clock, Database, ChevronRight } from 'lucide-react';
import { type Alert } from '../../types';

interface AlertsPanelProps {
  alerts: Alert[];
  onAlertClick: (alert: Alert) => void;
  onViewAll: () => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onAlertClick, onViewAll }) => {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'deadline': return <Clock className="w-5 h-5" />;
      case 'data-integrity': return <Database className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 border-red-500 text-red-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default: return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  };

  const groupedAlerts = {
    performance: alerts.filter(a => a.type === 'performance'),
    deadline: alerts.filter(a => a.type === 'deadline'),
    'data-integrity': alerts.filter(a => a.type === 'data-integrity'),
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Alerts & Notifications</h2>
        <button
          onClick={onViewAll}
          className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        {Object.entries(groupedAlerts).map(([type, typeAlerts]) => (
          typeAlerts.length > 0 && (
            <div key={type} className="mb-4 last:mb-0">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2 flex items-center gap-2">
                {getAlertIcon(type)}
                {type.replace('-', ' ')}
              </h3>
              <div className="space-y-2">
                {typeAlerts.slice(0, 2).map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => onAlertClick(alert)}
                    className={`p-3 rounded-lg border-l-4 cursor-pointer transition hover:shadow-md ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{alert.title}</h4>
                        <p className="text-xs mt-1 opacity-90">{alert.description}</p>
                      </div>
                      <span className="text-xs opacity-75 whitespace-nowrap ml-2">
                        {new Date(alert.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};
