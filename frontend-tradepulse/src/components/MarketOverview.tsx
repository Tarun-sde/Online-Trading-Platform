'use client';

import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/24/solid';
import { useState, useEffect } from 'react';

interface MarketIndexProps {
  name: string;
  symbol: string;
  value: number;
  change: number;
  percentChange: number;
}

interface MarketOverviewProps {
  indices?: Array<{
    name: string;
    symbol: string;
    currentValue: number;
    change: number;
    percentChange: number;
    previousClose?: number;
    lastUpdated?: Date;
  }> | null;
}

const MarketIndex = ({ name, symbol, value, change, percentChange }: MarketIndexProps) => {
  const isPositive = percentChange >= 0;

  return (
    <div className="bg-gray-800 hover:bg-gray-750 transition-colors duration-200 rounded-lg p-4 flex flex-col shadow-md hover:shadow-lg border border-gray-700 hover:border-gray-600">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-semibold text-white text-lg">{name}</h3>
          <p className="text-gray-400 text-xs mt-0.5">{symbol}</p>
        </div>
        <div className={`flex items-center justify-center h-8 w-8 rounded-full ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          {isPositive ? (
            <ArrowUpIcon className="h-5 w-5 text-green-500" />
          ) : (
            <ArrowDownIcon className="h-5 w-5 text-red-500" />
          )}
        </div>
      </div>
      <div className="mt-auto">
        <p className="text-white font-bold text-2xl">{value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
        <div className="flex items-center mt-1">
          <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{percentChange.toFixed(2)}%)
          </span>
        </div>
      </div>
    </div>
  );
};

const MarketOverview = ({ indices }: MarketOverviewProps) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Update time on client-side only
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    
    // Update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Sample data for market indices (fallback if no indices provided)
  const defaultMarketIndices = [
    {
      name: 'S&P 500',
      symbol: 'SPX',
      currentValue: 4892.37,
      change: 72.14,
      percentChange: 1.49,
    },
    {
      name: 'Nasdaq',
      symbol: 'COMP',
      currentValue: 15628.95,
      change: 198.89,
      percentChange: 1.29,
    },
    {
      name: 'Dow Jones',
      symbol: 'DJI',
      currentValue: 38711.24,
      change: -5.58,
      percentChange: -0.01,
    },
    {
      name: 'Russell 2000',
      symbol: 'RUT',
      currentValue: 2026.39,
      change: 35.06,
      percentChange: 1.76,
    },
  ];

  // Use provided indices or fallback to default data
  const displayIndices = indices?.length ? indices : defaultMarketIndices;

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Market Overview</h2>
        <div className="text-sm text-gray-400">
          {currentTime ? `Last Updated: ${currentTime}` : 'Loading...'}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {displayIndices.map((index) => (
          <MarketIndex
            key={index.symbol}
            name={index.name}
            symbol={index.symbol}
            value={index.currentValue || 0}
            change={index.change}
            percentChange={index.percentChange}
          />
        ))}
      </div>
    </div>
  );
};

export default MarketOverview; 