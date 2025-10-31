import React from 'react';
import { Clock, Cpu, User, ChevronRight } from 'lucide-react';
import type { Task } from '../../services/api';

interface TaskCardProps {
  task: Task;
  onInspect: (task: Task) => void;
}

/**
 * TaskCard - Task card component for Quality Inspector
 * Features:
 * - Visual task details with icons
 * - Efficiency indicator with color coding
 * - Quick inspect button
 * - Hover effects and transitions
 */
export const TaskCard: React.FC<TaskCardProps> = ({ task, onInspect }) => {
  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getEfficiencyColor = (efficiency?: number): string => {
    if (!efficiency) return 'text-gray-600';
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBgColor = (efficiency?: number): string => {
    if (!efficiency) return 'bg-gray-50';
    if (efficiency >= 90) return 'bg-green-50';
    if (efficiency >= 75) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 transition-all duration-200 hover:shadow-md hover:border-gray-300`}
    >
      <div className="p-5">
        {/* Top Section - Task ID */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-900">Task #{task.id}</h4>
            <p className="text-xs text-gray-500">Job Order: {task.job_order || 'N/A'}</p>
          </div>
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold whitespace-nowrap">
            Ready
          </span>
        </div>

        {/* Task Details Grid */}
        <div className="space-y-3 mb-4">
          {/* Operation */}
          <div className="flex items-center gap-3">
            <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-600 uppercase">Operation</p>
              <p className="text-sm font-medium text-gray-800 truncate">{task.operation_name}</p>
            </div>
          </div>

          {/* Device */}
          <div className="flex items-center gap-3">
            <Cpu className="w-4 h-4 text-purple-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-600 uppercase">Device</p>
              <p className="text-sm font-mono font-medium text-gray-800 truncate">
                {task.device_serial || `#${task.device}`}
              </p>
            </div>
          </div>

          {/* Technician */}
          {task.technician_name && (
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-600 uppercase">Technician</p>
                <p className="text-sm font-medium text-gray-800 truncate">{task.technician_name}</p>
              </div>
            </div>
          )}

          {/* Time */}
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-orange-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-600 uppercase">Time Spent</p>
              <p className="text-sm font-medium text-gray-800">
                {formatTime(task.actual_time_seconds)} / {formatTime(task.standard_time_seconds)}
              </p>
            </div>
          </div>
        </div>

        {/* Efficiency Badge */}
        {task.efficiency !== null && task.efficiency !== undefined && (
          <div className={`px-3 py-2 rounded-lg mb-4 ${getEfficiencyBgColor(task.efficiency)}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Efficiency</span>
              <span className={`text-lg font-bold ${getEfficiencyColor(task.efficiency)}`}>
                {task.efficiency.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Timestamps */}
        {(task.start_time || task.end_time) && (
          <div className="text-xs text-gray-500 space-y-1 mb-4 pb-4 border-t border-gray-100">
            {task.start_time && (
              <div className="pt-3">
                <span className="font-semibold">Started:</span> {new Date(task.start_time).toLocaleString()}
              </div>
            )}
            {task.end_time && (
              <div>
                <span className="font-semibold">Completed:</span> {new Date(task.end_time).toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInspect(task);
          }}
          className="w-full px-4 py-2 bg-linear-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-medium text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
        >
          Inspect
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
