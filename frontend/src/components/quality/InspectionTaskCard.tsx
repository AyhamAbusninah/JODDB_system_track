import React, { useState } from 'react';
import { api, type Task } from '../../services/api';
import { CheckCircle, XCircle, Clock, Cpu, User } from 'lucide-react';

interface InspectionTaskCardProps {
  task: Task;
  onInspectionComplete: () => void;
}

/**
 * Inspection Task Card - Quality inspection interface for completed tasks
 * Allows inspector to accept or reject tasks with comments
 */
export const InspectionTaskCard: React.FC<InspectionTaskCardProps> = ({ task, onInspectionComplete }) => {
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decision, setDecision] = useState<'accepted' | 'rejected'>('accepted');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInspectClick = (selectedDecision: 'accepted' | 'rejected') => {
    setDecision(selectedDecision);
    setComments('');
    setError(null);
    setShowDecisionModal(true);
  };

  const handleSubmitInspection = async () => {
    if (decision === 'rejected' && !comments.trim()) {
      setError('Comments are required when rejecting a task');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.inspections.createInspection({
        task_id: task.id,
        decision,
        comments: comments.trim(),
      });
      
      setShowDecisionModal(false);
      onInspectionComplete();
    } catch (err: any) {
      console.error('Failed to submit inspection:', err);
      setError(err.message || 'Failed to submit inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Task #{task.id}</h3>
              <p className="text-sm text-gray-600">Job Order #{task.job_order}</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
              Ready for Inspection
            </span>
          </div>
        </div>

        {/* Task Details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start gap-3">
              <Cpu className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Operation</p>
                <p className="text-sm font-medium text-gray-800">{task.operation_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Cpu className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Device Serial</p>
                <p className="text-sm font-mono font-medium text-gray-800">
                  {task.device_serial || `#${task.device}`}
                </p>
              </div>
            </div>

            {task.technician_name && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase">Technician</p>
                  <p className="text-sm font-medium text-gray-800">{task.technician_name}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Time Spent</p>
                <p className="text-sm font-medium text-gray-800">
                  {formatTime(task.actual_time_seconds)} / {formatTime(task.standard_time_seconds)}
                </p>
              </div>
            </div>
          </div>

          {/* Efficiency Badge */}
          {task.efficiency !== null && task.efficiency !== undefined && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Task Efficiency:</span>
                <span className={`text-lg font-bold ${ task.efficiency >= 90 ? 'text-green-600' : task.efficiency >= 75 ? 'text-yellow-600' : 'text-red-600' }`}>
                  {task.efficiency.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Inspection Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => handleInspectClick('accepted')}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2 shadow-md"
            >
              <CheckCircle className="w-5 h-5" />
              Accept
            </button>
            <button
              onClick={() => handleInspectClick('rejected')}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center gap-2 shadow-md"
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>
          </div>
        </div>

        {/* Timestamps */}
        {(task.start_time || task.end_time) && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 space-y-1">
            {task.start_time && (
              <div><span className="font-semibold">Started:</span> {new Date(task.start_time).toLocaleString()}</div>
            )}
            {task.end_time && (
              <div><span className="font-semibold">Completed:</span> {new Date(task.end_time).toLocaleString()}</div>
            )}
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {showDecisionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className={`px-6 py-4 border-b ${ decision === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200' }`}>
              <h3 className={`text-xl font-bold flex items-center gap-2 ${ decision === 'accepted' ? 'text-green-800' : 'text-red-800' }`}>
                {decision === 'accepted' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                {decision === 'accepted' ? 'Accept Task' : 'Reject Task'}
              </h3>
            </div>

            <div className="p-6">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                <p><span className="font-semibold">Task:</span> #{task.id}</p>
                <p><span className="font-semibold">Operation:</span> {task.operation_name}</p>
                <p><span className="font-semibold">Device:</span> {task.device_serial || `#${task.device}`}</p>
              </div>

              <div className="mb-4">
                <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-2">
                  Comments {decision === 'rejected' && <span className="text-red-600">*</span>}
                </label>
                <textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder={
                    decision === 'accepted'
                      ? 'Add any notes (optional)...'
                      : 'Explain why this task is rejected (required)...'
                  }
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDecisionModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitInspection}
                  disabled={isSubmitting}
                  className={`px-6 py-2 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2 ${ decision === 'accepted' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700' }`}
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
                      {decision === 'accepted' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      Confirm {decision === 'accepted' ? 'Accept' : 'Reject'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
