import type { Company, Employee, Attendance, Leave } from './types';

const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);

const todayStr = today.toISOString().split('T')[0];
const yesterdayStr = yesterday.toISOString().split('T')[0];

export const initialCompanies: Company[] = [
    { id: 'comp-1', name: 'Innovate Inc.', code: 'INNOV8', office_lat: 34.052235, office_lng: -118.243683 },
    { id: 'comp-2', name: 'Synergy Corp.', code: 'SYN456', office_lat: 40.712776, office_lng: -74.005974 },
];

export const initialEmployees: Employee[] = [
    // Innovate Inc. Employees
    { id: 'emp-1', name: 'Alice Smith', email: 'employee@pulse.com', password: 'password123', department: 'Engineering', role: 'EMPLOYEE', companyId: 'comp-1', active: true, companyCode: 'INNOV8', googleCalendarId: 'cal-alice@pulse.com', isGoogleCalendarConnected: true },
    { id: 'emp-2', name: 'Bob Johnson', email: 'manager@pulse.com', password: 'password123', department: 'Engineering', role: 'MANAGER', companyId: 'comp-1', active: true, companyCode: 'INNOV8', googleCalendarId: 'cal-bob@pulse.com', isGoogleCalendarConnected: true },
    { id: 'emp-3', name: 'Charlie Day', email: 'charlie@innovate.com', password: 'password123', department: 'Marketing', role: 'EMPLOYEE', companyId: 'comp-1', active: true, companyCode: 'INNOV8', googleCalendarId: 'cal-charlie@innovate.com', isGoogleCalendarConnected: false },
    { id: 'emp-4', name: 'Diana Ross', email: 'admin@pulse.com', password: 'password123', department: 'HR', role: 'ADMIN', companyId: 'comp-1', active: true, companyCode: 'INNOV8', googleCalendarId: 'cal-diana@pulse.com', isGoogleCalendarConnected: true },
    
    // Synergy Corp. Employees
    { id: 'emp-5', name: 'Ethan Hunt', email: 'ethan@synergy.com', password: 'password123', department: 'Sales', role: 'EMPLOYEE', companyId: 'comp-2', active: true, companyCode: 'SYN456', googleCalendarId: 'cal-ethan@synergy.com', isGoogleCalendarConnected: false },
    { id: 'emp-6', name: 'Fiona Glenanne', email: 'fiona@synergy.com', password: 'password123', department: 'Sales', role: 'MANAGER', companyId: 'comp-2', active: true, companyCode: 'SYN456', googleCalendarId: 'cal-fiona@synergy.com', isGoogleCalendarConnected: true },
];

export const initialAttendance: Attendance[] = [
    { id: 'att-1', employeeId: 'emp-1', date: yesterdayStr, checkIn: `${yesterdayStr}T09:05:00Z`, checkOut: `${yesterdayStr}T17:35:00Z`, hoursWorked: 8.5, mode: 'WFO', status: 'PRESENT', location_lat: 34.052, location_lng: -118.243 },
    { id: 'att-2', employeeId: 'emp-3', date: yesterdayStr, checkIn: `${yesterdayStr}T09:30:00Z`, checkOut: `${yesterdayStr}T17:00:00Z`, hoursWorked: 7.5, mode: 'WFH', status: 'INCOMPLETE', location_lat: null, location_lng: null },
    { id: 'att-3', employeeId: 'emp-2', date: todayStr, checkIn: `${todayStr}T08:58:00Z`, checkOut: null, hoursWorked: 0, mode: 'WFO', status: 'PRESENT', location_lat: 34.052, location_lng: -118.243 },
];

export const initialLeaves: Leave[] = [
    { id: 'leave-1', employeeId: 'emp-1', fromDate: '2024-09-10', toDate: '2024-09-12', reason: 'Family vacation', status: 'APPROVED', approvedBy: 'emp-2', calendarEventId: 'gcal-123', attachment: { name: 'flight-tickets.pdf' } },
    { id: 'leave-2', employeeId: 'emp-3', fromDate: `${todayStr}`, toDate: `${todayStr}`, reason: 'Doctor\'s appointment', status: 'PENDING', approvedBy: null, calendarEventId: null },
    { id: 'leave-3', employeeId: 'emp-5', fromDate: '2024-09-15', toDate: '2024-09-15', reason: 'Personal day', status: 'PENDING', approvedBy: null, calendarEventId: null },
];