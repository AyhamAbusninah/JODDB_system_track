import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';

interface AlertsCenterProps {
  onBack?: () => void;
  onAlertClick?: (alert: any) => void;
}

export const AlertsCenter: React.FC<AlertsCenterProps> = ({ onBack, onAlertClick }) => {
  const [loading, setLoading] = useState(true);
  const [jobOrders, setJobOrders] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchAlertsData();
  }, []);

  const fetchAlertsData = async () => {
    try {
      setLoading(true);
      const [jobs, allTasks] = await Promise.all([
        api.jobOrders.getJobOrders(),
        api.tasks.getTasks(),
      ]);
      
      setJobOrders(jobs);
      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching alerts data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse text-gray-600">Loading alerts...</div>
      </div>
    );
  }

  // Generate alerts from job orders and tasks
  const alerts = [];

  // Check for overdue job orders
  const now = new Date();
  jobOrders.forEach(job => {
    const dueDate = new Date(job.due_date);
    if (dueDate < now && job.status !== 'completed') {
      alerts.push({
        id: `job-${job.id}`,
        type: 'error',
        title: `Job Order Overdue: ${job.order_code}`,
        message: `Due date was ${dueDate.toLocaleDateString()}`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Check for tasks pending approval
  const pendingApproval = tasks.filter((t: any) => t.status === 'pending-approval');
  if (pendingApproval.length > 0) {
    alerts.push({
      id: 'pending-approval',
      type: 'warning',
      title: `${pendingApproval.length} Tasks Pending Approval`,
      message: 'Review and approve technician submissions',
      timestamp: new Date().toISOString(),
    });
  }

  // Check for failed tasks
  const failedTasks = tasks.filter((t: any) => t.status === 'failed');
  if (failedTasks.length > 0) {
    alerts.push({
      id: 'failed-tasks',
      type: 'error',
      title: `${failedTasks.length} Failed Tasks`,
      message: 'Investigate and reassign failed tasks',
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {onBack && (
        <div className="border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">Alerts Center</h2>
        </div>
      )}
      {!onBack && (
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Alerts Center</h2>
        </div>
      )}
      <div className="p-6">
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-600">No active alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert: any) => (
              <div
                key={alert.id}
                onClick={() => onAlertClick?.(alert)}
                className={`p-4 rounded-lg border ${
                  alert.type === 'error' ? 'bg-red-50 border-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                } ${onAlertClick ? 'cursor-pointer hover:shadow-md transition' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {alert.type === 'error' ? (
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      alert.type === 'error' ? 'text-red-800' :
                      alert.type === 'warning' ? 'text-yellow-800' :
                      'text-blue-800'
                    }`}>
                      {alert.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
