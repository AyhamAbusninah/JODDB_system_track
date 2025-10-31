import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { type JobOrder } from '../../services/api';

interface CreateTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  jobOrder: JobOrder | null;
}

export const CreateTasksModal: React.FC<CreateTasksModalProps> = ({ isOpen, onClose, onSuccess, jobOrder }) => {
  const [formData, setFormData] = useState({
    operation_name: '',
    task_type: 'technician',
    standard_time_seconds: '',
    device_serials: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!jobOrder) return 'No Job Order selected';
    if (!formData.operation_name.trim()) return 'Operation Name is required';
    if (!formData.standard_time_seconds) return 'Standard Time is required';
    if (parseInt(formData.standard_time_seconds) <= 0) return 'Standard Time must be greater than 0';
    if (!formData.device_serials.trim()) return 'At least one device serial is required';
    
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
      const deviceSerials = formData.device_serials
        .split('\n')
        .map(serial => serial.trim())
        .filter(serial => serial.length > 0);

      if (deviceSerials.length === 0) {
        setError('No valid device serials provided');
        setLoading(false);
        return;
      }

      const requestData = {
        job_order: jobOrder!.id,
        operation_name: formData.operation_name.trim(),
        standard_time_seconds: parseInt(formData.standard_time_seconds),
        task_type: formData.task_type,
        device_serials: deviceSerials,
      };

      // This is a placeholder for the actual API call
      // await api.tasks.createTasks(requestData);
      console.log('Creating tasks with data:', requestData);


      setSuccess(true);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error('Failed to create tasks:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-in-out scale-95 hover:scale-100">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Add Tasks to {jobOrder?.order_code}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg flex items-center space-x-3">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
              Tasks created successfully!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1">
              <label htmlFor="operation_name" className="block text-sm font-medium text-gray-700 mb-1">Operation Name</label>
              <input
                type="text"
                id="operation_name"
                value={formData.operation_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., Initial Assembly"
              />
            </div>
            <div className="col-span-1">
              <label htmlFor="task_type" className="block text-sm font-medium text-gray-700 mb-1">Task Type</label>
              <select
                id="task_type"
                value={formData.task_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="technician">Technician</option>
                <option value="quality">Quality</option>
                <option value="tester">Tester</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="standard_time_seconds" className="block text-sm font-medium text-gray-700 mb-1">Standard Time (seconds)</label>
            <input
              type="number"
              id="standard_time_seconds"
              value={formData.standard_time_seconds}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="e.g., 3600"
            />
          </div>

          <div>
            <label htmlFor="device_serials" className="block text-sm font-medium text-gray-700 mb-1">Device Serials (one per line)</label>
            <textarea
              id="device_serials"
              value={formData.device_serials}
              onChange={handleChange}
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="DEV001&#10;DEV002&#10;DEV003"
            />
          </div>

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
              disabled={loading || success}
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Saving...' : 'Create Tasks'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
