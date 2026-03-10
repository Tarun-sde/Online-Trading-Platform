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
      name: 'NIFTY 50',
      symbol: '^NSEI',
      currentValue: 22456.78,
      change: 125.45,
      percentChange: 0.56,
    },
    {
      name: 'SENSEX',
      symbol: '^BSESN',
      currentValue: 73845.67,
      change: 234.12,
      percentChange: 0.32,
    },
    {
      name: 'NIFTY BANK',
      symbol: 'NIFTYBANK',
      currentValue: 48567.89,
      change: 345.67,
      percentChange: 0.72,
    },
    {
      name: 'NIFTY IT',
      symbol: 'NIFTYIT',
      currentValue: 38210.45,
      change: -152.30,
      percentChange: -0.40,
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