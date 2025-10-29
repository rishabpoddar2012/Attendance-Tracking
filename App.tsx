import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, AttendanceRecord, LeaveRequest } from './types';
import { initialEmployees, initialAttendance, initialLeaveRequests } from './data';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

export const AppContext = React.createContext<any>(null);

// Helper to calculate distance between two lat/lon points in meters
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

const App: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('pulsehr-employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('pulsehr-attendance');
    return saved ? JSON.parse(saved) : initialAttendance;
  });
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem('pulsehr-leaveRequests');
    return saved ? JSON.parse(saved) : initialLeaveRequests;
  });
  const [officeLocation, setOfficeLocation] = useState<{lat: number, lon: number}>(() => {
    const saved = localStorage.getItem('pulsehr-officeLocation');
    return saved ? JSON.parse(saved) : { lat: 37.7749, lon: -122.4194 }; // Default SF
  });
  
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  useEffect(() => {
    localStorage.setItem('pulsehr-employees', JSON.stringify(employees));
  }, [employees]);
  useEffect(() => {
    localStorage.setItem('pulsehr-attendance', JSON.stringify(attendance));
  }, [attendance]);
  useEffect(() => {
    localStorage.setItem('pulsehr-leaveRequests', JSON.stringify(leaveRequests));
  }, [leaveRequests]);
  useEffect(() => {
    localStorage.setItem('pulsehr-officeLocation', JSON.stringify(officeLocation));
  }, [officeLocation]);


  const handleLogin = (employeeId: string) => {
    const user = employees.find(e => e.id === employeeId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCheckIn = (onStatus: (msg: string, isError?: boolean) => void) => {
    if (!currentUser) return;
    const existingEntry = attendance.find(a => a.employeeId === currentUser.id && a.date === todayStr);
    if (existingEntry) return;

    onStatus("Getting your location...", false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistance(latitude, longitude, officeLocation.lat, officeLocation.lon);
        
        if (distance <= 100) { // 100 meters radius
            const newRecord: AttendanceRecord = {
              id: `att-${Date.now()}`,
              employeeId: currentUser.id,
              date: todayStr,
              checkInTime: new Date().toISOString(),
              checkOutTime: null,
              source: 'Manual',
            };
            setAttendance(prev => [...prev, newRecord]);
            onStatus("Check-in successful!", false);
        } else {
            onStatus(`You are ${Math.round(distance)} meters away. You must be within 100m of the office to check in.`, true);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        onStatus("Could not get your location. Please enable location services.", true);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCheckOut = () => {
    if (!currentUser) return;
    setAttendance(prev => prev.map(record => 
      (record.employeeId === currentUser.id && record.date === todayStr)
        ? { ...record, checkOutTime: new Date().toISOString() }
        : record
    ));
  };
  
  const handleApplyLeave = (from: string, to: string, reason: string) => {
    if (!currentUser) return;
    const newRequest: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeId: currentUser.id,
      from,
      to,
      reason,
      status: 'Pending',
      approvedById: null,
    };
    setLeaveRequests(prev => [...prev, newRequest]);
  };

  const handleLeaveAction = (leaveId: string, status: 'Approved' | 'Rejected') => {
    if (!currentUser || currentUser.role === 'Staff') return;
    
    let leaveToProcess: LeaveRequest | undefined;
    const updatedLeaveRequests = leaveRequests.map(req => {
      if (req.id === leaveId) {
        leaveToProcess = { ...req, status, approvedById: currentUser.id };
        return leaveToProcess;
      }
      return req;
    });
    setLeaveRequests(updatedLeaveRequests);

    if (status === 'Approved' && leaveToProcess) {
      const fromDate = new Date(leaveToProcess.from);
      const toDate = new Date(leaveToProcess.to);
      const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      setEmployees(prev => prev.map(emp => 
        emp.id === leaveToProcess!.employeeId 
          ? { ...emp, leaveTaken: emp.leaveTaken + diffDays }
          : emp
      ));
    }
  };

  const handleAddNewEmployee = (name: string, email: string, department: Employee['department'], role: 'Staff' | 'Manager') => {
    const newEmployee: Employee = {
        id: `emp-${Date.now()}`,
        employeeId: Math.floor(1000 + Math.random() * 9000), // random ID
        name,
        email,
        department,
        role,
        active: true,
        annualLeaveBalance: 20,
        leaveTaken: 0,
    };
    setEmployees(prev => [...prev, newEmployee]);
  };

  const handleSetOfficeLocation = (lat: number, lon: number) => {
    if(currentUser?.role === 'Owner') {
        setOfficeLocation({ lat, lon });
    }
  };

  const handleResetData = () => {
    if (currentUser?.role === 'Owner') {
      if (window.confirm("Are you sure you want to reset all data to the initial demo state? This cannot be undone.")) {
        setEmployees(initialEmployees);
        setAttendance(initialAttendance);
        setLeaveRequests(initialLeaveRequests);
        setOfficeLocation({ lat: 37.7749, lon: -122.4194 });
        alert("Application data has been reset.");
      }
    }
  };

  const contextValue = useMemo(() => ({
    employees,
    attendance,
    leaveRequests,
    currentUser,
    officeLocation,
    handleLogout,
    handleCheckIn,
    handleCheckOut,
    handleApplyLeave,
    handleLeaveAction,
    handleAddNewEmployee,
    handleSetOfficeLocation,
    handleResetData,
  }), [employees, attendance, leaveRequests, currentUser, officeLocation]);

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} employees={employees} />;
  }

  return (
    <AppContext.Provider value={contextValue}>
      <Dashboard />
    </AppContext.Provider>
  );
};

export default App;