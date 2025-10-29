export interface Employee {
  id: string;
  employeeId: number;
  name: string;
  email: string;
  department: 'Sales' | 'Ops' | 'HR' | 'Finance' | 'Other';
  role: 'Staff' | 'Manager' | 'Owner';
  active: boolean;
  annualLeaveBalance: number;
  leaveTaken: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string | null; // ISO String
  checkOutTime: string | null; // ISO String
  source: 'Manual' | 'Fingerprint' | 'WhatsApp';
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedById: string | null;
}