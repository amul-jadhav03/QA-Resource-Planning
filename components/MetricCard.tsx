import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Metric } from '../types';

interface MetricCardProps {
  metric: Metric;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const { label, value, change, trend, icon: Icon } = metric;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        </div>
        {Icon && (
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Icon size={20} />
          </div>
        )}
      </div>
      
      {change && (
        <div className="flex items-center text-sm">
          {trend === 'up' && <ArrowUpRight size={16} className="text-green-500 mr-1" />}
          {trend === 'down' && <ArrowDownRight size={16} className="text-red-500 mr-1" />}
          {trend === 'neutral' && <Minus size={16} className="text-slate-400 mr-1" />}
          
          <span className={`font-medium ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-slate-600'
          }`}>
            {change}
          </span>
          <span className="text-slate-400 ml-1">vs last week</span>
        </div>
      )}
    </div>
  );
};
