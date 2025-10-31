import React, { useState, useMemo } from 'react';
import { Search, CheckCircle, TrendingUp, Calendar, User } from 'lucide-react';
import { api, type Task } from '../../services/api';
import { InspectionDialog } from './InspectionDialog';

interface TaskInspectionPanelProps {
  tasks: Task[];
  onInspect: (taskId: string, decision: 'accepted' | 'rejected', comments: string) => Promise<void>;
}

type SortField = 'efficiency' | 'end_time' | 'operation_name';
type SortDirection = 'asc' | 'desc';

export const TaskInspectionPanel: React.FC<TaskInspectionPanelProps> = ({ tasks, onInspect }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('end_time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [users, setUsers] = useState<any[]>([]);
  const [jobOrders, setJobOrders] = useState<any[]>([]);

  // Fetch additional data for enrichment
  React.useEffect(() => {
    const fetchEnrichmentData = async () => {
      try {
        const [usersData, jobOrdersData] = await Promise.all([
          api.users.getUsers(),
          api.jobOrders.getJobOrders(),
        ]);
        setUsers(usersData);
        setJobOrders(jobOrdersData);
      } catch (error) {
        console.error('Error fetching enrichment data:', error);
      }
    };
    fetchEnrichmentData();
  }, []);

  // Filter tasks ready for QA inspection
  const inspectableTasks = useMemo(() => {
    // Tasks that are pending QA approval
    return tasks.filter(t => 
      t.status === 'pending_qa'
    );
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let result = inspectableTasks;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => {
        const tech = users.find(u => u.id === task.technician);
        const techName = tech ? (tech.full_name || tech.username) : '';
        const jobOrder = jobOrders.find(jo => jo.id === task.job_order);
        const jobCode = jobOrder ? jobOrder.order_code : '';
        
        return (
          task.operation_name?.toLowerCase().includes(query) ||
          task.device_serial?.toLowerCase().includes(query) ||
          techName.toLowerCase().includes(query) ||
          jobCode.toLowerCase().includes(query) ||
          task.id.toString().includes(query)
        );
      });
    }

    // Sort
    result = [...result].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'efficiency':
          aVal = a.efficiency || 0;
          bVal = b.efficiency || 0;
          break;
        case 'end_time':
          aVal = a.end_time ? new Date(a.end_time).getTime() : 0;
          bVal = b.end_time ? new Date(b.end_time).getTime() : 0;
          break;
        case 'operation_name':
          aVal = a.operation_name || '';
          bVal = b.operation_name || '';
          break;
        default:
          return 0;
      }

      const comparison = typeof aVal === 'string' 
        ? aVal.localeCompare(bVal) 
        : aVal - bVal;

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [inspectableTasks, searchQuery, sortField, sortDirection, users, jobOrders]);

  const handleInspectClick = (task: Task) => {
    setSelectedTask(task);
    setShowDialog(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getEfficiencyColor = (efficiency: number | undefined | null) => {
    if (!efficiency) return 'text-gray-400';
    if (efficiency >= 100) return 'text-green-600';
    if (efficiency >= 80) return 'text-blue-600';
    if (efficiency >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyBg = (efficiency: number | undefined | null) => {
    if (!efficiency) return 'bg-gray-50';
    if (efficiency >= 100) return 'bg-green-50';
    if (efficiency >= 80) return 'bg-blue-50';
    if (efficiency >= 60) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getTechnicianName = (technicianId: number | undefined | null) => {
    if (!technicianId) return 'Unassigned';
    const user = users.find(u => u.id === technicianId);
    return user ? (user.full_name || user.username) : `Tech ${technicianId}`;
  };

  const getJobOrderCode = (jobOrderId: number | undefined | null) => {
    if (!jobOrderId) return 'N/A';
    const jobOrder = jobOrders.find(jo => jo.id === jobOrderId);
    return jobOrder ? jobOrder.order_code : `JO-${jobOrderId}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Pending Inspection</div>
          <div className="text-2xl font-bold text-blue-600">{filteredTasks.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Avg. Efficiency</div>
          <div className="text-2xl font-bold text-gray-800">
            {filteredTasks.length > 0
              ? Math.round(
                  filteredTasks.reduce((sum, t) => sum + (t.efficiency || 0), 0) / filteredTasks.length
                )
              : 0}%
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">High Efficiency</div>
          <div className="text-2xl font-bold text-green-600">
            {filteredTasks.filter(t => (t.efficiency || 0) >= 100).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Low Efficiency</div>
          <div className="text-2xl font-bold text-red-600">
            {filteredTasks.filter(t => (t.efficiency || 0) < 60).length}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by task ID, operation, technician, job order, device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Task ID
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('operation_name')}
                >
                  <div className="flex items-center gap-1">
                    Operation & Device
                    {sortField === 'operation_name' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Job Order
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Technician
                </th>
                <th 
                  className="px-4 py-3 text-center text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('efficiency')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Efficiency
                    {sortField === 'efficiency' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('end_time')}
                >
                  <div className="flex items-center gap-1">
                    Completed
                    {sortField === 'end_time' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="w-12 h-12 text-gray-300" />
                      <div className="text-lg font-medium">No tasks available for inspection</div>
                      <div className="text-sm">All tasks have been inspected or none are ready for QA</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const efficiency = task.efficiency || 0;
                  const techName = getTechnicianName(task.technician);
                  const jobCode = getJobOrderCode(task.job_order);
                  
                  return (
                    <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm font-semibold text-blue-600">
                          #{task.id}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-800">{task.operation_name || 'N/A'}</div>
                          <div className="text-xs text-gray-500 mt-0.5 font-mono">
                            {task.device_serial || `Device #${task.device}`}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-sm text-gray-700">{jobCode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{techName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <div className={`px-3 py-1 rounded-full ${getEfficiencyBg(efficiency)}`}>
                            <div className="flex items-center gap-1">
                              <TrendingUp className={`w-4 h-4 ${getEfficiencyColor(efficiency)}`} />
                              <span className={`font-semibold text-sm ${getEfficiencyColor(efficiency)}`}>
                                {efficiency > 0 ? `${Math.round(efficiency)}%` : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {task.end_time 
                            ? new Date(task.end_time).toLocaleDateString() 
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === 'pending_qa' ? 'bg-yellow-100 text-yellow-800' :
                          task.status === 'qa_approved' ? 'bg-green-100 text-green-800' :
                          task.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleInspectClick(task)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm shadow-sm hover:shadow-md"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Summary */}
      {filteredTasks.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} ready for inspection
        </div>
      )}

      {/* Inspection Dialog */}
      {showDialog && selectedTask && (
        <InspectionDialog
          isOpen={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          technicianName={getTechnicianName(selectedTask.technician)}
          jobOrderCode={getJobOrderCode(selectedTask.job_order)}
          onSubmit={onInspect}
        />
      )}
    </div>
  );
};
