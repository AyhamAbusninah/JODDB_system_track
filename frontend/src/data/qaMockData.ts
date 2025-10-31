import { type QATask, type QAInspection, type QAMetrics } from '../types';

export const mockQATasks: QATask[] = [
  {
    id: 'T001',
    deviceSerial: 'SN-10001',
    jobOrderCode: 'RADAR-DIAG-001',
    technicianName: 'Ahmed Ali',
    operationName: 'System Diagnostics',
    status: 'pending_qa',
  },
  {
    id: 'T002',
    deviceSerial: 'SN-10002',
    jobOrderCode: 'RADAR-DIAG-001',
    technicianName: 'Sara Hassan',
    operationName: 'System Diagnostics',
    status: 'pending_qa',
  },
  {
    id: 'T003',
    deviceSerial: 'SN-20001',
    jobOrderCode: 'FW-UPDATE-002',
    technicianName: 'Mohammed Ibrahim',
    operationName: 'Firmware Update',
    status: 'done',
  },
];

export const mockQAInspections: QAInspection[] = [
  {
    id: 'INS001',
    taskId: 'T010',
    deviceSerial: 'SN-10010',
    jobOrderCode: 'RADAR-DIAG-001',
    technicianName: 'Ahmed Ali',
    operationName: 'System Diagnostics',
    decision: 'accepted',
    comments: 'Work meets quality standards. All tests passed.',
    inspectorId: 'QI001',
    inspectorName: 'Fatima Quality',
    inspectedAt: '2024-03-08 10:30'
  },
  {
    id: 'INS002',
    taskId: 'T011',
    deviceSerial: 'SN-10011',
    jobOrderCode: 'RADAR-DIAG-001',
    technicianName: 'Sara Hassan',
    operationName: 'System Diagnostics',
    decision: 'rejected',
    comments: 'Incomplete calibration data. Sensor readings show variance beyond acceptable range. Please recalibrate and retest.',
    inspectorId: 'QI001',
    inspectorName: 'Fatima Quality',
    inspectedAt: '2024-03-08 09:45'
  },
  {
    id: 'INS003',
    taskId: 'T012',
    deviceSerial: 'SN-20005',
    jobOrderCode: 'FW-UPDATE-002',
    technicianName: 'Mohammed Ibrahim',
    operationName: 'Firmware Update',
    decision: 'accepted',
    comments: 'Update verification successful. All functionality tests passed.',
    inspectorId: 'QI001',
    inspectorName: 'Fatima Quality',
    inspectedAt: '2024-03-08 08:15'
  },
];

export const mockQAMetrics: QAMetrics = {
  pendingInspections: 3,
  acceptedToday: 12,
  rejectedToday: 2,
  reworkTasks: 1,
  acceptanceRate: 85.7
};

export const mockQADeviceLogs = [
  { serialId: 'SN-10001', technicianId: 'U001', technicianName: 'Ahmed Ali', status: 'completed' as const, timestamp: '2024-03-08 09:30', jobId: 'JO-001', qaStatus: 'approved' as const },
  { serialId: 'SN-10002', technicianId: 'U001', technicianName: 'Ahmed Ali', status: 'completed' as const, timestamp: '2024-03-08 10:15', jobId: 'JO-001', qaStatus: 'pending' as const },
  { serialId: 'SN-10003', technicianId: 'U002', technicianName: 'Sara Hassan', status: 'in-progress' as const, timestamp: '2024-03-08 11:00', jobId: 'JO-001', qaStatus: 'not-reviewed' as const },
  { serialId: 'SN-20001', technicianId: 'U003', technicianName: 'Mohammed Ibrahim', status: 'completed' as const, timestamp: '2024-03-08 08:45', jobId: 'JO-002', qaStatus: 'not-reviewed' as const },
  { serialId: 'SN-20002', technicianId: 'U001', technicianName: 'Ahmed Ali', status: 'completed' as const, timestamp: '2024-03-08 14:20', jobId: 'JO-002', qaStatus: 'approved' as const },
];
