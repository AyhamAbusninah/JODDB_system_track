import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../../services/api';

interface AnalyticsDashboardProps {
  onBack: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onBack }) => {
  const [viewType, setViewType] = useState<'technician' | 'job'>('technician');
  const [selectedTechnician, setSelectedTechnician] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState('7');
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [jobOrders, setJobOrders] = useState<any[]>([]);
  const [techData, setTechData] = useState<any | null>(null);
  const [jobData, setJobData] = useState<any | null>(null);

  // Load users and job orders on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [usersData, jobsData] = await Promise.all([
          api.users.getUsers(),
          api.jobOrders.getJobOrders(),
        ]);
        
        setTechnicians(usersData);
        setJobOrders(jobsData);
        
        if (usersData.length > 0) {
          setSelectedTechnician(usersData[0].id);
        }
        if (jobsData.length > 0) {
          setSelectedJob(jobsData[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load analytics data:', err);
      }
    };

    loadInitialData();
  }, []);

  // Load technician metrics
  useEffect(() => {
    if (!selectedTechnician) return;
    
    const loadTechMetrics = async () => {
      try {
        const metrics = await api.metrics.getTechnicianMetrics(selectedTechnician, new Date().toISOString().split('T')[0]);
        setTechData(metrics);
      } catch (err: any) {
        console.error('Failed to load technician metrics:', err);
      }
    };

    loadTechMetrics();
  }, [selectedTechnician]);

  // Load job metrics
  useEffect(() => {
    if (!selectedJob) return;
    
    const loadJobMetrics = async () => {
      try {
        const metrics = await api.metrics.getJobOrderProgress(selectedJob);
        setJobData(metrics);
      } catch (err: any) {
        console.error('Failed to load job metrics:', err);
      }
    };

    loadJobMetrics();
  }, [selectedJob]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Analytics & Performance</h1>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* View Type Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewType('technician')}
          className={`px-4 py-2 rounded-lg font-medium transition ${ viewType === 'technician' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200' }`}
        >
          Technician Metrics
        </button>
        <button
          onClick={() => setViewType('job')}
          className={`px-4 py-2 rounded-lg font-medium transition ${ viewType === 'job' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200' }`}
        >
          Job Order Metrics
        </button>
      </div>

      {viewType === 'technician' ? (
        <>
          {/* Technician Selection */}
          <div className="bg-white rounded-lg border p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Technician</label>
                <select
                  value={selectedTechnician || ''}
                  onChange={(e) => setSelectedTechnician(parseInt(e.target.value, 10))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                </select>
              </div>
            </div>
          </div>

          {techData && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Productivity</span>
                    {techData.productivity >= 85 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className={`text-2xl font-bold ${techData.productivity >= 85 ? 'text-green-600' : 'text-red-600'}`}>
                    {techData.productivity}%
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="text-sm text-gray-600 mb-2">Efficiency</div>
                  <div className={`text-2xl font-bold ${techData.efficiency >= 85 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {techData.efficiency}%
                  </div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="text-sm text-gray-600 mb-2">Utilization</div>
                  <div className="text-2xl font-bold text-blue-600">{techData.utilization}%</div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="text-sm text-gray-600 mb-2">Tasks Completed</div>
                  <div className="text-2xl font-bold text-gray-800">{techData.tasksCompleted}</div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="text-sm text-gray-600 mb-2">Avg Time/Task</div>
                  <div className="text-2xl font-bold text-gray-800">{techData.averageTimePerTask}h</div>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Productivity Trend</h3>
                <div className="h-64 flex items-end justify-around gap-2">
                  {[85, 88, 90, 92, 95, 92, techData.productivity].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-blue-600 rounded-t transition-all" style={{ height: `${val * 2.5}px` }} />
                      <span className="text-xs text-gray-500 mt-2">{idx + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center text-sm text-gray-600 mt-4">Days</div>
              </div>

              {/* Task Breakdown */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Task-wise Breakdown</h3>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Task Type</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Standard Time</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actual Time</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Diagnostics', 'Testing', 'Assembly', 'Quality Check'].map((task, idx) => {
                      const stdTime = [2.5, 1.5, 3.0, 1.0][idx];
                      const actTime = [2.2, 1.4, 2.8, 0.9][idx];
                      const eff = Math.round((stdTime / actTime) * 100);
                      return (
                        <tr key={task} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{task}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{stdTime}h</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">{actTime}h</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${ eff >= 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800' }`}>
                              {eff}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {/* Job Order Selection */}
          <div className="bg-white rounded-lg border p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Job Order</label>
              <select
                value={selectedJob || ''}
                onChange={(e) => setSelectedJob(parseInt(e.target.value, 10))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {jobOrders.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.order_code} - {job.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {jobData && (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg border p-4">
                  <div className="text-sm text-gray-600 mb-2">Progress</div>
                  <div className="text-2xl font-bold text-blue-600">{jobData.progress_percent}%</div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="text-sm text-gray-600 mb-2">Completed</div>
                  <div className="text-2xl font-bold text-green-600">{jobData.total_completed}</div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="text-sm text-gray-600 mb-2">Rejected</div>
                  <div className="text-2xl font-bold text-red-600">{jobData.total_rejected}</div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="text-sm text-gray-600 mb-2">Total Devices</div>
                  <div className="text-2xl font-bold text-gray-800">{jobData.total_devices}</div>
                </div>

                <div className="bg-white rounded-lg border p-4">
                  <div className="text-sm text-gray-600 mb-2">Alerts</div>
                  <div className="text-2xl font-bold text-orange-600">{jobData.alerts?.length || 0}</div>
                </div>
              </div>

              {/* Alerts */}
              {jobData.alerts && jobData.alerts.length > 0 && (
                <div className="space-y-2">
                  {jobData.alerts.map((alert: any, idx: number) => (
                    <div key={idx} className="p-4 border-l-4 border-orange-500 bg-orange-50 rounded">
                      <h4 className="font-semibold text-orange-800">{alert.type}</h4>
                      <p className="text-sm text-orange-700 mt-1">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Status Indicator */}
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Summary</h3>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-lg font-semibold text-blue-800">
                    {jobData.progress_percent}% Complete
                  </div>
                  <p className="text-sm mt-1 text-blue-700">
                    {jobData.total_completed} of {jobData.total_devices} devices completed
                  </p>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
