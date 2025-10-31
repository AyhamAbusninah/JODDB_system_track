import React from 'react';
import { type JobOrder } from '../types/types';

interface JobItemProps {
  job: JobOrder;
  onSelect: (jobId: string) => void;
  isActive: boolean;
}

export const JobItem: React.FC<JobItemProps> = ({ job, onSelect, isActive }) => {
  return (
    <div
      className={`p-4 border-b border-gray-200 cursor-pointer ${
        isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
      }`}
      onClick={() => onSelect(job.id)}
    >
      <h3 className="text-sm font-semibold text-gray-800">{job.title}</h3>
      <p className="text-xs text-gray-600 mt-1">{job.id}</p>
      <div className="mt-2">
        <span
          className={`inline-block px-2 py-1 text-xs font-medium rounded ${ job.status === 'Completed' ? 'bg-green-100 text-green-800' : job.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800' }`}
        >
          {job.status}
        </span>
      </div>
    </div>
  );
};