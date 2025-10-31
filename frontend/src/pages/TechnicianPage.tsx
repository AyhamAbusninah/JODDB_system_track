import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { TechnicianDashboard } from '../components/technician/TechnicianDashboard';

/**
 * Technician Page - Main entry point for field technician role
 * Provides mobile-optimized task management and reporting
 */
export const TechnicianPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    } else if (user.role !== 'technician') {
      // Redirect to appropriate dashboard if not a technician
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header 
        title="Technician Dashboard" 
        subtitle="Manage your tasks and operations"
        onLogout={handleLogout} 
      />
      <main className="flex-1 overflow-hidden">
        <TechnicianDashboard />
      </main>
    </div>
  );
};
