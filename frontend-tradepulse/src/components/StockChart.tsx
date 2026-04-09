'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  date: string;
  price: number;
}

interface StockChartProps {
  symbol: string;
  currentPrice?: number;
  priceChange?: number;
  percentChange?: number;
  /** Real chart data from the backend — { date: string, price: number }[] */
  chartData?: ChartDataPoint[];
  loading?: boolean;
  variant?: 'default' | 'sparkline';
}

// ── Component ─────────────────────────────────────────────────────────────────

const StockChart = ({
  symbol,
  currentPrice = 0,
  priceChange = 0,
  percentChange = 0,
  chartData = [],
  loading = false,
  variant = 'default',
}: StockChartProps) => {
  const isPositive = percentChange >= 0;
  const chartColor = isPositive ? '#22c55e' : '#ef4444';

  const displayData = useMemo(() => {
    if (chartData.length <= 60) return chartData;
    const step = Math.floor(chartData.length / 60);
    return chartData.filter((_, i) => i % step === 0 || i === chartData.length - 1);
  }, [chartData]);

  const prices = displayData.map((d) => d.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const pad = (maxPrice - minPrice) * 0.01;
  const yDomain: [number, number] = [
    parseFloat((minPrice - pad).toFixed(2)),
    parseFloat((maxPrice + pad).toFixed(2)),
  ];

  const tickInterval = Math.max(1, Math.floor(displayData.length / 6));

  if (variant === 'sparkline') {
    return (
      <div className="w-full h-full relative min-h-[40px] flex items-center justify-center">
        {loading && <svg className="h-4 w-4 animate-spin text-gray-500" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" /></svg>}
        {!loading && displayData.length === 0 && <span className="text-xs text-gray-500">No data</span>}
        {displayData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={yDomain} hide />
              <Area
                type="monotone"
                dataKey="price"
                stroke={chartColor}
                strokeWidth={1.5}
                fillOpacity={1}
                fill={`url(#spark-${symbol})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 shadow-lg">
      <div className="flex flex-col space-y-4">

        {/* ── Header ── */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">{symbol}</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {chartData.length} trading days · Yahoo Finance
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-white">
              ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}₹{priceChange.toFixed(2)}{' '}
              ({isPositive ? '+' : ''}{percentChange.toFixed(2)}%)
            </p>
          </div>
        </div>

        {/* ── Chart ── */}
        <div className="h-64 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-lg z-10">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                </svg>
                Loading real data…
              </div>
            </div>
          )}

          {!loading && displayData.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
              No chart data available.
            </div>
          )}

          {displayData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  interval={tickInterval}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  width={65}
                  domain={yDomain}
                  tickFormatter={(v: number) =>
                    v >= 1000
                      ? `₹${(v / 1000).toFixed(1)}k`
                      : `₹${v.toFixed(2)}`
                  }
                />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '0.5rem',
                    color: 'white',
                    fontSize: '12px',
                  }}
                  formatter={(v: number) => [
                    `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                    'Price',
                  ]}
                  labelStyle={{ color: '#9ca3af' }}
                />

                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={chartColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#grad-${symbol})`}
                  dot={false}
                  activeDot={{ r: 4, fill: chartColor }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
};

export default StockChart;
