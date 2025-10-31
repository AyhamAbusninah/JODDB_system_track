import React, { useState, useEffect } from 'react';
import { Plus, Users, BarChart3, CheckCircle, Package } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Header } from '../Header';
import { PlannerKPIs } from './PlannerKPIs';
import { JobOrdersPanel } from './JobOrdersPanel';
import { JobOrderDetails } from './JobOrderDetails';
import { UserManagement } from './UserManagement';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { CreateJobOrderModal } from './CreateJobOrderModal';
import { CreateUserModal } from './CreateUserModal';
import { TaskReviewQueue } from './TaskReviewQueue';
import { api, type JobOrder, type Task } from '../../services/api';
import { type PlannerTask, type PlannerJobOrder } from '../../types';

type View = 'dashboard' | 'job-details' | 'users' | 'analytics' | 'task-review';

export const PlannerDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [jobsData, tasksData] = await Promise.all([
          api.jobOrders.getJobOrders(),
          api.tasks.getTasks(),
        ]);
        setJobOrders(jobsData);
        setTasks(tasksData);
      } catch (err: any) {
        console.error('Failed to fetch planner data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setCurrentView('job-details');
  };

  const handleApproveTask = async (taskId: string, comments: string) => {
    try {
      const taskIdNum = parseInt(taskId, 10);
      
      // Create inspection with approved decision
      await api.inspections.createInspection({
        task_id: taskIdNum,
        decision: 'accepted',
        comments: comments || 'Approved by planner',
      });
      
      console.log(`Task ${taskId} approved with comments:`, comments);
      
      // Refresh task list
      const tasksData = await api.tasks.getTasks();
      setTasks(tasksData);
    } catch (err: any) {
      console.error('Failed to approve task:', err);
      setError(err.message || 'Failed to approve task');
    }
  };

  const handleRejectTask = async (taskId: string, comments: string) => {
    try {
      const taskIdNum = parseInt(taskId, 10);
      
      // Create inspection with rejected decision
      await api.inspections.createInspection({
        task_id: taskIdNum,
        decision: 'rejected',
        comments: comments || 'Rejected by planner',
      });
      
      console.log(`Task ${taskId} rejected with comments:`, comments);
      
      // Refresh task list
      const tasksData = await api.tasks.getTasks();
      setTasks(tasksData);
    } catch (err: any) {
      console.error('Failed to reject task:', err);
      setError(err.message || 'Failed to reject task');
    }
  };

  const handleJobOrderCreated = async () => {
    // Refresh job orders list after new order is created
    try {
      const jobsData = await api.jobOrders.getJobOrders();
      setJobOrders(jobsData);
    } catch (err: any) {
      console.error('Failed to refresh job orders:', err);
    }
  };

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    if (error && currentView === 'dashboard') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      );
    }

    switch (currentView) {
      case 'job-details':
        return <JobOrderDetails jobId={selectedJobId} onBack={() => setCurrentView('dashboard')} />;
      case 'users':
        return <UserManagement onBack={() => setCurrentView('dashboard')} />;
      case 'analytics':
        return <AnalyticsDashboard onBack={() => setCurrentView('dashboard')} />;
      case 'task-review':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Supervisor Task Review Queue</h2>
              <div className="text-sm text-gray-600">
                {tasks.filter(t => t.status === 'qa_approved').length} tasks awaiting review
              </div>
            </div>
            <TaskReviewQueue
              tasks={tasks.filter(t => t.status === 'qa_approved') as unknown as PlannerTask[]}
              onApprove={handleApproveTask}
              onReject={handleRejectTask}
            />
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <PlannerKPIs />
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowCreateJobModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-md"
              >
                <Plus className="w-5 h-5" />
                New Job Order
              </button>
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-md"
              >
                <Users className="w-5 h-5" />
                Create User
              </button>
            </div>

            <JobOrdersPanel jobs={jobOrders as unknown as PlannerJobOrder[]} onJobClick={handleJobClick} loading={loading} />
          </div>
        );
    }
  };

  const pendingTasksCount = tasks.filter(t => t.status === 'qa_approved').length;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <Header 
        title="Planning Control Panel" 
        subtitle="Job order planning and scheduling"
        user={user}
        onLogout={handleLogout}
      />

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <nav className="flex gap-6">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`pb-2 px-1 font-medium ${ currentView === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800' }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/jobs')}
            className="pb-2 px-1 font-medium flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <Package className="w-4 h-4" />
            Jobs
          </button>
          <button
            onClick={() => setCurrentView('task-review')}
            className={`pb-2 px-1 font-medium flex items-center gap-2 ${ currentView === 'task-review' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800' }`}
          >
            <CheckCircle className="w-4 h-4" />
            Task Review
            {pendingTasksCount > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingTasksCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentView('users')}
            className={`pb-2 px-1 font-medium flex items-center gap-2 ${ currentView === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800' }`}
          >
            <Users className="w-4 h-4" />
            Personnel
          </button>
          <button
            onClick={() => setCurrentView('analytics')}
            className={`pb-2 px-1 font-medium flex items-center gap-2 ${ currentView === 'analytics' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800' }`}
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

      {/* Modals */}
      {showCreateJobModal && (
        <CreateJobOrderModal
          isOpen={showCreateJobModal}
          onClose={() => setShowCreateJobModal(false)}
          onSuccess={handleJobOrderCreated}
        />
      )}
      {showCreateUserModal && (
        <CreateUserModal
          isOpen={showCreateUserModal}
          onClose={() => setShowCreateUserModal(false)}
        />
      )}
    </div>
  );
};
