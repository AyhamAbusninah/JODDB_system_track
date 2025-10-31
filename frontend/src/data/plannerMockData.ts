import { type PlannerJobOrder, type PlannerUser, type TechnicianMetrics, type JobOrderMetrics, type PlannerTask } from '../types';

export const mockPlannerJobs: PlannerJobOrder[] = [
  {
    id: 'JO-001',
    code: 'RADAR-DIAG-001',
    title: 'Radar System Diagnostics Phase 1',
    description: 'Complete diagnostic testing on 50 radar units',
    dueDate: '2024-03-20',
    createdBy: 'planner',
    totalDevices: 50,
    devicesCompleted: 32,
    devicesRejected: 3,
    progressPercent: 64,
    efficiency: 87,
    status: 'active',
    taskStandardTime: 2.5
  },
  {
    id: 'JO-002',
    code: 'FW-UPDATE-002',
    title: 'Terminal Firmware Updates',
    description: 'Apply security patches to 100 terminal units',
    dueDate: '2024-03-15',
    createdBy: 'planner',
    totalDevices: 100,
    devicesCompleted: 45,
    devicesRejected: 8,
    progressPercent: 45,
    efficiency: 72,
    status: 'active',
    taskStandardTime: 1.5
  },
  {
    id: 'JO-003',
    code: 'MAINT-CHECK-003',
    title: 'Quarterly Maintenance Inspection',
    description: 'Routine maintenance on power systems',
    dueDate: '2024-03-25',
    createdBy: 'planner',
    totalDevices: 75,
    devicesCompleted: 12,
    devicesRejected: 1,
    progressPercent: 16,
    efficiency: 91,
    status: 'active',
    taskStandardTime: 3.0
  },
];

export const mockPlannerUsers: PlannerUser[] = [
  {
    id: 'U001',
    fullName: 'Ahmed Ali',
    username: 'ahmed.ali',
    email: 'ahmed.ali@company.com',
    role: 'technician',
    assignedJobOrders: 2,
    isActive: true
  },
  {
    id: 'U002',
    fullName: 'Sara Hassan',
    username: 'sara.hassan',
    email: 'sara.hassan@company.com',
    role: 'technician',
    assignedJobOrders: 3,
    isActive: true
  },
  {
    id: 'S001',
    fullName: 'Jane Smith',
    username: 'supervisor',
    email: 'jane.smith@company.com',
    role: 'supervisor',
    assignedJobOrders: 0,
    isActive: true
  },
];

export const mockTechnicianMetrics: TechnicianMetrics[] = [
  {
    technicianId: 'U001',
    technicianName: 'Ahmed Ali',
    productivity: 95,
    efficiency: 92,
    utilization: 88,
    tasksCompleted: 156,
    averageTimePerTask: 2.3
  },
  {
    technicianId: 'U002',
    technicianName: 'Sara Hassan',
    productivity: 88,
    efficiency: 85,
    utilization: 90,
    tasksCompleted: 142,
    averageTimePerTask: 2.6
  },
];

export const mockJobOrderMetrics: JobOrderMetrics[] = [
  {
    jobOrderId: 'JO-001',
    progressPercent: 64,
    completedDevices: 32,
    rejectedDevices: 3,
    efficiencyScore: 87,
    deadlineProximity: 12,
    onTimeStatus: 'on-track'
  },
  {
    jobOrderId: 'JO-002',
    progressPercent: 45,
    completedDevices: 45,
    rejectedDevices: 8,
    efficiencyScore: 72,
    deadlineProximity: 7,
    onTimeStatus: 'at-risk'
  },
];

export const mockPlannerDeviceLogs = [
  { serialId: 'SN-10001', technicianId: 'U001', technicianName: 'Ahmed Ali', status: 'completed' as const, timestamp: '2024-03-08 09:30', jobId: 'JO-001', qaStatus: 'approved' as const },
  { serialId: 'SN-10002', technicianId: 'U001', technicianName: 'Ahmed Ali', status: 'completed' as const, timestamp: '2024-03-08 10:15', jobId: 'JO-001', qaStatus: 'pending' as const },
  { serialId: 'SN-10003', technicianId: 'U002', technicianName: 'Sara Hassan', status: 'in-progress' as const, timestamp: '2024-03-08 11:00', jobId: 'JO-001', qaStatus: 'not-reviewed' as const },
  { serialId: 'SN-20001', technicianId: 'U001', technicianName: 'Ahmed Ali', status: 'completed' as const, timestamp: '2024-03-08 08:45', jobId: 'JO-002', qaStatus: 'not-reviewed' as const },
  { serialId: 'SN-20002', technicianId: 'U001', technicianName: 'Ahmed Ali', status: 'completed' as const, timestamp: '2024-03-08 14:20', jobId: 'JO-002', qaStatus: 'approved' as const },
  { serialId: 'SN-30001', technicianId: 'U002', technicianName: 'Sara Hassan', status: 'in-progress' as const, timestamp: '2024-03-08 13:00', jobId: 'JO-003', qaStatus: 'not-reviewed' as const },
];

export const mockPlannerTasks: PlannerTask[] = [
  {
    id: 'T001',
    jobOrderCode: 'RADAR-DIAG-001',
    jobOrderId: 'JO-001',
    deviceSerial: 'SN-10001',
    technicianName: 'Ahmed Ali',
    operationName: 'System Diagnostics',
    status: 'pending-approval',
    standardTime: 9000, // 2.5 hours in seconds
    actualTime: 8100, // 2.25 hours
    efficiency: 111,
    startTime: '2024-03-08 09:00',
    endTime: '2024-03-08 11:15',
    notes: 'All diagnostics completed successfully. Minor calibration adjustment made.',
    submittedAt: '2024-03-08 11:20'
  },
  {
    id: 'T002',
    jobOrderCode: 'RADAR-DIAG-001',
    jobOrderId: 'JO-001',
    deviceSerial: 'SN-10002',
    technicianName: 'Sara Hassan',
    operationName: 'System Diagnostics',
    status: 'pending-approval',
    standardTime: 9000,
    actualTime: 10800, // 3 hours - overtime
    efficiency: 83,
    startTime: '2024-03-08 08:00',
    endTime: '2024-03-08 11:00',
    notes: 'Encountered firmware compatibility issue. Required additional troubleshooting.',
    submittedAt: '2024-03-08 11:10'
  },
  {
    id: 'T003',
    jobOrderCode: 'FW-UPDATE-002',
    jobOrderId: 'JO-002',
    deviceSerial: 'SN-20001',
    technicianName: 'Mohammed Ibrahim',
    operationName: 'Firmware Update',
    status: 'approved',
    standardTime: 5400, // 1.5 hours
    actualTime: 5100,
    efficiency: 106,
    startTime: '2024-03-08 13:00',
    endTime: '2024-03-08 14:25',
    notes: 'Update completed without issues.',
    submittedAt: '2024-03-08 14:30'
  },
];
