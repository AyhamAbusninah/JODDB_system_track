import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, User, ClipboardCheck } from 'lucide-react';
import { type SupervisorQAReview } from '../../types';

interface QAReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  review: SupervisorQAReview;
  onApprove: (reviewId: string, comments: string) => void;
  onReject: (reviewId: string, comments: string) => void;
}

export const QAReviewDialog: React.FC<QAReviewDialogProps> = ({
  isOpen,
  onClose,
  review,
  onApprove,
  onReject
}) => {
  const [decision, setDecision] = useState<'accept' | 'reject' | null>(null);
  const [comments, setComments] = useState('');

  const handleSubmit = () => {
    if (!decision) return;
    
    if (decision === 'accept') {
      onApprove(review.id, comments);
    } else {
      onReject(review.id, comments);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  const isPending = review.status === 'pending-supervisor';

  return (
    <>
      {/* Minimal backdrop */}
      <div className="fixed inset-0 bg-gray-900 bg-opacity-5 z-40" onClick={onClose} />
      
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto pointer-events-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-800">Supervisor QA Review</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* Task Information */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                Task Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Operation</div>
                  <div className="font-semibold text-gray-800">{review.operationName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Technician</div>
                  <div className="font-semibold text-gray-800">{review.technicianName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Job Order</div>
                  <div className="font-mono font-semibold text-gray-800">{review.jobOrderCode}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Device Serial</div>
                  <div className="font-mono font-semibold text-gray-800">{review.deviceSerial}</div>
                </div>
              </div>
            </div>

            {/* QA Inspection Details */}
            <div className={`rounded-lg p-4 border ${ review.qaDecision === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200' }`}>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                QA Inspector Decision
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Decision:</span>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${ review.qaDecision === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}>
                    {review.qaDecision === 'accepted' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {review.qaDecision.toUpperCase()}
                  </span>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">Inspector</div>
                  <div className="font-medium text-gray-800">{review.qaInspector}</div>
                  <div className="text-xs text-gray-500">{review.qaInspectedAt}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-1">QA Comments</div>
                  <div className="p-3 bg-white rounded border border-gray-200">
                    <p className="text-gray-700">{review.qaComments}</p>
                  </div>
                </div>
              </div>

              {review.qaDecision === 'rejected' && (
                <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-red-800">QA Rejected This Task</div>
                    <div className="text-sm text-red-700 mt-1">
                      Review the QA inspector's comments and decide whether to uphold the rejection or override it.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Previous Supervisor Review (if exists) */}
            {review.supervisorDecision && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3">Previous Supervisor Review</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Decision:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${ review.supervisorDecision === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}>
                      {review.supervisorDecision}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Comments</div>
                    <div className="text-gray-700 mt-1">{review.supervisorComments}</div>
                  </div>
                  <div className="text-xs text-gray-500">Reviewed at: {review.supervisorReviewedAt}</div>
                </div>
              </div>
            )}

            {/* Supervisor Decision (Only if pending) */}
            {isPending && (
              <>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Supervisor Decision *</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setDecision('accept')}
                      className={`p-4 rounded-lg border-2 transition ${ decision === 'accept' ? 'border-green-600 bg-green-50' : 'border-gray-300 hover:border-green-400' }`}
                    >
                      <CheckCircle className={`w-6 h-6 mx-auto mb-2 ${decision === 'accept' ? 'text-green-600' : 'text-gray-400'}`} />
                      <div className="font-semibold text-center">Approve QA Decision</div>
                      <div className="text-xs text-gray-600 text-center mt-1">
                        {review.qaDecision === 'accepted' ? 'Finalize task approval' : 'Uphold QA rejection'}
                      </div>
                    </button>

                    <button
                      onClick={() => setDecision('reject')}
                      className={`p-4 rounded-lg border-2 transition ${ decision === 'reject' ? 'border-red-600 bg-red-50' : 'border-gray-300 hover:border-red-400' }`}
                    >
                      <XCircle className={`w-6 h-6 mx-auto mb-2 ${decision === 'reject' ? 'text-red-600' : 'text-gray-400'}`} />
                      <div className="font-semibold text-center">Reject QA Decision</div>
                      <div className="text-xs text-gray-600 text-center mt-1">
                        {review.qaDecision === 'accepted' ? 'Override QA approval' : 'Override QA rejection'}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block font-semibold text-gray-800 mb-2">
                    Supervisor Comments {decision === 'reject' && <span className="text-red-600">*</span>}
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      decision === 'reject'
                        ? 'Explain why you are overriding the QA decision...'
                        : 'Optional: Add supervisor review comments...'
                    }
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {isPending && (
            <div className="px-6 py-4 border-t bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!decision || (decision === 'reject' && !comments.trim())}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Review
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
