import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, Attendance, Leave, Company } from './types';
import { initialCompanies, initialEmployees, initialAttendance, initialLeaves } from './data';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

export const AppContext = React.createContext<any>(null);

// Helper function to generate a classroom-style company code
const generateCompanyCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789'; // Avoid ambiguous chars like O, 0, I, l
    let result = '';
    for (let i = 0; i < 7; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
        if (i === 2) {
            result += '-';
        }
    }
    return result;
};

interface AppData {
  companies: Company[];
  employees: Employee[];
  attendance: Attendance[];
  leaves: Leave[];
}

const App: React.FC = () => {
  // --- UNIFIED STATE MANAGEMENT ---
  const [appData, setAppData] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem('pulsehr-appData');
      return saved ? JSON.parse(saved) : { companies: initialCompanies, employees: initialEmployees, attendance: initialAttendance, leaves: initialLeaves };
    } catch (error) {
      console.error("Failed to parse appData from localStorage", error);
      return { companies: initialCompanies, employees: initialEmployees, attendance: initialAttendance, leaves: initialLeaves };
    }
  });

  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    try {
      const saved = localStorage.getItem('pulsehr-currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to parse currentUser from localStorage", error);
      return null;
    }
  });

  // --- PERSISTENCE FIX ---
  // A dedicated function to update state and localStorage atomically.
  // This is more reliable than relying on useEffect for critical saves.
  const updateAppData = (newData: AppData) => {
    localStorage.setItem('pulsehr-appData', JSON.stringify(newData));
    setAppData(newData);
  };
  
  // Persist current user separately
  useEffect(() => { 
    localStorage.setItem('pulsehr-currentUser', JSON.stringify(currentUser));
  }, [currentUser]);

  // --- API-LIKE FUNCTIONS (refactored for atomic state updates) ---
  const handleLogin = (email: string, password: string): boolean => {
    const user = appData.employees.find(e => e.email.toLowerCase() === email.toLowerCase() && e.password === password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const handleLogout = () => setCurrentUser(null);

  const handleCreateCompanyAndAdmin = (companyName: string, adminName: string, adminEmail: string, adminPassword: string) => {
    const newCompanyCode = generateCompanyCode();
    const newCompany: Company = {
      id: `comp-${Date.now()}`,
      name: companyName,
      code: newCompanyCode,
      office_lat: 0,
      office_lng: 0,
    };

    const newAdmin: Employee = {
      id: `emp-${Date.now()}`,
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      department: 'HR', // Default for admin
      role: 'ADMIN',
      companyId: newCompany.id,
      active: true,
      companyCode: newCompany.code,
      googleCalendarId: `cal-${adminEmail.toLowerCase()}`,
      isGoogleCalendarConnected: false,
    };
    
    updateAppData({
        ...appData,
        companies: [...appData.companies, newCompany],
        // FIX: Use `appData` instead of `app` which is not defined.
        employees: [...appData.employees, newAdmin],
    });
    setCurrentUser(newAdmin);
    alert(`Company created! Your company code is: ${newCompanyCode}`);
  };


  const handleRegister = (name: string, email: string, password: string, department: Employee['department'], role: Employee['role'], companyCode: string) => {
    const company = appData.companies.find(c => c.code.toUpperCase() === companyCode.toUpperCase());
    if (!company) {
      alert('Invalid company code.');
      return false;
    }
    if (appData.employees.some(e => e.email.toLowerCase() === email.toLowerCase())) {
        alert('An employee with this email already exists.');
        return false;
    }

    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      name,
      email,
      password,
      department,
      role,
      companyId: company.id,
      active: true,
      companyCode: company.code,
      googleCalendarId: `cal-${email.toLowerCase()}`,
      isGoogleCalendarConnected: false,
    };

    updateAppData({ ...appData, employees: [...appData.employees, newEmployee] });
    setCurrentUser(newEmployee);
    return true;
  };
  
  const handleCheckIn = (lat: number, lng: number, mode: 'WFO' | 'WFH') => {
    if (!currentUser) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const newRecord: Attendance = {
      id: `att-${Date.now()}`,
      employeeId: currentUser.id,
      date: todayStr,
      checkIn: new Date().toISOString(),
      checkOut: null,
      hoursWorked: 0,
      mode,
      location_lat: lat,
      location_lng: lng,
      status: 'PRESENT',
    };
    updateAppData({ ...appData, attendance: [...appData.attendance, newRecord] });
  };

  const handleCheckOut = () => {
    if (!currentUser) return;
    const todayStr = new Date().toISOString().split('T')[0];
    
    const newAttendance = appData.attendance.map(rec => {
      if (rec.employeeId === currentUser.id && rec.date === todayStr && rec.checkOut === null) {
        const checkOutTime = new Date();
        const checkInTime = new Date(rec.checkIn!);
        const hoursWorked = parseFloat(((checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)).toFixed(2));
        return {
          ...rec,
          checkOut: checkOutTime.toISOString(),
          hoursWorked,
          status: (hoursWorked >= 8 ? 'PRESENT' : 'INCOMPLETE') as 'PRESENT' | 'INCOMPLETE',
        };
      }
      return rec;
    });

    updateAppData({ ...appData, attendance: newAttendance });
  };
  
  const handleApplyLeave = (fromDate: string, toDate: string, reason: string, attachment: { name: string } | null) => {
    if (!currentUser) return;
    const newRequest: Leave = {
      id: `leave-${Date.now()}`,
      employeeId: currentUser.id,
      fromDate,
      toDate,
      reason,
      status: 'PENDING',
      approvedBy: null,
      calendarEventId: null,
      attachment,
    };
    updateAppData({ ...appData, leaves: [...appData.leaves, newRequest] });
  };

  const handleLeaveAction = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!currentUser || currentUser.role === 'EMPLOYEE') return;
    await new Promise(resolve => setTimeout(resolve, 700));

    const newLeaves = appData.leaves.map(req => {
        if (req.id === leaveId) {
            const employee = appData.employees.find(e => e.id === req.employeeId);
            if (!employee) return req;

            if (status === 'APPROVED') {
                if (employee.isGoogleCalendarConnected) {
                    const newCalendarEventId = `gcal-${Date.now()}`;
                    console.log(`Simulating: Creating event on calendar ${employee.googleCalendarId} for ${employee.name}. Event ID: ${newCalendarEventId}`);
                    return { ...req, status, approvedBy: currentUser.id, calendarEventId: newCalendarEventId };
                } else {
                    console.log(`Simulating: Approving leave for ${employee.name}, but calendar event not created as they haven't connected their Google Calendar.`);
                    return { ...req, status, approvedBy: currentUser.id, calendarEventId: null };
                }
            }
            
            if (req.status === 'APPROVED' && req.calendarEventId && employee.googleCalendarId) {
                 console.log(`Simulating: Deleting event ${req.calendarEventId} from calendar ${employee.googleCalendarId} for ${employee.name}.`);
            }
            return { ...req, status, approvedBy: currentUser.id, calendarEventId: null };
        }
        return req;
    });
    updateAppData({ ...appData, leaves: newLeaves });
  };

  const handleUpdateOfficeLocation = (lat: number, lng: number) => {
    if (currentUser?.role !== 'ADMIN') return;
    const newCompanies = appData.companies.map(c => c.id === currentUser.companyId ? { ...c, office_lat: lat, office_lng: lng } : c);
    updateAppData({ ...appData, companies: newCompanies });
  };

  const handleToggleGCalConnection = () => {
      if (!currentUser) return;
      const newEmployees = appData.employees.map(e => e.id === currentUser.id ? { ...e, isGoogleCalendarConnected: !e.isGoogleCalendarConnected } : e);
      updateAppData({ ...appData, employees: newEmployees });
      // Also update the currentUser state to reflect the change immediately in the UI
      setCurrentUser(prevUser => prevUser ? { ...prevUser, isGoogleCalendarConnected: !prevUser.isGoogleCalendarConnected } : null);
      alert(`Simulated: Google Calendar has been ${!currentUser.isGoogleCalendarConnected ? 'connected' : 'disconnected'}.`);
  };
  
  const contextValue = useMemo(() => ({
    currentUser,
    companies: appData.companies,
    employees: appData.employees,
    attendance: appData.attendance,
    leaves: appData.leaves,
    handleLogin,
    handleLogout,
    handleRegister,
    handleCreateCompanyAndAdmin,
    handleCheckIn,
    handleCheckOut,
    handleApplyLeave,
    handleLeaveAction,
    handleUpdateOfficeLocation,
    handleToggleGCalConnection,
  }), [currentUser, appData]);

  return (
    <AppContext.Provider value={contextValue}>
      {currentUser ? <Dashboard /> : <LoginScreen />}
    </AppContext.Provider>
  );
};

export default App;
