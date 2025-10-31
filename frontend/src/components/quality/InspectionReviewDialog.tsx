import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Cpu, User, AlertCircle } from 'lucide-react';
import type { Task } from '../../services/api';
import { api } from '../../services/api';

interface InspectionReviewDialogProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
  onSubmit: () => void;
}

/**
 * InspectionReviewDialog - Enhanced inspection review interface
 * Features:
 * - Comprehensive task information display
 * - Two-step decision process (Approve/Reject with mandatory review)
 * - Rich text review notes with placeholder guidance
 * - Real-time validation
 * - Loading states and error handling
 */
export const InspectionReviewDialog: React.FC<InspectionReviewDialogProps> = ({
  isOpen,
  task,
  onClose,
  onSubmit,
}) => {
  const [decision, setDecision] = useState<'accepted' | 'rejected' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !task) {
    return null;
  }

  const handleSubmit = async () => {
    // Validation
    if (!decision) {
      setError('Please select Approve or Reject');
      return;
    }

    if (!reviewNotes.trim()) {
      setError('Review notes are required');
      return;
    }

    if (decision === 'rejected' && reviewNotes.trim().length < 10) {
      setError('Please provide detailed rejection reason (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.inspections.createInspection({
        task_id: task.id,
        decision,
        comments: reviewNotes.trim(),
      });

      // Close dialog and notify parent
      handleClose();
      onSubmit();
    } catch (err: any) {
      console.error('Failed to submit inspection:', err);
      // Extract detailed error message from axios response
      let errorMessage = 'Failed to submit inspection';
      if (err.response?.data) {
        // Try to get specific field errors first
        const data = err.response.data;
        if (data.task_id) {
          errorMessage = Array.isArray(data.task_id) ? data.task_id[0] : data.task_id;
        } else if (data.comments) {
          errorMessage = Array.isArray(data.comments) ? data.comments[0] : data.comments;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDecision(null);
    setReviewNotes('');
    setError(null);
    onClose();
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

  const isFormValid = decision && reviewNotes.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-6">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Task Inspection Review</h2>
          <p className="text-sm text-gray-600 mt-1">Review task details and provide your quality assessment</p>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-scroll max-h-96 px-6 py-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {/* Task Summary */}
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6 border border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Task ID</p>
                <p className="text-lg font-bold text-gray-900">#{task.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase">Job Order</p>
                <p className="text-lg font-bold text-gray-900">{task.job_order ? `#${task.job_order}` : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Task Details - Two Column */}
          <div className="space-y-4 mb-6">
            {/* Operation */}
            <div className="flex items-start gap-3">
              <Cpu className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase">Operation</p>
                <p className="text-sm font-medium text-gray-800">{task.operation_name}</p>
              </div>
            </div>

            {/* Device */}
            <div className="flex items-start gap-3">
              <Cpu className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase">Device Serial</p>
                <p className="text-sm font-mono font-medium text-gray-800">
                  {task.device_serial || `#${task.device}`}
                </p>
              </div>
            </div>

            {/* Technician */}
            {task.technician_name && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 uppercase">Technician</p>
                  <p className="text-sm font-medium text-gray-800">{task.technician_name}</p>
                </div>
              </div>
            )}

            {/* Time */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase">Time Spent</p>
                <p className="text-sm font-medium text-gray-800">
                  {formatTime(task.actual_time_seconds)} / {formatTime(task.standard_time_seconds)}
                </p>
              </div>
            </div>
          </div>

          {/* Efficiency Indicator */}
          {task.efficiency !== null && task.efficiency !== undefined && (
            <div className={`p-4 rounded-lg mb-6 ${getEfficiencyBgColor(task.efficiency)}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Task Efficiency</span>
                <span className={`text-2xl font-bold ${getEfficiencyColor(task.efficiency)}`}>
                  {task.efficiency.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    task.efficiency >= 90
                      ? 'bg-green-600'
                      : task.efficiency >= 75
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(task.efficiency, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Timestamps */}
          {(task.start_time || task.end_time) && (
            <div className="bg-gray-50 p-3 rounded-lg mb-6 text-xs text-gray-600 space-y-1">
              {task.start_time && (
                <div>
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

          <div className="border-t border-gray-200 pt-6">
            {/* Decision Selection */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Quality Assessment</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setDecision('accepted');
                    setError(null);
                  }}
                  className={`p-3 rounded-lg border-2 transition ${
                    decision === 'accepted'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 bg-white hover:border-green-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-700">Approve</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setDecision('rejected');
                    setError(null);
                  }}
                  className={`p-3 rounded-lg border-2 transition ${
                    decision === 'rejected'
                      ? 'border-red-600 bg-red-50'
                      : 'border-gray-300 bg-white hover:border-red-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-700">Reject</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Review Notes */}
            <div className="mb-4">
              <label htmlFor="review-notes" className="block text-sm font-semibold text-gray-700 mb-2">
                Review Notes <span className="text-red-600">*</span>
              </label>
              <textarea
                id="review-notes"
                value={reviewNotes}
                onChange={(e) => {
                  setReviewNotes(e.target.value);
                  setError(null);
                }}
                placeholder={
                  decision === 'accepted'
                    ? 'Provide positive feedback and notes on task completion...'
                    : 'Explain specific issues, defects, or reasons for rejection...'
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                rows={5}
              />
              <p className="text-xs text-gray-500 mt-1">
                {reviewNotes.length} characters | {decision === 'rejected' && 'Minimum 10 characters required'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className={`px-6 py-2 text-white rounded-lg transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              decision === 'accepted'
                ? 'bg-green-600 hover:bg-green-700'
                : decision === 'rejected'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-400'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                {decision === 'accepted' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approve & Submit
                  </>
                ) : decision === 'rejected' ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    Reject & Submit
                  </>
                ) : (
                  'Submit Review'
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
