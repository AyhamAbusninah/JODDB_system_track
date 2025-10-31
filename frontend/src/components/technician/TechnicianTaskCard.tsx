import React, { useState } from 'react';
import { Play, Square, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import type { Task } from '../../services/api';

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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Complete Task</h3>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                Task Notes <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all"
                rows={4}
                placeholder="Add any notes about the completed task, issues encountered, or observations..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {notes.length} characters
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold disabled:opacity-50 active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-bold shadow-lg active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Complete
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

  // Get compact status badge styling
  const getStatusBadge = () => {
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      'available': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: <Clock className="w-3 h-3" />,
      },
      'in_progress': {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: <Play className="w-3 h-3" />,
      },
      'done': {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: <CheckCircle className="w-3 h-3" />,
      },
      'completed': {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: <CheckCircle className="w-3 h-3" />,
      },
      'rejected': {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: <AlertCircle className="w-3 h-3" />,
      },
    };

    const config = statusConfig[task.status] || statusConfig['available'];
    const statusText = task.status.replace('_', ' ');
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {statusText.charAt(0).toUpperCase() + statusText.slice(1)}
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
      <div className="w-full">
        {/* Compact Header */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900">Task #{task.id}</h3>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">JO #{task.job_order}</span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Compact Task Details */}
        <div className="space-y-2 mb-3">
          <div>
            <p className="text-sm text-gray-900 font-medium">{task.operation_name}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
              {task.device_serial || `Device #${task.device}`}
            </span>
            {task.technician_name && (
              <>
                <span>•</span>
                <span>{task.technician_name}</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-gray-100">
            <div>
              <span className="text-gray-500">Standard:</span>
              <span className="ml-1 font-medium text-gray-700">{formatTime(task.standard_time_seconds)}</span>
            </div>
            {task.actual_time_seconds && (
              <div>
                <span className="text-gray-500">Actual:</span>
                <span className="ml-1 font-medium text-gray-700">{formatTime(task.actual_time_seconds)}</span>
              </div>
            )}
            {task.efficiency && (
              <div>
                <span className="text-gray-500">Eff:</span>
                <span className={`ml-1 font-bold ${
                  task.efficiency >= 90 ? 'text-green-600' : 
                  task.efficiency >= 75 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {task.efficiency.toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Compact Error Message */}
        {error && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
            ⚠️ {error}
          </div>
        )}

        {/* Compact Action Buttons */}
        <div className="flex gap-2">
          {task.status === 'available' && (
            <button
              onClick={handleStart}
              disabled={isStarting}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm font-semibold"
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
                  Start
                </>
              )}
            </button>
          )}

          {task.status === 'in_progress' && (
            <button
              onClick={handleEndClick}
              disabled={isEnding}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm font-semibold"
            >
              <Square className="w-4 h-4" />
              End
            </button>
          )}

          {(task.status === 'done' || task.status === 'completed') && (
            <div className="flex-1 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-center text-sm font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Completed
            </div>
          )}
        </div>

        {/* Compact Timestamps */}
        {(task.start_time || task.end_time) && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-3 text-xs text-gray-500">
            {task.start_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(task.start_time).toLocaleTimeString()}</span>
              </div>
            )}
            {task.end_time && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>{new Date(task.end_time).toLocaleTimeString()}</span>
              </div>
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
