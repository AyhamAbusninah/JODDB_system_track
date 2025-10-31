import React, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { SupervisorDashboard } from '../components/supervisor/SupervisorDashboard';
import { PlannerDashboard } from '../components/planner/PlannerDashboard';
import { QADashboard } from '../components/qa/QADashboard';

import { TestTechnicianDashboard } from '../components/test-technician/TestTechnicianDashboard';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Handle navigation based on user role - redirect to dedicated pages
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    // Redirect to role-specific pages for better UX
    switch (user.role) {
      case 'technician':
        navigate('/technician', { replace: true });
        break;
      case 'quality':
        navigate('/quality', { replace: true });
        break;
      case 'planning':
        navigate('/planner', { replace: true });
        break;
      case 'supervisor':
        navigate('/supervisor', { replace: true });
        break;
      case 'tester':
        navigate('/tester', { replace: true });
        break;
      case 'test_technician':
        navigate('/test-technician', { replace: true });
        break;
      default:
        // Stay on dashboard for unknown roles
        break;
    }
  }, [user, navigate]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  // No local job state on this page; role dashboards handle their own data

  // Return null if user is not authenticated (will redirect via useEffect)
  if (!user) {
    return null;
  }

  // Render different dashboard content based on user role
  const renderDashboardContent = () => {
    switch (user.role) {
      case 'supervisor':
        return <SupervisorDashboard />;
      
      case 'planning':
        return <PlannerDashboard />;
      
      case 'quality':
        return <QADashboard />;
      
      case 'test_technician':
        return <TestTechnicianDashboard />;
      
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        title="Dashboard" 
        subtitle="Welcome back"
        onLogout={handleLogout} 
      />
      {renderDashboardContent()}
    </div>
  );
};