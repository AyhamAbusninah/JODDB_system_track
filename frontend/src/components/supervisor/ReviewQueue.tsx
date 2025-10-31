import React, { useState, useEffect } from 'react';
import { FileText, Package, Clock } from 'lucide-react';
import { api } from '../../services/api';

interface ReviewQueueProps {
  onItemClick: (item: any) => void;
}

interface ReviewItem {
  id: string;
  type: 'device' | 'report';
  itemDescription: string;
  jobTitle: string;
  technicianName: string;
  submittedAt: string;
  priority: 'high' | 'medium' | 'low';
  taskId: number;
  jobId?: string;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ onItemClick }) => {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviewQueue();
    
    // Auto-refresh every 30 seconds to catch new QA completions
    const interval = setInterval(fetchReviewQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchReviewQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch supervisor reviews that are awaiting supervisor review (tester_approved or pending_supervisor tasks)
      const [tasks, jobOrders, users] = await Promise.all([
        api.tasks.getTasks(),
        api.jobOrders.getJobOrders(),
        api.users.getUsers(),
      ]);
      
      console.log('📋 ReviewQueue - Fetched data:', {
        tasksCount: tasks.length,
        testerApprovedCount: tasks.filter(t => t.status === 'tester_approved' || t.status === 'pending_supervisor').length,
        jobOrdersCount: jobOrders.length,
        usersCount: users.length,
      });
      
      // Create lookup maps
      const userMap = new Map(users.map(u => [u.id, u]));
      
      // Filter tasks that are tester_approved or pending_supervisor (awaiting supervisor review)
      const tasksAwaitingReview = tasks.filter(
        task => task.status === 'tester_approved' || task.status === 'pending_supervisor'
      );
      
      console.log('📋 ReviewQueue - Found tester_approved or pending_supervisor tasks:', tasksAwaitingReview.map(t => ({ id: t.id, operation: t.operation_name })));
      console.log('📋 ReviewQueue - Sample task object:', tasksAwaitingReview[0]);
      
      // Convert tasks to review items
      // Note: API returns job_order_code string, not job_order ID
      const reviewItems: ReviewItem[] = tasksAwaitingReview
        .map(task => {
          // Find job order by matching order_code
          const jobOrderCode = (task as any).job_order_code;
          const jobOrder = jobOrders.find(jo => jo.order_code === jobOrderCode);
          const jobOrderId = jobOrder?.id;
          
          console.log(`📋 ReviewQueue - Task ${task.id}: code="${jobOrderCode}" → jobOrderId=${jobOrderId}`);
          
          // Get technician from lookup map using task.technician (ID) if available
          // Otherwise use task.technician_username
          const technicianId = task.technician;
          const technician = technicianId ? userMap.get(technicianId) : null;
          const technicianUsername = (task as any).technician_username;
          
          // Determine priority based on time to approve (newer = higher priority)
          // High priority: Tasks that have been waiting longer (older end_time)
          let priority: 'high' | 'medium' | 'low' = 'medium';
          if (task.end_time) {
            const endTime = new Date(task.end_time).getTime();
            const now = new Date().getTime();
            const hoursWaiting = (now - endTime) / (1000 * 60 * 60);
            
            if (hoursWaiting > 24) {
              priority = 'high'; // Waiting more than 24 hours
            } else if (hoursWaiting < 2) {
              priority = 'low'; // Just finished recently
            }
          }
          
          return {
            id: task.id.toString(),
            type: 'device' as const,
            itemDescription: task.operation_name || 'Task',
            jobTitle: jobOrder?.title || jobOrder?.order_code || jobOrderCode || 'N/A',
            technicianName: technician?.full_name || technician?.username || technicianUsername || 'Unknown',
            submittedAt: task.end_time || task.updated_at,
            priority,
            taskId: task.id,
            jobId: jobOrderId?.toString() || jobOrderCode || 'N/A',
          };
        });
      
      console.log('📋 ReviewQueue - Converted to review items:', reviewItems.length);
      console.log('📋 ReviewQueue - Sample item:', reviewItems[0]);
      setItems(reviewItems);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Error fetching review queue:', errorMsg);
      setError(errorMsg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = filter === 'all' 
    ? items 
    : items.filter(item => item.priority === filter);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Review Queue</h2>
        </div>
        <div className="flex-1 p-8 text-center text-gray-500 flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full min-h-96 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Review Queue</h2>
          <button
            onClick={fetchReviewQueue}
            disabled={loading}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition disabled:opacity-50"
            title="Refresh review queue"
          >
            ↻ Refresh
          </button>
        </div>
        {error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-xs text-red-700">
            Error: {error}
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-full transition ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-3 py-1 text-sm rounded-full transition ${
              filter === 'high' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            High
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={`px-3 py-1 text-sm rounded-full transition ${
              filter === 'medium' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Medium
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No items in queue</p>
            <p className="text-xs mt-4 text-gray-400">
              {items.length === 0 ? 'No tester_approved or pending_supervisor tasks found' : `(${items.length} items hidden by filter)`}
            </p>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => onItemClick(item)}
              className={`p-3 rounded-lg border-l-4 cursor-pointer transition hover:shadow-md ${getPriorityColor(item.priority)}`}
            >
              <div className="flex items-start gap-2">
                {item.type === 'device' ? (
                  <Package className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-800 truncate">{item.itemDescription}</h4>
                  <p className="text-xs text-gray-600 mt-1">{item.jobTitle}</p>
                  <p className="text-xs text-gray-500 mt-1">By: {item.technicianName}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {new Date(item.submittedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
