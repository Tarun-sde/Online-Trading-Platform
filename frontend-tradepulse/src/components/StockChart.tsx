'use client';

import { useState, useMemo } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

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

/**
 * ✅ deterministic series builder
 * anchors chart to real current price + change
 */
function buildSeries(days: number, current: number, change: number) {
  const prev = current - change;
  const result = [];

  for (let i = 0; i < days; i++) {
    const t = i / (days - 1);

    // smooth curve between prev → current
    const value =
      prev + (current - prev) * t +
      (Math.sin(i / 3) * change * 0.08); // tiny wiggle

    const d = new Date();
    d.setDate(d.getDate() - (days - i));

    result.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: +value.toFixed(2),
      volume: 0
    });
  }

  // force last point exact
  result[result.length - 1].value = +current.toFixed(2);

  return result;
}

const StockChart = ({
  symbol,
  name,
  currentPrice,
  priceChange,
  percentChange,
}: StockChartProps) => {

  const [selectedRange, setSelectedRange] = useState('1m');

  const days =
    timeRanges.find(r => r.id === selectedRange)?.days ?? 30;

  const chartData = useMemo(
    () => buildSeries(days, currentPrice, priceChange),
    [days, currentPrice, priceChange]
  );

  const isPositive = percentChange >= 0;
  const chartColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <div className="bg-gray-900 rounded-xl p-4 shadow-lg">
      <div className="flex flex-col space-y-4">

        {/* header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{symbol}</h2>
            <p className="text-gray-400 text-sm">{name}</p>
          </div>

          <div className="text-right">
            <p className="text-xl font-bold text-white">
              ${currentPrice.toFixed(2)}
            </p>
            <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              ${Math.abs(priceChange).toFixed(2)} ({isPositive ? '+' : '-'}
              {Math.abs(percentChange).toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
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
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                width={50}
                domain={['dataMin', 'dataMax']}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  borderColor: '#374151',
                  borderRadius: '0.5rem',
                  color: 'white'
                }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'Value']}
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

        {/* range buttons */}
        <div className="flex justify-between mt-2">
          {timeRanges.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRange(r.id)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                selectedRange === r.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};

export default StockChart;
