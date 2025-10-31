import React, { useEffect, useState } from 'react';
import { Calendar, Users, Flag } from 'lucide-react';
import { api, type JobOrder, type JobOrderProgress } from '../../services/api';

interface JobOrderWithProgress extends JobOrder {
  progress?: JobOrderProgress;
  assignedTechnicians: number[];
}

interface JobOrdersSummaryProps {
  onJobClick: (jobId: string) => void;
}

export const JobOrdersSummary: React.FC<JobOrdersSummaryProps> = ({ onJobClick }) => {
  const [jobs, setJobs] = useState<JobOrderWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobOrders = async () => {
      try {
        setLoading(true);
        const jobOrders = await api.jobOrders.getJobOrders();
        
        // Filter out archived jobs and fetch progress for each
        const activeJobs = jobOrders.filter(jo => jo.status !== 'archived');
        
        const jobsWithProgress = await Promise.all(
          activeJobs.map(async (job) => {
            try {
              const progress = await api.metrics.getJobOrderProgress(job.id);
              // Get unique technicians for this job (from tasks)
              const tasks = await api.tasks.getTasks();
              // Filter tasks by comparing job_order_code with order_code
              // API returns job_order_code (string) not job_order (ID)
              const jobTasks = tasks.filter(t => (t as any).job_order_code === job.order_code);
              // Extract unique technician usernames from tasks
              const technicianUsernames = [...new Set(
                jobTasks.map(t => (t as any).technician_username).filter(Boolean)
              )];
              
              console.log(`📊 JobOrdersSummary - Job ${job.order_code}: found ${jobTasks.length} tasks with ${technicianUsernames.length} technicians`);
              
              return {
                ...job,
                progress,
                assignedTechnicians: technicianUsernames as any,
              };
            } catch (error) {
              console.error(`Error fetching progress for job ${job.id}:`, error);
              return {
                ...job,
                assignedTechnicians: [],
              };
            }
          })
        );

        setJobs(jobsWithProgress);
      } catch (error) {
        console.error('Error fetching job orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobOrders();
  }, []);

  const getReviewStatusBadge = (progress?: JobOrderProgress) => {
    if (!progress) return 'bg-gray-100 text-gray-700';
    
    const hasHighAlerts = progress.alerts?.some(a => a.severity === 'high');
    if (hasHighAlerts) return 'bg-red-100 text-red-700';
    
    const percentComplete = progress.progress_percent || 0;
    // Green only when 100% complete
    if (percentComplete === 100) return 'bg-green-100 text-green-700';
    // Yellow for in-progress jobs
    if (percentComplete > 0) return 'bg-blue-100 text-blue-700';
    
    // Gray for not started
    return 'bg-gray-100 text-gray-700';
  };

  const getReviewStatusText = (progress?: JobOrderProgress) => {
    if (!progress) return 'not reviewed';
    
    const hasHighAlerts = progress.alerts?.some(a => a.severity === 'high');
    if (hasHighAlerts) return 'flagged';
    
    const percentComplete = progress.progress_percent || 0;
    // Only consider it reviewed if progress is at 100% (all devices completed)
    if (percentComplete === 100) return 'reviewed';
    if (percentComplete > 0) return 'in progress';
    
    return 'not started';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Job Orders Summary</h2>
        </div>
        <div className="p-8 text-center text-gray-500">
          <div className="animate-pulse">Loading job orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Job Orders Summary</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Job Code</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Progress</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Due Date</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Review Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No active job orders found
                </td>
              </tr>
            ) : (
              jobs.map(job => {
                const percentComplete = job.progress?.progress_percent || 0;
                const hasAlerts = (job.progress?.alerts?.length || 0) > 0;
                
                return (
                  <tr
                    key={job.id}
                    onClick={() => onJobClick(job.id.toString())}
                    className="border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {hasAlerts && <Flag className="w-4 h-4 text-red-500" />}
                        <span className="font-semibold text-gray-800">{job.order_code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-800 truncate">{job.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          {job.assignedTechnicians.length} techs
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg font-bold text-gray-700">{Math.round(percentComplete)}%</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentComplete}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(job.due_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${getReviewStatusBadge(job.progress)}`}>
                        {getReviewStatusText(job.progress)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
