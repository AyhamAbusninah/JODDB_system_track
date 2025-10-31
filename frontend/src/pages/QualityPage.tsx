import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { QADashboard } from '../components/qa/QADashboard';

/**
 * Quality Inspector Page - Inspection and quality control interface
 * Real-time task monitoring and inspection workflows
 */
export const QualityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    } else if (user.role !== 'quality') {
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
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Quality Inspector" 
        subtitle="Inspection and quality control"
        onLogout={handleLogout} 
      />
      <main className="container mx-auto py-6 px-4">
        <QADashboard />
      </main>
    </div>
  );
};
