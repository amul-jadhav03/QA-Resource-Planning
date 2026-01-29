import React, { useState } from 'react';
import { Resource, UserRole } from '../types';
import { Trash2, Briefcase, Mail, Plus, Check, Edit2, X, History } from 'lucide-react';

interface ResourceGridProps {
  resources: Resource[];
  onRemove: (id: string) => void;
  onAddTask: (resourceId: string) => void;
  onToggleTaskCompletion: (resourceId: string, taskId: string) => void;
  onUpdateCapacity: (resourceId: string, capacity: number) => void;
  onViewHistory: (resourceId: string) => void;
  daysInRange: number;
  userRole: UserRole;
}

const getPriorityColor = (priority: string | undefined) => {
  switch(priority) {
    case 'High': return 'bg-red-50 text-red-600 border-red-100';
    case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'Low': return 'bg-blue-50 text-blue-600 border-blue-100';
    default: return 'bg-slate-50 text-slate-600 border-slate-100';
  }
};

export const ResourceGrid: React.FC<ResourceGridProps> = ({ 
  resources, 
  onRemove, 
  onAddTask, 
  onToggleTaskCompletion,
  onUpdateCapacity,
  onViewHistory,
  daysInRange,
  userRole
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const startEditing = (resource: Resource) => {
    if (userRole !== 'Admin') return;
    setEditingId(resource.id);
    setEditValue(resource.maxCapacity);
  };

  const saveCapacity = (resourceId: string) => {
    onUpdateCapacity(resourceId, editValue);
    setEditingId(null);
  };
  
  const cancelEditing = () => {
     setEditingId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((resource) => {
        // Only count hours for tasks that are NOT completed
        const activeTasks = resource.tasks.filter(t => !t.completed);
        const totalHours = activeTasks.reduce((acc, t) => acc + t.hours, 0);
        
        // Calculate effective capacity based on range
        // We assume standard 5 day work week base. Daily cap = maxCapacity / 5.
        const dailyCap = resource.maxCapacity / 5;
        const effectiveCapacity = dailyCap * daysInRange;
        
        const utilization = effectiveCapacity > 0 ? (totalHours / effectiveCapacity) * 100 : 100;
        
        // Progress bar colors (Utilization focus)
        let progressBarColor = 'bg-green-500';
        if (utilization > 100) progressBarColor = 'bg-red-600'; // Over limit
        else if (utilization > 90) progressBarColor = 'bg-red-500';
        else if (utilization < 40) progressBarColor = 'bg-yellow-400';

        // Availability Dot Colors
        // Based on % utilization regardless of range duration
        // Green: < 50%
        // Yellow: 50% - 90%
        // Red: > 90%
        let statusDotColor = 'bg-green-500';
        let statusTitle = 'Available';
        if (utilization > 90) {
            statusDotColor = 'bg-red-500';
            statusTitle = 'Overloaded';
        } else if (utilization >= 50) {
            statusDotColor = 'bg-yellow-500';
            statusTitle = 'Near Capacity';
        }

        return (
          <div key={resource.id} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden group">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img 
                      src={resource.avatar} 
                      alt={resource.name} 
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div 
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 ${statusDotColor} border-2 border-white rounded-full`}
                      title={`Status: ${statusTitle}`}
                    ></div>
                  </div>
                  <div>
                    <button 
                      onClick={() => onViewHistory(resource.id)}
                      className="font-semibold text-slate-900 hover:text-indigo-600 text-left transition-colors"
                    >
                      {resource.name}
                    </button>
                    <span className="block mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                      {resource.role}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => onViewHistory(resource.id)}
                    className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-full hover:bg-slate-50"
                    title="View History"
                  >
                    <History size={18} />
                  </button>
                  {userRole === 'Admin' && (
                    <button 
                      onClick={() => onRemove(resource.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-slate-50"
                      aria-label="Remove resource"
                      title="Remove Resource"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-sm text-slate-500">
                  <Mail size={14} className="mr-2" />
                  {resource.email}
                </div>
                <div className="flex items-center text-sm text-slate-500">
                  <Briefcase size={14} className="mr-2" />
                  {activeTasks.length} Task{activeTasks.length !== 1 ? 's' : ''} {daysInRange === 1 ? '(Today)' : '(In Range)'}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between text-sm mb-1 h-6 items-center">
                   <span className="font-medium text-slate-700">Allocation {daysInRange > 1 && `(${daysInRange} days)`}</span>
                   
                   {editingId === resource.id ? (
                       <div className="flex items-center space-x-1 relative">
                           {/* Helper Tooltip */}
                           <div className="absolute bottom-full mb-2 right-0 w-40 bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg z-10 pointer-events-none text-center">
                              <span className="block opacity-75 mb-0.5">Current: {resource.maxCapacity}h</span>
                              <span className="font-semibold text-yellow-300">Target: 35-40h</span>
                              <div className="absolute top-full right-6 -mt-1 border-4 border-transparent border-t-slate-800"></div>
                           </div>

                           <input 
                              type="number" 
                              value={editValue}
                              onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                              className="w-16 px-1 py-0.5 text-right border border-indigo-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              autoFocus
                              onKeyDown={(e) => e.key === 'Enter' && saveCapacity(resource.id)}
                           />
                           <button onClick={() => saveCapacity(resource.id)} className="text-green-600 hover:bg-green-50 p-0.5 rounded"><Check size={14} /></button>
                           <button onClick={cancelEditing} className="text-red-500 hover:bg-red-50 p-0.5 rounded"><X size={14} /></button>
                       </div>
                   ) : (
                       <div className="flex items-center group/edit">
                          <span className="text-slate-500">
                            {totalHours} / {effectiveCapacity} hrs
                          </span>
                          {userRole === 'Admin' && (
                            <button 
                                  onClick={() => startEditing(resource)} 
                                  className="ml-2 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Edit Weekly Capacity"
                              >
                                  <Edit2 size={12} />
                              </button>
                          )}
                       </div>
                   )}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full ${progressBarColor} transition-all duration-500`} 
                    style={{ width: `${Math.min(utilization, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Task List Preview */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {daysInRange === 1 ? 'Today\'s Tasks' : 'Tasks in Range'}
                </h5>
                {userRole === 'Admin' && (
                  <button 
                    onClick={() => onAddTask(resource.id)}
                    className="flex items-center text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                  >
                    <Plus size={12} className="mr-1" />
                    Add
                  </button>
                )}
              </div>
              
              {resource.tasks.length > 0 ? (
                <ul className="space-y-2">
                  {resource.tasks.map(task => (
                    <li key={task.id} className={`text-sm flex justify-between items-center transition-colors ${task.completed ? 'text-slate-400' : 'text-slate-600'}`}>
                      <div className="flex items-center min-w-0 flex-1 mr-2">
                        <button
                          onClick={() => onToggleTaskCompletion(resource.id, task.id)}
                          className={`flex-shrink-0 w-4 h-4 rounded border mr-2 flex items-center justify-center transition-all ${
                            task.completed 
                              ? 'bg-indigo-100 border-indigo-200 text-indigo-600' 
                              : 'border-slate-300 hover:border-indigo-400 bg-white'
                          }`}
                          title={task.completed ? "Mark as active" : "Mark as complete"}
                        >
                          {task.completed && <Check size={10} />}
                        </button>
                        <span className={`truncate ${task.completed ? 'line-through decoration-slate-400' : ''}`} title={task.name}>
                          {task.name}
                        </span>
                        {task.priority && !task.completed && (
                           <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)} font-medium hidden sm:inline-block`}>
                             {task.priority}
                           </span>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded border whitespace-nowrap ${
                        task.completed 
                          ? 'bg-slate-50 border-slate-100 text-slate-400' 
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                        {task.hours}h
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400 italic">No tasks for this period.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};