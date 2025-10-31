import React from 'react';
import { SupervisorDashboard } from '../components/supervisor/SupervisorDashboard';

export const SupervisorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      <SupervisorDashboard />
    </div>
  );
};
