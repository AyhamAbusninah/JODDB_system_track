import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { type PlannerTask } from '../../types';

interface TaskApprovalDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: PlannerTask;
  onApprove: (taskId: string, comments: string) => void;
  onReject: (taskId: string, comments: string) => void;
}

export const TaskApprovalDrawer: React.FC<TaskApprovalDrawerProps> = ({
  isOpen,
  onClose,
  task,
  onApprove,
  onReject
}) => {
  const [comments, setComments] = useState('');
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);

  const handleSubmit = () => {
    if (!decision) return;
    
    if (decision === 'approve') {
      onApprove(task.id, comments);
    } else {
      onReject(task.id, comments);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  const actualHours = (task.actualTime / 3600).toFixed(2);
  const standardHours = (task.standardTime / 3600).toFixed(2);
  const isOvertime = task.actualTime > task.standardTime;
  const isLowEfficiency = task.efficiency < 80;

  return (
    <>
      {/* Transparent backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col border-l-4 border-blue-600">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Task Review & Approval</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Task Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Task Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Operation</div>
                <div className="font-semibold text-gray-800">{task.operationName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Technician</div>
                <div className="font-semibold text-gray-800">{task.technicianName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Job Order</div>
                <div className="font-mono text-sm text-gray-700">{task.jobOrderCode}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Device Serial</div>
                <div className="font-mono text-sm text-gray-700">{task.deviceSerial}</div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Performance Metrics</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className={`p-4 rounded-lg border ${isLowEfficiency ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Efficiency</span>
                  <TrendingUp className={`w-4 h-4 ${isLowEfficiency ? 'text-yellow-600' : 'text-green-600'}`} />
                </div>
                <div className={`text-2xl font-bold ${isLowEfficiency ? 'text-yellow-700' : 'text-green-700'}`}>
                  {task.efficiency}%
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${isOvertime ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Actual Time</span>
                  <Clock className={`w-4 h-4 ${isOvertime ? 'text-red-600' : 'text-blue-600'}`} />
                </div>
                <div className={`text-2xl font-bold ${isOvertime ? 'text-red-700' : 'text-blue-700'}`}>
                  {actualHours}h
                </div>
              </div>

              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Standard Time</span>
                  <Clock className="w-4 h-4 text-gray-600" />
                </div>
                <div className="text-2xl font-bold text-gray-700">{standardHours}h</div>
              </div>
            </div>

            {/* Alerts */}
            {(isOvertime || isLowEfficiency) && (
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800">Performance Alert</h4>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      {isOvertime && <li>• Task exceeded standard time by {(task.actualTime - task.standardTime) / 60} minutes</li>}
                      {isLowEfficiency && <li>• Efficiency below 80% threshold</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Work Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Work Timeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Start Time</div>
                <div className="font-medium text-gray-800">{task.startTime}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">End Time</div>
                <div className="font-medium text-gray-800">{task.endTime}</div>
              </div>
            </div>
          </div>

          {/* Technician Notes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Technician Notes</h3>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-700">{task.notes || 'No notes provided'}</p>
            </div>
          </div>

          {/* Review Comments */}
          {task.status === 'pending-approval' && (
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-2">
                Review Comments {decision === 'reject' && <span className="text-red-600">*</span>}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={decision === 'reject' ? 'Explain why this task is being rejected...' : 'Optional: Add review comments...'}
              />
            </div>
          )}
        </div>

        {/* Footer - Actions */}
        {task.status === 'pending-approval' && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDecision('reject');
                  setTimeout(() => handleSubmit(), 100);
                }}
                disabled={!comments.trim() && decision === 'reject'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject Task
              </button>
              <button
                onClick={() => {
                  setDecision('approve');
                  setTimeout(() => handleSubmit(), 100);
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Task
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
