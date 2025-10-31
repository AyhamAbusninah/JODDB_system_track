import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { TestTechnicianDashboard } from '../components/test-technician/TestTechnicianDashboard';

/**
 * Test Technician Page - Testing and quality verification interface
 * Same permissions as Quality Inspector but branded separately
 */
export const TestTechnicianPage: React.FC = () => {
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
        title="Test Technician Dashboard" 
        subtitle="Quality testing and verification"
        onLogout={handleLogout} 
      />
      <main className="container mx-auto py-6 px-4">
        <div className="mb-6 bg-linear-to-r from-purple-500 to-indigo-600 text-white p-4 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold">Test Technician Dashboard</h1>
          <p className="text-purple-100 mt-1">Quality testing and verification interface</p>
        </div>
        <TestTechnicianDashboard />
      </main>
    </div>
  );
};
