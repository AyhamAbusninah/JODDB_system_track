import React, { useState, useEffect } from 'react';
import { Download, FileText, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';

interface ReportsViewProps {
  onBack?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [jobOrders, setJobOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [allTasks, allJobs] = await Promise.all([
        api.tasks.getTasks(),
        api.jobOrders.getJobOrders(),
      ]);
      
      setTasks(allTasks);
      setJobOrders(allJobs);
    } catch (error) {
      console.error('Error fetching reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse text-gray-600">Loading reports...</div>
      </div>
    );
  }

  // Generate summary statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
  const totalJobOrders = jobOrders.length;
  const completedJobOrders = jobOrders.filter((j: any) => j.status === 'completed').length;

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {onBack && (
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">Reports</h2>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Download className="w-4 h-4 inline mr-2" />
            Export All
          </button>
        </div>
      )}
      {!onBack && (
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Reports</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Download className="w-4 h-4 inline mr-2" />
            Export All
          </button>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Tasks</div>
            <div className="text-2xl font-bold text-gray-800">{totalTasks}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-700">Completed Tasks</div>
            <div className="text-2xl font-bold text-green-800">{completedTasks}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Total Job Orders</div>
            <div className="text-2xl font-bold text-gray-800">{totalJobOrders}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-700">Completed Jobs</div>
            <div className="text-2xl font-bold text-green-800">{completedJobOrders}</div>
          </div>
        </div>

        {/* Available Reports */}
        <div>
          <h3 className="text-md font-semibold text-gray-700 mb-3">Available Reports</h3>
          <div className="space-y-2">
            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-800">Task Completion Report</h4>
                    <p className="text-sm text-gray-600">Summary of all task completions</p>
                  </div>
                </div>
                <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                  Download
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-gray-800">Job Order Summary</h4>
                    <p className="text-sm text-gray-600">Overview of all job orders</p>
                  </div>
                </div>
                <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
                  Download
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <div>
                    <h4 className="font-medium text-gray-800">Technician Performance</h4>
                    <p className="text-sm text-gray-600">Performance metrics by technician</p>
                  </div>
                </div>
                <button className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200">
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
