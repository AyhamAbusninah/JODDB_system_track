import React, { useState, useMemo } from 'react';
import { Clock, TrendingUp, Search } from 'lucide-react';
import { type PlannerTask } from '../../types';
import { TaskApprovalDrawer } from './TaskApprovalDrawer';

interface TaskReviewQueueProps {
  tasks: PlannerTask[];
  onApprove: (taskId: string, comments: string) => void;
  onReject: (taskId: string, comments: string) => void;
}

export const TaskReviewQueue: React.FC<TaskReviewQueueProps> = ({ tasks, onApprove, onReject }) => {
  const [selectedTask, setSelectedTask] = useState<PlannerTask | null>(null);
  const [showApprovalDrawer, setShowApprovalDrawer] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTasks = useMemo(() => {
    let result = filter === 'all' 
      ? tasks 
      : filter === 'pending'
      ? tasks.filter(t => t.status === 'pending-approval')
      : tasks.filter(t => t.status === filter);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task =>
        task.operationName.toLowerCase().includes(query) ||
        task.technicianName.toLowerCase().includes(query) ||
        task.jobOrderCode.toLowerCase().includes(query) ||
        task.deviceSerial.toLowerCase().includes(query)
      );
    }

    return result;
  }, [tasks, filter, searchQuery]);

  const handleReviewClick = (task: PlannerTask) => {
    setSelectedTask(task);
    setShowApprovalDrawer(true);
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 100) return 'text-green-600';
    if (efficiency >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'pending-approval': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'done': 'bg-blue-100 text-blue-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tasks, technicians, job orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && (
                <span className="ml-2 px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs">
                  {tasks.filter(t => t.status === 'pending-approval').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Task</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Technician</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Time</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Efficiency</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No tasks found
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-800">{task.operationName}</div>
                        <div className="text-xs text-gray-500">
                          {task.jobOrderCode} • {task.deviceSerial}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{task.technicianName}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {Math.round(task.actualTime / 60)}m / {Math.round(task.standardTime / 60)}m
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <TrendingUp className={`w-4 h-4 ${getEfficiencyColor(task.efficiency)}`} />
                        <span className={`font-semibold ${getEfficiencyColor(task.efficiency)}`}>
                          {task.efficiency}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {task.status === 'pending-approval' ? (
                        <button
                          onClick={() => handleReviewClick(task)}
                          className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReviewClick(task)}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Drawer */}
      {showApprovalDrawer && selectedTask && (
        <TaskApprovalDrawer
          isOpen={showApprovalDrawer}
          onClose={() => {
            setShowApprovalDrawer(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </div>
  );
};
