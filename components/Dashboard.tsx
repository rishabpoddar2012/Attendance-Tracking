import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { HomeIcon, ClockIcon, CalendarIcon, UsersIcon, SettingsIcon, LogOutIcon, ClockIconCircled, SendIcon, CheckCircle, XCircle, ChartBarIcon, GoogleCalendarIcon, SpinnerIcon, ClipboardIcon, ClipboardCheckIcon, ChevronLeftIcon, ChevronRightIcon, PaperclipIcon, XIcon } from './icons';
import type { Employee, Attendance, Leave, Company } from '../types';
import { Chatbot } from './Chatbot';

// --- Helper Functions ---
const formatDate = (dateString: string | null | Date) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
     // Add time zone offset to prevent off-by-one day errors
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'});
};
const formatTime = (dateString: string | null) => dateString ? new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
const getDistance = (lat1: number, lon1: number, lat2: number, lon2:number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180; const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // in metres
}
const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];

// --- Card Component ---
const Card: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white p-6 rounded-xl shadow-md ${className}`}>
        <h3 className="font-bold text-lg text-gray-800 mb-4">{title}</h3>
        {children}
    </div>
);

// --- HIGH VISIBILITY INPUT STYLES ---
const inputStyles = "mt-1 w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";


// --- EMPLOYEE DASHBOARD ---
const EmployeeDashboard = () => {
    const { currentUser, attendance, leaves, companies, handleCheckIn, handleCheckOut, handleApplyLeave, handleToggleGCalConnection } = useContext(AppContext);
    const [statusMessage, setStatusMessage] = useState<{msg: string, isError: boolean} | null>(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    
    // State for leave form
    const [leaveFromDate, setLeaveFromDate] = useState<Date | null>(null);
    const [leaveToDate, setLeaveToDate] = useState<Date | null>(null);
    const [leaveReason, setLeaveReason] = useState('');
    const [leaveAttachment, setLeaveAttachment] = useState<File | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [dateError, setDateError] = useState<string | null>(null);


    const [activeTab, setActiveTab] = useState('dashboard');

    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = attendance.find((a: Attendance) => a.employeeId === currentUser.id && a.date === todayStr);
    const myCompany = companies.find((c: Company) => c.id === currentUser.companyId);

    const onCheckInClick = () => {
        setIsCheckingIn(true);
        setStatusMessage({ msg: "Verifying your location...", isError: false });
        if (!myCompany || myCompany.office_lat === 0) {
            setStatusMessage({ msg: "Office location not set. Checked-in as WFH.", isError: false });
            handleCheckIn(0, 0, 'WFH');
            setIsCheckingIn(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const distance = getDistance(latitude, longitude, myCompany.office_lat, myCompany.office_lng);
                
                if (distance <= 300) { // 300 meters radius for WFO
                    handleCheckIn(latitude, longitude, 'WFO');
                    setStatusMessage({ msg: `Check-in successful (WFO). You are ${Math.round(distance)}m from the office.`, isError: false });
                } else {
                    handleCheckIn(latitude, longitude, 'WFH');
                    setStatusMessage({ msg: `You are too far for WFO. Checked-in as WFH.`, isError: false });
                }
                setIsCheckingIn(false);
            },
            (error) => {
                setStatusMessage({ msg: "Could not get location. Checked in as WFH.", isError: true });
                handleCheckIn(0, 0, 'WFH');
                setIsCheckingIn(false);
            }, { enableHighAccuracy: true }
        );
    };

    const handleLeaveSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setDateError(null);
        if (!leaveFromDate || !leaveToDate || !leaveReason) {
            alert('Please fill all fields.');
            return;
        }
        if (leaveToDate < leaveFromDate) {
            setDateError("'To' date cannot be before 'From' date.");
            return;
        }
        handleApplyLeave(toYYYYMMDD(leaveFromDate), toYYYYMMDD(leaveToDate), leaveReason, leaveAttachment ? { name: leaveAttachment.name } : null);
        
        // Reset form
        handleClearDates();
        setLeaveReason('');
        setLeaveAttachment(null);
        alert('Leave request submitted!');
    };

    const handleClearDates = () => {
        setLeaveFromDate(null);
        setLeaveToDate(null);
        setDateError(null);
    };
    
    // Memoized display value for the date range picker to provide immediate feedback.
    const dateDisplayValue = useMemo(() => {
        if (leaveFromDate && leaveToDate) {
            return `${formatDate(leaveFromDate)} - ${formatDate(leaveToDate)}`;
        }
        if (leaveFromDate) {
            return `${formatDate(leaveFromDate)} - Select To Date`;
        }
        return 'Select date range';
    }, [leaveFromDate, leaveToDate]);

    const myAttendanceHistory = useMemo(() => attendance.filter((a: Attendance) => a.employeeId === currentUser.id).sort((a: Attendance, b: Attendance) => new Date(b.date).getTime() - new Date(a.date).getTime()), [attendance, currentUser.id]);
    const myLeaveHistory = useMemo(() => leaves.filter((l: Leave) => l.employeeId === currentUser.id).sort((a: Leave, b: Leave) => new Date(b.fromDate).getTime() - new Date(a.fromDate).getTime()), [leaves, currentUser.id]);

    const renderDashboard = () => (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Card title="My Attendance">
                    <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 sticky top-0"><tr className="text-slate-500 uppercase text-xs tracking-wider"><th className="p-4 font-semibold">Date</th><th className="p-4 font-semibold">Check-in</th><th className="p-4 font-semibold">Check-out</th><th className="p-4 font-semibold">Hours</th><th className="p-4 font-semibold">Mode</th></tr></thead>
                            <tbody>
                                {myAttendanceHistory.map((r: Attendance) => (<tr key={r.id} className="border-b border-slate-100"><td className="p-4">{formatDate(r.date)}</td><td className="p-4">{formatTime(r.checkIn)}</td><td className="p-4">{formatTime(r.checkOut)}</td><td className="p-4">{r.hoursWorked.toFixed(2)}</td><td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${r.mode === 'WFO' ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'}`}>{r.mode}</span></td></tr>))}
                            </tbody>
                        </table>
                    </div>
                </Card>
                <Card title="My Leave Requests">
                      <div className="overflow-x-auto max-h-96">
                        <table className="w-full text-sm text-left">
                             <thead className="bg-slate-50 sticky top-0"><tr className="text-slate-500 uppercase text-xs tracking-wider"><th className="p-4 font-semibold">Dates</th><th className="p-4 font-semibold">Reason</th><th className="p-4 font-semibold">Status</th></tr></thead>
                             <tbody>
                                {myLeaveHistory.map((r: Leave) => (<tr key={r.id} className="border-b border-slate-100"><td className="p-4">{formatDate(r.fromDate)} - {formatDate(r.toDate)}</td><td className="p-4 truncate max-w-xs">{r.reason}</td><td className="p-4"><div className="flex items-center gap-2"><span className={`px-2 py-1 text-xs font-bold rounded-full ${r.status === 'APPROVED' ? 'bg-green-100 text-green-800' : r.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{r.status}</span>{r.calendarEventId && <div title={`Event ${r.calendarEventId} synced to Google Calendar`}><GoogleCalendarIcon className="w-4 h-4 text-gray-500"/></div>}{r.attachment && <div title={r.attachment.name}><PaperclipIcon className="w-4 h-4 text-gray-400" /></div>}</div></td></tr>))}
                             </tbody>
                        </table>
                    </div>
                </Card>
            </div>
            <div className="space-y-8">
                <Card title="Today's Attendance">
                    <div className="flex justify-around text-center py-4"><p><strong>Check In:</strong><br/>{formatTime(todayRecord?.checkIn)}</p><p><strong>Check Out:</strong><br/>{formatTime(todayRecord?.checkOut)}</p></div>
                    {statusMessage && <div className={`p-3 mb-4 rounded-md text-sm ${statusMessage.isError ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>{statusMessage.msg}</div>}
                    <div className="flex gap-4">
                        <button onClick={onCheckInClick} disabled={!!todayRecord?.checkIn || isCheckingIn} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg disabled:bg-gray-300 hover:bg-green-600 transition-all">{isCheckingIn ? 'Checking In...' : 'Check In'}</button>
                        <button onClick={handleCheckOut} disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut} className="w-full bg-red-500 text-white font-bold py-3 rounded-lg disabled:bg-gray-300 hover:bg-red-600 transition-all">Check Out</button>
                    </div>
                </Card>
                <Card title="Apply for Leave">
                     <form onSubmit={handleLeaveSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-medium">Dates</label>
                             <div className="relative">
                                <button type="button" onClick={() => setShowCalendar(true)} className={`${inputStyles} text-left w-full flex justify-between items-center pr-2`}>
                                     <span className={leaveFromDate ? 'text-slate-900' : 'text-slate-400'}>
                                        {dateDisplayValue}
                                    </span>
                                    <CalendarIcon className="w-5 h-5 text-slate-400"/>
                                </button>
                                {leaveFromDate && (
                                     <button type="button" onClick={handleClearDates} className="absolute right-10 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200">
                                         <XIcon className="w-4 h-4 text-slate-500"/>
                                     </button>
                                )}
                             </div>
                            {showCalendar && <CalendarRangePicker fromDate={leaveFromDate} toDate={leaveToDate} setFromDate={setLeaveFromDate} setToDate={setLeaveToDate} onClose={() => setShowCalendar(false)} />}
                            {dateError && <p className="text-red-500 text-xs mt-1">{dateError}</p>}
                        </div>
                        <div><label className="text-xs font-medium">Reason</label><textarea value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="Reason for leave..." required className={`${inputStyles} h-20`}></textarea></div>
                        <div>
                            <label htmlFor="attachment" className="w-full bg-slate-100 text-slate-700 font-semibold py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                                <PaperclipIcon className="w-5 h-5"/>{leaveAttachment ? 'Change File' : 'Attach Document'}
                            </label>
                            <input id="attachment" type="file" className="hidden" onChange={(e) => setLeaveAttachment(e.target.files ? e.target.files[0] : null)} />
                            {leaveAttachment && <div className="text-xs text-gray-500 mt-2 flex items-center justify-between"><span>{leaveAttachment.name}</span><button type="button" onClick={() => setLeaveAttachment(null)}><XIcon className="w-4 h-4 text-red-500"/></button></div>}
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"><SendIcon className="w-5 h-5"/>Submit Request</button>
                    </form>
                </Card>
            </div>
        </div>
    );
    
    const renderSettings = () => (
      <Card title="My Settings">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">Integrations</h4>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-700">Google Calendar</p>
              <p className="text-sm text-gray-500">Sync approved leave requests to your calendar.</p>
            </div>
            <button
              onClick={handleToggleGCalConnection}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                currentUser.isGoogleCalendarConnected
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {currentUser.isGoogleCalendarConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            In a real application, clicking 'Connect' would redirect you to Google to grant permissions. This is a simulation.
          </p>
        </div>
      </Card>
    );

    return (
        <div className="flex flex-col">
            <div className="flex border-b border-slate-200 mb-6">
                 <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'dashboard' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Dashboard</button>
                 <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 text-sm font-semibold transition-colors ${activeTab === 'settings' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Settings</button>
            </div>
            {activeTab === 'dashboard' ? renderDashboard() : renderSettings()}
        </div>
    );
};

// --- Calendar Range Picker Component ---
const CalendarRangePicker: React.FC<{
    fromDate: Date | null;
    toDate: Date | null;
    setFromDate: (date: Date | null) => void;
    setToDate: (date: Date | null) => void;
    onClose: () => void;
}> = ({ fromDate, toDate, setFromDate, setToDate, onClose }) => {
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const [currentMonth, setCurrentMonth] = useState(fromDate || new Date());

    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const isSameDay = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    
    const handleDateClick = (date: Date) => {
        if (!fromDate || (fromDate && toDate)) {
            setFromDate(date);
            setToDate(null);
        } else if (fromDate && !toDate) {
            if (date < fromDate) {
                setFromDate(date);
            } else {
                setToDate(date);
                onClose();
            }
        }
    };

    // FIX: Refactored complex and buggy inline class logic into a robust helper function.
    // This ensures correct visual feedback for start, end, in-range, and hovered dates, making the component fully interactive.
    const getDayClassNames = (date: Date): string => {
        const baseClass = "w-8 h-8 flex items-center justify-center text-sm transition-colors";
        
        const isStart = fromDate && isSameDay(date, fromDate);
        const isEnd = toDate && isSameDay(date, toDate);
        const isInRange = fromDate && toDate && date > fromDate && date < toDate;
        const isHovering = fromDate && !toDate && hoveredDate && date > fromDate && date <= hoveredDate;
        const isHoveringEnd = isHovering && hoveredDate && isSameDay(date, hoveredDate);
        const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

        if (!isCurrentMonth) {
            return `${baseClass} text-gray-300 cursor-default`;
        }

        if (isStart && isEnd) { // Single day selection
            return `${baseClass} bg-indigo-600 text-white rounded-full`;
        }
        if (isStart) {
            return `${baseClass} bg-indigo-600 text-white ${toDate || hoveredDate ? 'rounded-l-full rounded-r-none' : 'rounded-full'}`;
        }
        if (isEnd) {
            return `${baseClass} bg-indigo-600 text-white rounded-r-full rounded-l-none`;
        }
        if (isInRange) {
            return `${baseClass} bg-indigo-100 text-gray-900 rounded-none`;
        }
        if (isHoveringEnd) {
            return `${baseClass} bg-indigo-100 text-gray-900 rounded-r-full rounded-l-none`;
        }
        if (isHovering) {
            return `${baseClass} bg-indigo-100 text-gray-900 rounded-none`;
        }
        
        return `${baseClass} text-gray-700 hover:bg-slate-100 rounded-full`;
    };


    return (
        <div className="absolute top-full mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-4" onMouseLeave={() => setHoveredDate(null)}>
             <div className="flex justify-between items-center mb-4">
                <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1 rounded-full hover:bg-slate-100"><ChevronLeftIcon className="w-5 h-5"/></button>
                <p className="font-semibold">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                <button type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1 rounded-full hover:bg-slate-100"><ChevronRightIcon className="w-5 h-5"/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
                {dates.map(date => (
                    <button 
                        type="button" 
                        key={date.toString()} 
                        onClick={() => handleDateClick(date)} 
                        onMouseEnter={() => setHoveredDate(date)} 
                        className={getDayClassNames(date)}
                        disabled={date.getMonth() !== currentMonth.getMonth()}
                    >
                        {date.getDate()}
                    </button>
                ))}
            </div>
            <button onClick={onClose} className="mt-4 w-full text-sm text-center text-indigo-600 font-semibold hover:underline">Close</button>
        </div>
    )
}

// --- MANAGER DASHBOARD ---
const ManagerDashboard = () => {
    const { employees, attendance, leaves, handleLeaveAction } = useContext(AppContext);
    const [processingLeave, setProcessingLeave] = useState<string | null>(null);
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        leaveId: string | null;
        action: 'APPROVED' | 'REJECTED' | null;
    }>({ isOpen: false, leaveId: null, action: null });

    const todayStr = new Date().toISOString().split('T')[0];

    const teamMembers = employees.filter((e: Employee) => e.role === 'EMPLOYEE' || e.role === 'MANAGER');
    const teamAttendance = useMemo(() => teamMembers.map((emp: Employee) => {
        const todayRecord = attendance.find((a: Attendance) => a.employeeId === emp.id && a.date === todayStr);
        const onLeave = leaves.find((l: Leave) => l.employeeId === emp.id && l.status === 'APPROVED' && todayStr >= l.fromDate && todayStr <= l.toDate);
        if (onLeave) return { ...emp, statusLabel: 'On Leave', mode: '', statusColor: 'bg-yellow-100 text-yellow-800' };
        if (todayRecord) {
          if (!todayRecord.checkOut) return { ...emp, statusLabel: 'Present', mode: todayRecord.mode, statusColor: 'bg-green-100 text-green-800' };
          return { ...emp, statusLabel: todayRecord.hoursWorked < 8 ? `Incomplete (${todayRecord.hoursWorked.toFixed(1)}h)` : `Completed (${todayRecord.hoursWorked.toFixed(1)}h)`, mode: todayRecord.mode, statusColor: 'bg-gray-100 text-gray-800' };
        }
        return { ...emp, statusLabel: 'Absent', mode: '', statusColor: 'bg-red-100 text-red-800' };
    }), [teamMembers, attendance, leaves]);

    const pendingLeaves = useMemo(() => leaves.filter((l: Leave) => l.status === 'PENDING').map(l => ({...l, employee: employees.find((e:Employee) => e.id === l.employeeId)?.name})), [leaves, employees]);
    
    const onLeaveAction = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
        setProcessingLeave(leaveId);
        await handleLeaveAction(leaveId, status);
        setProcessingLeave(null);
    }
    
    const openConfirmation = (leaveId: string, action: 'APPROVED' | 'REJECTED') => {
        setConfirmation({ isOpen: true, leaveId, action });
    };

    const handleConfirmAction = () => {
        if (confirmation.leaveId && confirmation.action) {
            onLeaveAction(confirmation.leaveId, confirmation.action);
        }
        setConfirmation({ isOpen: false, leaveId: null, action: null });
    };

    const handleCancelAction = () => {
        setConfirmation({ isOpen: false, leaveId: null, action: null });
    };

    const leaveToConfirm = useMemo(() => {
        if (!confirmation.leaveId) return null;
        return pendingLeaves.find(l => l.id === confirmation.leaveId);
    }, [confirmation.leaveId, pendingLeaves]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <Card title="Team Attendance Today">
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {teamAttendance.map(emp => (
                                <div key={emp.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-gray-800">{emp.name}</p>
                                        <p className="text-xs text-gray-500">{emp.department}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {emp.mode && <span className={`px-2 py-1 text-xs font-semibold rounded-full ${emp.mode === 'WFO' ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'}`}>{emp.mode}</span>}
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${emp.statusColor}`}>{emp.statusLabel}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
                <div className="space-y-8">
                    <Card title="Avg. Hours / Month"><p className="text-4xl font-bold text-gray-800">162.5</p></Card>
                    <Card title="WFO vs WFH Ratio"><p className="text-4xl font-bold text-gray-800">65% / 35%</p></Card>
                </div>
            </div>
            <Card title="Pending Leave Requests">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50"><tr className="text-slate-500 uppercase text-xs tracking-wider"><th className="p-4 font-semibold">Employee</th><th className="p-4 font-semibold">Dates</th><th className="p-4 font-semibold">Reason</th><th className="p-4 font-semibold text-right">Actions</th></tr></thead>
                        <tbody>
                            {pendingLeaves.map((req: Leave & {employee: string}) => (
                                <tr key={req.id} className="border-b border-slate-100">
                                    <td className="p-4 font-semibold">{req.employee}</td>
                                    <td className="p-4">{formatDate(req.fromDate)} to {formatDate(req.toDate)}</td>
                                    <td className="p-4 max-w-xs truncate">{req.reason}</td>
                                    <td className="p-4 text-right">
                                      <div className="flex gap-2 justify-end">
                                        {processingLeave === req.id ? <SpinnerIcon className="w-5 h-5 text-gray-500 animate-spin" /> : (
                                          <>
                                            <button onClick={() => openConfirmation(req.id, 'APPROVED')} className="p-2 bg-green-100 rounded-full hover:bg-green-200"><CheckCircle className="w-5 h-5 text-green-600"/></button>
                                            <button onClick={() => openConfirmation(req.id, 'REJECTED')} className="p-2 bg-red-100 rounded-full hover:bg-red-200"><XCircle className="w-5 h-5 text-red-600"/></button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                </tr>
                            ))}
                            {pendingLeaves.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No pending requests.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Confirmation Modal */}
            {confirmation.isOpen && leaveToConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ease-in-out">
                    <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ease-in-out scale-100">
                        <h3 className="text-xl font-bold text-gray-900">Confirm Leave Request</h3>
                        <p className="mt-4 text-gray-600">
                            Are you sure you want to{' '}
                            <span className={`font-semibold ${confirmation.action === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>
                                {confirmation.action?.toLowerCase()}
                            </span>
                            {' '}this leave request for <span className="font-semibold text-gray-800">{leaveToConfirm.employee}</span>?
                        </p>
                        <div className="mt-6 flex justify-end gap-4">
                            <button 
                                onClick={handleCancelAction}
                                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmAction}
                                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
                                    confirmation.action === 'APPROVED' 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : 'bg-red-600 hover:bg-red-700'
                                }`}
                            >
                                Confirm {confirmation.action === 'APPROVED' ? 'Approval' : 'Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- ADMIN DASHBOARD ---
const AdminDashboard = () => {
    const { companies, currentUser, handleUpdateOfficeLocation } = useContext(AppContext);
    const myCompany = companies.find((c: Company) => c.id === currentUser.companyId);
    const [lat, setLat] = useState(myCompany.office_lat);
    const [lng, setLng] = useState(myCompany.office_lng);
    const [copied, setCopied] = useState(false);

    const onSettingsSave = (e: React.FormEvent) => {
        e.preventDefault();
        handleUpdateOfficeLocation(lat, lng);
        alert('Office location updated!');
    };

    const handleCopyCode = () => {
        if (!myCompany?.code) return;
        navigator.clipboard.writeText(myCompany.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }
    
    return (
        <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card title="Company Overview">
                     <p className="text-gray-600"><strong>Company Name:</strong> {myCompany.name}</p>
                     <div className="mt-4 bg-slate-50 p-4 rounded-lg text-center">
                        <label className="text-sm font-medium text-gray-700">Your Company Join Code</label>
                        <div className="flex items-center justify-center gap-4 mt-2">
                           <p className="text-3xl font-bold font-mono text-indigo-600 tracking-widest bg-white px-4 py-2 rounded-md">{myCompany.code}</p>
                            <button onClick={handleCopyCode} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                {copied ? <ClipboardCheckIcon className="w-5 h-5"/> : <ClipboardIcon className="w-5 h-5"/>}
                                {copied ? 'Copied!' : 'Copy Code'}
                           </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Share this code with your employees to let them join your company.</p>
                     </div>
                </Card>
                <Card title="Admin Settings">
                    <form onSubmit={onSettingsSave} className="space-y-4">
                        <p className="text-sm font-medium">Update Office Geolocation (for WFO validation)</p>
                         <div><label className="text-xs font-medium text-gray-600">Latitude</label><input type="number" step="any" value={lat} onChange={e => setLat(e.target.valueAsNumber)} required className={inputStyles}/></div>
                         <div><label className="text-xs font-medium text-gray-600">Longitude</label><input type="number" step="any" value={lng} onChange={e => setLng(e.target.valueAsNumber)} required className={inputStyles}/></div>
                         <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-indigo-700 transition-colors">Save Settings</button>
                    </form>
                </Card>
             </div>
        </div>
    );
};

// --- Main Dashboard Layout ---
const Dashboard: React.FC = () => {
    const { currentUser, handleLogout } = useContext(AppContext);

    const renderContent = () => {
        switch (currentUser.role) {
            case 'EMPLOYEE': return <EmployeeDashboard />;
            case 'MANAGER': return <ManagerDashboard />;
            case 'ADMIN': return <AdminDashboard />;
            default: return <div>Invalid Role</div>;
        }
    };
    
    return (
        <div className="flex h-screen bg-slate-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white flex flex-col shadow-lg">
                <div className="flex items-center gap-3 p-6 border-b border-gray-200">
                    <ClockIconCircled className="w-10 h-10 text-indigo-600" />
                    <h1 className="text-2xl font-extrabold text-gray-800">PulseHR</h1>
                </div>
                <div className="flex-1 p-6">
                    <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-indigo-100 mx-auto mb-2 flex items-center justify-center text-indigo-600 text-3xl font-bold">{currentUser.name.charAt(0)}</div>
                        <p className="text-lg font-bold text-gray-800">{currentUser.name}</p>
                        <p className="text-sm text-indigo-600 font-semibold">{currentUser.role}</p>
                    </div>
                </div>
                <div className="p-6 border-t border-gray-200">
                     <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-slate-100 hover:text-gray-900 transition-colors">
                        <LogOutIcon className="h-5 w-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200 p-6 flex justify-between items-center">
                     <h2 className="text-xl font-bold text-slate-800">Welcome back, {currentUser.name.split(' ')[0]}!</h2>
                     <div className="text-sm text-right text-gray-600">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </header>
                <div className="flex-1 p-8 overflow-y-auto">
                    {renderContent()}
                </div>
            </main>
            <Chatbot />
        </div>
    );
};

export default Dashboard;