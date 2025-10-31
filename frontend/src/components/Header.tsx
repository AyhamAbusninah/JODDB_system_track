import React, { useState } from 'react';
import { LogOut, ChevronDown, User, Settings, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  user?: any;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout();
  };

  const handleSettings = () => {
    setShowUserMenu(false);
    navigate('/settings');
  };

  // Enhanced: Clickable logo navigates to role-specific home
  const handleLogoClick = () => {
    if (!authUser) return;
    
    const roleRoutes: Record<string, string> = {
      technician: '/technician',
      supervisor: '/supervisor',
      planning: '/planner',
      quality: '/quality',
      test_technician: '/test-technician',
      tester: '/tester',
    };
    
    const homePath = roleRoutes[authUser.role] || '/dashboard';
    navigate(homePath);
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top section with logo and user menu */}
        <div className="flex items-center justify-between mb-4">
          {/* Enhanced: Clickable Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
            title="Go to Dashboard"
          >
            <div className="text-2xl font-extrabold">
              <span className="text-blue-600 group-hover:text-blue-700 transition-colors">aselsan</span>
              <span className="text-gray-400 font-light text-sm ml-1">Middle East</span>
            </div>
          </button>

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{user?.name || authUser?.username || 'User'}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {/* Enhanced: Dropdown with Help/Support */}
            {showUserMenu && (
              <>
                {/* Click outside to close */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-fadeIn">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogoClick();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    <span>Home</span>
                  </button>
                  <button
                    onClick={handleSettings}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Page title and subtitle */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};