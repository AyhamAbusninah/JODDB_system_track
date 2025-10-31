import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type User, type UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Failed to restore session:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Clear any existing session first
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      
      const response = await api.auth.login(username, password);
      
      console.log('Login response:', response);
      
      if (response.access && response.refresh && response.user) {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        
        // Map backend user format to frontend User type
        const mappedUser: User = {
          id: String(response.user.id),
          name: response.user.full_name || response.user.username,
          email: response.user.email,
          username: response.user.username,
          role: response.user.role as UserRole
        };
        
        localStorage.setItem('user', JSON.stringify(mappedUser));
        setUser(mappedUser);
        
        console.log('Login successful, user set:', mappedUser);
        return true;
      } else {
        console.error('Invalid login response format:', response);
        return false;
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Ensure state is cleared on login error
      setUser(null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Call backend logout to blacklist token
      await api.auth.logout();
      console.log('Logout successful');
    } catch (err) {
      console.error('Logout error (continuing with local logout):', err);
    } finally {
      // Always clear user state and tokens, even if backend logout fails
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};