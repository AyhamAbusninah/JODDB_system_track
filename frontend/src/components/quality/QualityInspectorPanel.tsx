import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, AlertCircle } from 'lucide-react';
import type { Task } from '../../services/api';
import { TaskCard } from './TaskCard';
import { InspectionReviewDialog } from './InspectionReviewDialog';

interface QualityInspectorPanelProps {
  tasks: Task[];
  onInspectionComplete: () => void;
}

type SortField = 'id' | 'efficiency' | 'end_time';
type SortDirection = 'asc' | 'desc';

/**
 * QualityInspectorPanel - Main quality inspector interface
 * Features:
 * - Task list with selection capability
 * - Search and filtering
 * - Sorting by efficiency, time, etc.
 * - Bulk selection actions
 * - Inspection review dialog integration
 */
export const QualityInspectorPanel: React.FC<QualityInspectorPanelProps> = ({
  tasks,
  onInspectionComplete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('end_time');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [inspectionTask, setInspectionTask] = useState<Task | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [filterEfficiency, setFilterEfficiency] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter((task) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        task.id.toString().includes(searchLower) ||
        (task.job_order?.toString() || '').includes(searchLower) ||
        task.operation_name.toLowerCase().includes(searchLower) ||
        (task.device_serial && task.device_serial.toLowerCase().includes(searchLower)) ||
        (task.technician_name && task.technician_name.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // Efficiency filter
      if (filterEfficiency !== 'all' && task.efficiency != null) {
        if (filterEfficiency === 'high' && task.efficiency < 90) return false;
        if (filterEfficiency === 'medium' && (task.efficiency < 75 || task.efficiency >= 90)) return false;
        if (filterEfficiency === 'low' && task.efficiency >= 75) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'efficiency') {
        aValue = a.efficiency ?? -1;
        bValue = b.efficiency ?? -1;
      } else if (sortField === 'end_time') {
        aValue = a.end_time ? new Date(a.end_time).getTime() : 0;
        bValue = b.end_time ? new Date(b.end_time).getTime() : 0;
      } else {
        aValue = a.id;
        bValue = b.id;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tasks, searchQuery, sortField, sortDirection, filterEfficiency]);

  const handleInspectTask = (task: Task) => {
    setInspectionTask(task);
    setShowDialog(true);
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setInspectionTask(null);
  };

  const handleInspectionSubmit = () => {
    handleDialogClose();
    onInspectionComplete();
  };

  const toggleSortField = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Tasks Ready for Inspection</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredAndSortedTasks.length} of {tasks.length} tasks available
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by task ID, job order, operation, device, technician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Efficiency Filter */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
                <Filter className="w-4 h-4" />
                Efficiency: {filterEfficiency === 'all' ? 'All' : filterEfficiency.charAt(0).toUpperCase() + filterEfficiency.slice(1)}
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-0 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-10 py-2">
                {(['all', 'high', 'medium', 'low'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setFilterEfficiency(filter)}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      filterEfficiency === filter
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {filter === 'all' && 'All Efficiency Levels'}
                    {filter === 'high' && '≥90% (High)'}
                    {filter === 'medium' && '75-89% (Medium)'}
                    {filter === 'low' && '<75% (Low)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">
                <Filter className="w-4 h-4" />
                Sort By
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute left-0 mt-0 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-10 py-2">
                {(['id', 'efficiency', 'end_time'] as const).map((field) => (
                  <button
                    key={field}
                    onClick={() => toggleSortField(field)}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${
                      sortField === field
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>
                      {field === 'id' && 'Task ID'}
                      {field === 'efficiency' && 'Efficiency'}
                      {field === 'end_time' && 'Completion Time'}
                    </span>
                    {sortField === field && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters button */}
            {(searchQuery || filterEfficiency !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterEfficiency('all');
                }}
                className="px-3 py-2 text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No tasks to inspect</h3>
          <p className="text-gray-500">
            {tasks.length === 0
              ? 'All completed tasks have been inspected.'
              : 'Try adjusting your filters or search criteria.'}
          </p>
        </div>
      ) : (
        <>
          {/* Task Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-1">
            {filteredAndSortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onInspect={handleInspectTask}
              />
            ))}
          </div>
        </>
      )}

      {/* Inspection Review Dialog */}
      <InspectionReviewDialog
        isOpen={showDialog}
        task={inspectionTask}
        onClose={handleDialogClose}
        onSubmit={handleInspectionSubmit}
      />
    </div>
  );
};
