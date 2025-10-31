import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Header } from '../Header';
import { DashboardKPIs } from './DashboardKPIs';
import { JobOrdersSummary } from './JobOrdersSummary';
import { TechnicianPerformanceTable } from './TechnicianPerformanceTable';
import { ReviewQueue } from './ReviewQueue';
import { JobOrderDetails } from './JobOrderDetails';
import { TechnicianReviewLog } from './TechnicianReviewLog';
import { AlertsCenter } from './AlertsCenter';
import { ReportsView } from './ReportsView';
import { SupervisorReviewDialog } from './SupervisorReviewDialog';
import { inspectionAPI } from '../../services/api';

type View = 'dashboard' | 'job-details' | 'technician-log' | 'alerts' | 'reports';

export const SupervisorDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewDialogItem, setReviewDialogItem] = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setCurrentView('job-details');
  };

  const handleTechnicianClick = (technicianId: string) => {
    setSelectedTechnicianId(technicianId);
    setCurrentView('technician-log');
  };

  const handleReviewItemClick = async (item: any) => {
    // Fetch inspection for the selected task
    try {
      const inspection = await inspectionAPI.getInspectionForTask(item.taskId);
      console.log('Supervisor Review - Task:', item.taskId);
      console.log('Supervisor Review - Inspection:', inspection);
      setReviewDialogItem({ ...item, inspectionId: inspection.id });
      setReviewDialogOpen(true);
    } catch (err) {
      console.error('Supervisor Review - Error fetching inspection:', err);
      setReviewDialogItem({ ...item, inspectionId: undefined });
      setReviewDialogOpen(true);
    }
  };

  const handleAlertClick = (alert: any) => {
    if (alert.relatedJobId) {
      handleJobClick(alert.relatedJobId);
    } else if (alert.relatedTechnicianId) {
      handleTechnicianClick(alert.relatedTechnicianId);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleReviewSubmitted = () => {
    // Close dialog and refresh the review queue
    setReviewDialogOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const renderView = () => {
    switch (currentView) {
      case 'job-details':
        return <JobOrderDetails jobId={selectedJobId} onBack={() => setCurrentView('dashboard')} />;
      case 'technician-log':
        return <TechnicianReviewLog technicianId={selectedTechnicianId} onBack={() => setCurrentView('dashboard')} />;
      case 'alerts':
        return <AlertsCenter onBack={() => setCurrentView('dashboard')} onAlertClick={handleAlertClick} />;
      case 'reports':
        return <ReportsView onBack={() => setCurrentView('dashboard')} />;
      default:
        return (
          <div className="space-y-6">
            {/* KPIs */}
            <DashboardKPIs />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Jobs and Technicians */}
              <div className="lg:col-span-2 space-y-6">
                <JobOrdersSummary onJobClick={handleJobClick} />
                <TechnicianPerformanceTable onTechnicianClick={handleTechnicianClick} />
              </div>

              {/* Right Column - Review Queue */}
              <div>
                <ReviewQueue key={refreshKey} onItemClick={handleReviewItemClick} />
              </div>
            </div>
            {/* Supervisor Review Dialog */}
            {reviewDialogOpen && reviewDialogItem && (
              <SupervisorReviewDialog
                isOpen={reviewDialogOpen}
                onClose={() => setReviewDialogOpen(false)}
                taskId={reviewDialogItem.taskId}
                taskOperation={reviewDialogItem.itemDescription}
                technicianName={reviewDialogItem.technicianName}
                jobOrderCode={reviewDialogItem.jobTitle}
                inspectionId={reviewDialogItem.inspectionId}
                onReviewSubmitted={handleReviewSubmitted}
              />
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header 
        title="Supervisor Dashboard" 
        subtitle="Manage and oversee all operations"
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Content with scrolling */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">
        {renderView()}
      </div>
    </div>
  );
};
