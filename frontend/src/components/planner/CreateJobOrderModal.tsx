import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { api, type Job } from '../../services/api';

interface CreateJobOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateJobOrderModal: React.FC<CreateJobOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    job: '',
    order_code: '',
    title: '',
    description: '',
    due_date: '',
    total_devices: '',
  });

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Fetch jobs when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchJobs();
    }
  }, [isOpen]);

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const jobsData = await api.jobs.getJobs();
      setJobs(jobsData);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
      setError('Failed to load job templates');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.order_code.trim()) return 'Job Order Code is required';
    if (!formData.title.trim()) return 'Title is required';
    if (!formData.due_date) return 'Due Date is required';
    if (!formData.total_devices) return 'Total Devices is required';
    if (parseInt(formData.total_devices) <= 0) return 'Total Devices must be greater than 0';
    
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
      // Prepare API request data
      const requestData: any = {
        order_code: formData.order_code.trim(),
        title: formData.title.trim(),
        due_date: formData.due_date,
        total_devices: parseInt(formData.total_devices),
      };

      // Add job if selected
      if (formData.job) {
        requestData.job = parseInt(formData.job);
      }

      // Only add optional fields if they have content
      const description = formData.description.trim();
      if (description) {
        requestData.description = description;
      }

      console.log('Sending job order request with data:', requestData);

      // Call API to create job order
      const result = await api.jobOrders.createJobOrder(requestData);

      console.log('Job Order created successfully:', result);
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);

    } catch (err: any) {
      console.error('Failed to create job order:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedJob = jobs.find(j => j.id === parseInt(formData.job));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 ease-in-out scale-95 hover:scale-100">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Create New Job Order</h2>
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
              Job Order created successfully!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1">
              <label htmlFor="order_code" className="block text-sm font-medium text-gray-700 mb-1">Job Order Code</label>
              <input
                type="text"
                id="order_code"
                value={formData.order_code}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., JO-2024-001"
              />
            </div>
            <div className="col-span-1">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., Assemble 500 Units"
              />
            </div>
          </div>

          <div>
            <label htmlFor="job" className="block text-sm font-medium text-gray-700 mb-1">Job Template (Optional)</label>
            <select
              id="job"
              value={formData.job}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              disabled={loadingJobs}
            >
              <option value="">-- No Template (Add tasks manually) --</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.name} ({job.processes.length} processes)
                </option>
              ))}
            </select>
            {selectedJob && (
              <p className="mt-2 text-sm text-gray-600">
                <strong>Template Info:</strong> {selectedJob.description || 'No description available'}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              placeholder="Add any relevant details about the job order..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                id="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label htmlFor="total_devices" className="block text-sm font-medium text-gray-700 mb-1">Total Devices</label>
              <input
                type="number"
                id="total_devices"
                value={formData.total_devices}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., 500"
              />
            </div>
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
              {loading ? 'Saving...' : 'Create Job Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
