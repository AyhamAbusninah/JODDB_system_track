import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, CheckCircle, XCircle, Clock, Award } from 'lucide-react';
import { type QATask } from '../../types';

interface QAAnalyticsProps {
  tasks: QATask[];
}

export const QAAnalytics: React.FC<QAAnalyticsProps> = ({ tasks }) => {
  const analytics = useMemo(() => {
    const total = tasks.length;
    const inspected = tasks.filter(t => t.status === 'done').length;
    const pending = tasks.filter(t => t.status === 'pending_qa').length;
    const accepted = tasks.filter(t => t.qaDecision === 'accepted').length;
    const rejected = tasks.filter(t => t.qaDecision === 'rejected').length;

    const inspectionRate = total > 0 ? (inspected / total) * 100 : 0;
    const acceptanceRate = inspected > 0 ? (accepted / inspected) * 100 : 0;

    // Group by operation
    const byOperation: Record<string, { total: number; accepted: number; rejected: number }> = {};
    tasks.forEach(task => {
      if (!byOperation[task.operationName]) {
        byOperation[task.operationName] = { total: 0, accepted: 0, rejected: 0 };
      }
      byOperation[task.operationName].total++;
      if (task.qaDecision === 'accepted') byOperation[task.operationName].accepted++;
      if (task.qaDecision === 'rejected') byOperation[task.operationName].rejected++;
    });

    return {
      total,
      inspected,
      pending,
      accepted,
      rejected,
      inspectionRate,
      acceptanceRate,
      byOperation,
    };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.total}</p>
            </div>
            <BarChart3 className="w-12 h-12 text-blue-500 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending QA</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.pending}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-500 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Accepted</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.accepted}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.rejected}</p>
            </div>
            <XCircle className="w-12 h-12 text-red-500 opacity-80" />
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Inspection Progress</h3>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Inspected</span>
              <span className="font-semibold text-gray-900">{analytics.inspectionRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${analytics.inspectionRate}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-right">
              {analytics.inspected} of {analytics.total} tasks
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Acceptance Rate</h3>
            <Award className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Accepted</span>
              <span className="font-semibold text-gray-900">{analytics.acceptanceRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${analytics.acceptanceRate}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 text-right">
              {analytics.accepted} accepted, {analytics.rejected} rejected
            </div>
          </div>
        </div>
      </div>

      {/* Operations Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection by Operation Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(analytics.byOperation).map(([operation, stats]) => {
            const acceptanceRate = stats.total > 0 ? (stats.accepted / stats.total) * 100 : 0;
            return (
              <div key={operation} className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 text-sm mb-2">{operation}</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-medium">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Accepted:</span>
                    <span className="font-medium">{stats.accepted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600">Rejected:</span>
                    <span className="font-medium">{stats.rejected}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-700">Rate:</span>
                      <span className={acceptanceRate >= 90 ? 'text-green-600' : acceptanceRate >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                        {acceptanceRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
