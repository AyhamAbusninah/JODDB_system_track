import React, { useState } from 'react';
import { Dialog } from './Dialog.tsx';

interface WorkTimingDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
  onSaveDetails: (jobId: string, details: string) => void;
  currentDetails: string;
}

export const WorkTimingDetailsDialog: React.FC<WorkTimingDetailsDialogProps> = ({ 
  isOpen, 
  onClose, 
  jobId, 
  onSaveDetails, 
  currentDetails 
}) => {
  const [details, setDetails] = useState(currentDetails);

  React.useEffect(() => {
    // Reset state only when the dialog opens
    if (isOpen) {
      setDetails(currentDetails);
    }
  }, [currentDetails, isOpen]);

    const handleSave = () => {
    if (jobId && details.trim()) {
      onSaveDetails(jobId, details);
      setDetails('');
      onClose();
    }
  };

  return (
    <Dialog title="Add Note" isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700" htmlFor="workDetails">
          Intermediate Details for Job ID: {jobId}
        </label>
        <textarea
          id="workDetails"
          rows={6}
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
          placeholder="Log your work progress or timing notes here..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow-md hover:bg-gray-300 transition duration-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!details.trim()}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300 disabled:opacity-50 transition-colors"
          >
            Save Note
          </button>
        </div>
      </div>
    </Dialog>
  );
};