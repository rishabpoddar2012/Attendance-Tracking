export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

export interface Company {
  id: string;
  name: string;
  code: string; // Unique join code
  office_lat: number;
  office_lng: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  password?: string; // Add password for login
  department: 'Sales' | 'Engineering' | 'HR' | 'Marketing' | 'Operations';
  role: UserRole;
  companyId: string;
  active: boolean;
  companyCode: string;
  googleCalendarId?: string | null; // Unique ID for the user's Google Calendar
  isGoogleCalendarConnected?: boolean; // Tracks if user has "granted permission"
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // ISO String
  checkOut: string | null; // ISO String
  hoursWorked: number;
  mode: 'WFO' | 'WFH';
  location_lat: number | null;
  location_lng: number | null;
  status: 'PRESENT' | 'INCOMPLETE';
}

export interface Leave {
  id: string;
  employeeId: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy: string | null; // Employee ID of manager/admin
  calendarEventId: string | null;
  attachment?: {
    name: string;
  } | null;
}