import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Archive, Calendar, Package, TrendingUp, AlertCircle, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { AddTasksFromJobModal } from './AddTasksFromJobModal';

interface JobOrderDetailsProps {
  jobId: string | null;
  onBack: () => void;
}

export const JobOrderDetails: React.FC<JobOrderDetailsProps> = ({ jobId, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'devices' | 'performance' | 'alerts'>('overview');
  const [job, setJob] = useState<any | null>(null);
  const [progress, setProgress] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTasksModal, setShowAddTasksModal] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;
      
      setLoading(true);
      setError(null);
      try {
        // Parse jobId as number for API call
        const jobIdNum = parseInt(jobId, 10);
        const [jobData, progressData] = await Promise.all([
          api.jobOrders.getJobOrder(jobIdNum),
          api.metrics.getJobOrderProgress(jobIdNum),
        ]);
        setJob(jobData);
        setProgress(progressData);
      } catch (err: any) {
        console.error('Failed to fetch job details:', err);
        setError(err.message || 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  const handleAddTasksSuccess = () => {
    // Refresh job details after adding tasks
    if (jobId) {
      const jobIdNum = parseInt(jobId, 10);
      Promise.all([
        api.jobOrders.getJobOrder(jobIdNum),
        api.metrics.getJobOrderProgress(jobIdNum),
      ]).then(([jobData, progressData]) => {
        setJob(jobData);
        setProgress(progressData);
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">{error || 'Job order not found'}</p>
        </div>
      </div>
    );
  }

  const devices: any[] = [];

  // Map API data to component fields
  const progressPercent = progress?.progress_percent || 0;
  const devicesCompleted = progress?.total_completed || 0;
  const devicesRejected = progress?.total_rejected || 0;
  const totalDevices = progress?.total_devices || job?.total_devices || 0;
  const daysUntilDue = Math.ceil((new Date(job.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{job.title}</h1>
            <p className="text-sm text-gray-600 font-mono">{job.order_code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {job.job && (
            <button 
              onClick={() => setShowAddTasksModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Tasks from Template
            </button>
          )}
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
            <Archive className="w-4 h-4" />
            Archive
          </button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{progressPercent}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Devices</span>
            <Package className="w-4 h-4 text-gray-500" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{devicesCompleted}</div>
          <div className="text-xs text-gray-500">of {totalDevices} total</div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Rejected</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600">{devicesRejected}</div>
          <div className="text-xs text-gray-500">{((devicesRejected / totalDevices) * 100).toFixed(1)}% rate</div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Efficiency</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className={`text-2xl font-bold ${(progress?.efficiency || 0) >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
            {progress?.efficiency || 0}%
          </div>
          <div className="text-xs text-gray-500">Team average</div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Due Date</span>
            <Calendar className="w-4 h-4 text-gray-500" />
          </div>
          <div className={`text-lg font-bold ${daysUntilDue <= 3 ? 'text-red-600' : 'text-gray-800'}`}>
            {daysUntilDue} days
          </div>
          <div className="text-xs text-gray-500">{job.due_date}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b px-6">
          <div className="flex gap-8">
            {(['overview', 'devices', 'performance', 'alerts'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 font-medium transition capitalize ${ activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800' }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600">{job.description || 'No description'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Created By</h4>
                  <p className="text-gray-800">System</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Total Devices</h4>
                  <p className="text-gray-800">{totalDevices} devices</p>
                </div>
              </div>

              {/* Progress Chart Placeholder */}
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Progress Over Time</h3>
                <div className="h-48 flex items-end justify-around gap-2">
                  {[20, 35, 45, 58, progressPercent].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-blue-600 rounded-t" style={{ height: `${val * 2}px` }} />
                      <span className="text-xs text-gray-500 mt-2">Day {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'devices' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Serial ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Technician</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Timestamp</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">QA Status</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm">{device.serialId}</td>
                      <td className="px-4 py-3 text-sm">{device.technicianName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ device.status === 'completed' ? 'bg-green-100 text-green-800' : device.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800' }`}>
                          {device.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{device.timestamp}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ String(device.qaStatus) === 'approved' ? 'bg-green-100 text-green-800' : String(device.qaStatus) === 'rejected' ? 'bg-red-100 text-red-800' : String(device.qaStatus) === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700' }`}>
                          {device.qaStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Technician Contributions</h3>
                <div className="space-y-3">
                  {['Ahmed Ali', 'Sara Hassan'].map((tech, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium text-gray-700">{tech}</div>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-6">
                          <div
                            className="bg-green-600 h-6 rounded-full flex items-center justify-end pr-2"
                            style={{ width: `${[65, 35][idx]}%` }}
                          >
                            <span className="text-xs text-white font-medium">{[65, 35][idx]}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-20 text-sm text-gray-600">{[32, 13][idx]} devices</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Efficiency by Task Type</h3>
                <div className="space-y-2">
                  {['Diagnostics', 'Testing', 'Assembly'].map((task, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">{task}</span>
                      <span className={`text-sm font-semibold ${[92, 85, 84][idx] >= 85 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {[92, 85, 84][idx]}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-3">
              {progress?.alerts && progress.alerts.length > 0 ? (
                progress.alerts.map((alert: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-4 border-l-4 rounded ${ alert.type === 'due_date_risk' ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50' }`}
                  >
                    <h4 className={`font-semibold ${ alert.type === 'due_date_risk' ? 'text-yellow-800' : 'text-red-800' }`}>
                      {alert.type === 'due_date_risk' ? 'Due Date Alert' : 'Efficiency Alert'}
                    </h4>
                    <p className={`text-sm mt-1 ${ alert.type === 'due_date_risk' ? 'text-yellow-700' : 'text-red-700' }`}>
                      {alert.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-green-50 border border-green-200 rounded text-center">
                  <p className="text-sm text-green-700">✓ No active alerts</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Tasks Modal */}
      {job?.job && (
        <AddTasksFromJobModal
          isOpen={showAddTasksModal}
          onClose={() => setShowAddTasksModal(false)}
          jobOrderId={parseInt(jobId || '0', 10)}
          jobId={job.job}
          onSuccess={handleAddTasksSuccess}
        />
      )}
    </div>
  );
};