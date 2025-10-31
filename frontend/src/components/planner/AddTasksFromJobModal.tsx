import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { api, type Process } from '../../services/api';

interface AddTasksFromJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobOrderId: number;
  jobId: number;
  onSuccess?: () => void;
}

export const AddTasksFromJobModal: React.FC<AddTasksFromJobModalProps> = ({ 
  isOpen, 
  onClose, 
  jobOrderId, 
  jobId,
  onSuccess 
}) => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcesses, setSelectedProcesses] = useState<Set<number>>(new Set());
  const [deviceSerials, setDeviceSerials] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch processes when modal opens
  useEffect(() => {
    if (isOpen && jobId) {
      fetchProcesses();
    }
  }, [isOpen, jobId]);

  const fetchProcesses = async () => {
    setLoadingProcesses(true);
    try {
      const processesData = await api.processes.getProcesses(jobId);
      setProcesses(processesData);
    } catch (err) {
      console.error('Failed to fetch processes:', err);
      setError('Failed to load job processes');
    } finally {
      setLoadingProcesses(false);
    }
  };

  const handleProcessToggle = (processId: number) => {
    setSelectedProcesses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(processId)) {
        newSet.delete(processId);
      } else {
        newSet.add(processId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedProcesses.size === processes.length) {
      setSelectedProcesses(new Set());
    } else {
      setSelectedProcesses(new Set(processes.map(p => p.id)));
    }
  };

  const parseDeviceSerials = (input: string): string[] => {
    // Split by comma, newline, or semicolon and trim whitespace
    return input
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const validateForm = (): string | null => {
    if (selectedProcesses.size === 0) return 'Please select at least one process';
    if (!deviceSerials.trim()) return 'Please enter device serial numbers';
    
    const serials = parseDeviceSerials(deviceSerials);
    if (serials.length === 0) return 'Please enter at least one valid device serial number';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const serials = parseDeviceSerials(deviceSerials);
      
      // Create tasks for each device and each selected process
      const taskPromises: Promise<any>[] = [];
      
      for (const serial of serials) {
        for (const processId of selectedProcesses) {
          const process = processes.find(p => p.id === processId);
          if (!process) continue;

          const taskData = {
            job_order: jobOrderId,
            process: processId,
            device_serial: serial,
            task_type: process.task_type,
            operation_name: process.operation_name,
            estimated_time: process.standard_time_seconds,
          };

          taskPromises.push(api.tasks.createTask(taskData));
        }
      }

      console.log(`Creating ${taskPromises.length} tasks...`);
      await Promise.all(taskPromises);

      console.log('All tasks created successfully');
      setSuccess(true);
      
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error('Failed to create tasks:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create tasks';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const serials = parseDeviceSerials(deviceSerials);
  const totalTasksToCreate = selectedProcesses.size * serials.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-in-out scale-95 hover:scale-100">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Add Tasks from Job Template</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center space-x-3">
              <CheckCircle className="w-5 h-5" />
              <span>Tasks created successfully!</span>
            </div>
          )}

          {/* Device Serial Numbers Input */}
          <div>
            <label htmlFor="deviceSerials" className="block text-sm font-medium text-gray-700 mb-2">
              Device Serial Numbers
            </label>
            <textarea
              id="deviceSerials"
              value={deviceSerials}
              onChange={(e) => setDeviceSerials(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono text-sm"
              placeholder="Enter device serials (one per line or comma-separated)&#10;Example:&#10;DEV-001&#10;DEV-002&#10;DEV-003"
            />
            {serials.length > 0 && (
              <p className="mt-1 text-sm text-gray-600">
                {serials.length} device{serials.length > 1 ? 's' : ''} entered
              </p>
            )}
          </div>

          {/* Process Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Processes ({selectedProcesses.size} of {processes.length} selected)
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {selectedProcesses.size === processes.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {loadingProcesses ? (
              <div className="text-center py-8 text-gray-500">Loading processes...</div>
            ) : (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="w-12 px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedProcesses.size === processes.length && processes.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Operation Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                          Standard Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {processes.map((process) => (
                        <tr 
                          key={process.id}
                          className={`hover:bg-gray-50 cursor-pointer ${selectedProcesses.has(process.id) ? 'bg-blue-50' : ''}`}
                          onClick={() => handleProcessToggle(process.id)}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedProcesses.has(process.id)}
                              onChange={() => handleProcessToggle(process.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {process.operation_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              process.task_type === 'quality' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {process.task_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {Math.floor(process.standard_time_seconds / 60)}m {process.standard_time_seconds % 60}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          {totalTasksToCreate > 0 && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
              <p className="font-medium">
                {totalTasksToCreate} task{totalTasksToCreate > 1 ? 's' : ''} will be created:
              </p>
              <p className="text-sm mt-1">
                {serials.length} device{serials.length > 1 ? 's' : ''} × {selectedProcesses.size} process{selectedProcesses.size > 1 ? 'es' : ''}
              </p>
            </div>
          )}

          <div className="pt-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition flex items-center"
              disabled={loading || success || selectedProcesses.size === 0 || serials.length === 0}
            >
              <Plus className="w-5 h-5 mr-2" />
              {loading ? `Creating ${totalTasksToCreate} Tasks...` : `Add ${totalTasksToCreate} Tasks`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
