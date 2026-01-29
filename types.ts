export type Role = 'Developer' | 'Designer' | 'Manager' | 'QA' | 'Product';
export type Priority = 'Low' | 'Medium' | 'High';
export type UserRole = 'Admin' | 'Viewer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Task {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  hours: number;
  date: string; // YYYY-MM-DD
  completed?: boolean;
  priority: Priority;
}

export interface Resource {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  maxCapacity: number; // Weekly capacity (e.g., 40)
  tasks: Task[];
  email: string;
}

export interface Project {
  id: string;
  name: string;
  status: 'Active' | 'Pending' | 'Completed';
  requiredRole?: Role;
}

export interface Metric {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: any;
}

export interface AnalysisResult {
  summary: string;
  underutilized: string[];
  overloaded: string[];
  suggestions: string[];
}