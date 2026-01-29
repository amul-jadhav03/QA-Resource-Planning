import { Resource, Project } from './types';

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'E-commerce Web', status: 'Active' },
  { id: 'p2', name: 'Mobile App v2.0', status: 'Active' },
  { id: 'p3', name: 'Payment Gateway', status: 'Pending' },
  { id: 'p4', name: 'Admin Dashboard', status: 'Active' },
];

// Helper to get today's date in YYYY-MM-DD format
const getToday = () => new Date().toISOString().split('T')[0];

export const INITIAL_RESOURCES: Resource[] = [
  {
    id: 'r1',
    name: 'Sarah Chen',
    role: 'QA',
    email: 'sarah.c@company.com',
    avatar: 'https://picsum.photos/id/64/100/100',
    maxCapacity: 40,
    tasks: [
      { id: 't1', projectId: 'p1', projectName: 'E-commerce Web', name: 'Checkout Flow Regression', hours: 6, date: getToday(), completed: false, priority: 'High' },
    ],
  },
  {
    id: 'r2',
    name: 'Marcus Johnson',
    role: 'QA',
    email: 'marcus.j@company.com',
    avatar: 'https://picsum.photos/id/91/100/100',
    maxCapacity: 40,
    tasks: [
      { id: 't3', projectId: 'p2', projectName: 'Mobile App v2.0', name: 'Login Smoke Test', hours: 4, date: getToday(), completed: false, priority: 'High' },
      { id: 't4', projectId: 'p2', projectName: 'Mobile App v2.0', name: 'UI Glitch Verification', hours: 3, date: getToday(), completed: false, priority: 'Low' },
    ],
  },
  {
    id: 'r3',
    name: 'Emily Davis',
    role: 'QA',
    email: 'emily.d@company.com',
    avatar: 'https://picsum.photos/id/177/100/100',
    maxCapacity: 40,
    tasks: [
      { id: 't5', projectId: 'p4', projectName: 'Admin Dashboard', name: 'Permission Testing', hours: 8, date: getToday(), completed: false, priority: 'Medium' },
    ],
  },
  {
    id: 'r4',
    name: 'James Wilson',
    role: 'Manager',
    email: 'james.w@company.com',
    avatar: 'https://picsum.photos/id/203/100/100',
    maxCapacity: 40,
    tasks: [],
  },
];