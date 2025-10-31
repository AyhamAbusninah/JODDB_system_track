import React, { useState, useMemo } from 'react';
import { Search, Filter } from 'lucide-react';
import { Dialog } from './Dialog.tsx';
import { type Task } from '../types/types';

interface TaskSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  tasks: Task[];
  onConfirm: (selectedTaskIds: string[]) => void;
  currentlySelectedTaskId?: string | null;
}

export const TaskSelectionDialog: React.FC<TaskSelectionDialogProps> = ({
  isOpen,
  onClose,
  jobTitle,
  tasks,
  onConfirm,
  currentlySelectedTaskId
}) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [technicianFilter, setTechnicianFilter] = useState<string>('All');

  // Initialize with current selection when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      console.log('Dialog opened with currentlySelectedTaskId:', currentlySelectedTaskId);
      if (currentlySelectedTaskId) {
        setSelectedTaskIds(new Set([currentlySelectedTaskId]));
      } else {
        setSelectedTaskIds(new Set());
      }
      setSearchQuery('');
      setStatusFilter('All');
      setTechnicianFilter('All');
    }
  }, [isOpen, currentlySelectedTaskId]);

  // Get unique technicians and statuses for filters
  const uniqueTechnicians = useMemo(() => {
    const technicians = new Set(tasks.map(t => t.technician));
    return ['All', ...Array.from(technicians)];
  }, [tasks]);

  const uniqueStatuses = useMemo(() => {
    return ['All', 'Pending', 'In Progress', 'Completed', 'On Hold'];
  }, []);

  // Filter tasks based on search and filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      const matchesSearch = searchQuery.trim() === '' ||
        task.operationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.deviceSerial.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.technician.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.id.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'All' || task.status === statusFilter;

      // Technician filter
      const matchesTechnician = technicianFilter === 'All' || task.technician === technicianFilter;

      return matchesSearch && matchesStatus && matchesTechnician;
    });
  }, [tasks, searchQuery, statusFilter, technicianFilter]);

  // Toggle task selection (single selection only)
  const toggleTask = (taskId: string) => {
    setSelectedTaskIds(prev => {
      // If clicking the already selected task, keep it selected (don't deselect)
      if (prev.has(taskId)) {
        return prev; // Keep the selection
      }
      // Otherwise, select only this task
      return new Set([taskId]);
    });
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedTaskIds(new Set());
  };

  // Handle confirm
  const handleConfirm = () => {
    onConfirm(Array.from(selectedTaskIds));
    onClose();
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'On Hold':
        return 'bg-red-100 text-red-800';
      case 'Pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Dialog 
      title={`Select a Task for Job: ${jobTitle}`} 
      isOpen={isOpen} 
      onClose={onClose} 
      className="max-w-5xl!"
    >
      <div className="space-y-4">
        {/* Search and Filters Row */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tasks by operation, device serial, technician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Technician Filter */}
          <div className="w-full md:w-40">
            <select
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {uniqueTechnicians.map(tech => (
                <option key={tech} value={tech}>{tech}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="flex justify-between items-center border-b pb-3">
          <div className="text-sm text-gray-600">
            {selectedTaskIds.size > 0 ? (
              <span><span className="font-semibold">1 task</span> selected</span>
            ) : (
              <span>No task selected</span>
            )}
            {filteredTasks.length !== tasks.length && (
              <span className="ml-2 text-gray-500">
                ({tasks.length} total)
              </span>
            )}
          </div>
          {selectedTaskIds.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={deselectAll}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>

        {/* Task List */}
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No tasks found matching your criteria</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="w-12 px-4 py-3 text-left">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Task ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Operation
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Device Serial
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Technician
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map(task => {
                  const isSelected = selectedTaskIds.has(task.id);
                  return (
                    <tr
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`cursor-pointer ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <input
                            type="radio"
                            checked={isSelected}
                            onChange={() => toggleTask(task.id)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {task.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {task.operationName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                        {task.deviceSerial}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {task.technician}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-300 transition duration-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedTaskIds.size === 0}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {selectedTaskIds.size > 0 ? 'Start Working on This Task' : 'Select a Task'}
          </button>
        </div>
      </div>
    </Dialog>
  );
};