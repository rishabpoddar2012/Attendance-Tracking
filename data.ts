import type { Employee, AttendanceRecord, LeaveRequest } from './types';

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);

const todayStr = today.toISOString().split('T')[0];
const yesterdayStr = yesterday.toISOString().split('T')[0];

export const initialEmployees: Employee[] = [
  { id: 'emp-1', employeeId: 101, name: 'Alice Johnson', email: 'alice@example.com', department: 'Sales', role: 'Staff', active: true, annualLeaveBalance: 20, leaveTaken: 5 },
  { id: 'emp-2', employeeId: 102, name: 'Bob Williams', email: 'bob@example.com', department: 'Ops', role: 'Staff', active: true, annualLeaveBalance: 20, leaveTaken: 10 },
  { id: 'emp-3', employeeId: 201, name: 'Charlie Brown', email: 'charlie@example.com', department: 'Ops', role: 'Manager', active: true, annualLeaveBalance: 25, leaveTaken: 4 },
  { id: 'emp-4', employeeId: 1, name: 'Diana Prince', email: 'diana@example.com', department: 'HR', role: 'Owner', active: true, annualLeaveBalance: 30, leaveTaken: 10 },
];

export const initialAttendance: AttendanceRecord[] = [
  // Yesterday's data
  { id: 'att-1', employeeId: 'emp-1', date: yesterdayStr, checkInTime: `${yesterdayStr}T09:01:00.000Z`, checkOutTime: `${yesterdayStr}T17:30:00.000Z`, source: 'Manual' },
  { id: 'att-2', employeeId: 'emp-2', date: yesterdayStr, checkInTime: `${yesterdayStr}T09:15:00.000Z`, checkOutTime: `${yesterdayStr}T17:00:00.000Z`, source: 'Manual' },
  { id: 'att-3', employeeId: 'emp-3', date: yesterdayStr, checkInTime: `${yesterdayStr}T08:55:00.000Z`, checkOutTime: `${yesterdayStr}T18:05:00.000Z`, source: 'Manual' },
  // Today's data
  { id: 'att-4', employeeId: 'emp-3', date: todayStr, checkInTime: `${todayStr}T08:58:00.000Z`, checkOutTime: null, source: 'Manual' },
];

export const initialLeaveRequests: LeaveRequest[] = [
  { id: 'leave-1', employeeId: 'emp-2', from: '2024-08-20', to: '2024-08-22', reason: 'Family vacation.', status: 'Approved', approvedById: 'emp-3' },
  { id: 'leave-2', employeeId: 'emp-1', from: `${todayStr}`, to: `${todayStr}`, reason: 'Doctor\'s appointment in the afternoon.', status: 'Pending', approvedById: null },
];