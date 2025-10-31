import React, { useState } from 'react';
import { Play, Square, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { api, type Task } from '../services/api';

interface TechnicianTaskCardProps {
  task: Task;
  onTaskUpdate: () => void;
}

interface EndTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => void;
  isSubmitting: boolean;
}

// End Task Modal Component
const EndTaskModal: React.FC<EndTaskModalProps> = ({ isOpen, onClose, onSubmit, isSubmitting }) => {
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(notes);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">End Task</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Task Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
                placeholder="Add any notes about the completed task..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Complete Task
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main TechnicianTaskCard Component
export const TechnicianTaskCard: React.FC<TechnicianTaskCardProps> = ({ task, onTaskUpdate }) => {
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get status badge styling
  const getStatusBadge = () => {
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      'available': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        icon: <Clock className="w-4 h-4" />,
      },
      'in_progress': {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: <Play className="w-4 h-4" />,
      },
      'done': {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="w-4 h-4" />,
      },
      'completed': {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <CheckCircle className="w-4 h-4" />,
      },
      'rejected': {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <AlertCircle className="w-4 h-4" />,
      },
    };

    const config = statusConfig[task.status] || statusConfig['available'];
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.icon}
        {task.status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  // Format time display
  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // Handle Start Task
  const handleStart = async () => {
    if (task.status !== 'available') {
      setError('Task cannot be started from current status');
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      await api.tasks.startTask(task.id);
      // Notify parent to refresh tasks
      onTaskUpdate();
    } catch (err: any) {
      console.error('Start task error:', err);
      setError(err.message || 'Failed to start task');
    } finally {
      setIsStarting(false);
    }
  };

  // Handle End Task
  const handleEndClick = () => {
    if (task.status !== 'in_progress') {
      setError('Task must be in progress to end');
      return;
    }
    setShowEndModal(true);
  };

  const handleEndSubmit = async (notes: string) => {
    setIsEnding(true);
    setError(null);

    try {
      await api.tasks.endTask(task.id, notes);
      setShowEndModal(false);
      // Notify parent to refresh tasks
      onTaskUpdate();
    } catch (err: any) {
      console.error('End task error:', err);
      setError(err.message || 'Failed to end task');
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-4 hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Task #{task.id}</h3>
            <p className="text-sm text-gray-500">JO #{task.job_order}</p>
          </div>
          {getStatusBadge()}
        </div>

        {/* Task Details */}
        <div className="space-y-2 mb-4">
          <div>
            <span className="text-xs font-semibold text-gray-600 uppercase">Operation:</span>
            <p className="text-sm text-gray-800">{task.operation_name}</p>
          </div>

          <div>
            <span className="text-xs font-semibold text-gray-600 uppercase">Device Serial:</span>
            <p className="text-sm text-gray-800 font-mono">{task.device_serial || `Device #${task.device}`}</p>
          </div>

          {task.technician_name && (
            <div>
              <span className="text-xs font-semibold text-gray-600 uppercase">Technician:</span>
              <p className="text-sm text-gray-800">{task.technician_name}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <div>
              <span className="text-xs font-semibold text-gray-600 uppercase">Standard Time:</span>
              <p className="text-sm text-gray-800">{formatTime(task.standard_time_seconds)}</p>
            </div>
            {task.actual_time_seconds && (
              <div>
                <span className="text-xs font-semibold text-gray-600 uppercase">Actual Time:</span>
                <p className="text-sm text-gray-800">{formatTime(task.actual_time_seconds)}</p>
              </div>
            )}
          </div>

          {task.efficiency && (
            <div>
              <span className="text-xs font-semibold text-gray-600 uppercase">Efficiency:</span>
              <p className={`text-sm font-bold ${task.efficiency >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                {task.efficiency.toFixed(2)}%
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {task.status === 'available' && (
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
            >
              {isStarting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Task
                </>
              )}
            </button>
          )}

          {task.status === 'in_progress' && (
            <button
              onClick={handleEndClick}
              disabled={isEnding}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
            >
              <Square className="w-4 h-4" />
              End Task
            </button>
          )}

          {(task.status === 'done' || task.status === 'completed') && (
            <div className="flex-1 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-center font-semibold flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Task Completed
            </div>
          )}
        </div>

        {/* Timestamps */}
        {(task.start_time || task.end_time) && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
            {task.start_time && (
              <div>Started: {new Date(task.start_time).toLocaleString()}</div>
            )}
            {task.end_time && (
              <div>Ended: {new Date(task.end_time).toLocaleString()}</div>
            )}
          </div>
        )}
      </div>

      {/* End Task Modal */}
      <EndTaskModal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        onSubmit={handleEndSubmit}
        isSubmitting={isEnding}
      />
    </>
  );
};
