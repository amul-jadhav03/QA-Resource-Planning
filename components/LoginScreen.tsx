import React, { useState } from 'react';
import { Layout, Shield, Eye, ArrowRight, User as UserIcon, ChevronLeft } from 'lucide-react';
import { UserRole, Resource } from '../types';

interface LoginScreenProps {
  onLogin: (role: UserRole, resourceId?: string) => void;
  resources: Resource[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, resources }) => {
  const [view, setView] = useState<'main' | 'viewer_select'>('main');
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');

  const handleViewerLogin = () => {
    if (selectedResourceId) {
      onLogin('Viewer', selectedResourceId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden border border-slate-100">
        
        {/* Left Side - Brand */}
        <div className="bg-indigo-600 p-12 flex flex-col justify-center text-white md:w-1/2">
          <div className="mb-6">
            <div className="bg-white/20 p-3 rounded-xl w-fit backdrop-blur-sm">
              <Layout className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">OptiResource Planner</h1>
          <p className="text-indigo-100 text-lg leading-relaxed">
            Manage team allocation, track project tasks, and optimize workload distribution with AI-powered insights.
          </p>
          <div className="mt-8 flex items-center space-x-2 text-sm text-indigo-200">
            <span>Secure Access</span>
            <div className="w-1 h-1 bg-indigo-200 rounded-full"></div>
            <span>Role Based Control</span>
          </div>
        </div>

        {/* Right Side - Login Options */}
        <div className="p-12 md:w-1/2 flex flex-col justify-center">
          
          {view === 'main' ? (
            <>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back</h2>
              <p className="text-slate-500 mb-8">Select your role to access the dashboard</p>

              <div className="space-y-4">
                {/* Admin Login */}
                <button
                  onClick={() => onLogin('Admin')}
                  className="w-full group relative p-4 bg-white border-2 border-slate-100 hover:border-indigo-600 rounded-xl transition-all duration-300 text-left hover:shadow-md"
                >
                  <div className="flex items-start">
                    <div className="bg-indigo-50 p-3 rounded-lg group-hover:bg-indigo-600 transition-colors">
                      <Shield className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Project Manager</h3>
                      <p className="text-xs text-slate-500 mt-1">Full access to manage resources, assign tasks, and view analytics.</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 self-center opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                  </div>
                </button>

                {/* Viewer Login */}
                <button
                  onClick={() => setView('viewer_select')}
                  className="w-full group relative p-4 bg-white border-2 border-slate-100 hover:border-slate-400 rounded-xl transition-all duration-300 text-left hover:shadow-md"
                >
                  <div className="flex items-start">
                    <div className="bg-slate-50 p-3 rounded-lg group-hover:bg-slate-600 transition-colors">
                      <Eye className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-bold text-slate-800 group-hover:text-slate-700 transition-colors">Team Member</h3>
                      <p className="text-xs text-slate-500 mt-1">Check your schedule, tasks, and workload status.</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 self-center opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                  </div>
                </button>
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={() => setView('main')}
                className="flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
              >
                <ChevronLeft size={16} className="mr-1" /> Back to roles
              </button>
              
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Team Member Login</h2>
              <p className="text-slate-500 mb-6">Select your profile to continue</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Who are you?</label>
                  <div className="relative">
                    <select
                      value={selectedResourceId}
                      onChange={(e) => setSelectedResourceId(e.target.value)}
                      className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select your name</option>
                      {resources.map(resource => (
                        <option key={resource.id} value={resource.id}>
                          {resource.name} ({resource.role})
                        </option>
                      ))}
                    </select>
                    <UserIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  </div>
                </div>

                <button
                  onClick={handleViewerLogin}
                  disabled={!selectedResourceId}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-medium shadow-md transition-all flex items-center justify-center"
                >
                  Access Dashboard <ArrowRight size={18} className="ml-2" />
                </button>
              </div>
            </>
          )}
          
          <p className="mt-8 text-center text-xs text-slate-400">
            Powered by Google Gemini AI
          </p>
        </div>
      </div>
    </div>
  );
};