import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Dialog } from './Dialog.tsx';
import { type CompletionReportData } from '../types/types';

interface CompletionReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  onComplete: (jobId: string, reportData: CompletionReportData) => void;
}

export const CompletionReportDialog: React.FC<CompletionReportDialogProps> = ({
  isOpen,
  onClose,
  jobId,
  onComplete
}) => {
  const [reportData, setReportData] = useState<CompletionReportData>({
    amountCompleted: 0,
    timeFrom: '',
    timeTo: '',
    reportDetails: '',
    serialNumbers: ''
  });

  const resetForm = () => {
    setReportData({
      amountCompleted: 0,
      timeFrom: '',
      timeTo: '',
      reportDetails: '',
      serialNumbers: ''
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobId && reportData.amountCompleted > 0 && reportData.timeFrom && reportData.timeTo) {
      onComplete(jobId, reportData);
      handleClose();
    }
  };

  const isFormValid = reportData.amountCompleted > 0 && !!reportData.timeFrom && !!reportData.timeTo;

  return (
    <Dialog title="Complete Job Report" isOpen={isOpen} onClose={handleClose} className="!max-w-3xl">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Serial Numbers */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Serial Numbers (one per line)
            </label>
            <textarea
              value={reportData.serialNumbers}
              onChange={(e) => setReportData(prev => ({ ...prev, serialNumbers: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={4}
              placeholder="Enter serial numbers, one per line..."
            />
          </div>

          {/* Amount Completed */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Amount Completed <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={reportData.amountCompleted}
              onChange={(e) => setReportData(prev => ({ ...prev, amountCompleted: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              required
            />
          </div>

          {/* Work Timing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Time From <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={reportData.timeFrom}
                onChange={(e) => setReportData(prev => ({ ...prev, timeFrom: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Time To <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={reportData.timeTo}
                onChange={(e) => setReportData(prev => ({ ...prev, timeTo: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Report Details */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Report Details / Notes
            </label>
            <textarea
              value={reportData.reportDetails}
              onChange={(e) => setReportData(prev => ({ ...prev, reportDetails: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Enter any additional notes or observations..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-300 transition duration-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid}
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Submit Report
          </button>
        </div>
      </form>
    </Dialog>
  );
};