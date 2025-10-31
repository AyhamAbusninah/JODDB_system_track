export interface JobOrder {
  id: string;
  title: string;
  description: string;
  status: 'Assigned' | 'In Progress' | 'Completed';
  detailsOfWork: string; // User-added details
}

export interface CompletionReportData {
  amountCompleted: number;
  timeFrom: string;
  timeTo: string;
  reportDetails: string;
  serialNumbers: string; // Stored as a single string of numbers/text
}

export type View = 'login' | 'jobs';

export type UserRole = 'technician' | 'supervisor' | 'planning' | 'quality' | 'test_technician' | 'tester';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  username?: string;
}

export interface TechnicianPerformance {
  id: string;
  name: string;
  productivity: number; // percentage
  efficiency: number; // percentage
  utilization: number; // percentage
  status: 'normal' | 'at-risk' | 'low';
}

export interface Alert {
  id: string;
  type: 'performance' | 'deadline' | 'data-integrity';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  relatedJobId?: string;
  relatedTechnicianId?: string;
  timestamp: string;
  status: 'new' | 'acknowledged' | 'resolved';
}

export interface SupervisorReview {
  id: string;
  reviewType: 'performance' | 'quality' | 'delay' | 'general';
  note: string;
  createdAt: string;
  reviewedBy: string;
  flaggedForQA: boolean;
  issueType?: 'rework-needed' | 'incomplete-data' | 'delay' | 'other';
  attachments?: string[];
}

export interface DeviceLog {
  serialId: string;
  technicianId: string;
  technicianName: string;
  status: 'completed' | 'in-progress' | 'failed';
  timestamp: string;
  jobId: string;
  supervisorReview?: SupervisorReview;
  qaStatus: 'pending' | 'approved' | 'rejected' | 'not-reviewed';
}

export interface TechnicianSubmission {
  id: string;
  technicianId: string;
  technicianName: string;
  jobId: string;
  date: string;
  devicesCompleted: number;
  timeSpent: string;
  notes: string;
  supervisorReview?: SupervisorReview;
  qaStatus: 'pending' | 'approved' | 'rejected' | 'not-reviewed';
}

export interface SupervisorJobOrder extends JobOrder {
  percentComplete: number;
  dueDate: string;
  assignedTechnicians: string[];
  priority: 'low' | 'medium' | 'high';
  reviewStatus: 'not-reviewed' | 'partially-reviewed' | 'reviewed' | 'flagged';
}

export interface ReviewQueueItem {
  id: string;
  type: 'task' | 'device';
  jobId: string;
  jobTitle: string;
  technicianId: string;
  technicianName: string;
  itemDescription: string;
  submittedAt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface PlannerJobOrder {
  id: string;
  code: string;
  title: string;
  description: string;
  dueDate: string;
  createdBy: string;
  totalDevices: number;
  devicesCompleted: number;
  devicesRejected: number;
  progressPercent: number;
  efficiency: number;
  status: 'active' | 'completed' | 'overdue' | 'archived';
  taskStandardTime: number; // in hours
}

export interface PlannerUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  assignedJobOrders: number;
  isActive: boolean;
}

export interface TechnicianMetrics {
  technicianId: string;
  technicianName: string;
  productivity: number;
  efficiency: number;
  utilization: number;
  tasksCompleted: number;
  averageTimePerTask: number;
}

export interface JobOrderMetrics {
  jobOrderId: string;
  progressPercent: number;
  completedDevices: number;
  rejectedDevices: number;
  efficiencyScore: number;
  deadlineProximity: number; // days remaining
  onTimeStatus: 'on-track' | 'at-risk' | 'overdue';
}

export interface PlannerTask {
  id: string;
  jobOrderCode: string;
  jobOrderId: string;
  deviceSerial: string;
  technicianName: string;
  operationName: string;
  status: 'available' | 'in-progress' | 'done' | 'pending-approval' | 'approved' | 'rejected';
  standardTime: number; // in seconds
  actualTime: number; // in seconds
  efficiency: number; // percentage
  startTime: string;
  endTime: string;
  notes: string;
  submittedAt: string;
}

export interface TaskApprovalDecision {
  taskId: string;
  decision: 'approve' | 'reject';
  comments: string;
  reviewedBy: string;
  reviewedAt: string;
}

export interface QATask {
  id: string;
  operationName: string;
  deviceSerial: string;
  technicianName: string;
  jobOrderCode: string;
  status: 'pending_qa' | 'done';
  qaDecision?: 'accepted' | 'rejected';
  qaComments?: string;
  qaInspectedAt?: string;
}

export interface QAInspection {
  id: string;
  taskId: string;
  deviceSerial: string;
  jobOrderCode: string;
  technicianName: string;
  operationName: string;
  decision: 'accepted' | 'rejected';
  comments: string;
  inspectorId: string;
  inspectorName: string;
  inspectedAt: string;
}

export interface QAMetrics {
  pendingInspections: number;
  acceptedToday: number;
  rejectedToday: number;
  reworkTasks: number;
  acceptanceRate: number;
}

export interface SupervisorQAReview {
  id: string;
  inspectionId: string;
  taskId: string;
  deviceSerial: string;
  jobOrderCode: string;
  technicianName: string;
  operationName: string;
  qaDecision: 'accepted' | 'rejected';
  qaComments: string;
  qaInspector: string;
  qaInspectedAt: string;
  supervisorDecision?: 'accepted' | 'rejected';
  supervisorComments?: string;
  supervisorReviewedAt?: string;
  status: 'pending-supervisor' | 'supervisor-approved' | 'supervisor-rejected';
}

export interface TechnicianReport {
  id: string;
  taskId: string;
  jobOrderId: string;
  jobOrderCode: string;
  technicianId: string;
  technicianName: string;
  deviceSerial: string;
  operationName: string;
  roleType: 'technician' | 'quality';
  content: string;
  quantity: number;
  startTime: string;
  endTime: string;
  actualTimeSeconds: number;
  createdAt: string;
  updatedAt: string;
}