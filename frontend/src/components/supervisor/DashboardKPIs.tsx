import React, { useEffect, useState } from 'react';
import { Briefcase, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { api } from '../../services/api';

export const DashboardKPIs: React.FC = () => {
  const [kpis, setKpis] = useState({
    activeJobOrders: 0,
    pendingReviews: 0,
    flaggedForQA: 0,
    avgTeamEfficiency: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);

        // Fetch job orders
        const jobOrders = await api.jobOrders.getJobOrders();
        const activeJobOrders = jobOrders.filter(
          (jo) => jo.status !== 'archived' && jo.status !== 'done'
        ).length;

        // Fetch inspections to count pending supervisor reviews
        const inspections = await api.inspections.getInspections();
        const pendingReviews = inspections.filter(
          (inspection) => inspection.decision === 'accepted'
        ).length;

        // Fetch tasks to count rejected/flagged items
        const tasks = await api.tasks.getTasks();
        const flaggedForQA = tasks.filter(
          (task) => task.status === 'rejected'
        ).length;

        // Calculate average efficiency from tasks with actual time
        const completedTasks = tasks.filter(
          (task) => task.efficiency !== null && task.efficiency !== undefined
        );
        const avgEfficiency =
          completedTasks.length > 0
            ? completedTasks.reduce((sum, task) => sum + (task.efficiency || 0), 0) /
              completedTasks.length
            : 0;

        setKpis({
          activeJobOrders,
          pendingReviews,
          flaggedForQA,
          avgTeamEfficiency: Math.round(avgEfficiency),
        });
      } catch (error) {
        console.error('Error fetching KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Job Orders</p>
            <p className="text-3xl font-bold text-gray-800">{kpis.activeJobOrders}</p>
          </div>
          <Briefcase className="w-10 h-10 text-blue-500 opacity-80" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Pending Reviews</p>
            <p className="text-3xl font-bold text-yellow-600">{kpis.pendingReviews}</p>
          </div>
          <FileText className="w-10 h-10 text-yellow-500 opacity-80" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Flagged for QA</p>
            <p className="text-3xl font-bold text-red-600">{kpis.flaggedForQA}</p>
          </div>
          <AlertTriangle className="w-10 h-10 text-red-500 opacity-80" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Avg Team Efficiency</p>
            <p className="text-3xl font-bold text-green-600">{kpis.avgTeamEfficiency}%</p>
          </div>
          <TrendingUp className="w-10 h-10 text-green-500 opacity-80" />
        </div>
      </div>
    </div>
  );
};
