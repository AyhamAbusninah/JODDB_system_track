import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { type JobOrder } from '../types';
import { initialJobOrders } from '../data/mockData';
import { Header } from '../components/Header';
import { JobOrdersView } from '../components/JobOrdersView';

export const JobsPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobOrders, setJobOrders] = useState<JobOrder[]>(initialJobOrders);

  const handleLogout = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleUpdateJob = useCallback((jobId: string, details: Partial<JobOrder>) => {
    setJobOrders(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId
          ? { ...job, ...details }
          : job
      )
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        title="Job Orders" 
        subtitle="Manage and track job orders"
        onLogout={handleLogout} 
      />
      <main className="h-[calc(100vh-65px)]">
        <JobOrdersView jobOrders={jobOrders} onUpdateJob={handleUpdateJob} />
      </main>
    </div>
  );
};
