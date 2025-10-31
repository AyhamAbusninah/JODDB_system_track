import React, { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { type Task } from '../../services/api';

interface TaskInspectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onSubmit: (taskId: number, decision: 'accepted' | 'rejected', comments: string) => Promise<void>;
}

export const TaskInspectionDialog: React.FC<TaskInspectionDialogProps> = ({
  isOpen,
  onClose,
  task,
  onSubmit
}) => {
  const [decision, setDecision] = useState<'accepted' | 'rejected' | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!decision) {
      setError('Please select Accept or Reject');
      return;
    }

    if (decision === 'rejected' && !comments.trim()) {
      setError('Comments are required when rejecting a task');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(task.id, decision, comments);
      setDecision(null);
      setComments('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit inspection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">Task Inspection</h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Task Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div>
                <span className="font-semibold text-gray-700">Task ID:</span>
                <span className="ml-2 text-gray-600">#{task.id}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Operation:</span>
                <span className="ml-2 text-gray-600">{task.operation_name}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Device:</span>
                <span className="ml-2 text-gray-600">{task.device_serial}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Status:</span>
                <span className="ml-2 text-gray-600">{task.status}</span>
              </div>
            </div>

            {/* Decision Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Select Decision *
              </label>
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
                  <CheckCircle
                    className={`w-8 h-8 mx-auto mb-2 ${
                      decision === 'accepted' ? 'text-green-600' : 'text-gray-400'
                    }`}
                  />
                  <div className="font-bold text-lg text-center">Accept</div>
                  <div className="text-sm text-gray-600 text-center mt-1">
                    Task passes testing
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
                  <XCircle
                    className={`w-8 h-8 mx-auto mb-2 ${
                      decision === 'rejected' ? 'text-red-600' : 'text-gray-400'
                    }`}
                  />
                  <div className="font-bold text-lg text-center">Reject</div>
                  <div className="text-sm text-gray-600 text-center mt-1">
                    Task requires rework
                  </div>
                </button>
              </div>
            </div>

            {/* Comments */}
            {decision && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Test Review Comments
                  {decision === 'rejected' && <span className="text-red-600">*</span>}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder={
                    decision === 'rejected'
                      ? 'Describe the issues found during testing (required)...'
                      : 'Add any additional testing notes (optional)...'
                  }
                />
                {decision === 'rejected' && (
                  <p className="text-xs text-red-600 mt-1">
                    Comments are required for rejected tasks
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {decision && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                  decision === 'accepted'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Submitting...
                  </>
                ) : decision === 'accepted' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirm Accept
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Confirm Reject
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
