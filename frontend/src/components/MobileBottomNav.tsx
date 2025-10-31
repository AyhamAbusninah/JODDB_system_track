import React from 'react';
import { Home, ClipboardList, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Mobile Bottom Navigation Bar
 * Provides quick access to Home, Tasks, and Settings on mobile devices
 * Hidden on desktop (md breakpoint and above)
 */
export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const getHomePath = () => {
    const roleRoutes: Record<string, string> = {
      technician: '/technician',
      supervisor: '/supervisor',
      planning: '/planner',
      quality: '/quality',
      test_technician: '/test-technician',
      tester: '/tester',
    };
    return roleRoutes[user.role] || '/dashboard';
  };

  const homePath = getHomePath();
  const isHome = location.pathname === homePath;
  const isSettings = location.pathname === '/settings';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
      <div className="flex items-center justify-around h-16 px-4">
        {/* Home Button */}
        <button
          onClick={() => navigate(homePath)}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isHome ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Home className={`w-6 h-6 ${isHome ? 'fill-current' : ''}`} />
          <span className="text-xs mt-1 font-medium">Home</span>
        </button>

        {/* Tasks Button - Role specific */}
        {user.role === 'technician' && (
          <button
            onClick={() => navigate('/technician')}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ClipboardList className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Tasks</span>
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={() => navigate('/settings')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            isSettings ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className={`w-6 h-6 ${isSettings ? 'fill-current' : ''}`} />
          <span className="text-xs mt-1 font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );
};
