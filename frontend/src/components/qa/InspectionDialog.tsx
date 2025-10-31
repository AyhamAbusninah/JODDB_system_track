import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { type Task } from '../../services/api';

interface InspectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  technicianName: string;
  jobOrderCode: string;
  onSubmit: (taskId: string, decision: 'accepted' | 'rejected', comments: string) => Promise<void>;
}

export const InspectionDialog: React.FC<InspectionDialogProps> = ({
  isOpen,
  onClose,
  task,
  technicianName,
  jobOrderCode,
  onSubmit
}) => {
  const [decision, setDecision] = useState<'accepted' | 'rejected' | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!decision) {
      setError('Please select a decision (Accept or Reject)');
      return;
    }
    
    if (decision === 'rejected' && !comments.trim()) {
      setError('Comments are mandatory for rejection');
      return;
    }
    
    setError(null);
    setIsSubmitting(true);
    
    try {
      await onSubmit(task.id.toString(), decision, comments);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit inspection. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const efficiency = task.efficiency || 0;
  const standardTime = task.standard_time_seconds || 0;
  const actualTime = task.actual_time_seconds || 0;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getEfficiencyColor = (eff: number) => {
    if (eff >= 100) return 'text-green-600';
    if (eff >= 80) return 'text-blue-600';
    if (eff >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBg = (eff: number) => {
    if (eff >= 100) return 'bg-green-50 border-green-200';
    if (eff >= 80) return 'bg-blue-50 border-blue-200';
    if (eff >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40" onClick={onClose} />
      
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b flex justify-between items-center bg-linear-to-r from-blue-600 to-blue-700 text-white">
            <div>
              <h2 className="text-xl font-bold">Quality Inspection</h2>
              <p className="text-sm text-blue-100 mt-0.5">Task #{task.id}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-blue-500 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-red-900">Error</div>
                  <div className="text-sm text-red-700 mt-1">{error}</div>
                </div>
              </div>
            )}

            {/* Task Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-700 font-medium mb-2">Job Order</div>
                <div className="font-mono font-bold text-lg text-blue-900">{jobOrderCode}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-700 font-medium mb-2">Device Serial</div>
                <div className="font-mono font-bold text-lg text-blue-900">
                  {task.device_serial || `Device #${task.device}`}
                </div>
              </div>
            </div>

            {/* Task Details */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Task Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Operation</div>
                  <div className="font-semibold text-gray-900 mt-1">{task.operation_name || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Technician</div>
                  <div className="font-semibold text-gray-900 mt-1">{technicianName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Started</div>
                  <div className="font-medium text-gray-900 mt-1 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {task.start_time ? new Date(task.start_time).toLocaleString() : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Completed</div>
                  <div className="font-medium text-gray-900 mt-1 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {task.end_time ? new Date(task.end_time).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className={`rounded-lg p-4 border-2 ${getEfficiencyBg(efficiency)}`}>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp className={`w-5 h-5 ${getEfficiencyColor(efficiency)}`} />
                Performance Metrics
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Standard Time</div>
                  <div className="text-2xl font-bold text-gray-900">{formatTime(standardTime)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Actual Time</div>
                  <div className="text-2xl font-bold text-gray-900">{formatTime(actualTime)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Efficiency</div>
                  <div className={`text-3xl font-bold ${getEfficiencyColor(efficiency)}`}>
                    {efficiency > 0 ? `${Math.round(efficiency)}%` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Efficiency Warning */}
              {efficiency > 0 && efficiency < 60 && (
                <div className="mt-3 bg-red-100 border border-red-300 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <strong>Low Efficiency Alert:</strong> This task has below-target efficiency. 
                    Consider reviewing the work quality and technician performance.
                  </div>
                </div>
              )}
            </div>

            {/* Decision Section */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                Inspection Decision 
                <span className="text-red-600">*</span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setDecision('accepted')}
                  disabled={isSubmitting}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    decision === 'accepted' 
                      ? 'border-green-600 bg-green-50 shadow-md' 
                      : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${
                    decision === 'accepted' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <div className="font-bold text-lg text-center">Accept</div>
                  <div className="text-sm text-gray-600 text-center mt-1">
                    Task meets quality standards
                  </div>
                </button>

                <button
                  onClick={() => setDecision('rejected')}
                  disabled={isSubmitting}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    decision === 'rejected' 
                      ? 'border-red-600 bg-red-50 shadow-md' 
                      : 'border-gray-300 hover:border-red-400 hover:bg-red-50'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <XCircle className={`w-8 h-8 mx-auto mb-2 ${
                    decision === 'rejected' ? 'text-red-600' : 'text-gray-400'
                  }`} />
                  <div className="font-bold text-lg text-center">Reject</div>
                  <div className="text-sm text-gray-600 text-center mt-1">
                    Task requires rework
                  </div>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div>
              <label className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                Inspection Comments
                {decision === 'rejected' && <span className="text-red-600">*</span>}
                {decision === 'rejected' && (
                  <span className="text-sm font-normal text-red-600">(Required for rejection)</span>
                )}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                disabled={isSubmitting}
                rows={5}
                className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder={
                  decision === 'rejected' 
                    ? 'Describe the issues found and what needs to be corrected...' 
                    : 'Optional: Add any inspection notes, observations, or recommendations...'
                }
              />
              <div className="text-sm text-gray-500 mt-1">
                {comments.length}/500 characters
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-gray-50 flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-100 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!decision || (decision === 'rejected' && !comments.trim()) || isSubmitting}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Inspection'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
