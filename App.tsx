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
  Eye,
  EyeOff,
  Briefcase,
  DollarSign,
  XCircle,
  Check,
  Power,
  Activity
} from 'lucide-react';
import { Resource, Role, AnalysisResult, Task, Project, Priority, User, UserRole } from './types';
import { MetricCard } from './components/MetricCard';
import { ResourceGrid } from './components/ResourceGrid';
import { AddResourceModal } from './components/AddResourceModal';
import { AddTaskModal } from './components/AddTaskModal';
import { ImportDataModal } from './components/ImportDataModal';
import { TaskHistoryModal } from './components/TaskHistoryModal';
import { WorkloadChart } from './components/WorkloadChart';
import { LoginScreen } from './components/LoginScreen';
import { analyzeResources } from './services/geminiService';
import { StorageService } from './services/storageService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Initialize state using the StorageService
  const [resources, setResources] = useState<Resource[]>(() => StorageService.getResources());
  const [projects, setProjects] = useState<Project[]>(() => StorageService.getProjects());
  
  // Persist changes whenever state updates
  useEffect(() => {
    StorageService.saveResources(resources);
  }, [resources]);

  useEffect(() => {
    StorageService.saveProjects(projects);
  }, [projects]);
  
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [historyResourceId, setHistoryResourceId] = useState<string | null>(null);
  
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  
  // Date Range State
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  
  const [sortBy, setSortBy] = useState<'name' | 'role'>('name');
  const [filterPriority, setFilterPriority] = useState<Priority | 'All'>('All');
  const [activeTab, setActiveTab] = useState<'allocation' | 'team'>('allocation');
  const [showInactive, setShowInactive] = useState(false);
  
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
    setActiveTab('allocation');
    setFilterPriority('All');
  };

  // Helper to calculate days between dates (inclusive)
  const getDaysDiff = (start: string, end: string) => {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const oneDay = 24 * 60 * 60 * 1000;
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

  const visibleResources = currentUser?.role === 'Viewer'
    ? resources.filter(r => r.id === currentUser.id)
    : resources;

  const projectFilteredResources = visibleResources.filter(resource => {
    if (selectedProjectIds.length === 0) return true;
    return resource.tasks.some(task => 
      !task.completed && selectedProjectIds.includes(task.projectId)
    );
  });

  const rangeResources = projectFilteredResources
    .filter(r => showInactive || r.status === 'Active')
    .map(resource => ({
    ...resource,
    tasks: resource.tasks.filter(task => {
      const inDateRange = task.date >= startDate && task.date <= endDate;
      const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
      return inDateRange && matchesPriority;
    })
  }));

  const activeResourcesList = visibleResources.filter(r => r.status === 'Active');
  const totalResources = visibleResources.length; 
  const totalActiveResources = activeResourcesList.length;

  const dailyCapacityPerPerson = 8;
  const totalCapacityInRange = totalActiveResources * dailyCapacityPerPerson * daysInRange;
  
  const activeRangeResources = rangeResources.filter(r => r.status === 'Active');
  
  const allocatedHoursInRange = activeRangeResources.reduce((acc, r) => acc + r.tasks
    .filter(t => !t.completed)
    .reduce((sum, t) => sum + t.hours, 0), 0);
  
  const completedTasksInRange = activeRangeResources.reduce((acc, r) => acc + r.tasks.filter(t => t.completed).length, 0);
  const completedHoursInRange = activeRangeResources.reduce((acc, r) => acc + r.tasks.filter(t => t.completed).reduce((sum, t) => sum + t.hours, 0), 0);
  const pendingTasksInRange = activeRangeResources.reduce((acc, r) => acc + r.tasks.filter(t => !t.completed).length, 0);

  const utilizationRate = totalCapacityInRange > 0 ? Math.round((allocatedHoursInRange / totalCapacityInRange) * 100) : 0;
  
  const underutilizedThreshold = 4 * daysInRange;
  const overloadedThreshold = 7 * daysInRange;

  const underutilizedCount = activeRangeResources.filter(r => {
    const hours = r.tasks.filter(t => !t.completed).reduce((sum, t) => sum + t.hours, 0);
    return hours < underutilizedThreshold;
  }).length;

  const overloadedCount = activeRangeResources.filter(r => {
    const hours = r.tasks.filter(t => !t.completed).reduce((sum, t) => sum + t.hours, 0);
    return hours > overloadedThreshold;
  }).length;
  
  const balancedCount = totalActiveResources - underutilizedCount - overloadedCount;

  const billableCount = visibleResources.filter(r => r.billable && r.status === 'Active').length;
  const nonBillableCount = visibleResources.filter(r => !r.billable && r.status === 'Active').length;
  const inactiveCount = visibleResources.filter(r => r.status === 'Inactive').length;

  const sortedResources = [...rangeResources].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'Active' ? -1 : 1;
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      return a.role.localeCompare(b.role);
    }
  });

  const handleAddResource = (name: string, role: Role, email: string, billable: boolean) => {
    const newResource: Resource = {
      id: `r${Date.now()}`,
      name,
      role,
      email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
      maxCapacity: 40,
      tasks: [],
      billable,
      status: 'Active'
    };
    // Use functional update to ensure we have the latest state
    setResources(prev => [...prev, newResource]);
  };

  const handleToggleResourceStatus = (id: string) => {
    setResources(prev => prev.map(r => {
      if (r.id === id) {
        const newStatus = r.status === 'Active' ? 'Inactive' : 'Active';
        return { ...r, status: newStatus };
      }
      return r;
    }));
  };

  const handleToggleBillable = (id: string) => {
    if (currentUser?.role !== 'Admin') return;
    setResources(prev => prev.map(r => r.id === id ? { ...r, billable: !r.billable } : r));
  };

  const handleOpenTaskModal = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    if (resource?.status === 'Inactive') return;
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

  const handleBulkCompleteTasks = (taskIds: string[]) => {
    setResources(prevResources => prevResources.map(resource => ({
      ...resource,
      tasks: resource.tasks.map(task => 
        taskIds.includes(task.id) ? { ...task, completed: true } : task
      )
    })));
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

  const handleImportCSV = (csvText: string) => {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const startIdx = lines[0].toLowerCase().includes('resource') ? 1 : 0;
    
    // Functional update to ensure safe state mutation
    setResources(currentResources => {
        const newResources = [...currentResources];
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
                    tasks: [],
                    billable: true,
                    status: 'Active'
                };
                newResources.push(newRes);
                resourceIdx = newResources.length - 1;
            }

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
        setProjects(newProjects); // Side effect inside state updater, but Projects has its own state
        return newResources;
    });
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeResources(rangeResources.filter(r => r.status === 'Active'));
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
              <div className="mr-8">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">QA Resource Planner</h1>
                <div className="flex items-center text-xs text-slate-500 hidden sm:flex">
                  <span className="px-2 py-0.5 bg-slate-100 rounded-full text-slate-600 font-medium flex items-center border border-slate-200">
                    {currentUser.role === 'Admin' ? <Shield size={10} className="mr-1 text-indigo-500" /> : <Eye size={10} className="mr-1 text-slate-500" />}
                    {currentUser.name}
                  </span>
                </div>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('allocation')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'allocation' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Allocation
                </button>
                {currentUser.role === 'Admin' && (
                  <button
                    onClick={() => setActiveTab('team')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      activeTab === 'team' 
                        ? 'bg-white text-indigo-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Team
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
              
              {activeTab === 'allocation' && (
                <>
                  <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-lg shadow-sm">
                    <div className="flex items-center px-2 py-1.5 sm:px-3 sm:py-2">
                      <Calendar size={16} className="text-slate-500 mr-2 flex-shrink-0" />
                      <div className="flex items-center space-x-2">
                          <input 
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              onClick={openDatePicker}
                              className="bg-transparent border-none outline-none text-xs sm:text-sm text-slate-700 font-medium cursor-pointer w-24 sm:w-auto relative [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0"
                              title="Start Date"
                          />
                          <ArrowRight size={14} className="text-slate-400" />
                          <input 
                              type="date"
                              value={endDate}
                              min={startDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              onClick={openDatePicker}
                              className="bg-transparent border-none outline-none text-xs sm:text-sm text-slate-700 font-medium cursor-pointer w-24 sm:w-auto relative [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0"
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
                </>
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
        
        {/* VIEW 1: ALLOCATION DASHBOARD */}
        {activeTab === 'allocation' && (
          <>
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
                {/* Only chart active resources */}
                <WorkloadChart resources={activeRangeResources} daysInRange={daysInRange} />
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
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                     <div className="flex items-center">
                      <div className="w-2 h-2 bg-slate-400 rounded-full mr-3"></div>
                      <span className="text-sm font-medium text-slate-700">Ramped Down</span>
                    </div>
                    <span className="font-bold text-slate-900">
                       {inactiveCount}
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
                   
                   {/* Inactive Filter Toggle */}
                   <button
                      onClick={() => setShowInactive(!showInactive)}
                      className={`flex items-center px-3 py-1.5 h-[34px] text-xs font-medium rounded-lg border transition-colors shadow-sm ${
                        showInactive 
                          ? 'bg-slate-100 text-slate-700 border-slate-300' 
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                   >
                      {showInactive ? <Eye size={14} className="mr-2" /> : <EyeOff size={14} className="mr-2" />}
                      {showInactive ? 'Hide Inactive' : 'Show Inactive'}
                   </button>

                   {/* Priority Filter */}
                   <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                      <Filter size={14} className="text-slate-400 mr-2" />
                      <span className="text-xs text-slate-500 mr-2">Priority:</span>
                      <select 
                        value={filterPriority} 
                        onChange={(e) => setFilterPriority(e.target.value as Priority | 'All')}
                        className="text-sm font-medium text-slate-700 bg-transparent border-none outline-none cursor-pointer focus:ring-0"
                      >
                        <option value="All">All</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                   </div>

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
                  onRemove={handleToggleResourceStatus} 
                  onAddTask={handleOpenTaskModal}
                  onToggleTaskCompletion={handleToggleTaskCompletion}
                  onUpdateCapacity={handleUpdateCapacity}
                  onViewHistory={handleViewHistory}
                  daysInRange={daysInRange}
                  userRole={currentUser.role}
                  onBulkComplete={handleBulkCompleteTasks}
                />
              ) : (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                  <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <Calendar className="text-slate-400" size={20} />
                  </div>
                  <h3 className="text-slate-900 font-medium mb-1">No tasks found</h3>
                  <p className="text-slate-500 text-sm">
                    No tasks match your current filters (Range: {startDate} to {endDate}, Priority: {filterPriority}).
                  </p>
                  <button 
                    onClick={() => {
                      setSelectedProjectIds([]);
                      setFilterPriority('All');
                    }}
                    className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {/* VIEW 2: TEAM MANAGEMENT */}
        {activeTab === 'team' && (
          <>
            {/* Team Stats */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <MetricCard
                metric={{
                  label: 'Total Resources',
                  value: totalResources,
                  icon: Users,
                }}
              />
              <MetricCard
                metric={{
                  label: 'Active Resources',
                  value: totalActiveResources,
                  change: `${inactiveCount} Inactive`,
                  trend: 'neutral',
                  icon: Activity,
                }}
              />
              <MetricCard
                metric={{
                  label: 'Billable Resources',
                  value: billableCount,
                  change: `${Math.round((billableCount / (totalActiveResources || 1)) * 100)}% of active`,
                  trend: 'neutral',
                  icon: DollarSign,
                }}
              />
               <MetricCard
                metric={{
                  label: 'Non-Billable Resources',
                  value: nonBillableCount,
                  icon: Briefcase,
                }}
              />
            </section>

            {/* Team List Table */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-900">Team Directory</h2>
                  {currentUser.role === 'Admin' && (
                    <button
                      onClick={() => setIsResourceModalOpen(true)}
                      className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-transform active:scale-95"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Resource
                    </button>
                  )}
               </div>
               
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                       <tr>
                         <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Resource Name</th>
                         <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Role</th>
                         <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Billable Status</th>
                         <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Projects</th>
                         <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Weekly Capacity</th>
                         {currentUser.role === 'Admin' && (
                           <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                         )}
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {visibleResources.length > 0 ? (
                         visibleResources.map(resource => {
                           // Calculate active projects based on non-completed tasks
                           const activeProjects = Array.from(new Set(
                               resource.tasks.filter(t => !t.completed).map(t => t.projectName)
                           ));
                           const isInactive = resource.status === 'Inactive';

                           return (
                             <tr key={resource.id} className={`hover:bg-slate-50 transition-colors ${isInactive ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                   <div className="flex items-center">
                                      <img 
                                        src={resource.avatar} 
                                        alt="" 
                                        className={`h-10 w-10 rounded-full border border-slate-200 mr-4 ${isInactive ? 'grayscale' : ''}`}
                                      />
                                      <div>
                                          <div className="font-medium text-slate-900 flex items-center">
                                            {resource.name}
                                            {isInactive && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-slate-200 text-slate-600 rounded">Inactive</span>}
                                          </div>
                                          <div className="text-xs text-slate-500">{resource.email}</div>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                    isInactive 
                                    ? 'bg-slate-100 text-slate-500 border-slate-200' 
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                  }`}>
                                    {resource.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <button
                                    onClick={() => handleToggleBillable(resource.id)}
                                    disabled={currentUser.role !== 'Admin' || isInactive}
                                    className={`flex items-center text-sm font-medium px-3 py-1 rounded-full border transition-all ${
                                       resource.billable && !isInactive
                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                    } ${currentUser.role === 'Admin' && !isInactive ? 'cursor-pointer' : 'cursor-default'}`}
                                  >
                                     {resource.billable ? <Check size={14} className="mr-1.5" /> : <XCircle size={14} className="mr-1.5" />}
                                     {resource.billable ? 'Billable' : 'Non-Billable'}
                                  </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {activeProjects.length > 0 ? activeProjects.slice(0, 2).map((p, i) => (
                                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                            {p}
                                        </span>
                                        )) : <span className="text-slate-400 text-xs italic">No active projects</span>}
                                        {activeProjects.length > 2 && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-400 border border-slate-200">+{activeProjects.length - 2}</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600 font-mono">
                                  {resource.maxCapacity} hrs
                                </td>
                                {currentUser.role === 'Admin' && (
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                     <button 
                                        onClick={() => handleToggleResourceStatus(resource.id)}
                                        className={`p-2 rounded-full transition-colors flex items-center justify-center mx-auto ${
                                          isInactive 
                                            ? 'text-slate-400 hover:text-green-600 hover:bg-green-50' 
                                            : 'text-green-500 hover:text-red-500 hover:bg-red-50'
                                        }`}
                                        title={isInactive ? "Ramp Up (Activate)" : "Ramp Down (Deactivate)"}
                                     >
                                        <Power size={18} />
                                     </button>
                                  </td>
                                )}
                             </tr>
                           );
                         })
                       ) : (
                         <tr>
                           <td colSpan={currentUser.role === 'Admin' ? 6 : 5} className="px-6 py-12 text-center text-slate-500 italic">
                             No resources found.
                           </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
               </div>
            </section>
          </>
        )}

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
    </div>
  );
};

export default App;