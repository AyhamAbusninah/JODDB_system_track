import React, { useState, useMemo } from 'react';
import { type QAInspection } from '../../types';
import { Search } from 'lucide-react';

interface InspectionHistoryProps {
  inspections: QAInspection[];
}

export const InspectionHistory: React.FC<InspectionHistoryProps> = ({ inspections }) => {
  const [filter, setFilter] = useState<'all' | 'accepted' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInspections = useMemo(() => {
    let result = filter === 'all'
      ? inspections
      : inspections.filter(i => i.decision === filter);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inspection =>
        inspection.deviceSerial.toLowerCase().includes(query) ||
        inspection.jobOrderCode.toLowerCase().includes(query) ||
        inspection.technicianName.toLowerCase().includes(query) ||
        inspection.operationName.toLowerCase().includes(query) ||
        inspection.comments.toLowerCase().includes(query)
      );
    }

    return result;
  }, [inspections, filter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search inspections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'accepted', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Device/Job Order</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Technician</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Operation</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Decision</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Comments</th>
              </tr>
            </thead>
            <tbody>
              {filteredInspections.map(inspection => (
                <tr key={inspection.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{inspection.inspectedAt}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-mono">{inspection.deviceSerial}</div>
                    <div className="text-xs text-gray-500">{inspection.jobOrderCode}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{inspection.technicianName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{inspection.operationName}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${ inspection.decision === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}>
                      {inspection.decision}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{inspection.comments}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
