// API Service Layer for JODDB Backend Integration
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token in all requests
axiosInstance.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Types
export interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    full_name: string;
  };
}

export interface Task {
  id: number;
  job_order?: number;  // Optional - may not be in API response
  job_order_code?: string;  // Added - what API actually returns
  device?: number;
  device_serial?: string;
  operation_name: string;
  standard_time_seconds: number;
  actual_time_seconds?: number;
  efficiency?: number;
  status: string;
  technician?: number;
  technician_username?: string;
  technician_name?: string;
  start_time?: string;
  end_time?: string;
  task_type?: string;
  created_at: string;
  updated_at: string;
}

export interface Process {
  id: number;
  job: number;
  operation_name: string;
  standard_time_seconds: number;
  task_type: 'technician' | 'quality' | 'tester';
  order: number;
}

export interface Job {
  id: number;
  name: string;
  description?: string;
  processes: Process[];
  created_at: string;
  updated_at: string;
}

export interface JobOrder {
  id: number;
  job?: number;
  job_name?: string;
  order_code: string;
  title: string;
  description?: string;
  total_devices: number;
  due_date: string;
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface JobOrderProgress {
  progress_percent: number;
  total_completed: number;
  total_rejected: number;
  total_devices: number;
  alerts: Array<{
    type: string;
    message: string;
    severity: string;
  }>;
}

export interface TechnicianMetrics {
  technician_id?: number;
  technician_name?: string;
  date: string;
  productivity: number;
  average_efficiency: number;
  utilization: number;
  tasks_completed: number;
}

export interface PlannerStatistics {
  active_job_orders: number;
  due_this_week: number;
  avg_productivity: number;
  active_technicians: number;
  total_technicians: number;
  technician_utilization: number;
  overdue_tasks: number;
  pending_reviews: number;
}

export interface Inspection {
  id: number;
  task: number;
  device: number;
  inspector: number | null;
  decision: 'accepted' | 'rejected';
  comments: string;
  created_at: string;
}

export interface InspectionDetail extends Inspection {
  task_details?: Task;
  inspector_name?: string;
  device_serial?: string;
  job_order_code?: string;
}

export interface SupervisorReview {
  id: number;
  inspection: number;
  supervisor: number | null;
  decision: 'accepted' | 'rejected';
  comments: string;
  created_at: string;
}

export interface TesterReview {
  id: number;
  task: number;
  tester: number | null;
  decision: 'accepted' | 'rejected';
  comments: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
}

// Handle API responses (Axios version)
function handleResponse<T>(response: any): T {
  return response.data;
}

// Handle paginated responses from DRF (Axios version)
function handlePaginatedResponse<T>(response: any): T[] {
  const data = response.data;
  // If response has 'results' key (paginated), return results array
  // Otherwise, assume it's already an array
  return Array.isArray(data) ? data : (data?.results || []);
}

// =======================
// Authentication APIs
// =======================

export const authAPI = {
  /**
   * Login user and get JWT tokens
   * POST /api/v1/auth/login/
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await axiosInstance.post('/api/v1/auth/login/', { username, password });
    const data = response.data;
    
    // Store tokens in localStorage
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  },

  /**
   * Refresh access token
   * POST /api/v1/auth/token/refresh/
   */
  refreshToken: async (): Promise<{ access: string }> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axiosInstance.post('/api/v1/auth/token/refresh/', {
      refresh: refreshToken,
    });

    const data = response.data;
    localStorage.setItem('access_token', data.access);
    
    return data;
  },

