import React, { useState, useMemo, useEffect } from 'react';
import { Eye, AlertCircle, Search } from 'lucide-react';
import { api, type Inspection, type Task } from '../../services/api';
import { QAReviewDialog } from './QAReviewDialog';

interface EnrichedInspection extends Inspection {
  task_details?: Task;
  inspector_name?: string;
  technician_name?: string;
  device_serial?: string;
  job_order_code?: string;
  operation_name?: string;
  supervisor_reviewed?: boolean;
  supervisor_decision?: 'accepted' | 'rejected';
}

export const QAReviewQueue: React.FC = () => {
  const [inspections, setInspections] = useState<EnrichedInspection[]>([]);
  const [selectedReview, setSelectedReview] = useState<EnrichedInspection | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [inspectionsData, tasks, jobOrders, users, supervisorReviews] = await Promise.all([
        api.inspections.getInspections(),
        api.tasks.getTasks(),
        api.jobOrders.getJobOrders(),
        api.users.getUsers(),
        api.supervisorReviews.getReviews(),
      ]);

      // Create lookup maps for efficiency
      const taskMap = new Map(tasks.map(t => [t.id, t]));
      const jobOrderMap = new Map(jobOrders.map(jo => [jo.id, jo]));
      const userMap = new Map(users.map(u => [u.id, u]));
      const reviewMap = new Map(supervisorReviews.map(sr => [sr.inspection, sr]));

      // Enrich inspections with related data
      const enriched: EnrichedInspection[] = inspectionsData.map(inspection => {
        const task = taskMap.get(inspection.task);
        const jobOrder = task && task.job_order ? jobOrderMap.get(task.job_order) : undefined;
        const inspector = inspection.inspector ? userMap.get(inspection.inspector) : undefined;
        const technician = task?.technician ? userMap.get(task.technician) : undefined;
        const supervisorReview = reviewMap.get(inspection.id);

        return {
          ...inspection,
          task_details: task,
          inspector_name: inspector?.full_name || inspector?.username || 'Unknown',
          technician_name: technician?.full_name || technician?.username || 'Unassigned',
          device_serial: task?.device_serial || `Device ${inspection.device}`,
          job_order_code: jobOrder?.order_code || 'N/A',
          operation_name: task?.operation_name || 'N/A',
          supervisor_reviewed: !!supervisorReview,
          supervisor_decision: supervisorReview?.decision,
        };
      });

      setInspections(enriched);
    } catch (error) {
      console.error('Error fetching inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = useMemo(() => {
    let result = inspections;

    // Filter by status
    if (filter === 'pending') {
      result = result.filter(r => !r.supervisor_reviewed && r.decision === 'accepted');
    } else if (filter === 'accepted') {
      result = result.filter(r => r.supervisor_reviewed);
    } else if (filter === 'rejected') {
      result = result.filter(r => r.decision === 'rejected');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (review) =>
          review.operation_name?.toLowerCase().includes(query) ||
          review.technician_name?.toLowerCase().includes(query) ||
          review.job_order_code?.toLowerCase().includes(query) ||
          review.device_serial?.toLowerCase().includes(query) ||
          review.inspector_name?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [inspections, filter, searchQuery]);

  const handleReviewClick = (review: EnrichedInspection) => {
    setSelectedReview(review);
    setShowDialog(true);
  };

  const handleApprove = async (inspectionId: number, comments: string) => {
    try {
      await api.supervisorReviews.createReview({
        inspection_id: inspectionId,
        decision: 'accepted',
        comments,
      });
      
      // Refresh the list
      await fetchInspections();
      setShowDialog(false);
      setSelectedReview(null);
    } catch (error) {
      console.error('Error approving inspection:', error);
      alert('Failed to approve inspection. Please try again.');
    }
  };

  const handleReject = async (inspectionId: number, comments: string) => {
    try {
      await api.supervisorReviews.createReview({
        inspection_id: inspectionId,
        decision: 'rejected',
        comments,
      });
      
      // Refresh the list
      await fetchInspections();
      setShowDialog(false);
      setSelectedReview(null);
    } catch (error) {
      console.error('Error rejecting inspection:', error);
      alert('Failed to reject inspection. Please try again.');
    }
  };

  const getQADecisionBadge = (decision: string) => {
    return decision === 'accepted'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getStatusBadge = (inspection: EnrichedInspection) => {
    if (inspection.supervisor_reviewed && inspection.supervisor_decision) {
      return inspection.supervisor_decision === 'accepted'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800';
    }
    if (inspection.decision === 'rejected') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-orange-100 text-orange-800';
  };

  const getStatusText = (inspection: EnrichedInspection) => {
    if (inspection.supervisor_reviewed && inspection.supervisor_decision) {
      return inspection.supervisor_decision === 'accepted'
        ? 'supervisor approved'
        : 'supervisor rejected';
    }
    if (inspection.decision === 'rejected') {
      return 'QA rejected';
    }
    return 'pending supervisor';
  };

  const pendingCount = inspections.filter(
    r => !r.supervisor_reviewed && r.decision === 'accepted'
  ).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="animate-pulse">Loading QA reviews...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search reviews, technicians, inspectors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'accepted', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && (
                <span className="ml-2 px-2 py-0.5 bg-white text-blue-600 rounded-full text-xs">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* QA Reviews Table */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">QA Inspection Reviews</h3>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve/reject QA inspection decisions
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Task Info
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Technician
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  QA Decision
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  QA Inspector
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No QA reviews found
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-800">{review.operation_name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {review.job_order_code} • {review.device_serial}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {review.technician_name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getQADecisionBadge(
                            review.decision
                          )}`}
                        >
                          {review.decision}
                        </span>
                        {review.decision === 'rejected' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{review.inspector_name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          review
                        )}`}
                      >
                        {getStatusText(review)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleReviewClick(review)}
                        className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition font-medium text-sm flex items-center gap-2 ml-auto"
                      >
                        <Eye className="w-4 h-4" />
                        {!review.supervisor_reviewed && review.decision === 'accepted'
                          ? 'Review'
                          : 'View'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Dialog */}
      {showDialog && selectedReview && (
        <QAReviewDialog
          isOpen={showDialog}
          onClose={() => {
            setShowDialog(false);
            setSelectedReview(null);
          }}
          review={selectedReview as any}
          onApprove={(_, comments) => handleApprove(selectedReview.id, comments)}
          onReject={(_, comments) => handleReject(selectedReview.id, comments)}
        />
      )}
    </div>
  );
};
