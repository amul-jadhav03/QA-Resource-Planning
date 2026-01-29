import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Cell
} from 'recharts';
import { Resource } from '../types';

interface WorkloadChartProps {
  resources: Resource[];
  daysInRange: number;
}

export const WorkloadChart: React.FC<WorkloadChartProps> = ({ resources, daysInRange }) => {
  // Assume 8h per day capacity for chart scaling
  const dailyCap = 8;
  const maxLine = dailyCap * daysInRange;

  const data = resources.map(r => ({
    name: r.name.split(' ')[0], // First name only for clearer labels
    // Filter out completed tasks for calculation
    hours: r.tasks
      .filter(t => !t.completed)
      .reduce((sum, t) => sum + t.hours, 0),
    max: maxLine
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
          />
          <Tooltip 
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ 
              borderRadius: '8px', 
              border: 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              backgroundColor: '#1e293b',
              color: '#fff'
            }}
          />
          <ReferenceLine 
            y={maxLine} 
            stroke="#94a3b8" 
            strokeDasharray="3 3" 
            label={{ position: 'top', value: daysInRange === 1 ? 'Daily Cap (8h)' : `Cap (${maxLine}h)`, fill: '#94a3b8', fontSize: 10 }} 
          />
          <Bar dataKey="hours" radius={[4, 4, 0, 0]} barSize={40}>
            {data.map((entry, index) => {
               const threshold = maxLine;
               const underload = (dailyCap / 2) * daysInRange; // 50% capacity mark
               return (
                   <Cell key={`cell-${index}`} fill={entry.hours > threshold ? '#ef4444' : entry.hours < underload ? '#facc15' : '#6366f1'} />
               );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};