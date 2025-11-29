'use client';

import { useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

// Sample data
const generateData = (days: number, trend: 'up' | 'down' | 'volatile') => {
  const result = [];
  let baseValue = 100;
  
  for (let i = 0; i < days; i++) {
    let volatility = Math.random() * 2 - 1; // between -1 and 1
    
    if (trend === 'up') {
      baseValue += Math.random() * 3 + volatility + 0.2; // overall upward trend
    } else if (trend === 'down') {
      baseValue -= Math.random() * 3 + volatility + 0.2; // overall downward trend
    } else {
      baseValue += (Math.random() * 4 - 2) + volatility; // volatile
    }
    
    // Ensure we don't go negative
    baseValue = Math.max(baseValue, 30);
    
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    result.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: baseValue.toFixed(2),
      volume: Math.floor(Math.random() * 10000000) + 1000000
    });
  }
  
  return result;
};

const timeRanges = [
  { label: '1D', days: 1, id: '1d' },
  { label: '1W', days: 7, id: '1w' },
  { label: '1M', days: 30, id: '1m' },
  { label: '3M', days: 90, id: '3m' },
  { label: '1Y', days: 365, id: '1y' },
  { label: 'ALL', days: 1825, id: 'all' }
];

interface StockChartProps {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange: number;
  percentChange: number;
  trend?: 'up' | 'down' | 'volatile';
}

const StockChart = ({
  symbol,
  name,
  currentPrice,
  priceChange,
  percentChange,
  trend = 'up'
}: StockChartProps) => {
  const [selectedRange, setSelectedRange] = useState('1m');
  const [chartData, setChartData] = useState(() => {
    const range = timeRanges.find(r => r.id === '1m') || timeRanges[2];
    return generateData(range.days, trend);
  });

  const handleRangeChange = (rangeId: string) => {
    setSelectedRange(rangeId);
    const range = timeRanges.find(r => r.id === rangeId) || timeRanges[2];
    setChartData(generateData(range.days, trend));
  };

  const isPositive = percentChange >= 0;
  const chartColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <div className="bg-gray-900 rounded-xl p-4 shadow-lg">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{symbol}</h2>
            <p className="text-gray-400 text-sm">{name}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-white">${currentPrice.toFixed(2)}</p>
            <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              ${Math.abs(priceChange).toFixed(2)} ({isPositive ? '+' : '-'}{Math.abs(percentChange).toFixed(2)}%)
            </p>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                minTickGap={30}
              />
              <YAxis
                domain={['dataMin - 5', 'dataMax + 5']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  borderColor: '#374151',
                  borderRadius: '0.5rem',
                  color: 'white'
                }}
                itemStyle={{ color: 'white' }}
                formatter={(value: string) => [`$${value}`, 'Price']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-between mt-2">
          {timeRanges.map((range) => (
            <button
              key={range.id}
              onClick={() => handleRangeChange(range.id)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                selectedRange === range.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StockChart; 