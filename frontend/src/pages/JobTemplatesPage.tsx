import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, ChevronDown, ChevronRight, Loader2, ArrowLeft, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { api } from '../services/api';
import type { Job } from '../services/api';

// Interface for process form data (used when creating/editing)
interface ProcessFormData {
  id?: number;
  operation_name: string;
  standard_time_seconds: number;
  task_type: 'technician' | 'quality' | 'tester';
  order: number;
}

interface JobFormData {
  id?: number;
  name: string;
  description: string;
  processes: ProcessFormData[];
}

export const JobTemplatesPage: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobFormData | null>(null);
  const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const fetchedJobs = await api.jobs.getJobs();
      setJobs(fetchedJobs);
      setError(null);
    } catch (err) {
      setError('Failed to fetch job templates.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleToggleExpand = (jobId: number) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const handleAddNewJob = () => {
    setEditingJob({
      name: '',
      description: '',
      processes: [
        {
          operation_name: '',
          standard_time_seconds: 60,
          task_type: 'technician',
          order: 1,
        }
      ],
    });
    setIsModalOpen(true);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob({
      id: job.id,
      name: job.name,
      description: job.description || '',
      processes: job.processes.map(p => ({
        id: p.id,
        operation_name: p.operation_name,
        standard_time_seconds: p.standard_time_seconds,
        task_type: p.task_type,
        order: p.order,
      })),
    });
    setIsModalOpen(true);
  };

  const handleDeleteJob = async (jobId: number) => {
    if (window.confirm('Are you sure you want to delete this job template? This action cannot be undone.')) {
      try {
        await api.jobs.deleteJob(jobId);
        fetchJobs();
      } catch (err) {
        setError('Failed to delete job template.');
        console.error(err);
      }
    }
  };

  const handleSaveJob = async () => {
    if (!editingJob || !editingJob.name) {
      alert('Job name is required.');
      return;
    }

    if (!editingJob.processes || editingJob.processes.length === 0) {
      alert('At least one process is required.');
      return;
    }

    // Validate all processes
    for (const proc of editingJob.processes) {
      if (!proc.operation_name) {
        alert('All processes must have an operation name.');
        return;
      }
      if (proc.standard_time_seconds <= 0) {
        alert('All processes must have a standard time greater than 0.');
        return;
      }
    }

    const jobData = {
      name: editingJob.name,
      description: editingJob.description,
      processes: editingJob.processes.map((p, index) => ({
        operation_name: p.operation_name,
        standard_time_seconds: Number(p.standard_time_seconds),
        task_type: p.task_type,
        order: index + 1,
      })),
    };

    try {
      if (editingJob.id) {
        // Update existing job
        await api.jobs.updateJob(editingJob.id, { 
          name: jobData.name, 
          description: jobData.description 
        });
        
        // For processes, we need to handle create/update/delete
        // This is a simplified version - delete all and recreate
        const existingJob = jobs.find(j => j.id === editingJob.id);
        if (existingJob) {
          // Delete all existing processes
          for (const proc of existingJob.processes) {
            await api.processes.deleteProcess(proc.id);
          }
        }
        
        // Create new processes
        for (const proc of jobData.processes) {
          await api.processes.createProcess({
            job: editingJob.id,
            ...proc,
          });
        }
      } else {
        // Create new job
        console.log('Creating job with data:', jobData);
        await api.jobs.createJob(jobData);
      }
      
      fetchJobs();
      setIsModalOpen(false);
      setEditingJob(null);
    } catch (err: any) {
      console.error('Failed to save job template:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.detail 
        || JSON.stringify(err.response?.data)
        || 'Failed to save job template.';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleProcessChange = (procIndex: number, field: keyof ProcessFormData, value: any) => {
    if (!editingJob) return;

    const updatedProcesses = [...editingJob.processes];
    updatedProcesses[procIndex] = { ...updatedProcesses[procIndex], [field]: value };
    
    setEditingJob({ ...editingJob, processes: updatedProcesses });
  };

  const handleAddProcess = () => {
    if (!editingJob) return;
    const newOrder = editingJob.processes.length + 1;
    const newProcesses = [
      ...editingJob.processes,
      {
        operation_name: '',
        standard_time_seconds: 60,
        task_type: 'technician' as const,
        order: newOrder,
      }
    ];
    setEditingJob({ ...editingJob, processes: newProcesses });
  };

  const handleRemoveProcess = (procIndex: number) => {
    if (!editingJob) return;
    const updatedProcesses = editingJob.processes
      .filter((_, index) => index !== procIndex)
      .map((p, index) => ({ ...p, order: index + 1 }));
    setEditingJob({ ...editingJob, processes: updatedProcesses });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        title="Job Templates"
        subtitle="Manage job templates and their process workflows"
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Action buttons */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate('/planner')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <button
              onClick={handleAddNewJob}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Add New Job
            </button>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Jobs list */}
          {!isLoading && jobs.length === 0 && (
            <div className="bg-white shadow-md rounded-lg p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Job Templates</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first job template.</p>
              <button
                onClick={handleAddNewJob}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Job Template
              </button>
            </div>
          )}

          {!isLoading && jobs.length > 0 && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {jobs.map(job => (
                  <li key={job.id}>
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleToggleExpand(job.id)}
                    >
                      <div className="flex items-center flex-1">
                        {expandedJobs.has(job.id) ? (
                          <ChevronDown className="h-5 w-5 mr-3 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 mr-3 text-gray-500" />
                        )}
                        <Package className="h-6 w-6 text-blue-600 mr-4" />
                        <div className="flex-1">
                          <p className="font-semibold text-lg text-gray-900">{job.name}</p>
                          <p className="text-sm text-gray-500">{job.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {job.processes.length} {job.processes.length === 1 ? 'process' : 'processes'}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditJob(job); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id); }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    {expandedJobs.has(job.id) && (
                      <div className="pl-12 pr-4 pb-4 bg-gray-50 border-t border-gray-200">
                        <h4 className="font-semibold text-md mb-3 pt-4 text-gray-700">Process Workflow:</h4>
                        <div className="space-y-2">
                          {job.processes
                            .sort((a, b) => a.order - b.order)
                            .map((proc) => (
                              <div key={proc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 font-semibold rounded-full text-sm">
                                    {proc.order}
                                  </span>
                                  <div>
                                    <p className="font-medium text-gray-900">{proc.operation_name}</p>
                                    <p className="text-xs text-gray-500">
                                      Type: <span className="font-semibold capitalize">{proc.task_type}</span>
                                    </p>
                                  </div>
                                </div>
                                <div className="text-sm text-gray-600">
                                  <span className="bg-gray-100 px-3 py-1 rounded-full">
                                    ⏱️ {proc.standard_time_seconds}s
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && editingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingJob.id ? 'Edit Job Template' : 'Create New Job Template'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Define the job's name, description, and its sequence of processes.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Job Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., A380 Landing Gear Assembly"
                    value={editingJob.name}
                    onChange={(e) => setEditingJob({ ...editingJob, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* Job Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Job Description
                  </label>
                  <textarea
                    placeholder="Describe the purpose and scope of this job..."
                    value={editingJob.description}
                    onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                  />
                </div>

                {/* Processes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      Processes <span className="text-red-500">*</span>
                    </label>
                    <button
                      onClick={handleAddProcess}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Process
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {editingJob.processes.map((proc, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-gray-700">Process #{index + 1}</span>
                          {editingJob.processes.length > 1 && (
                            <button
                              onClick={() => handleRemoveProcess(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Operation Name */}
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Operation Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Install hydraulic cylinder"
                              value={proc.operation_name}
                              onChange={(e) => handleProcessChange(index, 'operation_name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                            />
                          </div>

                          {/* Standard Time */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Standard Time (seconds) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              placeholder="60"
                              min="1"
                              value={proc.standard_time_seconds}
                              onChange={(e) => handleProcessChange(index, 'standard_time_seconds', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                            />
                          </div>

                          {/* Task Type */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Task Type <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={proc.task_type}
                              onChange={(e) => handleProcessChange(index, 'task_type', e.target.value as ProcessFormData['task_type'])}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                            >
                              <option value="technician">Technician</option>
                              <option value="quality">Quality Inspector</option>
                              <option value="tester">Tester</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveJob}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingJob.id ? 'Update Job' : 'Create Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobTemplatesPage;
