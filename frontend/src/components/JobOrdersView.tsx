import React, { useState, useMemo, useCallback } from 'react';
import { Briefcase, PlusCircle, CheckCircle, Search, ListChecks } from 'lucide-react';
import type { CompletionReportData, JobOrder } from '../types/types';
import { initialJobOrders } from '../data/mockData';
import { JobItem } from './JobItem.tsx';
import { WorkTimingDetailsDialog } from './WorkTimingDetailsDialog.tsx';
import { CompletionReportDialog } from './CompletionReportDialog.tsx';
import { TaskSelectionDialog } from './TaskSelectionDialog.tsx';

interface JobOrdersViewProps {
  jobOrders: JobOrder[];
  onUpdateJob: (jobId: string, details: Partial<JobOrder>) => void;
}

export const JobOrdersView: React.FC<JobOrdersViewProps> = ({ jobOrders, onUpdateJob }) => {
  const [activeJobId, setActiveJobId] = useState<string | null>(initialJobOrders[0]?.id || null);
  const [showWorkTimingDialog, setShowWorkTimingDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showTaskSelectionDialog, setShowTaskSelectionDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasksByJob, setSelectedTasksByJob] = useState<Record<string, string>>({});

  const activeJob = useMemo(() => jobOrders.find(job => job.id === activeJobId), [jobOrders, activeJobId]);
  
  // Get the currently selected task details for the active job
  const selectedTask = useMemo(() => {
    if (activeJobId && selectedTasksByJob[activeJobId] && activeJob?.tasks) {
      return activeJob.tasks.find(t => t.id === selectedTasksByJob[activeJobId]);
    }
    return null;
  }, [selectedTasksByJob, activeJobId, activeJob]);

  // Filter jobs based on search query
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobOrders;
    
    const query = searchQuery.toLowerCase();
    return jobOrders.filter(job =>
      job.id.toLowerCase().includes(query) ||
      job.title.toLowerCase().includes(query) ||
      job.description.toLowerCase().includes(query) ||
      job.status.toLowerCase().includes(query)
    );
  }, [jobOrders, searchQuery]);

  const handleSaveDetails = useCallback((id: string, details: string) => {
    onUpdateJob(id, { detailsOfWork: details, status: 'In Progress' });
  }, [onUpdateJob]);

  const handleCompleteJob = useCallback((id: string, reportData: CompletionReportData) => {
    console.log(`Job ${id} Completed with Report Data:`, reportData);

    onUpdateJob(id, {
      status: 'Completed',
      detailsOfWork: (activeJob?.detailsOfWork || '') +
                     `\n\n--- COMPLETED REPORT ---\n` +
                     `Completed: ${reportData.amountCompleted} devices.\n` +
                     `Work Time: ${reportData.timeFrom} to ${reportData.timeTo}\n` +
                     `Serial Nos: ${reportData.serialNumbers.split('\n').filter(s => s).length} entries.\n` +
                     `Report Notes: ${reportData.reportDetails}`
    });
    const nextJob = jobOrders.find(job => job.status !== 'Completed' && job.id !== id);
    if (nextJob) {
      setActiveJobId(nextJob.id);
    }
  }, [onUpdateJob, activeJob?.detailsOfWork, jobOrders]);

  const handleWorkTimingDetailsClick = useCallback(() => {
    if (activeJob && activeJob.status !== 'Completed') {
      setShowWorkTimingDialog(true);
    }
  }, [activeJob]);

  const handleCompleteReportClick = useCallback(() => {
    if (activeJob && activeJob.status !== 'Completed') {
      setShowReportDialog(true);
    }
  }, [activeJob]);

  const handleTaskSelectionClick = useCallback(() => {
    setShowTaskSelectionDialog(true);
  }, []);

  const handleTaskSelectionConfirm = useCallback((taskIds: string[]) => {
    // Save the selected task for the current job
    if (activeJobId && taskIds.length > 0) {
      console.log('Saving task selection:', { jobId: activeJobId, taskId: taskIds[0] });
      setSelectedTasksByJob(prev => {
        const updated = {
          ...prev,
          [activeJobId]: taskIds[0]
        };
        console.log('Updated selectedTasksByJob:', updated);
        return updated;
      });
    }
  }, [activeJobId]);

  const handleJobSelect = useCallback((selectedJobId: string) => {
    setActiveJobId(selectedJobId);
    // Task selections are now preserved per job, no need to reset
  }, []);

  if (!activeJob) {
    return (
      <div className="p-8 text-center text-gray-600">
        <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-semibold">No Active Job Orders</h2>
        <p>All assigned tasks are currently completed.</p>
      </div>
    );
  }

  const hasTasks = activeJob.tasks && activeJob.tasks.length > 0;

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Job Orders List (Left Panel) */}
      <div className="md:w-1/3 bg-white border-r border-gray-200 shadow-md flex flex-col">
        <h2 className="text-lg font-bold p-4 border-b border-gray-200 bg-gray-50 text-center uppercase tracking-wider flex-shrink-0">JOB ORDERS</h2>
        
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto">
          {filteredJobs.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No jobs found matching "{searchQuery}"
            </div>
          ) : (
            filteredJobs.map(job => (
              <JobItem
                key={job.id}
                job={job}
                onSelect={handleJobSelect}
                isActive={job.id === activeJobId}
              />
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0 space-y-2">
          {hasTasks && (
            <button
              onClick={handleTaskSelectionClick}
              className="w-full px-4 py-3 bg-purple-100 text-purple-800 font-medium rounded-lg shadow-sm hover:bg-purple-200 transition duration-300 transition-colors"
            >
              <ListChecks className="inline w-4 h-4 mr-1.5" />
              Select Task ({activeJob.tasks?.length || 0})
            </button>
          )}
          <button
            onClick={handleWorkTimingDetailsClick}
            disabled={activeJob.status === 'Completed'}
            className="w-full px-4 py-3 bg-blue-100 text-blue-800 font-medium rounded-lg shadow-sm hover:bg-blue-200 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PlusCircle className="inline w-4 h-4 mr-1.5" />
            Add Note
          </button>
        </div>
      </div>

      {/* Job Details and Actions (Right Panel) */}
      <div className="md:w-2/3 bg-gray-50 p-6 flex flex-col justify-between">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{activeJob.title}</h1>
          <p className="text-sm font-medium text-blue-600 mb-4">Job ID: {activeJob.id}</p>

          {selectedTask && (
            <>
              <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-purple-900">
                    Working on Task
                  </h4>
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-purple-200 text-purple-800">
                    {selectedTask.id}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-purple-900">Operation:</span>{' '}
                    <span className="text-purple-800">{selectedTask.operationName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-900">Device Serial:</span>{' '}
                    <span className="text-purple-800 font-mono">{selectedTask.deviceSerial}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-900">Technician:</span>{' '}
                    <span className="text-purple-800">{selectedTask.technician}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-900">Status:</span>{' '}
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${ selectedTask.status === 'Completed' ? 'bg-green-100 text-green-800' : selectedTask.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : selectedTask.status === 'On Hold' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800' }`}>
                      {selectedTask.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-inner border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Task Description</h3>
                <p className="text-gray-600">
                  <span className="font-semibold">{selectedTask.operationName}</span> on device <span className="font-mono">{selectedTask.deviceSerial}</span>
                </p>
              </div>

              <div className="mt-6 bg-white p-6 rounded-lg shadow-inner border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Current Note</h3>
                <div className="min-h-[100px] text-gray-600 whitespace-pre-wrap">
                  {activeJob.detailsOfWork || <span className="text-gray-400 italic">No notes added yet.</span>}
                </div>
              </div>
            </>
          )}

          {!selectedTask && hasTasks && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <ListChecks className="w-12 h-12 mx-auto mb-3 text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Select a Task to Begin</h3>
              <p className="text-blue-700 mb-4">
                This job has {activeJob.tasks?.length || 0} task{(activeJob.tasks?.length || 0) !== 1 ? 's' : ''} available. 
                Please select a task to view details and start working.
              </p>
              <button
                onClick={handleTaskSelectionClick}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 transition duration-300 transition-colors"
              >
                Select a Task
              </button>
            </div>
          )}

          {!selectedTask && !hasTasks && (
            <div className="bg-white p-6 rounded-lg shadow-inner border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Job Description</h3>
              <p className="text-gray-600">{activeJob.description}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-lg">
          <button
            onClick={handleCompleteReportClick}
            disabled={activeJob.status === 'Completed'}
            className="w-full px-8 py-4 bg-gray-300 text-gray-800 font-bold rounded-lg shadow-md hover:bg-gray-400 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider transition-colors"
            type="button"
          >
            <CheckCircle className="inline w-5 h-5 mr-2" />
            Complete Report
          </button>
        </div>
      </div>

      {/* Modals */}
      <WorkTimingDetailsDialog
        isOpen={showWorkTimingDialog}
        onClose={() => setShowWorkTimingDialog(false)}
        jobId={activeJobId || null}
        onSaveDetails={handleSaveDetails}
        currentDetails={activeJob?.detailsOfWork || ''}
      />
      <CompletionReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        jobId={activeJobId || null}
        onComplete={handleCompleteJob}
      />
      {hasTasks && (
        <TaskSelectionDialog
          isOpen={showTaskSelectionDialog}
          onClose={() => setShowTaskSelectionDialog(false)}
          jobTitle={activeJob.title}
          tasks={activeJob.tasks || []}
          onConfirm={handleTaskSelectionConfirm}
          currentlySelectedTaskId={activeJobId ? selectedTasksByJob[activeJobId] : null}
        />
      )}
    </div>
  );
};