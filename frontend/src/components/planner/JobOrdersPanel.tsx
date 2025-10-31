import React, { useState } from 'react';
import { Calendar, AlertCircle, CheckCircle, Package } from 'lucide-react';
import { type PlannerJobOrder } from '../../types';

interface JobOrdersPanelProps {
  jobs: PlannerJobOrder[];
  onJobClick: (jobId: string) => void;
  loading?: boolean;
}

export const JobOrdersPanel: React.FC<JobOrdersPanelProps> = ({ jobs, onJobClick, loading = false }) => {
  const [filter] = useState<'all' | 'active' | 'completed' | 'overdue'>('all');

  const filteredJobs = filter === 'all' ? jobs : jobs.filter(job => job.status === filter);

  const getStatusColor = (status: string, efficiency: number) => {
    if (status === 'overdue') return 'border-red-500 bg-red-50';
    if (status === 'completed') return 'border-green-500 bg-green-50';
    if (efficiency < 75) return 'border-yellow-500 bg-yellow-50';
    return 'border-blue-500 bg-blue-50';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'active': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'at-risk': 'bg-yellow-100 text-yellow-800',
      'archived': 'bg-gray-100 text-gray-800',
    };
    return badges[status as keyof typeof badges] || badges.active;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Active Job Orders</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-3 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-10 w-24 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Active Job Orders</h2>
      {jobs.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No job orders found</p>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => (
            <div
              key={job.id}
              onClick={() => onJobClick(job.id)}
              className={`p-4 rounded-lg border-l-4 cursor-pointer transition hover:shadow-md ${getStatusColor(job.status, job.efficiency)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{job.title}</h3>
                  <p className="text-xs text-gray-600 font-mono">{job.code}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                  {job.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-bold text-gray-800">{job.progressPercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${job.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{job.devicesCompleted}/{job.totalDevices}</span>
                </div>
                <div className="flex items-center gap-1">
                  {job.efficiency >= 80 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-gray-600">{job.efficiency}% eff</span>
                </div>
              </div>

              {/* Due Date */}
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Calendar className="w-3 h-3" />
                <span>Due: {job.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
