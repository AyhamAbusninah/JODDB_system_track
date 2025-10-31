import React, { useState, useEffect, useCallback } from 'react';
import { api, type Task } from '../../services/api';
import { TechnicianTaskCard } from './TechnicianTaskCard';
import { QuickActionsBar } from './QuickActionsBar';
import { DailyReportModal } from './DailyReportModal';
import { RefreshCw, AlertCircle, ListChecks, CheckSquare, Square, FileText } from 'lucide-react';

export const TechnicianDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'available' | 'in_progress'>('all');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [isSelectAllMode, setIsSelectAllMode] = useState(false);
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const activeTask = tasks.find(t => t.status === 'in_progress');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const upcomingTasks = tasks.filter(t => t.status === 'available');

  const fetchTasks = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const fetchedTasks = await api.tasks.getTasks();
      setTasks(fetchedTasks);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTasks(true); }, [fetchTasks]);
  useEffect(() => {
    const interval = setInterval(() => fetchTasks(false), 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleTaskUpdate = useCallback(() => fetchTasks(false), [fetchTasks]);
  const handleRefresh = useCallback(() => fetchTasks(false), [fetchTasks]);
  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const toggleTaskSelection = (taskId: number) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) newSet.delete(taskId);
      else newSet.add(taskId);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (isSelectAllMode && selectedTaskIds.size > 0) {
      setSelectedTaskIds(new Set());
      setIsSelectAllMode(false);
    } else {
      const availableTaskIds = new Set(filteredTasks.map(t => t.id as number));
      setSelectedTaskIds(availableTaskIds);
      setIsSelectAllMode(true);
    }
  };

  const handleStartSelected = async () => {
    if (selectedTaskIds.size === 0) return;
    try {
      for (const taskId of selectedTaskIds) {
        await api.tasks.startTask(taskId);
      }
      handleTaskUpdate();
      setSelectedTaskIds(new Set());
      setIsSelectAllMode(false);
    } catch (err: any) {
      console.error('Failed to start tasks:', err);
      alert('Failed to start some tasks');
    }
  };

  const handleSubmitDailyReport = async (reportData: {
    tasksCompleted: number;
    totalTimeMinutes: number;
    notes: string;
  }) => {
    setReportSubmitting(true);
    try {
      console.log('Daily report:', reportData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowDailyReport(false);
      alert('Daily report submitted!');
    } catch (err: any) {
      alert('Failed to submit report');
    } finally {
      setReportSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Error</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={() => fetchTasks(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Compact Fixed Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-900">Tasks</h1>
            <span className="text-sm text-gray-500">
              {selectedTaskIds.size > 0 
                ? `${selectedTaskIds.size} selected` 
                : `${upcomingTasks.length} available`}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh"
              className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowDailyReport(true)}
              title="Daily report"
              className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Compact Filter Tabs */}
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-thin">
          {[
            { value: 'all', label: 'All', count: tasks.length },
            { value: 'available', label: 'Available', count: upcomingTasks.length },
            { value: 'in_progress', label: 'In Progress', count: inProgressTasks.length },
          ].map(({ value, label, count }) => (
            <button
              key={value}
              onClick={() => setFilter(value as any)}
              className={`px-3 py-1.5 rounded-lg font-medium text-xs whitespace-nowrap transition-all ${
                filter === value 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Compact Selection Controls */}
        {filteredTasks.length > 0 && (
          <div className="px-4 pb-2 flex items-center gap-2 border-t border-gray-100 pt-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 transition-colors"
            >
              {isSelectAllMode ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                  Deselect
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  Select All
                </>
              )}
            </button>
            {selectedTaskIds.size > 0 && (
              <button
                onClick={handleStartSelected}
                className="ml-auto px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-bold transition-all"
              >
                Start ({selectedTaskIds.size})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Improved Tasks List */}
        <div className="p-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <ListChecks className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-700 mb-1">No Tasks Found</h3>
              <p className="text-xs text-gray-500">There are no tasks matching your current filter.</p>
            </div>
          ) : (
            <div className="space-y-2 pb-20">
              {filteredTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`rounded-lg transition-all ${
                    selectedTaskIds.has(task.id as number) 
                      ? 'ring-2 ring-blue-400 shadow-md' 
                      : 'shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-2 p-2 bg-white rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.has(task.id as number)}
                      onChange={() => toggleTaskSelection(task.id as number)}
                      className="w-4 h-4 mt-2 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <TechnicianTaskCard task={task} onTaskUpdate={handleTaskUpdate} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showDailyReport && (
        <DailyReportModal
          isOpen={showDailyReport}
          onClose={() => setShowDailyReport(false)}
          onSubmit={handleSubmitDailyReport}
          isSubmitting={reportSubmitting}
          completedTasksCount={0}
          allTasks={tasks}
        />
      )}

      {/* Quick Actions Bar (Fixed at bottom) */}
      <QuickActionsBar
        hasActiveTask={!!activeTask}
        activeTaskId={activeTask?.id}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  );
};