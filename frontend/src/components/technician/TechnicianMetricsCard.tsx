import React, { useState, useEffect } from 'react';
import { api, type TechnicianMetrics } from '../../services/api';
import { TrendingUp, CheckCircle, Activity } from 'lucide-react';

interface TechnicianMetricsCardProps {
  technicianId: number;
}

/**
 * Technician Metrics Card - Daily performance overview
 * Shows productivity, efficiency, and task completion stats
 */
export const TechnicianMetricsCard: React.FC<TechnicianMetricsCardProps> = ({ technicianId }) => {
  const [metrics, setMetrics] = useState<TechnicianMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const data = await api.metrics.getTechnicianMetrics(technicianId, today);
        setMetrics(data);
      } catch (err: any) {
        console.error('Failed to fetch metrics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [technicianId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <p className="text-sm text-gray-500 text-center">Metrics unavailable</p>
      </div>
    );
  }

  const getEfficiencyColor = (value: number) => {
    if (value >= 90) return 'text-green-600';
    if (value >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Calculate derived metrics from API response
  const efficiencyPercent = (metrics as any).efficiency || 0;
  const tasksCompleted = (metrics as any).tasks_completed || 0;
  const productivityPercent = (metrics as any).productivity || 0;
  const utilizationPercent = (metrics as any).utilization || 0;

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-lg border-2 border-blue-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Today's Performance
        </h3>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Efficiency */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase">Efficiency</span>
            </div>
            <div className={`text-2xl font-bold ${getEfficiencyColor(efficiencyPercent)}`}>
              {efficiencyPercent.toFixed(1)}%
            </div>
          </div>

          {/* Tasks Completed */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase">Completed</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {tasksCompleted}
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {/* Productivity */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Productivity</div>
            <div className="text-lg font-bold text-gray-800">
              {productivityPercent.toFixed(1)}%
            </div>
          </div>

          {/* Utilization */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-1">Utilization</div>
            <div className="text-lg font-bold text-gray-800">
              {utilizationPercent.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Technician Name */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{metrics.technician_name}</span>
          </p>
        </div>
      </div>
    </div>
  );
};