  /**
   * Logout and blacklist refresh token
   * POST /api/v1/auth/logout/
   */
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        await axiosInstance.post('/api/v1/auth/logout/', {
          refresh: refreshToken,
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  /**
   * Get current user's profile
   * GET /api/v1/auth/me/
   */
  getMe: async (): Promise<LoginResponse['user']> => {
    const response = await axiosInstance.get('/api/v1/auth/me/');
    return handleResponse<LoginResponse['user']>(response);
  },
};

// =======================
// Task APIs (Technician)
// =======================

export const taskAPI = {
  /**
   * Get all tasks (filtered by role on backend)
   * GET /api/v1/tasks/
   */
  getTasks: async (): Promise<Task[]> => {
    const response = await axiosInstance.get('/api/v1/tasks/');
    return handlePaginatedResponse<Task>(response);
  },

  /**
   * Get single task details
   * GET /api/v1/tasks/{id}/
   */
  getTask: async (taskId: number): Promise<Task> => {
    const response = await axiosInstance.get(`/api/v1/tasks/${taskId}/`);
    return handleResponse<Task>(response);
  },

  /**
   * Create a new task
   * POST /api/v1/tasks/
   */
  createTask: async (taskData: {
    job_order: number;
    process?: number;
    device_serial: string;
    task_type: string;
    operation_name: string;
    estimated_time?: number;
  }): Promise<Task> => {
    const response = await axiosInstance.post('/api/v1/tasks/', taskData);
    return handleResponse<Task>(response);
  },

  /**
   * Start a task (Technician)
   * PATCH /api/v1/tasks/{id}/start/
   */
  startTask: async (taskId: number): Promise<Task> => {
    const response = await axiosInstance.patch(`/api/v1/tasks/${taskId}/start/`);
    return handleResponse<Task>(response);
  },

  /**
   * End a task (Technician)
   * PATCH /api/v1/tasks/{id}/end/
   */
  endTask: async (taskId: number, notes?: string): Promise<Task> => {
    const response = await axiosInstance.patch(`/api/v1/tasks/${taskId}/end/`, {
      notes: notes || '',
    });
    return handleResponse<Task>(response);
  },
};

// =======================
// Job Order APIs
// =======================

export const jobOrderAPI = {
  /**
   * Get all job orders
   * GET /api/v1/job-orders/
   */
  getJobOrders: async (): Promise<JobOrder[]> => {
    const response = await axiosInstance.get('/api/v1/job-orders/');
    return handlePaginatedResponse<JobOrder>(response);
  },

  /**
   * Get single job order details
   * GET /api/v1/job-orders/{id}/
   */
  getJobOrder: async (jobOrderId: number): Promise<JobOrder> => {
    const response = await axiosInstance.get(`/api/v1/job-orders/${jobOrderId}/`);
    return handleResponse<JobOrder>(response);
  },

  /**
   * Create new job order (Planning Engineer)
   * POST /api/v1/job-orders/
   */
  createJobOrder: async (data: {
    job?: number;
    order_code: string;
    title: string;
    description?: string;
    due_date: string;
    total_devices: number;
  }): Promise<JobOrder> => {
    const response = await axiosInstance.post('/api/v1/job-orders/', data);
    return handleResponse<JobOrder>(response);
  },

  /**
   * Import job orders from Excel/CSV (Planning Engineer)
   * POST /api/v1/data/import/job-order/
   */
  importJobOrders: async (file: File): Promise<{
    success: boolean;
    summary: {
      total_job_orders_created: number;
      total_devices_created: number;
      created_job_orders: string[];
      duplicates: string[];
      errors: string[];
    };
  }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post('/api/v1/data/import/job-order/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return handleResponse(response);
  },
};

// =======================
// Metrics APIs
// =======================

export const metricsAPI = {
  /**
   * Get technician daily metrics
   * GET /api/v1/metrics/technician/{id}/?date=YYYY-MM-DD
   */
  getTechnicianMetrics: async (
    technicianId: number,
    date?: string
  ): Promise<TechnicianMetrics> => {
    const dateParam = date ? `?date=${date}` : '';
    const response = await axiosInstance.get(
      `/api/v1/metrics/technician/${technicianId}/${dateParam}`
    );
    return handleResponse<TechnicianMetrics>(response);
  },

  /**
   * Get job order progress and alerts
   * GET /api/v1/metrics/job-order/{id}/
   */
  getJobOrderProgress: async (jobOrderId: number): Promise<JobOrderProgress> => {
    const response = await axiosInstance.get(
      `/api/v1/metrics/job-order/${jobOrderId}/`
    );
    return handleResponse<JobOrderProgress>(response);
  },

  /**
   * Get planner dashboard statistics
   * GET /api/v1/planner/statistics/
   */
  getPlannerStatistics: async (): Promise<PlannerStatistics> => {
    const response = await axiosInstance.get('/api/v1/planner/statistics/');
    return handleResponse<PlannerStatistics>(response);
  },
};

// =======================
// Inspection APIs (Quality Inspector)
// =======================

export const inspectionAPI = {
  /**
   * Create inspection (accept/reject task)
   * POST /api/v1/inspections/
   */
  createInspection: async (data: {
    task_id: number;
    decision: 'accepted' | 'rejected';
    comments: string;
  }): Promise<Inspection> => {
    const response = await axiosInstance.post('/api/v1/inspections/', data);
    return handleResponse<Inspection>(response);
  },

  /**
   * Get all inspections
   * GET /api/v1/inspections/
   */
  getInspections: async (): Promise<Inspection[]> => {
    const response = await axiosInstance.get('/api/v1/inspections/');
    return handlePaginatedResponse<Inspection>(response);
  },

  /**
   * Get inspection for a specific task
   * GET /api/v1/inspections/task/<task_id>/
   */
  getInspectionForTask: async (taskId: number): Promise<Inspection> => {
    const response = await axiosInstance.get(`/api/v1/inspections/task/${taskId}/`);
    return handleResponse<Inspection>(response);
  },
};

// =======================
// Tester Review APIs (Tester)
// =======================

export const testerReviewAPI = {
  /**
   * Create tester review (accept/reject task during testing)
   * POST /api/v1/tester-reviews/
   */
  createReview: async (data: {
    task_id: number;
    decision: 'accepted' | 'rejected';
    comments: string;
  }): Promise<TesterReview> => {
    const response = await axiosInstance.post('/api/v1/tester-reviews/', data);
    return handleResponse<TesterReview>(response);
  },

  /**
   * Get all tester reviews
   * GET /api/v1/tester-reviews/
   */
  getReviews: async (): Promise<TesterReview[]> => {
    const response = await axiosInstance.get('/api/v1/tester-reviews/');
    return handlePaginatedResponse<TesterReview>(response);
  },
};

// =======================
// Supervisor Review APIs (Supervisor)
// =======================

export const supervisorReviewAPI = {
  /**
   * Create supervisor review (accept/reject inspection)
   * POST /api/v1/supervisor-reviews/
   */
  createReview: async (data: {
    inspection_id: number;
    decision: 'accepted' | 'rejected';
    comments: string;
  }): Promise<SupervisorReview> => {
    const response = await axiosInstance.post('/api/v1/supervisor-reviews/', data);
    return handleResponse<SupervisorReview>(response);
  },

  /**
   * Get all supervisor reviews
   * GET /api/v1/supervisor-reviews/
   */
  getReviews: async (): Promise<SupervisorReview[]> => {
    const response = await axiosInstance.get('/api/v1/supervisor-reviews/');
    return handlePaginatedResponse<SupervisorReview>(response);
  },
};

// =======================
// Export APIs
// =======================

export const exportAPI = {
  /**
   * Export daily report
   * GET /api/v1/data/export/daily-report/?date=YYYY-MM-DD&format=csv
   */
  exportDailyReport: async (date?: string, format: 'csv' | 'excel' = 'csv'): Promise<Blob> => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    params.append('format', format);

    const response = await axiosInstance.get(
      `/api/v1/data/export/daily-report/?${params.toString()}`,
      {
        responseType: 'blob',
      }
    );

    return response.data;
  },

  /**
   * Export Job Order PDF Report
   * GET /api/v1/reports/joborder/{id}/export/pdf
   * 
   * Generates comprehensive PDF report for a specific job order including:
   * - Job order details (code, title, dates, progress)
   * - Device list with status
   * - Task details (technician, times, efficiency)
   * - Quality inspection results
   * - Summary statistics
   * 
   * @param jobOrderId - The ID of the job order to export
   * @returns Promise<Blob> - PDF file as Blob for download
   */
  exportJobOrderPDF: async (jobOrderId: number): Promise<Blob> => {
    const response = await axiosInstance.get(
      `/api/v1/reports/joborder/${jobOrderId}/export/pdf`,
      {
        responseType: 'blob', // Important: tell axios to expect binary data
      }
    );

    return response.data;
  },
};

// =======================
// User Management APIs
// =======================

export const userAPI = {
  /**
   * Get all users
   * GET /api/v1/users/
   */
  getUsers: async (): Promise<User[]> => {
    const response = await axiosInstance.get('/api/v1/users/');
    return handlePaginatedResponse<User>(response);
  },

  /**
   * Create new user (Planner)
   * POST /api/v1/users/
   */
  createUser: async (data: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    role: string;
  }): Promise<User> => {
    const response = await axiosInstance.post('/api/v1/users/', data);
    return handleResponse<User>(response);
  },

