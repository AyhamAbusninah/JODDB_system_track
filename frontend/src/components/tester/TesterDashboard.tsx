import React, { useState, useEffect } from 'react';
import { BarChart3, ClipboardList, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { api, type Task } from '../../services/api';
import { TaskInspectionDialog } from './TaskInspectionDialog';

type View = 'dashboard' | 'testing-queue' | 'history';

export const TesterDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [inspectionHistory, setInspectionHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [allTasks, allInspections] = await Promise.all([
        api.tasks.getTasks(),
        api.inspections.getInspections(),
      ]);
      setTasks(allTasks);
      setInspectionHistory(allInspections);
    } catch (err) {
      console.error('Error fetching tester data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getTesterKPIs = () => {
    const availableTasks = tasks.filter(t => t.status === 'available').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const acceptedInspections = inspectionHistory.filter(i => (i as any).decision === 'accepted').length;
    const rejectedInspections = inspectionHistory.filter(i => (i as any).decision === 'rejected').length;

    return {
      totalTasks: tasks.length,
      availableTasks,
      inProgressTasks,
      acceptedInspections,
      rejectedInspections,
      totalInspections: inspectionHistory.length,
    };
  };

  const handleInspectClick = (task: Task) => {
    setSelectedTask(task);
    setShowInspectionDialog(true);
  };

  const handleInspectionSubmit = async (
    taskId: number,
    decision: 'accepted' | 'rejected',
    comments: string
  ) => {
    try {
      await api.testerReviews.createReview({
        task_id: taskId,
        decision,
        comments,
      });

      console.log(`✓ Task ${taskId} ${decision} with comment: ${comments}`);
      setShowInspectionDialog(false);
      setSelectedTask(null);
      await fetchData();
    } catch (err: any) {
      console.error('Failed to submit inspection:', err);
      throw new Error(err.message || 'Failed to submit inspection');
    }
  };

  const kpis = getTesterKPIs();

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-gray-600">Loading tester dashboard...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'testing-queue':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Testing Queue</h3>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tasks available for testing</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-400 transition shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">
                          {task.operation_name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Device: {task.device_serial}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          task.status === 'available'
                            ? 'bg-blue-100 text-blue-800'
                            : task.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-semibold">Task ID:</span> #{task.id}
                      </div>
                      <div>
                        <span className="font-semibold">Standard Time:</span>{' '}
                        {Math.round(task.standard_time_seconds / 60)} min
                      </div>
                    </div>

                    <button
                      onClick={() => handleInspectClick(task)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                    >
                      Start Testing
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Testing History</h3>
            {inspectionHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No testing history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inspectionHistory.map((inspection: any) => (
                  <div
                    key={inspection.id}
                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-800">
                          Task #{inspection.task_id}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {inspection.comments}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                          inspection.decision === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {inspection.decision === 'accepted' ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Accepted
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Rejected
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-lg border p-6">
                <p className="text-gray-600 text-sm font-medium">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{kpis.totalTasks}</p>
              </div>
              <div className="bg-white rounded-lg border p-6">
                <p className="text-gray-600 text-sm font-medium">Available</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{kpis.availableTasks}</p>
              </div>
              <div className="bg-white rounded-lg border p-6">
                <p className="text-gray-600 text-sm font-medium">In Progress</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {kpis.inProgressTasks}
                </p>
              </div>
              <div className="bg-white rounded-lg border p-6">
                <p className="text-gray-600 text-sm font-medium">Accepted</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {kpis.acceptedInspections}
                </p>
              </div>
              <div className="bg-white rounded-lg border p-6">
                <p className="text-gray-600 text-sm font-medium">Rejected</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {kpis.rejectedInspections}
                </p>
              </div>
              <div className="bg-white rounded-lg border p-6">
                <p className="text-gray-600 text-sm font-medium">Total Tests</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {kpis.totalInspections}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentView('testing-queue')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-md"
              >
                <ClipboardList className="w-5 h-5" />
                Start Testing
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold shadow-md"
              >
                <BarChart3 className="w-5 h-5" />
                Testing History
              </button>
            </div>

            {/* Recent Tests */}
            <div className="bg-white rounded-lg border">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Recent Tests</h3>
              </div>
              <div className="p-4">
                {inspectionHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No tests yet</p>
                ) : (
                  <div className="space-y-3">
                    {inspectionHistory.slice(0, 5).map((inspection: any) => (
                      <div
                        key={inspection.id}
                        className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition"
                      >
                        <span className="text-gray-700">Task #{inspection.task_id}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                            inspection.decision === 'accepted'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {inspection.decision === 'accepted' ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Accepted
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Rejected
                            </>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {renderView()}
      </div>

      {/* Inspection Dialog */}
      {selectedTask && (
        <TaskInspectionDialog
          isOpen={showInspectionDialog}
          onClose={() => {
            setShowInspectionDialog(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onSubmit={handleInspectionSubmit}
        />
      )}
    </div>
  );
};
