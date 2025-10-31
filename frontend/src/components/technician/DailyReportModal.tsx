import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
import { type Task } from '../../services/api';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reportData: {
    tasksCompleted: number;
    totalTimeMinutes: number;
    notes: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  completedTasksCount: number;
  allTasks: Task[];
}

/**
 * Daily Report Modal Component
 * 
 * Allows technicians to submit end-of-day report with:
 * - Auto-populated completed task count
 * - Time tracking (hours/minutes)
 * - Notes/remarks about the day
 * - Task summary display
 * 
 * Design principles:
 * - Clear, minimal interface
 * - No flashy animations
 * - Focus on data entry and confirmation
 */
export const DailyReportModal: React.FC<DailyReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  completedTasksCount,
  allTasks,
}) => {
  const [hours, setHours] = useState('8');
  const [minutes, setMinutes] = useState('0');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Calculate total time in minutes
  const totalTimeMinutes = parseInt(hours || '0') * 60 + parseInt(minutes || '0');

  // Get task summary for display
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress');

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const hours_num = parseInt(hours || '0');
    const minutes_num = parseInt(minutes || '0');

    if (hours_num < 0 || hours_num > 24) {
      newErrors.hours = 'Hours must be between 0 and 24';
    }

    if (minutes_num < 0 || minutes_num > 59) {
      newErrors.minutes = 'Minutes must be between 0 and 59';
    }

    if (totalTimeMinutes === 0) {
      newErrors.time = 'Total time must be greater than 0 minutes';
    }

    if (completedTasksCount === 0) {
      newErrors.tasks = 'No completed tasks to report';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        tasksCompleted: completedTasksCount,
        totalTimeMinutes,
        notes,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Submission error:', err);
    }
  };

  if (!isOpen) {
    return null;
  }

  // Success state
  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Report Submitted!</h3>
          <p className="text-gray-600 mb-4">
            Your daily report has been successfully submitted.
          </p>
          <div className="space-y-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between">
              <span>Tasks Completed:</span>
              <span className="font-semibold">{completedTasksCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Time Spent:</span>
              <span className="font-semibold">{hours}h {minutes}m</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-5 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Daily Report</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Summary Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Task Summary
            </h3>

            <div className="grid grid-cols-3 gap-4 text-center">
              {/* Completed tasks */}
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {completedTasksCount}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>

              {/* In progress tasks */}
              <div>
                <div className="text-3xl font-bold text-yellow-600">
                  {inProgressTasks.length}
                </div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>

              {/* Total tasks */}
              <div>
                <div className="text-3xl font-bold text-gray-600">
                  {allTasks.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>

          {/* Time Tracking Section */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-semibold text-gray-800 mb-2 block">
                Time Spent Working
              </span>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg font-medium text-center ${ errors.hours ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400' }`}
                    placeholder="0"
                  />
                  <div className="text-xs text-gray-500 mt-1 text-center">Hours (0-24)</div>
                </div>

                <div className="text-2xl text-gray-400 self-center mb-4">:</div>

                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg font-medium text-center ${ errors.minutes ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400' }`}
                    placeholder="0"
                  />
                  <div className="text-xs text-gray-500 mt-1 text-center">Minutes (0-59)</div>
                </div>
              </div>
            </label>

            {errors.time && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.time}
              </div>
            )}

            {errors.hours && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.hours}
              </div>
            )}

            {errors.minutes && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.minutes}
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-800">
              Notes & Remarks (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any comments about today's work, issues encountered, or notes for tomorrow..."
              className="w-full px-3 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition resize-none"
              rows={4}
            />
            <div className="text-xs text-gray-500">{notes.length} / 500 characters</div>
          </div>

          {/* Form Error Messages */}
          {errors.tasks && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errors.tasks}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || completedTasksCount === 0}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition text-white ${ isSubmitting || completedTasksCount === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700' }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>

        {/* Info Text */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          This report will be recorded in your work history. Make sure all information is accurate before submitting.
        </p>
      </div>
    </div>
  );
};
