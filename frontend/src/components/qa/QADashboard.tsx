import React, { useState, useEffect } from 'react';
import { ClipboardCheck, BarChart3 } from 'lucide-react';
import { QAKPIs } from './QAKPIs';
import { TaskInspectionPanel } from './TaskInspectionPanel';
import { InspectionHistory } from './InspectionHistory';
import { QAAnalytics } from './QAAnalytics';
import { QualityInspectorPanel } from '../quality/QualityInspectorPanel';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

type View = 'dashboard' | 'inspections' | 'history' | 'analytics';

export const QADashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [tasks, setTasks] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allTasks, allInspections] = await Promise.all([
        api.tasks.getTasks(),
        api.inspections.getInspections(),
      ]);
      
      setTasks(allTasks);
      setInspections(allInspections);
    } catch (error) {
      console.error('Error fetching QA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInspect = async (taskId: string, decision: 'accepted' | 'rejected', comments: string) => {
    try {
      // Create inspection via API
      await api.inspections.createInspection({
        task_id: parseInt(taskId),
        decision,
        comments,
      });

      // Refresh data after inspection
      await fetchData();
      
      // Show success message
      console.log(`✓ Task ${taskId} ${decision}${comments ? ` - ${comments}` : ''}`);
    } catch (error: any) {
      console.error('Error creating inspection:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit inspection');
    }
  };

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-gray-600">Loading QA data...</div>
        </div>
      );
    }

    // Quality Inspector role gets enhanced interface with new components
    if (user?.role === 'quality' && currentView === 'inspections') {
      return (
        <QualityInspectorPanel
          tasks={tasks}
          onInspectionComplete={() => fetchData()}
        />
      );
    }

    switch (currentView) {
      case 'inspections':
        return (
          <TaskInspectionPanel
            tasks={tasks}
            onInspect={handleInspect}
          />
        );
      case 'history':
        return <InspectionHistory inspections={inspections} />;
      case 'analytics':
        return <QAAnalytics tasks={tasks} />;
      default:
        return (
          <div className="space-y-6">
            <QAKPIs tasks={tasks} inspections={inspections} />
            
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentView('inspections')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-md"
              >
                <ClipboardCheck className="w-5 h-5" />
                Start Inspection
              </button>
            </div>

            {/* Recent Inspections Preview */}
            <div className="bg-white rounded-lg border flex flex-col max-h-96">
              <div className="px-6 py-4 border-b shrink-0">
                <h3 className="text-lg font-semibold text-gray-800">Recent Inspections</h3>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {inspections.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No inspections yet</div>
                ) : (
                  inspections.slice(0, 5).map((inspection: any) => {
                    const task = tasks.find((t: any) => t.id === inspection.task);
                    return (
                      <div key={inspection.id} className="py-4 border-b last:border-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">
                              Task #{inspection.task}{task ? ` - ${task.name || task.operation_name}` : ''}
                            </div>
                            {task && (
                              <>
                                <div className="text-sm text-gray-600 mt-1">
                                  Device: {task.device_serial || `#${task.device}`}
                                </div>
                                {task.technician_name && (
                                  <div className="text-sm text-gray-600">
                                    Technician: {task.technician_name}
                                  </div>
                                )}
                              </>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(inspection.created_at).toLocaleString()}
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
                            inspection.decision === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {inspection.decision}
                          </span>
                        </div>
                        {inspection.comments && (
                          <div className="text-xs text-gray-500 italic mt-2 bg-gray-50 p-2 rounded">
                            "{inspection.comments}"
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  const pendingCount = tasks.filter((t: any) => 
    t.status === 'pending_qa'
  ).length;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        {/* Navigation */}
        <nav className="flex gap-6">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`pb-2 px-1 font-medium transition-colors ${
              currentView === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('inspections')}
            className={`pb-2 px-1 font-medium transition-colors flex items-center gap-2 ${
              currentView === 'inspections'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Inspections
            {pendingCount > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`pb-2 px-1 font-medium transition-colors ${
              currentView === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setCurrentView('analytics')}
            className={`pb-2 px-1 font-medium transition-colors flex items-center gap-2 ${
              currentView === 'analytics'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderView()}
      </div>
    </div>
  );
};
