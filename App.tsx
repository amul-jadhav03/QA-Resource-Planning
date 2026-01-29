import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Layout, 
  Plus, 
  BarChart2, 
  Zap, 
  AlertTriangle,
  Loader2,
  Filter,
  ArrowUpDown,
  Calendar,
  FileSpreadsheet,
  ArrowRight,
  ChevronDown,
  CheckCircle,
  LogOut,
  Shield,
  Eye
} from 'lucide-react';
import { Resource, Role, AnalysisResult, Task, Project, Priority, User, UserRole } from './types';
import { INITIAL_RESOURCES, MOCK_PROJECTS } from './constants';
import { MetricCard } from './components/MetricCard';
import { ResourceGrid } from './components/ResourceGrid';
import { AddResourceModal } from './components/AddResourceModal';
import { AddTaskModal } from './components/AddTaskModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ImportDataModal } from './components/ImportDataModal';
import { TaskHistoryModal } from './components/TaskHistoryModal';
import { WorkloadChart } from './components/WorkloadChart';
import { LoginScreen } from './components/LoginScreen';
import { analyzeResources } from './services/geminiService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const [historyResourceId, setHistoryResourceId] = useState<string | null>(null);
  
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  
  // Date Range State
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  
  const [sortBy, setSortBy] = useState<'name' | 'role'>('name');
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Authentication Handlers
  const handleLogin = (role: UserRole, resourceId?: string) => {
    if (role === 'Admin') {
      setCurrentUser({
        id: 'u_admin',
        name: 'Manager',
        role: 'Admin',
        avatar: 'https://ui-avatars.com/api/?name=Manager&background=4f46e5&color=fff'
      });
    } else if (resourceId) {
      const resource = resources.find(r => r.id === resourceId);
      if (resource) {
        setCurrentUser({
          id: resource.id,
          name: resource.name,
          role: 'Viewer',
          avatar: resource.avatar
        });
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAnalysis(null);
    setSelectedProjectIds([]);
  };

  // Helper to calculate days between dates (inclusive)
  const getDaysDiff = (start: string, end: string) => {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const oneDay = 24 * 60 * 60 * 1000;
    // Difference + 1 for inclusive range
    return Math.round(Math.abs((d2.getTime() - d1.getTime()) / oneDay)) + 1;
  };

  const daysInRange = getDaysDiff(startDate, endDate);

  const applyDatePreset = (preset: 'thisWeek' | 'nextWeek' | 'thisMonth' | 'nextMonth') => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    if (preset === 'thisWeek') {
        const day = now.getDay();
        // Assuming Monday start. day 0 is Sunday.
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        end = new Date(start);
        end.setDate(start.getDate() + 6); 
    } else if (preset === 'nextWeek') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
        start.setDate(diff + 7);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
    } else if (preset === 'thisMonth') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === 'nextMonth') {
        start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    }

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
    setIsDateMenuOpen(false);
  };

  // Filter resources based on current user role (Viewers only see themselves)
  const visibleResources = currentUser?.role === 'Viewer'
    ? resources.filter(r => r.id === currentUser.id)
    : resources;

  // Filter visible resources based on project
  const projectFilteredResources = visibleResources.filter(resource => {
    if (selectedProjectIds.length === 0) return true;
    return resource.tasks.some(task => 
      !task.completed && selectedProjectIds.includes(task.projectId)
    );
  });

  // Range View Logic - Filter tasks within date range
  const rangeResources = projectFilteredResources.map(resource => ({
    ...resource,
    tasks: resource.tasks.filter(task => task.date >= startDate && task.date <= endDate)
  }));

  // Derived Metrics (Calculated from visible resources only)
  const totalResources = visibleResources.length; // Use visibleResources for total count in header
  const dailyCapacityPerPerson = 8; // Standard 8h day assumption
  const totalCapacityInRange = totalResources * dailyCapacityPerPerson * daysInRange;
  
  const allocatedHoursInRange = rangeResources.reduce((acc, r) => acc + r.tasks
    .filter(t => !t.completed)
    .reduce((sum, t) => sum + t.hours, 0), 0);
  
  const completedTasksInRange = rangeResources.reduce((acc, r) => acc + r.tasks.filter(t => t.completed).length, 0);
  const completedHoursInRange = rangeResources.reduce((acc, r) => acc + r.tasks.filter(t => t.completed).reduce((sum, t) => sum + t.hours, 0), 0);
  const pendingTasksInRange = rangeResources.reduce((acc, r) => acc + r.tasks.filter(t => !t.completed).length, 0);

  const utilizationRate = totalCapacityInRange > 0 ? Math.round((allocatedHoursInRange / totalCapacityInRange) * 100) : 0;
  
  // Thresholds scale with days in range
  const underutilizedThreshold = 4 * daysInRange; // < 4h per day average
  const overloadedThreshold = 7 * daysInRange; // > 7h per day average

  const underutilizedCount = rangeResources.filter(r => {
    const hours = r.tasks.filter(t => !t.completed).reduce((sum, t) => sum + t.hours, 0);
    return hours < underutilizedThreshold;
  }).length;

  const overloadedCount = rangeResources.filter(r => {
    const hours = r.tasks.filter(t => !t.completed).reduce((sum, t) => sum + t.hours, 0);
    return hours > overloadedThreshold;
  }).length;
  
  const balancedCount = totalResources - underutilizedCount - overloadedCount;

  // Sort Logic
  const sortedResources = [...rangeResources].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      return a.role.localeCompare(b.role);
    }
  });

  const handleAddResource = (name: string, role: Role, email: string) => {
    const newResource: Resource = {
      id: `r${Date.now()}`,
      name,
      role,
      email,
      avatar: `https://picsum.photos/seed/${Date.now()}/100/100`,
      maxCapacity: 40,
      tasks: [],
    };
    setResources([...resources, newResource]);
  };

  const handleRemoveResource = (id: string) => {
    setResourceToDelete(id);
  };

  const confirmDeleteResource = () => {
    if (resourceToDelete) {
      setResources(resources.filter(r => r.id !== resourceToDelete));
      setResourceToDelete(null);
    }
  };

  const handleOpenTaskModal = (resourceId: string) => {
    setSelectedResourceId(resourceId);
    setIsTaskModalOpen(true);
  };

  const handleViewHistory = (resourceId: string) => {
    setHistoryResourceId(resourceId);
    setIsHistoryModalOpen(true);
  };

  const handleAssignTask = (taskName: string, projectId: string, projectName: string, hours: number, date: string, priority: Priority) => {
    if (!selectedResourceId) return;

    setResources(prevResources => prevResources.map(resource => {
      if (resource.id === selectedResourceId) {
        const newTask: Task = {
          id: `t${Date.now()}`,
          projectId,
          projectName,
          name: taskName,
          hours: hours,
          date: date,
          completed: false,
          priority
        };
        return {
          ...resource,
          tasks: [...resource.tasks, newTask]
        };
      }
      return resource;
    }));
  };

  const handleToggleTaskCompletion = (resourceId: string, taskId: string) => {
    setResources(prevResources => prevResources.map(resource => {
      if (resource.id === resourceId) {
        return {
          ...resource,
          tasks: resource.tasks.map(task => 
            task.id === taskId 
              ? { ...task, completed: !task.completed } 
              : task
          )
        };
      }
      return resource;
    }));
  };

  const handleUpdateCapacity = (resourceId: string, newCapacity: number) => {
    const capacity = Math.max(0, newCapacity);
    setResources(prevResources => prevResources.map(resource => 
      resource.id === resourceId 
        ? { ...resource, maxCapacity: capacity }
        : resource
    ));
  };

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  // CSV Import Logic
  const handleImportCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    // Skip header if it contains "Resource"
    const startIdx = lines[0].toLowerCase().includes('resource') ? 1 : 0;
    
    const newResources = [...resources];
    const newProjects = [...projects];

    for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < 6) continue;

        const [rName, rRole, pName, tName, tDate, tHours, tPriority] = cols;

        let project = newProjects.find(p => p.name.toLowerCase() === pName.toLowerCase());
        if (!project) {
            project = { id: `p-${Date.now()}-${i}`, name: pName, status: 'Active' };
            newProjects.push(project);
        }

        let resourceIdx = newResources.findIndex(r => r.name.toLowerCase() === rName.toLowerCase());
        if (resourceIdx === -1) {
            const newRes: Resource = {
                id: `r-${Date.now()}-${i}`,
                name: rName,
                role: rRole as Role || 'QA',
                email: `${rName.toLowerCase().replace(' ', '.')}@company.com`,
                avatar: `https://picsum.photos/seed/${rName}/100/100`,
                maxCapacity: 40,
                tasks: []
            };
            newResources.push(newRes);
            resourceIdx = newResources.length - 1;
        }

        // Simple validation/default for priority from CSV
        let priority: Priority = 'Medium';
        if (tPriority) {
          const p = tPriority.trim().toLowerCase();
          if (p === 'high') priority = 'High';
          else if (p === 'low') priority = 'Low';
        }

        const newTask: Task = {
            id: `t-${Date.now()}-${i}`,
            projectId: project.id,
            projectName: project.name,
            name: tName,
            date: tDate,
            hours: parseFloat(tHours) || 0,
            completed: false,
            priority
        };

        const exists = newResources[resourceIdx].tasks.some(t => 
            t.name === newTask.name && t.date === newTask.date
        );

        if (!exists) {
            newResources[resourceIdx].tasks.push(newTask);
        }
    }

    setProjects(newProjects);
    setResources(newResources);
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeResources(rangeResources);
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis error", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const openDatePicker = (e: React.MouseEvent<HTMLInputElement>) => {
    try {
      e.currentTarget.showPicker();
    } catch (err) {
      console.log('showPicker not supported', err);
    }
  };

  const selectedResourceName = resources.find(r => r.id === selectedResourceId)?.name;
  const historyResource = resources.find(r => r.id === historyResourceId) || null;

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} resources={resources} />;
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between h-auto sm:h-16 py-3 sm:py-0">
            <div className="flex items-center mb-3 sm:mb-0">
              <div className="bg-indigo-600 p-2 rounded-lg mr-3">
                <Layout className="text-white h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">QA Resource Planner</h1>
                <div className="flex items-center text-xs text-slate-500 hidden sm:flex">
                  <span className="mr-2">Allocations & Daily Tracker</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded-full text-slate-600 font-medium flex items-center border border-slate-200">
                    {currentUser.role === 'Admin' ? <Shield size={10} className="mr-1 text-indigo-500" /> : <Eye size={10} className="mr-1 text-slate-500" />}
                    {currentUser.name}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
              
              <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                <div className="flex items-center px-2 py-1.5 sm:px-3 sm:py-2">
                  <Calendar size={16} className="text-slate-500 mr-2 flex-shrink-0" />
                  <div className="flex items-center space-x-2">
                      <input 
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          onClick={openDatePicker}
                          className="bg-transparent border-none outline-none text-xs sm:text-sm text-slate-700 font-medium cursor-pointer w-24 sm:w-auto"
                          title="Start Date"
                      />
                      <ArrowRight size={14} className="text-slate-400" />
                      <input 
                          type="date"
                          value={endDate}
                          min={startDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          onClick={openDatePicker}
                          className="bg-transparent border-none outline-none text-xs sm:text-sm text-slate-700 font-medium cursor-pointer w-24 sm:w-auto"
                          title="End Date"
                      />
                  </div>
                </div>
                
                <div className="h-6 w-px bg-slate-300 mx-1"></div>

                <button 
                  onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
                  className="px-2 py-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-r-lg transition-colors"
                  title="Date Presets"
                >
                  <ChevronDown size={14} />
                </button>

                {isDateMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDateMenuOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-xl border border-slate-100 z-50 py-1 overflow-hidden animate-fade-in-up">
                      <button onClick={() => applyDatePreset('thisWeek')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors">This Week</button>
                      <button onClick={() => applyDatePreset('nextWeek')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors">Next Week</button>
                      <div className="h-px bg-slate-100 my-1"></div>
                      <button onClick={() => applyDatePreset('thisMonth')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors">This Month</button>
                      <button onClick={() => applyDatePreset('nextMonth')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors">Next Month</button>
                    </div>
                  </>
                )}
              </div>

              {currentUser.role === 'Admin' && (
                <button
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center px-3 py-2 border border-green-200 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Import</span> CSV
                </button>
              )}

              <button
                onClick={runAnalysis}
                className="hidden lg:flex items-center px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'AI Insights'}
              </button>
              
              {currentUser.role === 'Admin' && (
                <button
                  onClick={() => setIsResourceModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-md transition-transform active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add <span className="hidden sm:inline ml-1">Resource</span>
                </button>
              )}
              
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Top Metrics Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            metric={{
              label: currentUser.role === 'Viewer' ? 'My Completed (Range)' : 'Completed (Range)',
              value: completedTasksInRange,
              change: `${completedHoursInRange}h logged`,
              trend: 'up',
              icon: CheckCircle,
            }}
          />
          <MetricCard
            metric={{
              label: `${daysInRange > 1 ? 'Period' : 'Daily'} Utilization`,
              value: `${utilizationRate}%`,
              change: utilizationRate > 80 ? 'Heavy Load' : 'Balanced',
              trend: utilizationRate > 80 ? 'up' : 'neutral',
              icon: BarChart2,
            }}
          />
          <MetricCard
            metric={{
              label: currentUser.role === 'Viewer' ? 'My Availability' : 'Available (In Range)',
              value: underutilizedCount,
              change: 'Can take tasks',
              trend: 'down', 
              icon: Zap,
            }}
          />
           <MetricCard
            metric={{
              label: 'Pending Tasks (Range)',
              value: pendingTasksInRange,
              icon: Layout,
            }}
          />
        </section>

        {/* AI Analysis Section (Conditional) */}
        {analysis && (
          <section className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6 animate-fade-in">
            <div className="flex items-start space-x-4">
              <div className="bg-white p-2 rounded-full shadow-sm">
                <Zap className="text-yellow-500 w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Workload Analysis ({startDate} to {endDate})</h3>
                <p className="text-slate-700 mb-4 text-sm leading-relaxed">{analysis.summary}</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.underutilized.length > 0 && (
                    <div className="bg-white/60 p-3 rounded-lg border border-indigo-100">
                      <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Underutilized</span>
                      <p className="text-sm text-slate-600 mt-1">{analysis.underutilized.join(', ')}</p>
                    </div>
                  )}
                   {analysis.overloaded.length > 0 && (
                    <div className="bg-white/60 p-3 rounded-lg border border-red-100">
                      <span className="text-xs font-bold text-red-800 uppercase tracking-wide">Overloaded</span>
                      <p className="text-sm text-slate-600 mt-1">{analysis.overloaded.join(', ')}</p>
                    </div>
                  )}
                </div>

                {analysis.suggestions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Suggestions:</h4>
                    <ul className="space-y-1">
                      {analysis.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex items-start text-sm text-slate-600">
                          <span className="mr-2 text-indigo-500">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setAnalysis(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </section>
        )}

        {/* Charts & Graphs Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                {currentUser.role === 'Viewer' ? 'My Allocation' : 'Team Allocation'} ({startDate === endDate ? startDate : `${startDate} - ${endDate}`})
              </h2>
              <div className="flex items-center space-x-2">
                 <div className="flex items-center">
                    <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                    <span className="text-xs text-slate-500">Optimal</span>
                 </div>
                 <div className="flex items-center">
                    <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
                    <span className="text-xs text-slate-500">Low</span>
                 </div>
                 <div className="flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    <span className="text-xs text-slate-500">Over</span>
                 </div>
              </div>
            </div>
            <WorkloadChart resources={rangeResources} daysInRange={daysInRange} />
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Availability Status</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-slate-700">Available</span>
                </div>
                <span className="font-bold text-slate-900">{underutilizedCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                 <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-slate-700">Near Capacity</span>
                </div>
                <span className="font-bold text-slate-900">
                  {balancedCount}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                 <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-slate-700">Fully Booked</span>
                </div>
                <span className="font-bold text-slate-900">
                   {overloadedCount}
                </span>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="flex items-center mb-2">
                 <AlertTriangle size={16} className="text-yellow-500 mr-2" />
                 <h3 className="text-sm font-semibold text-slate-900">QA Planning Tip</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Prioritize "Blocker" bugs first. Ensure 20% buffer time for unexpected regression issues during daily testing.
              </p>
            </div>
          </div>
        </section>

        {/* Main Resource List */}
        <section>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                 {currentUser.role === 'Viewer' ? 'My Schedule' : 'QA Team Schedule'}
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedProjectIds([])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedProjectIds.length === 0 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  All Projects
                </button>
                {projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectToggle(project.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center ${
                      selectedProjectIds.includes(project.id) 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                      project.status === 'Active' ? 'bg-green-400' :
                      project.status === 'Pending' ? 'bg-yellow-400' : 'bg-slate-400'
                    }`}></span>
                    {project.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
               {/* Sort Control */}
               <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                  <ArrowUpDown size={14} className="text-slate-400 mr-2" />
                  <span className="text-xs text-slate-500 mr-2">Sort by:</span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'role')}
                    className="text-sm font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer focus:ring-0"
                  >
                    <option value="name">Name</option>
                    <option value="role">Role</option>
                  </select>
               </div>

               <div className="flex items-center text-sm text-slate-500">
                 <Filter size={16} className="mr-2" />
                 Showing {sortedResources.length} of {totalResources} resources
               </div>
            </div>
          </div>
          
          {sortedResources.length > 0 ? (
            <ResourceGrid 
              resources={sortedResources} 
              onRemove={handleRemoveResource} 
              onAddTask={handleOpenTaskModal}
              onToggleTaskCompletion={handleToggleTaskCompletion}
              onUpdateCapacity={handleUpdateCapacity}
              onViewHistory={handleViewHistory}
              daysInRange={daysInRange}
              userRole={currentUser.role}
            />
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
              <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                <Calendar className="text-slate-400" size={20} />
              </div>
              <h3 className="text-slate-900 font-medium mb-1">No tasks for this range</h3>
              <p className="text-slate-500 text-sm">No tasks assigned between {startDate} and {endDate}. Use the "Import CSV" button or add tasks manually.</p>
              <button 
                onClick={() => setSelectedProjectIds([])}
                className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>

      </main>

      <AddResourceModal 
        isOpen={isResourceModalOpen} 
        onClose={() => setIsResourceModalOpen(false)} 
        onAdd={handleAddResource} 
      />

      <AddTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onAssign={handleAssignTask}
        resourceName={selectedResourceName}
        initialDate={startDate}
        projects={projects}
      />

      <ImportDataModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCSV}
      />

      <TaskHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        resource={historyResource}
      />

      <ConfirmationModal
        isOpen={!!resourceToDelete}
        onClose={() => setResourceToDelete(null)}
        onConfirm={confirmDeleteResource}
        title="Remove Resource"
        message="Are you sure you want to remove this resource? This action cannot be undone and all assigned tasks will be unassigned."
      />
    </div>
  );
};

export default App;
