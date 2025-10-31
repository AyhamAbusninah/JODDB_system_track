import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { TesterDashboard } from '../components/tester/TesterDashboard';

export const TesterPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        title="Tester Dashboard" 
        subtitle="Testing and quality management"
        onLogout={handleLogout} 
      />
      <TesterDashboard />
    </div>
  );
};
