import React, { useState } from 'react';
import { type Inspection } from '../../services/api';
import { CheckCircle, XCircle, Search, Calendar } from 'lucide-react';

interface InspectionHistoryListProps {
  inspections: Inspection[];
}

export const InspectionHistoryList: React.FC<InspectionHistoryListProps> = ({ inspections }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDecision, setFilterDecision] = useState<'all' | 'accepted' | 'rejected'>('all');

  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = searchQuery === '' || 
      inspection.id.toString().includes(searchQuery) ||
      inspection.task.toString().includes(searchQuery);
    
    const matchesFilter = filterDecision === 'all' || inspection.decision === filterDecision;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Search and Filter */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by task or inspection ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {['all', 'accepted', 'rejected'].map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterDecision(filter as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition ${
                filterDecision === filter ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Inspections List */}
      <div className="divide-y divide-gray-100">
        {filteredInspections.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No inspections found</p>
          </div>
        ) : (
          filteredInspections.map((inspection) => (
            <div key={inspection.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${ inspection.decision === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}>
                      {inspection.decision === 'accepted' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {inspection.decision.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      Inspection #{inspection.id}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Task:</span> #{inspection.task}</p>
                    <p><span className="font-medium">Device:</span> #{inspection.device}</p>
                    {inspection.comments && (
                      <p className="mt-2 text-gray-700 italic">"{inspection.comments}"</p>
                    )}
                  </div>
                </div>

                <div className="text-right text-xs text-gray-500">
                  {new Date(inspection.created_at).toLocaleDateString()}
                  <br />
                  {new Date(inspection.created_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
