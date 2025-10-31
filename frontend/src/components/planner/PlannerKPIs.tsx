import React, { useState, useEffect } from 'react';
import { Briefcase, TrendingUp, Users, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { api, type PlannerStatistics } from '../../services/api';

export const PlannerKPIs: React.FC = () => {
  const [stats, setStats] = useState<PlannerStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.metrics.getPlannerStatistics();
        setStats(data);
      } catch (err: any) {
        console.error('Failed to fetch planner statistics:', err);
        setError(err.message || 'Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-800 text-sm">{error || 'Unable to load statistics'}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Job Orders</p>
            <p className="text-3xl font-bold text-gray-800">{stats.active_job_orders}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.due_this_week} due this week</p>
          </div>
          <Briefcase className="w-10 h-10 text-blue-500 opacity-80" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Avg Productivity</p>
            <p className={`text-3xl font-bold ${stats.avg_productivity >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
              {stats.avg_productivity.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Team average today</p>
          </div>
          <TrendingUp className={`w-10 h-10 ${stats.avg_productivity >= 80 ? 'text-green-500' : 'text-yellow-500'} opacity-80`} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Technicians</p>
            <p className="text-3xl font-bold text-gray-800">{stats.active_technicians}</p>
            <p className="text-xs text-gray-500 mt-1">{stats.technician_utilization.toFixed(0)}% utilization</p>
          </div>
          <Users className="w-10 h-10 text-purple-500 opacity-80" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Overdue Tasks</p>
            <p className={`text-3xl font-bold ${stats.overdue_tasks > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.overdue_tasks}
            </p>
            <p className={`text-xs mt-1 ${stats.overdue_tasks > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.overdue_tasks > 0 ? 'Requires attention' : 'All on track'}
            </p>
          </div>
          <AlertTriangle className={`w-10 h-10 ${stats.overdue_tasks > 0 ? 'text-red-500' : 'text-green-500'} opacity-80`} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Pending Reviews</p>
            <p className={`text-3xl font-bold ${stats.pending_reviews > 0 ? 'text-orange-600' : 'text-gray-800'}`}>
              {stats.pending_reviews}
            </p>
            <p className="text-xs text-gray-500 mt-1">Tasks to review</p>
          </div>
          <ClipboardCheck className="w-10 h-10 text-orange-500 opacity-80" />
        </div>
      </div>
    </div>
  );
};
