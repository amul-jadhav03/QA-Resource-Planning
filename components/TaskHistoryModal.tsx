import React from 'react';
import { X, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Resource } from '../types';

interface TaskHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
}

export const TaskHistoryModal: React.FC<TaskHistoryModalProps> = ({ isOpen, onClose, resource }) => {
  if (!isOpen || !resource) return null;

  const completedTasks = resource.tasks
    .filter(t => t.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              Task History
            </h2>
            <p className="text-sm text-slate-500">Completed tasks for {resource.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {completedTasks.length > 0 ? (
            <div className="space-y-4">
              {completedTasks.map(task => (
                <div key={task.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-200 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 line-through decoration-slate-400 decoration-2">{task.name}</h4>
                    <p className="text-sm text-slate-500 font-medium">{task.projectName}</p>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-slate-600">
                    <div className="flex items-center bg-white px-2 py-1 rounded border border-slate-200">
                      <Calendar size={14} className="mr-1.5 text-slate-400" />
                      {task.date}
                    </div>
                    <div className="flex items-center bg-white px-2 py-1 rounded border border-slate-200">
                      <Clock size={14} className="mr-1.5 text-slate-400" />
                      {task.hours}h
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="text-slate-300" size={24} />
              </div>
              <h3 className="text-slate-900 font-medium mb-1">No completed tasks</h3>
              <p className="text-slate-500 text-sm">Tasks marked as complete will appear here.</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <div className="flex flex-col">
                <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Total Completed</span>
                <span className="text-lg font-bold text-slate-900">{completedTasks.length} <span className="text-sm font-normal text-slate-500">tasks</span></span>
            </div>
            <div className="flex flex-col text-right">
                <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Total Hours</span>
                <span className="text-lg font-bold text-indigo-600">{completedTasks.reduce((acc, t) => acc + t.hours, 0)}h</span>
            </div>
        </div>
      </div>
    </div>
  );
};