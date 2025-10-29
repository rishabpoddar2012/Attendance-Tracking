import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { HomeIcon, ClockIcon, CalendarIcon, UsersIcon, ClipboardListIcon, ChartBarIcon, SettingsIcon, LogOutIcon, PulseIcon, SendIcon, CheckCircle, XCircle } from './icons';
import type { Employee, AttendanceRecord, LeaveRequest } from '../types';

// --- Helper Functions ---
const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
const formatTime = (dateString: string | null) => dateString ? new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
const getHoursWorked = (start: string | null, end: string | null) => {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return parseFloat((diff / (1000 * 60 * 60)).toFixed(2));
};

// --- Employee View Components ---
const CheckInOut: React.FC = () => {
    const { currentUser, attendance, handleCheckIn, handleCheckOut } = useContext(AppContext);
    const [statusMessage, setStatusMessage] = useState<{msg: string, isError: boolean} | null>(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = attendance.find((a: AttendanceRecord) => a.employeeId === currentUser.id && a.date === todayStr);

    const onCheckInClick = () => {
        setIsCheckingIn(true);
        handleCheckIn((msg: string, isError = false) => {
            setStatusMessage({ msg, isError });
            setIsCheckingIn(false);
            if (!isError) {
                setTimeout(() => setStatusMessage(null), 3000);
            }
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
            <h3 className="font-bold text-lg">Today's Attendance</h3>
            <div className="flex justify-around items-center text-center">
                <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-bold text-xl">{formatTime(todayRecord?.checkInTime)}</p>
                </div>
                <div className="h-12 border-l border-gray-200"></div>
                <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-bold text-xl">{formatTime(todayRecord?.checkOutTime)}</p>
                </div>
            </div>
            {statusMessage && (
                <div className={`p-3 rounded-md text-sm ${statusMessage.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {statusMessage.msg}
                </div>
            )}
             <div className="flex gap-4">
                <button 
                    onClick={onCheckInClick} 
                    disabled={!!todayRecord?.checkInTime || isCheckingIn}
                    className="w-full bg-green-500 text-white font-bold py-3 rounded-lg disabled:bg-gray-300 transition-colors">
                    {isCheckingIn ? 'Checking Location...' : 'Check In'}
                </button>
                <button 
                    onClick={handleCheckOut} 
                    disabled={!todayRecord?.checkInTime || !!todayRecord?.checkOutTime}
                    className="w-full bg-red-500 text-white font-bold py-3 rounded-lg disabled:bg-gray-300 transition-colors">
                    Check Out
                </button>
            </div>
        </div>
    );
};

const LeaveForm: React.FC = () => {
    const { currentUser, handleApplyLeave } = useContext(AppContext);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    
    const remainingLeave = currentUser.annualLeaveBalance - currentUser.leaveTaken;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!from || !to || !reason) return;

        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (toDate < fromDate) {
            setError('"To" date cannot be before "From" date.');
            return;
        }

        const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
        const requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (requestedDays > remainingLeave) {
            setError(`You only have ${remainingLeave} days of leave remaining.`);
            return;
        }

        handleApplyLeave(from, to, reason);
        setFrom('');
        setTo('');
        setReason('');
        alert('Leave request submitted!');
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Apply for Leave</h3>
                <div className="text-right">
                    <p className="font-bold text-lg text-blue-600">{remainingLeave}</p>
                    <p className="text-xs text-gray-500">Days Remaining</p>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4">
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)} required className="w-full p-2 border rounded-md"/>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)} required className="w-full p-2 border rounded-md"/>
                </div>
                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for leave..." required className="w-full p-2 border rounded-md h-24"></textarea>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <SendIcon className="w-5 h-5" />
                    Submit Request
                </button>
            </form>
        </div>
    );
};

const MyAttendance: React.FC = () => {
    const { currentUser, attendance } = useContext(AppContext);
    const myRecords = useMemo(() => 
        attendance
            .filter((a: AttendanceRecord) => a.employeeId === currentUser.id)
            .sort((a: AttendanceRecord, b: AttendanceRecord) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [attendance, currentUser.id]
    );

    return (
         <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-4">My Attendance History</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Check-in</th>
                            <th className="p-3">Check-out</th>
                            <th className="p-3">Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myRecords.map((r: AttendanceRecord) => (
                            <tr key={r.id} className="border-b">
                                <td className="p-3">{formatDate(r.date)}</td>
                                <td className="p-3">{formatTime(r.checkInTime)}</td>
                                <td className="p-3">{formatTime(r.checkOutTime)}</td>
                                <td className="p-3">{getHoursWorked(r.checkInTime, r.checkOutTime).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Manager View Components ---
const TodayAttendance: React.FC = () => {
    const { employees, attendance, leaveRequests } = useContext(AppContext);
    const todayStr = new Date().toISOString().split('T')[0];

    const departmentalStatus = useMemo(() => {
        const employeeStatuses = employees.map((emp: Employee) => {
            const todayRecord = attendance.find((a: AttendanceRecord) => a.employeeId === emp.id && a.date === todayStr);
            const onLeave = leaveRequests.find((l: LeaveRequest) => l.employeeId === emp.id && l.status === 'Approved' && todayStr >= l.from && todayStr <= l.to);

            let status = 'Absent';
            let color = 'bg-red-100 text-red-700';
            let details = 'Not checked in yet.';
            let isPresent = false;

            if (onLeave) {
                status = 'On Leave';
                color = 'bg-yellow-100 text-yellow-700';
                details = 'Approved leave.';
            } else if (todayRecord) {
                const hours = getHoursWorked(todayRecord.checkInTime, todayRecord.checkOutTime);
                if (todayRecord.checkOutTime) {
                    status = hours >= 8 ? 'Completed' : 'Incomplete';
                    color = hours >= 8 ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700';
                    details = `${formatTime(todayRecord.checkInTime)} - ${formatTime(todayRecord.checkOutTime)} (${hours.toFixed(2)} hrs)`;
                    isPresent = true;
                } else {
                    status = 'Present';
                    color = 'bg-green-100 text-green-700';
                    details = `Checked in at ${formatTime(todayRecord.checkInTime)}`;
                    isPresent = true;
                }
            }
            return { ...emp, status, color, details, isPresent };
        });

        // Fix: Define strong types for the accumulator to ensure correct type inference for `departmentalStatus`.
        type EmployeeWithStatus = Employee & { status: string; color: string; details: string; isPresent: boolean };
        type DepartmentalStatusData = { employees: EmployeeWithStatus[], presentCount: number, totalCount: number };

        // Fix: Explicitly type the accumulator `acc` to resolve type inference issues.
        return employeeStatuses.reduce((acc: Record<string, DepartmentalStatusData>, emp) => {
            const dept = emp.department;
            if (!acc[dept]) {
                acc[dept] = { employees: [], presentCount: 0, totalCount: 0 };
            }
            acc[dept].employees.push(emp);
            acc[dept].totalCount += 1;
            if (emp.isPresent) {
                acc[dept].presentCount += 1;
            }
            return acc;
        }, {} as Record<string, DepartmentalStatusData>);
        
    }, [employees, attendance, leaveRequests]);

    const overallStats = useMemo(() => {
        const statuses = employees.map((emp: Employee) => {
            const todayRecord = attendance.find((a: AttendanceRecord) => a.employeeId === emp.id && a.date === todayStr);
            const onLeave = leaveRequests.find((l: LeaveRequest) => l.employeeId === emp.id && l.status === 'Approved' && todayStr >= l.from && todayStr <= l.to);
            if (onLeave) return 'leave';
            if (todayRecord) return 'present';
            return 'absent';
        });

        return {
            present: statuses.filter(s => s === 'present').length,
            absent: statuses.filter(s => s === 'absent').length,
            onLeave: statuses.filter(s => s === 'leave').length,
            total: employees.length,
        };
    }, [employees, attendance, leaveRequests]);

    return (
        <div className="space-y-6">
            <h3 className="font-bold text-xl">Today's Attendance Overview</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-100 p-4 rounded-lg">
                    <p className="text-sm text-green-800 font-semibold">Present</p>
                    <p className="text-2xl font-bold text-green-900">{overallStats.present} / {overallStats.total}</p>
                </div>
                <div className="bg-red-100 p-4 rounded-lg">
                    <p className="text-sm text-red-800 font-semibold">Absent</p>
                    <p className="text-2xl font-bold text-red-900">{overallStats.absent}</p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-lg">
                    <p className="text-sm text-yellow-800 font-semibold">On Leave</p>
                    <p className="text-2xl font-bold text-yellow-900">{overallStats.onLeave}</p>
                </div>
                <div className="bg-blue-100 p-4 rounded-lg">
                    <p className="text-sm text-blue-800 font-semibold">Total Employees</p>
                    <p className="text-2xl font-bold text-blue-900">{overallStats.total}</p>
                </div>
            </div>

            <div className="space-y-6">
                {Object.entries(departmentalStatus).map(([department, data]) => (
                    <div key={department} className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-lg">{department}</h4>
                            <span className="text-sm font-semibold text-gray-600">
                                {data.presentCount} / {data.totalCount} Present
                            </span>
                        </div>
                        <div className="space-y-3">
                            {data.employees.map(emp => (
                                <div key={emp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <div>
                                        <p className="font-semibold">{emp.name}</p>
                                        <p className="text-xs text-gray-500">{emp.details}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${emp.color}`}>{emp.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LeaveApprovals: React.FC = () => {
    const { employees, leaveRequests, handleLeaveAction } = useContext(AppContext);
    const pendingRequests = leaveRequests.filter((l: LeaveRequest) => l.status === 'Pending');

    return (
         <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-4">Pending Leave Requests</h3>
            <div className="space-y-4">
                {pendingRequests.length === 0 && <p className="text-gray-500">No pending requests.</p>}
                {pendingRequests.map((req: LeaveRequest) => {
                    const employee = employees.find((e: Employee) => e.id === req.employeeId);
                    return (
                        <div key={req.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold">{employee?.name}</p>
                                    <p className="text-sm text-gray-600">{formatDate(req.from)} to {formatDate(req.to)}</p>
                                    <p className="text-sm mt-2 text-gray-500 bg-gray-100 p-2 rounded">{req.reason}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleLeaveAction(req.id, 'Approved')} className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"><CheckCircle className="w-5 h-5"/></button>
                                    <button onClick={() => handleLeaveAction(req.id, 'Rejected')} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"><XCircle className="w-5 h-5"/></button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const EmployeeManagement: React.FC = () => {
    const { employees, handleAddNewEmployee } = useContext(AppContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState<Employee['department']>('Other');
    const [role, setRole] = useState<'Staff' | 'Manager'>('Staff');
    const [showForm, setShowForm] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(name && email && department && role) {
            handleAddNewEmployee(name, email, department, role);
            setName('');
            setEmail('');
            setDepartment('Other');
            setRole('Staff');
            setShowForm(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Manage Employees</h3>
                    <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        {showForm ? 'Cancel' : '+ Add Employee'}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} className="p-4 border rounded-lg mb-6 space-y-4 bg-gray-50">
                        <h4 className="font-semibold">New Employee Form</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} required className="p-2 border rounded-md" />
                            <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} required className="p-2 border rounded-md" />
                            <select value={department} onChange={e => setDepartment(e.target.value as any)} className="p-2 border rounded-md bg-white">
                                <option>Sales</option>
                                <option>Ops</option>
                                <option>HR</option>
                                <option>Finance</option>
                                <option>Other</option>
                            </select>
                            <select value={role} onChange={e => setRole(e.target.value as any)} className="p-2 border rounded-md bg-white">
                                <option>Staff</option>
                                <option>Manager</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full md:w-auto bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">Save Employee</button>
                    </form>
                )}
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3">Name</th>
                                <th className="p-3">Email</th>
                                <th className="p-3">Department</th>
                                <th className="p-3">Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp: Employee) => (
                                <tr key={emp.id} className="border-b">
                                    <td className="p-3 font-medium">{emp.name}</td>
                                    <td className="p-3 text-gray-600">{emp.email}</td>
                                    <td className="p-3"><span className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-full">{emp.department}</span></td>
                                    <td className="p-3 text-gray-600">{emp.role}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const Settings: React.FC = () => {
    const { officeLocation, handleSetOfficeLocation, handleResetData } = useContext(AppContext);
    const [lat, setLat] = useState(officeLocation.lat);
    const [lon, setLon] = useState(officeLocation.lon);
    const [saved, setSaved] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSetOfficeLocation(parseFloat(lat as any), parseFloat(lon as any));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold text-lg mb-4">Office Settings</h3>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Office Latitude</label>
                        <input type="number" step="any" value={lat} onChange={e => setLat(e.target.value as any)} required className="mt-1 w-full p-2 border rounded-md"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Office Longitude</label>
                        <input type="number" step="any" value={lon} onChange={e => setLon(e.target.value as any)} required className="mt-1 w-full p-2 border rounded-md"/>
                    </div>
                    <div className="flex items-center gap-4">
                        <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                            Save Location
                        </button>
                        {saved && <span className="text-sm text-green-600 font-medium">Settings saved!</span>}
                    </div>
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-bold text-lg text-red-700">Danger Zone</h3>
                <p className="text-sm text-gray-600 mt-2 mb-4">These actions are permanent and cannot be undone.</p>
                <button 
                    onClick={handleResetData} 
                    className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm">
                    Reset Application Data
                </button>
            </div>
        </div>
    );
};

const Reports: React.FC = () => (
    <div className="bg-white p-6 rounded-lg shadow text-center">
        <h3 className="font-bold text-lg mb-4">Reports & Analytics</h3>
        <p className="text-gray-500">Analytics dashboard coming soon.</p>
        <ChartBarIcon className="w-24 h-24 mx-auto text-gray-200 mt-4"/>
    </div>
);


// --- Main Dashboard Component ---
const Dashboard: React.FC = () => {
    const { currentUser, handleLogout } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('home');

    const isManager = currentUser.role !== 'Staff';
    const isOwner = currentUser.role === 'Owner';

    const baseNavItems = isManager
        ? [
            { id: 'home', label: "Dashboard", icon: HomeIcon },
            { id: 'approvals', label: 'Leave Approvals', icon: ClipboardListIcon },
            { id: 'employees', label: 'Manage Employees', icon: UsersIcon },
            { id: 'reports', label: 'Reports', icon: ChartBarIcon },
          ]
        : [
            { id: 'home', label: 'My Dashboard', icon: ClockIcon },
            { id: 'history', label: 'Attendance History', icon: CalendarIcon },
          ];
    
    const navItems = isOwner ? [...baseNavItems, { id: 'settings', label: 'Settings', icon: SettingsIcon }] : baseNavItems;

    const renderContent = () => {
        if (isManager) {
            switch (activeTab) {
                case 'home': return <TodayAttendance />;
                case 'approvals': return <LeaveApprovals />;
                case 'employees': return <EmployeeManagement />;
                case 'reports': return <Reports />;
                case 'settings': return isOwner ? <Settings /> : <TodayAttendance />;
                default: return <TodayAttendance />;
            }
        } else {
            switch (activeTab) {
                case 'home': return <div className="space-y-6"><CheckInOut /><LeaveForm /></div>;
                case 'history': return <MyAttendance />;
                default: return <div className="space-y-6"><CheckInOut /><LeaveForm /></div>;
            }
        }
    };
    
    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white flex flex-col shadow-md">
                <div className="flex items-center gap-2 p-4 border-b">
                    <PulseIcon className="w-8 h-8 text-blue-600" />
                    <h1 className="text-xl font-bold">PulseHR</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button key={item.id} onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                                    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                                }`}>
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
                <div className="p-4 border-t">
                     <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100">
                        <LogOutIcon className="h-5 w-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm p-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold">
                        Welcome, {currentUser.name}!
                    </h2>
                     <div className="text-sm text-gray-500">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </header>
                <div className="flex-1 p-6 overflow-y-auto">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;