  /**
   * Update user information (Planner)
   * PATCH /api/v1/users/{id}/
   */
  updateUser: async (userId: number, data: {
    full_name?: string;
    email?: string;
    role?: string;
    is_active?: boolean;
  }): Promise<User> => {
    const response = await axiosInstance.patch(`/api/v1/users/${userId}/`, data);
    return handleResponse<User>(response);
  },

  /**
   * Delete user (Planner)
   * DELETE /api/v1/users/{id}/
   */
  deleteUser: async (userId: number): Promise<void> => {
    await axiosInstance.delete(`/api/v1/users/${userId}/`);
  },
};

// =======================
// Job APIs (Templates)
// =======================

export const jobAPI = {
  /**
   * Get all job templates
   * GET /api/v1/jobs/
   */
  getJobs: async (): Promise<Job[]> => {
    const response = await axiosInstance.get('/api/v1/jobs/');
    return handlePaginatedResponse<Job>(response);
  },

  /**
   * Get single job with all processes
   * GET /api/v1/jobs/{id}/
   */
  getJob: async (jobId: number): Promise<Job> => {
    const response = await axiosInstance.get(`/api/v1/jobs/${jobId}/`);
    return handleResponse<Job>(response);
  },

  /**
   * Create a new job template with its processes
   * POST /api/v1/jobs/
   */
  createJob: async (data: {
    name: string;
    description?: string;
    processes: Array<{
      operation_name: string;
      standard_time_seconds: number;
      task_type: 'technician' | 'quality' | 'tester';
      order: number;
    }>;
  }): Promise<Job> => {
    const response = await axiosInstance.post('/api/v1/jobs/', data);
    return handleResponse<Job>(response);
  },

  /**
   * Update a job template's details (name/description)
   * PATCH /api/v1/jobs/{id}/
   */
  updateJob: async (jobId: number, data: { name?: string; description?: string }): Promise<Job> => {
    const response = await axiosInstance.patch(`/api/v1/jobs/${jobId}/`, data);
    return handleResponse<Job>(response);
  },

  /**
   * Delete a job template
   * DELETE /api/v1/jobs/{id}/
   */
  deleteJob: async (jobId: number): Promise<void> => {
    await axiosInstance.delete(`/api/v1/jobs/${jobId}/`);
  },
};

