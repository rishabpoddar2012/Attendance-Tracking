import React from 'react';
import type { Employee } from '../types';
import { PulseIcon } from './icons';

interface LoginScreenProps {
  employees: Employee[];
  onLogin: (employeeId: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ employees, onLogin }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
        <div className="flex flex-col items-center">
          <PulseIcon className="w-16 h-16 text-blue-600" />
          <h2 className="mt-4 text-3xl font-bold text-center text-gray-900">Welcome to PulseHR</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Select a user to sign in</p>
        </div>
        <div className="space-y-4">
          {employees.map(emp => (
            <button
              key={emp.id}
              onClick={() => onLogin(emp.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 hover:bg-blue-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div>
                <p className="font-semibold text-gray-800">{emp.name}</p>
                <p className="text-sm text-gray-500">{emp.role} - {emp.department}</p>
              </div>
              <span className="text-sm font-medium text-blue-600">Sign In &rarr;</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
