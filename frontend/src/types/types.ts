export interface Task {
  id: string;
  operationName: string;
  deviceSerial: string;
  technician: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'On Hold';
  jobOrderId: string;
  qaDecision?: 'accepted' | 'rejected';
  qaComments?: string;
  qaInspectedAt?: string;
}

export interface JobOrder {
  id: string;
  title: string;
  description: string;
  status: 'Assigned' | 'In Progress' | 'Completed';
  detailsOfWork: string;
  tasks?: Task[];
}

export interface CompletionReportData {
  amountCompleted: number;
  timeFrom: string;
  timeTo: string;
  reportDetails: string;
  serialNumbers: string;
}