// =======================
// Process APIs (Task Templates)
// =======================

export const processAPI = {
  /**
   * Get all processes
   * GET /api/v1/processes/
   */
  getProcesses: async (jobId?: number): Promise<Process[]> => {
    const params = jobId ? `?job_id=${jobId}` : '';
    const response = await axiosInstance.get(`/api/v1/processes/${params}`);
    return handlePaginatedResponse<Process>(response);
  },

  /**
   * Get single process
   * GET /api/v1/processes/{id}/
   */
  getProcess: async (processId: number): Promise<Process> => {
    const response = await axiosInstance.get(`/api/v1/processes/${processId}/`);
    return handleResponse<Process>(response);
  },

  /**
   * Create a new process for a job
   * POST /api/v1/processes/
   */
  createProcess: async (data: {
    job: number;
    operation_name: string;
    standard_time_seconds: number;
    task_type: 'technician' | 'quality' | 'tester';
    order: number;
  }): Promise<Process> => {
    const response = await axiosInstance.post('/api/v1/processes/', data);
    return handleResponse<Process>(response);
  },

  /**
   * Update an existing process
   * PATCH /api/v1/processes/{id}/
   */
  updateProcess: async (processId: number, data: Partial<{
    operation_name: string;
    standard_time_seconds: number;
    task_type: 'technician' | 'quality' | 'tester';
    order: number;
  }>): Promise<Process> => {
    const response = await axiosInstance.patch(`/api/v1/processes/${processId}/`, data);
    return handleResponse<Process>(response);
  },

  /**
   * Delete a process
   * DELETE /api/v1/processes/{id}/
   */
  deleteProcess: async (processId: number): Promise<void> => {
    await axiosInstance.delete(`/api/v1/processes/${processId}/`);
  },
};

export const taskSummaryAPI = {
  getTaskSummary: async (): Promise<any> => {
    const response = await axiosInstance.get('/api/v1/tasks/summary/');
    return handleResponse<any>(response);
  },
};

// Export all APIs
export const api = {
  auth: authAPI,
  tasks: taskAPI,
  jobOrders: jobOrderAPI,
  users: userAPI,
  metrics: metricsAPI,
  inspections: inspectionAPI,
  testerReviews: testerReviewAPI,
  supervisorReviews: supervisorReviewAPI,
  export: exportAPI,
  taskSummary: taskSummaryAPI,
  jobs: jobAPI,
  processes: processAPI,
};

export default api;
