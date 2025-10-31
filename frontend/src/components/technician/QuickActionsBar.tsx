import React from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { api } from '../../services/api';

interface QuickActionsBarProps {
  hasActiveTask: boolean;
  activeTaskId?: number;
  onTaskUpdate: () => void;
}

/**
 * Quick Actions Bar - Sticky footer with one-tap actions
 * Optimized for one-handed thumb zone operation
 * Provides instant access to most common actions
 */
export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  hasActiveTask,
  activeTaskId,
  onTaskUpdate,
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleEndTask = async () => {
    if (!activeTaskId) return;

    const confirmEnd = window.confirm('End this task? This will mark it as completed.');
    if (!confirmEnd) return;

    setIsProcessing(true);
    try {
      await api.tasks.endTask(activeTaskId, 'Completed via quick action');
      onTaskUpdate();
    } catch (err) {
      console.error('Failed to end task:', err);
      alert('Failed to end task. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hasActiveTask) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl p-4 z-30 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <button
              onClick={onTaskUpdate}
              className="flex-1 py-3.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl font-bold text-base flex items-center justify-center gap-2 hover:from-blue-100 hover:to-blue-200 transition-all shadow-sm active:scale-95 border border-blue-200"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh Tasks
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2 font-medium">
            No active task • Select a task to start working
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-green-200 shadow-2xl p-4 z-30 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3">
          <button
            onClick={handleEndTask}
            disabled={isProcessing}
            className="flex-1 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:from-green-700 hover:to-green-800 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-6 h-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                Complete Current Task
              </>
            )}
          </button>
        </div>
        <p className="text-center text-xs text-green-700 mt-2 font-semibold">
          ⚡ Quick Complete: Tap to finish your active task
        </p>
      </div>
    </div>
  );
};
