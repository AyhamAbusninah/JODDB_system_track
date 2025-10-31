import React from 'react';
import { ListOrdered, Clock, Cpu } from 'lucide-react';
import { type Task } from '../../services/api';

interface TaskQueuePreviewProps {
  tasks: Task[];
}

/**
 * Task Queue Preview - Shows upcoming tasks
 * Helps technicians plan their work and see what's next
 */
export const TaskQueuePreview: React.FC<TaskQueuePreviewProps> = ({ tasks }) => {
  if (tasks.length === 0) return null;

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <ListOrdered className="w-5 h-5" />
          <h3 className="font-bold text-lg">Upcoming Tasks</h3>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {tasks.map((task, index) => (
          <div key={task.id} className="p-4 hover:bg-gray-50 transition">
            <div className="flex items-start gap-3">
              {/* Queue Number */}
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>

              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-800 truncate">
                  {task.operation_name}
                </h4>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Cpu className="w-4 h-4" />
                    <span className="font-mono">{task.device_serial || `#${task.device}`}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(task.standard_time_seconds)}</span>
                  </div>
                </div>
              </div>

              {/* Job Order Badge */}
              <div className="flex-shrink-0">
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                  JO #{task.job_order}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {tasks.length > 3 && (
        <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-600">
          + {tasks.length - 3} more tasks in queue
        </div>
      )}
    </div>
  );
};
