import React, { useMemo } from 'react';
import { ClipboardList, CheckCircle, XCircle, RefreshCw, TrendingUp } from 'lucide-react';

interface QAKPIsProps {
  tasks: any[];
  inspections: any[];
}

export const QAKPIs: React.FC<QAKPIsProps> = ({ tasks, inspections }) => {
  const metrics = useMemo(() => {
    const pendingInspections = tasks.filter((t: any) => t.status === 'pending_qa' || t.status === 'done').length;
    const today = new Date().toISOString().split('T')[0];
    const acceptedToday = inspections.filter((i: any) => 
      i.decision === 'accepted' && i.created_at.startsWith(today)
    ).length;
    const rejectedToday = inspections.filter((i: any) => 
      i.decision === 'rejected' && i.created_at.startsWith(today)
    ).length;
    const reworkTasks = tasks.filter((t: any) => t.status === 'rework_required').length;
    const totalInspected = inspections.length;
    const totalAccepted = inspections.filter((i: any) => i.decision === 'accepted').length;
    const acceptanceRate = totalInspected > 0 ? (totalAccepted / totalInspected) * 100 : 0;

    return {
      pendingInspections,
      acceptedToday,
      rejectedToday,
      reworkTasks,
      acceptanceRate: Math.round(acceptanceRate),
      totalInspected,
    };
  }, [tasks, inspections]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Pending Inspections</p>
            <p className="text-3xl font-bold text-orange-600">{metrics.pendingInspections}</p>
          </div>
          <ClipboardList className="w-10 h-10 text-orange-500 opacity-80" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Accepted Today</p>
            <p className="text-3xl font-bold text-green-600">{metrics.acceptedToday}</p>
          </div>
          <CheckCircle className="w-10 h-10 text-green-500 opacity-80" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Rejected Today</p>
            <p className="text-3xl font-bold text-red-600">{metrics.rejectedToday}</p>
          </div>
          <XCircle className="w-10 h-10 text-red-500 opacity-80" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Rework Tasks</p>
            <p className="text-3xl font-bold text-yellow-600">{metrics.reworkTasks}</p>
          </div>
          <RefreshCw className="w-10 h-10 text-yellow-500 opacity-80" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Acceptance Rate</p>
            <p className="text-3xl font-bold text-blue-600">{metrics.acceptanceRate}%</p>
          </div>
          <TrendingUp className="w-10 h-10 text-blue-500 opacity-80" />
        </div>
      </div>
    </div>
  );
};
