import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import type { Employee } from '../types';
import { ClockIconCircled } from './icons';

/**
 * AuthPage Component
 * A clean, professional login and signup page for PulseHR.
 * Inspired by modern SaaS login screens.
 */
const LoginScreen: React.FC = () => {
  const { handleLogin, handleRegister, handleCreateCompanyAndAdmin } = useContext(AppContext);

  // State for toggling between Login and Sign Up tabs
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  // State for signup flow (creating a new company or joining an existing one)
  const [signupMode, setSignupMode] = useState<'create' | 'join'>('create');
  // State for form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [department, setDepartment] = useState<Employee['department']>('Engineering');
  const [role, setRole] = useState<Employee['role']>('EMPLOYEE');
  // State for handling form errors
  const [error, setError] = useState<string | null>(null);

  // --- Form Submission Handlers ---
  const onLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    const success = handleLogin(email, password);
    if (!success) {
      setError('Invalid email or password.');
    }
  };

  const onSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signupMode === 'create') {
      if (!companyName || !fullName || !email || !password) {
        setError('Please fill all required fields to create a company.');
        return;
      }
      handleCreateCompanyAndAdmin(companyName, fullName, email, password);
    } else { // 'join' mode
      if (!fullName || !email || !password || !companyCode) {
        setError('Please fill all required fields to join a company.');
        return;
      }
      handleRegister(fullName, email, password, department, role, companyCode);
    }
  };
  
  // --- HIGH VISIBILITY INPUT STYLES ---
  const inputStyles = "mt-1 w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";


  // --- Reusable JSX Snippets ---
  const renderInput = (label: string, type: string, value: string, setter: (val: string) => void, placeholder: string) => (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder}
        required
        className={inputStyles}
      />
    </div>
  );

  const renderSelect = (label: string, value: string, setter: (val: any) => void, options: string[]) => (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select 
        value={value} 
        onChange={(e) => setter(e.target.value)}
        className={inputStyles}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );

  // --- Main Render ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 via-white to-sky-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <ClockIconCircled className="mx-auto h-12 w-12 text-indigo-600" />
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900">PulseHR</h1>
          <p className="mt-2 text-sm text-gray-600">Attendance & Leave Management</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button onClick={() => { setActiveTab('login'); setError(null); }} className={`w-1/2 py-3 text-sm font-semibold transition-colors ${activeTab === 'login' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Login</button>
          <button onClick={() => { setActiveTab('signup'); setError(null); }} className={`w-1/2 py-3 text-sm font-semibold transition-colors ${activeTab === 'signup' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Sign Up</button>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>}

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={onLoginSubmit} className="space-y-6">
            {renderInput('Email', 'email', email, setEmail, 'you@company.com')}
            <div>
              {renderInput('Password', 'password', password, setPassword, '••••••••')}
              <a href="#" className="text-xs text-indigo-600 hover:underline mt-1 block text-right">Forgot password?</a>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Login
            </button>
          </form>
        )}

        {/* Signup Form */}
        {activeTab === 'signup' && (
          <form onSubmit={onSignupSubmit} className="space-y-4">
            {/* Signup Mode Selection */}
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
              <button type="button" onClick={() => setSignupMode('create')} className={`px-4 py-2 text-sm font-semibold rounded-md ${signupMode === 'create' ? 'bg-white shadow text-indigo-700' : 'text-gray-600'}`}>Create New Company</button>
              <button type="button" onClick={() => setSignupMode('join')} className={`px-4 py-2 text-sm font-semibold rounded-md ${signupMode === 'join' ? 'bg-white shadow text-indigo-700' : 'text-gray-600'}`}>Join Existing Company</button>
            </div>
            <p className="text-xs text-center text-gray-500 -mt-2 pb-2">{signupMode === 'create' ? "You'll be the admin." : "Ask your admin for the code."}</p>

            {/* Dynamic Fields */}
            {signupMode === 'create' && renderInput('Company Name', 'text', companyName, setCompanyName, 'e.g., Acme Corporation')}
            {signupMode === 'join' && renderInput('Company Code', 'text', companyCode, setCompanyCode, 'Enter company code')}
            
            {renderInput('Full Name', 'text', fullName, setFullName, 'John Doe')}
            {renderInput('Email', 'email', email, setEmail, 'you@company.com')}
            {renderInput('Password', 'password', password, setPassword, 'Minimum 8 characters')}

            {signupMode === 'join' && (
              <>
                {renderSelect('Department', department, setDepartment, ['Engineering', 'HR', 'Sales', 'Operations', 'Marketing'])}
                {renderSelect('Role', role, setRole, ['EMPLOYEE', 'MANAGER'])}
              </>
            )}

            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Sign Up
            </button>

            {signupMode === 'create' && <p className="text-xs text-center text-gray-500">A unique company code will be generated for your team.</p>}
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;