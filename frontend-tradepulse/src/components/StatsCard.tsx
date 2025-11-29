'use client';

import { ReactNode } from 'react';
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/solid';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'indigo' | 'purple' | 'red' | 'orange';
}

const StatsCard = ({
  title,
  value,
  change,
  icon,
  trend = 'neutral',
  color = 'blue'
}: StatsCardProps) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
  };

  const trendClasses = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-gray-400',
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className={`bg-gradient-to-r ${colorClasses[color]} px-4 py-2 flex justify-between items-center`}>
        <h3 className="text-white font-medium">{title}</h3>
        <div className="bg-black/20 rounded-full p-2">
          {icon}
        </div>
      </div>
      <div className="p-4">
        <div className="text-2xl font-bold text-white">{value}</div>
        {change !== undefined && (
          <div className="flex items-center mt-1">
            {trend === 'up' ? (
              <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
            ) : trend === 'down' ? (
              <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
            ) : null}
            <span className={`text-sm ${trendClasses[trend]}`}>
              {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}
              {Math.abs(change).toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard; 