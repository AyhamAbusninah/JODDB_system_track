import { type JobOrder, type Task } from '../types/types';

// Mock tasks data
const mockTasks: Task[] = [
  { id: 'T-001', operationName: 'Diagnostics Check', deviceSerial: 'DEV-A-2401', technician: 'John Smith', status: 'Completed', jobOrderId: 'J-001' },
  { id: 'T-002', operationName: 'Power Supply Test', deviceSerial: 'DEV-A-2402', technician: 'John Smith', status: 'In Progress', jobOrderId: 'J-001' },
  { id: 'T-003', operationName: 'Antenna Calibration', deviceSerial: 'DEV-A-2403', technician: 'Sarah Johnson', status: 'Pending', jobOrderId: 'J-001' },
  
  { id: 'T-004', operationName: 'Firmware Flash', deviceSerial: 'TERM-12-001', technician: 'Mike Davis', status: 'In Progress', jobOrderId: 'J-002' },
  { id: 'T-005', operationName: 'System Reboot', deviceSerial: 'TERM-12-001', technician: 'Mike Davis', status: 'Completed', jobOrderId: 'J-002' },
  { id: 'T-006', operationName: 'Connectivity Test', deviceSerial: 'TERM-12-001', technician: 'Mike Davis', status: 'Pending', jobOrderId: 'J-002' },
  
  { id: 'T-007', operationName: 'Power Check', deviceSerial: 'COOL-SYS-01', technician: 'Emma Wilson', status: 'Pending', jobOrderId: 'J-003' },
  { id: 'T-008', operationName: 'Cooling Test', deviceSerial: 'COOL-SYS-01', technician: 'Emma Wilson', status: 'Pending', jobOrderId: 'J-003' },
  
  { id: 'T-009', operationName: 'Physical Inspection', deviceSerial: 'ANT-ARRAY-01', technician: 'David Brown', status: 'Pending', jobOrderId: 'J-004' },
  { id: 'T-010', operationName: 'Alignment Adjustment', deviceSerial: 'ANT-ARRAY-01', technician: 'David Brown', status: 'Pending', jobOrderId: 'J-004' },
  { id: 'T-011', operationName: 'Signal Test', deviceSerial: 'ANT-ARRAY-01', technician: 'David Brown', status: 'Pending', jobOrderId: 'J-004' },
  
  { id: 'T-012', operationName: 'Switch Removal', deviceSerial: 'NET-SW-05', technician: 'Chris Anderson', status: 'Completed', jobOrderId: 'J-005' },
  { id: 'T-013', operationName: 'New Switch Install', deviceSerial: 'NET-SW-06', technician: 'Chris Anderson', status: 'In Progress', jobOrderId: 'J-005' },
  { id: 'T-014', operationName: 'Network Config', deviceSerial: 'NET-SW-06', technician: 'Chris Anderson', status: 'Pending', jobOrderId: 'J-005' },
];

export const initialJobOrders: JobOrder[] = [
  { 
    id: 'J-001', 
    title: 'System Diagnostics on Unit 4', 
    description: 'Perform full diagnostic check on main radar unit.', 
    status: 'Assigned', 
    detailsOfWork: '',
    tasks: mockTasks.filter(t => t.jobOrderId === 'J-001')
  },
  { 
    id: 'J-002', 
    title: 'Firmware Update for Terminal 12', 
    description: 'Apply latest security patch and test functionality.', 
    status: 'In Progress', 
    detailsOfWork: 'Started patch deployment. Found initial dependency error.',
    tasks: mockTasks.filter(t => t.jobOrderId === 'J-002')
  },
  { 
    id: 'J-003', 
    title: 'Routine Maintenance Check B', 
    description: 'Check power supply and cooling systems.', 
    status: 'Assigned', 
    detailsOfWork: '',
    tasks: mockTasks.filter(t => t.jobOrderId === 'J-003')
  },
  { 
    id: 'J-004', 
    title: 'Antenna Alignment Check', 
    description: 'Verify physical alignment of main antenna array.', 
    status: 'Assigned', 
    detailsOfWork: '',
    tasks: mockTasks.filter(t => t.jobOrderId === 'J-004')
  },
  { 
    id: 'J-005', 
    title: 'Network Switch Replacement', 
    description: 'Replace faulty network switch in comms rack.', 
    status: 'In Progress', 
    detailsOfWork: 'Switch isolated and replacement unit acquired.',
    tasks: mockTasks.filter(t => t.jobOrderId === 'J-005')
  },
  { 
    id: 'J-006', 
    title: 'Power System Load Test', 
    description: 'Run a 30-minute load test on backup generators.', 
    status: 'Assigned', 
    detailsOfWork: '',
    tasks: []
  },
  { 
    id: 'J-007', 
    title: 'Software Rollback on Server', 
    description: 'Revert Server Alpha to previous stable build.', 
    status: 'Assigned', 
    detailsOfWork: '',
    tasks: []
  },
  { 
    id: 'J-008', 
    title: 'Cable Management Cleanup', 
    description: 'Re-bundle and label all patch panel cables.', 
    status: 'Assigned', 
    detailsOfWork: '',
    tasks: []
  },
  { 
    id: 'J-009', 
    title: 'Quarterly Inventory Audit', 
    description: 'Perform full physical inventory count.', 
    status: 'Assigned', 
    detailsOfWork: '',
    tasks: []
  },
];