import React, { useState } from 'react';
import { X, Flag, Save } from 'lucide-react';

interface ReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string | null;
  type: 'task' | 'device';
}

export const ReviewDrawer: React.FC<ReviewDrawerProps> = ({ isOpen, onClose, submissionId, type: _type }) => {
  const [reviewType, setReviewType] = useState<'performance' | 'quality' | 'delay' | 'general'>('general');
  const [note, setNote] = useState('');
  const [flagForQA, setFlagForQA] = useState(false);
  const [issueType, setIssueType] = useState<string>('');

  const handleSubmit = () => {
    console.log('Review submitted:', { reviewType, note, flagForQA, issueType, submissionId });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Transparent backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col border-l-4 border-blue-600">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Write Supervisor Review</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Review Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Review Type</label>
            <div className="grid grid-cols-2 gap-3">
              {(['performance', 'quality', 'delay', 'general'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setReviewType(t)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition ${ reviewType === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 hover:border-gray-400' }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Review Note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Review Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={8}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter detailed review notes, observations, and feedback..."
            />
          </div>

          {/* Flag for QA */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="flagQA"
                checked={flagForQA}
                onChange={(e) => setFlagForQA(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="flagQA" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Flag className="w-4 h-4 text-red-500" />
                Flag this item for QA validation
              </label>
            </div>

            {flagForQA && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select issue type</option>
                  <option value="rework-needed">Rework Needed</option>
                  <option value="incomplete-data">Incomplete Data</option>
                  <option value="delay">Delay/Timeline Issue</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!note.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Review
          </button>
        </div>
      </div>
    </>
  );
};