import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../../services/api';

interface SupervisorReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: number;
  taskOperation: string;
  technicianName: string;
  jobOrderCode: string;
  inspectionId?: number;
  qaComments?: string;
  testerNotes?: string;
  onReviewSubmitted?: () => void;
}

export const SupervisorReviewDialog: React.FC<SupervisorReviewDialogProps> = ({
  isOpen,
  onClose,
  taskId,
  taskOperation,
  technicianName,
  jobOrderCode,
  inspectionId,
  qaComments,
  testerNotes,
  onReviewSubmitted,
}) => {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!inspectionId) {
      setError('No inspection found for this task');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('📝 SupervisorReviewDialog - Submitting review:', {
        inspection_id: inspectionId,
        comments,
      });

      // Call API to create supervisor review (no decision, just comments)
      await api.supervisorReviews.createReview({
        inspection_id: inspectionId,
        decision: 'accepted',
        comments,
      });

      console.log('✅ SupervisorReviewDialog - Review submitted successfully');

      // Reset form
      setComments('');

      // Notify parent component to refresh
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

      // Close dialog
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to submit review';
      console.error('❌ SupervisorReviewDialog - Error submitting review:', err);
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        {/* Header */}
  <div className="sticky top-0 bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between border-b border-blue-800">
          <h2 className="text-xl font-bold text-white">Supervisor Review</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-500 rounded-lg transition"
            title="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Task Information */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-3">Task Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Operation</p>
                <p className="font-medium text-gray-800">{taskOperation}</p>
              </div>
              <div>
                <p className="text-gray-600">Technician</p>
                <p className="font-medium text-gray-800">{technicianName}</p>
              </div>
              <div>
                <p className="text-gray-600">Job Order</p>
                <p className="font-medium text-gray-800">{jobOrderCode}</p>
              </div>
              <div>
                <p className="text-gray-600">Task ID</p>
                <p className="font-medium text-gray-800">#{taskId}</p>
              </div>
            </div>

          {/* QA and Tester Notes */}
          {(qaComments || testerNotes) && (
            <div className="space-y-3">
              {qaComments && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">QA Inspector Comments</h4>
                  <p className="text-sm text-blue-800">{qaComments}</p>
                </div>
              )}
              {testerNotes && (
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">Tester Notes</h4>
                  <p className="text-sm text-purple-800">{testerNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Comments Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">Your Review</h3>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="Write your review comments here..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-28"
            />
          </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !comments.trim()}
              className="flex-1 px-4 py-2 font-medium rounded-lg text-white transition bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
