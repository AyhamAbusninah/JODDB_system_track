import React, { useState, useEffect } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { api } from '../../services/api';

interface TechnicianPerformanceTableProps {
  onTechnicianClick: (technicianId: string) => void;
}

type SortField = 'name' | 'productivity' | 'average_efficiency' | 'utilization';

interface TechnicianData {
  technician_id: number;
  technician_name: string;
  date: string;
  productivity: number;
  average_efficiency: number;
  utilization: number;
  tasks_completed: number;
  status: 'good' | 'at-risk' | 'low';
}

export const TechnicianPerformanceTable: React.FC<TechnicianPerformanceTableProps> = ({
  onTechnicianClick
}) => {
  const [technicians, setTechnicians] = useState<TechnicianData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('productivity');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      
      // Get all users who are technicians
      const users = await api.users.getUsers();
      const technicianUsers = users.filter(u => u.role === 'technician');
      
      // Fetch metrics for each technician
      const today = new Date().toISOString().split('T')[0];
      const techMetrics = await Promise.all(
        technicianUsers.map(async (tech) => {
          try {
            const metrics = await api.metrics.getTechnicianMetrics(tech.id, today);
            
            // Determine status based on metrics (using average_efficiency from API)
            let status: 'good' | 'at-risk' | 'low' = 'good';
            if (metrics.average_efficiency < 60 || metrics.productivity < 60) {
              status = 'low';
            } else if (metrics.average_efficiency < 75 || metrics.productivity < 75) {
              status = 'at-risk';
            }
            
            return {
              technician_id: Number(tech.id),
              technician_name: tech.full_name || tech.username,
              date: today,
              productivity: metrics.productivity,
              average_efficiency: metrics.average_efficiency,
              utilization: metrics.utilization,
              tasks_completed: metrics.tasks_completed,
              status,
            };
          } catch (error) {
            // If no metrics available for this technician, return default values
            console.warn(`No metrics for technician ${tech.id}`, error);
            return {
              technician_id: Number(tech.id),
              technician_name: tech.full_name || tech.username,
              date: today,
              productivity: 0,
              average_efficiency: 0,
              utilization: 0,
              tasks_completed: 0,
              status: 'good' as const,
            };
          }
        })
      );
      
      // Filter out any technicians with invalid IDs
      const validTechMetrics = techMetrics.filter(t => t.technician_id != null && !isNaN(t.technician_id));
      setTechnicians(validTechMetrics);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const sortedTechnicians = [...technicians].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;
    
    if (sortField === 'name') {
      aVal = a.technician_name || '';
      bVal = b.technician_name || '';
    } else {
      aVal = a[sortField];
      bVal = b[sortField];
    }
    
    const comparison = typeof aVal === 'string' 
      ? aVal.localeCompare(bVal as string) 
      : (aVal as number) - (bVal as number);
    return sortDesc ? -comparison : comparison;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-red-100 text-red-800';
      case 'at-risk': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Technician Performance</h2>
        </div>
        <div className="p-8 text-center text-gray-500">
          <div className="animate-pulse">Loading technicians...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Technician Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <button onClick={() => handleSort('name')} className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900">
                  Technician
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-center">
                <button onClick={() => handleSort('productivity')} className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900 mx-auto">
                  Productivity
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-center">
                <button onClick={() => handleSort('average_efficiency')} className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900 mx-auto">
                  Efficiency
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
              <th className="px-4 py-3 text-center">
                <button onClick={() => handleSort('utilization')} className="flex items-center gap-1 font-semibold text-gray-700 hover:text-gray-900 mx-auto">
                  Utilization
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTechnicians.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No technicians found
                </td>
              </tr>
            )}
            {sortedTechnicians.map(tech => {
              // Safety check for technician_id
              if (!tech.technician_id) return null;
              
              return (
                <tr
                  key={tech.technician_id}
                  onClick={() => onTechnicianClick(tech.technician_id!.toString())}
                  className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                    tech.status === 'low' ? 'bg-red-50' : tech.status === 'at-risk' ? 'bg-yellow-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                        {tech.technician_name ? tech.technician_name.charAt(0) : 'T'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{tech.technician_name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">ID: {tech.technician_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tech.status)}`}>
                      {Math.round(tech.productivity)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-gray-700 font-medium">{Math.round(tech.average_efficiency)}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-gray-700 font-medium">{Math.round(tech.utilization)}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
