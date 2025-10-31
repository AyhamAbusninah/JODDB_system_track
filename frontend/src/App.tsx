import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TechnicianPage } from './pages/TechnicianPage';
import { QualityPage } from './pages/QualityPage';
import { TestTechnicianPage } from './pages/TestTechnicianPage';
import { PlannerPage } from './pages/PlannerPage';
import { SupervisorPage } from './pages/SupervisorPage';
import { TesterPage } from './pages/TesterPage';
import { TaskPage } from './pages/TaskPage';
import { JobTemplatesPage } from './pages/JobTemplatesPage';
import "./App.css";
import { SettingsPage } from './pages/SettingsPage';
import { type UserRole } from './types';
import { BackToTop } from './components/BackToTop';
import { MobileBottomNav } from './components/MobileBottomNav';

/**
 * Main Application Component
 * Enhanced with Toast notifications, Back to Top button, and Mobile Navigation
 * Handles routing for all user roles with dedicated pages
 */

// Protected Route Component with Role Validation
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" />;
  }

  if (!allowedRoles.includes(user.role)) {
    console.warn(`User ${user.username} (role: ${user.role}) tried to access restricted page. Allowed roles: ${allowedRoles.join(', ')}`);
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    const roleRoutes: Record<UserRole, string> = {
      technician: '/technician',
      supervisor: '/supervisor',
      planning: '/planner',
      quality: '/quality',
      test_technician: '/test-technician',
      tester: '/tester',
    };

    if (user) {
      const intendedPath = roleRoutes[user.role];
      if (window.location.pathname !== intendedPath) {
        //
      }
    }
  }, [user]);

  return (
    <div className="app-container animate-fadeIn">
      <Router>
        <div className="flex h-screen bg-gray-100">
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Back to Top Button - Global */}
            <BackToTop />
            
            {/* Mobile Bottom Navigation - Shows only on mobile */}
            <MobileBottomNav />
            
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['supervisor', 'planning']}>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/supervisor" element={
                  <ProtectedRoute allowedRoles={['supervisor']}>
                    <SupervisorPage />
                  </ProtectedRoute>
                } 
              />
              {/* Planner Routes */}
              <Route path="/planner" element={
                  <ProtectedRoute allowedRoles={['planning']}>
                    <PlannerPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/jobs" element={
                  <ProtectedRoute allowedRoles={['planning']}>
                    <JobTemplatesPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/technician" element={
                  <ProtectedRoute allowedRoles={['technician']}>
                    <TechnicianPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/quality" element={
                  <ProtectedRoute allowedRoles={['quality']}>
                    <QualityPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/test-technician" element={
                  <ProtectedRoute allowedRoles={['test_technician']}>
                    <TestTechnicianPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/tester" element={
                  <ProtectedRoute allowedRoles={['tester']}>
                    <TesterPage />
                  </ProtectedRoute>
                } 
              />
              {/* Fallback for any other authenticated user */}
              <Route path="/unauthorized" element={
                <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
                  <h1 className="text-4xl font-bold text-red-600">Unauthorized</h1>
                  <p className="text-lg text-gray-700 mt-2">You do not have permission to view this page.</p>
                  <button
                    onClick={() => {
                      logout();
                      window.location.href = '/';
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Go to Login
                  </button>
                </div>
              } />
              <Route path="/tasks" element={
                  <ProtectedRoute allowedRoles={['technician', 'quality', 'supervisor', 'planning', 'test_technician', 'tester']}>
                    <TaskPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="/settings" element={
                  <ProtectedRoute allowedRoles={['technician', 'quality', 'supervisor', 'planning', 'test_technician', 'tester']}>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </main>
        </div>
      </Router>
    </div>
  );
};

export default App;