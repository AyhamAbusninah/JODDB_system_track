import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';

interface TechnicianReviewLogProps {
  technicianId: string | null;
  onBack: () => void;
}

export const TechnicianReviewLog: React.FC<TechnicianReviewLogProps> = ({ technicianId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [technician, setTechnician] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (technicianId) {
      fetchTechnicianData();
    }
  }, [technicianId]);

    const fetchTechnicianData = async () => {
    try {
      setLoading(true);
      const [allUsers, allTasks] = await Promise.all([
        api.users.getUsers(),
        api.tasks.getTasks(),
      ]);
      
      const user = allUsers.find((u: any) => u.id === parseInt(technicianId!));
      setTechnician(user);
      
      // Filter tasks by comparing technician_username from API
      // API returns technician_username string, not technician ID
      console.log('👤 TechnicianReviewLog - Looking for tasks for technician:', user?.username);
      const technicianTasks = allTasks.filter((t: any) => {
        const taskTechUsername = (t as any).technician_username;
        const matches = taskTechUsername === user?.username;
        return matches;
      });
      console.log('👤 TechnicianReviewLog - Found tasks count:', technicianTasks.length);
      setTasks(technicianTasks);
    } catch (error) {
      console.error('Error fetching technician data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!technicianId) return null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="animate-pulse text-gray-600">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!technician) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{technician.username}</h1>
          <p className="text-sm text-gray-600">{technician.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Total Tasks</div>
          <div className="text-2xl font-bold text-gray-800">{tasks.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600">
            {tasks.filter((t: any) => t.status === 'done').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-2xl font-bold text-yellow-600">
            {tasks.filter((t: any) => t.status === 'in-progress').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-blue-600">
            {tasks.filter((t: any) => t.status === 'pending').length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800">Task History</h2>
        </div>
        <div className="p-6">
          {tasks.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No tasks found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Task</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Operation</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Created</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task: any) => (
                  <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">#{task.id}</td>
                    <td className="px-4 py-3 text-sm">{task.operation_name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 'done' ? 'bg-green-100 text-green-800' : 
                        task.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(task.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
