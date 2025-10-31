import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api, type JobOrder, type Task, type JobOrderProgress, type Inspection } from '../../services/api';

interface EnrichedTask extends Task {
  technician_username?: string;
  qa_inspection?: Inspection;
  qa_status?: 'approved' | 'rejected' | 'pending' | 'not_inspected';
}

interface JobOrderDetailsProps {
  jobId: string | null;
  onBack: () => void;
}

export const JobOrderDetails: React.FC<JobOrderDetailsProps> = ({ jobId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null);
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [progress, setProgress] = useState<JobOrderProgress | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJobOrderDetails();
    }
  }, [jobId]);

  const handleExportPDF = async () => {
    if (!jobId) return;
    
    setExportingPDF(true);
    try {
      // Call PDF export API
      const pdfBlob = await api.export.exportJobOrderPDF(parseInt(jobId));
      
      // Create download link and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `job_order_${jobOrder?.order_code || jobId}_report.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF report. Please try again.');
    } finally {
      setExportingPDF(false);
    }
  };

  const fetchJobOrderDetails = async () => {
    try {
      setLoading(true);
      const [job, allTasks, allUsers, progressData, inspections] = await Promise.all([
        api.jobOrders.getJobOrder(parseInt(jobId!)),
        api.tasks.getTasks(),
        api.users.getUsers(),
        api.metrics.getJobOrderProgress(parseInt(jobId!)).catch(err => {
          console.warn('Could not fetch progress:', err);
          return null;
        }),
        api.inspections.getInspections(),
      ]);
      
      setJobOrder(job);
      setProgress(progressData);
      
      // Filter tasks for this job order
      // Note: API returns job_order_code (string like "JO-01112"), not job_order (ID)
      // Compare using order_code which should match job_order_code
      console.log('🏢 JobOrderDetails - Job order code:', job.order_code);
      const jobTasks = allTasks.filter((t: Task) => {
        const taskJobCode = (t as any).job_order_code;
        const matches = taskJobCode === job.order_code;
        return matches;
      });
      console.log('🏢 JobOrderDetails - Filtered tasks count:', jobTasks.length, 'from total:', allTasks.length);
      
      // Create inspection map by task ID
      const inspectionMap = new Map(inspections.map(insp => [insp.task, insp]));
      
      // Enrich tasks with technician names and QA inspection status
      const enrichedTasks: EnrichedTask[] = jobTasks.map(task => {
        // API returns technician_username directly, so use that
        const techUsername = (task as any).technician_username;
        // Try to find full name from users list if we have technician ID, but fallback to username
        const tech = task.technician ? allUsers.find(u => u.id === task.technician) : null;
        const inspection = inspectionMap.get(task.id);
        
        // Determine QA status
        let qa_status: 'approved' | 'rejected' | 'pending' | 'not_inspected' = 'not_inspected';
        if (inspection) {
          qa_status = inspection.decision === 'accepted' ? 'approved' : 'rejected';
        } else if (task.status === 'done' || task.status === 'pending_qa') {
          qa_status = 'pending';
        }
        
        return {
          ...task,
          // Use full name if available, otherwise use username from API
          technician_username: tech ? (tech.full_name || tech.username) : (techUsername || 'Unassigned'),
          qa_inspection: inspection,
          qa_status,
        };
      });
      
      setTasks(enrichedTasks);
    } catch (error) {
      console.error('Error fetching job order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!jobId) return null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="animate-pulse text-gray-600">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!jobOrder) return null;

  // Use progress data from backend API
  const totalDevices = progress?.total_devices || jobOrder.total_devices || 0;
  const completedDevices = progress?.total_completed || 0;
  const rejectedDevices = progress?.total_rejected || 0;
  const percentComplete = progress?.progress_percent || 0;
  const alerts = progress?.alerts || [];
  
  // Calculate task statistics
  const completedTasks = tasks.filter((t: Task) => t.status === 'done' || t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t: Task) => t.status === 'in_progress').length;
  const totalTasks = tasks.length;
  
  // Get unique technicians assigned to this job
  // Use technician_username from enriched tasks since API doesn't return technician ID
  const technicianNames = [...new Set(
    tasks
      .map((t: EnrichedTask) => t.technician_username)
      .filter(Boolean)
  )] as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{jobOrder.title}</h1>
          <p className="text-sm text-gray-600">
            {jobOrder.order_code} • Due: {new Date(jobOrder.due_date).toLocaleDateString()}
          </p>
        </div>
        <button 
          onClick={handleExportPDF}
          disabled={exportingPDF}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 inline mr-2" />
          {exportingPDF ? 'Generating PDF...' : 'Export PDF'}
        </button>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">Active Alerts</h3>
              <ul className="space-y-1">
                {alerts.map((alert, idx) => (
                  <li key={idx} className="text-sm text-red-800">
                    • {alert.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Completion</div>
          <div className="text-2xl font-bold text-gray-800">{Math.round(percentComplete)}%</div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Devices</div>
          <div className="text-2xl font-bold text-gray-800">{completedDevices}/{totalDevices}</div>
          <div className="text-xs text-gray-500 mt-1">
            {rejectedDevices > 0 && `${rejectedDevices} rejected`}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Tasks</div>
          <div className="text-2xl font-bold text-gray-800">{completedTasks}/{totalTasks}</div>
          <div className="text-xs text-gray-500 mt-1">
            {inProgressTasks} in progress
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Technicians</div>
          <div className="text-lg font-medium text-gray-800">{technicianNames.length}</div>
          <div className="text-xs text-gray-500 mt-1 truncate" title={technicianNames.join(', ')}>
            {technicianNames.slice(0, 2).join(', ')}
            {technicianNames.length > 2 && ` +${technicianNames.length - 2}`}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Tasks</h2>
        </div>
        <div className="p-6">
          {tasks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No tasks found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Device</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Operation</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Technician</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Efficiency</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Task Status</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task: EnrichedTask) => {
                  const efficiency = task.efficiency || 0;
                  return (
                    <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{task.device_serial || `#${task.device}`}</td>
                      <td className="px-4 py-3 text-sm">{task.operation_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{task.technician_username}</td>
                      <td className="px-4 py-3 text-center text-sm">
                        {efficiency > 0 ? (
                          <span className={`font-medium ${
                            efficiency >= 100 ? 'text-green-600' :
                            efficiency >= 80 ? 'text-blue-600' :
                            efficiency >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {Math.round(efficiency)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === 'done' || task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          task.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          task.status === 'pending_qa' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {task.qa_status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            Approved
                          </span>
                        )}
                        {task.qa_status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3" />
                            Rejected
                          </span>
                        )}
                        {task.qa_status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <Clock className="w-3 h-3" />
                            Pending QA
                          </span>
                        )}
                        {task.qa_status === 'not_inspected' && (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
