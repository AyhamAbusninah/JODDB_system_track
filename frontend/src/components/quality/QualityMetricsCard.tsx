import React from 'react';
import { type Inspection } from '../../services/api';
import { CheckCircle, XCircle, TrendingUp, AlertTriangle } from 'lucide-react';

interface QualityMetricsCardProps {
  inspections: Inspection[];
}

export const QualityMetricsCard: React.FC<QualityMetricsCardProps> = ({ inspections }) => {
  // Calculate metrics
  const totalInspections = inspections.length;
  const acceptedCount = inspections.filter(i => i.decision === 'accepted').length;
  const rejectedCount = inspections.filter(i => i.decision === 'rejected').length;
  const acceptanceRate = totalInspections > 0 ? (acceptedCount / totalInspections) * 100 : 0;

  // Get today's inspections
  const today = new Date().toDateString();
  const todayInspections = inspections.filter(
    i => new Date(i.created_at).toDateString() === today
  );
  const todayAccepted = todayInspections.filter(i => i.decision === 'accepted').length;
  const todayRejected = todayInspections.filter(i => i.decision === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Total Inspections</h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalInspections}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Accepted</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{acceptedCount}</p>
          <p className="text-xs text-gray-500 mt-1">Today: {todayAccepted}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Rejected</h3>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
          <p className="text-xs text-gray-500 mt-1">Today: {todayRejected}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600 uppercase">Acceptance Rate</h3>
            <AlertTriangle className={`w-5 h-5 ${acceptanceRate >= 90 ? 'text-green-600' : 'text-yellow-600'}`} />
          </div>
          <p className={`text-3xl font-bold ${acceptanceRate >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
            {acceptanceRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Inspection Trend</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-400">Chart visualization would go here</p>
        </div>
      </div>
    </div>
  );
};
