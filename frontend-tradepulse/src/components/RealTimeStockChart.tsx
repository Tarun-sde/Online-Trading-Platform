'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  ComposedChart
} from 'recharts';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { motion } from 'framer-motion';

// Time ranges
const timeRanges = [
  { label: '1D', days: 1, id: '1d' },
  { label: '1W', days: 7, id: '1w' },
  { label: '1M', days: 30, id: '1m' },
  { label: '3M', days: 90, id: '3m' },
  { label: '1Y', days: 365, id: '1y' },
  { label: 'ALL', days: 1825, id: 'all' }
];

// Base prices for mock data
const BASE_PRICES = {
  'AAPL': 180,
  'MSFT': 400,
  'GOOGL': 140,
  'AMZN': 170,
  'TSLA': 190,
  'DEFAULT': 100
};

// Helper function to get deterministic random number
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Helper function to generate mock chart data
const generateMockChartData = (symbol: string, timeframe: string) => {
  const basePrice = BASE_PRICES[symbol as keyof typeof BASE_PRICES] || BASE_PRICES.DEFAULT;
  const now = Math.floor(Date.now() / 1000 / 300) * 300; // Round to nearest 5 minutes
  
  const dataPoints = timeframe === '1d' ? 24 : 
                    timeframe === '1w' ? 7 : 
                    timeframe === '1m' ? 30 : 
                    timeframe === '3m' ? 90 : 
                    timeframe === '1y' ? 365 : 1825;
  
  const interval = timeframe === '1d' ? 3600 : // 1 hour for 1d
                   timeframe === '1w' ? 86400 : // 1 day for 1w
                   timeframe === '1m' ? 86400 : // 1 day for 1m
                   timeframe === '3m' ? 86400 : // 1 day for 3m
                   timeframe === '1y' ? 86400 : // 1 day for 1y
                   86400; // 1 day for all
  
  const mockData = [];
  
  for (let i = 0; i < dataPoints; i++) {
    const timestamp = now - (dataPoints - i) * interval;
    // Use deterministic random number based on timestamp and symbol
    const seed = timestamp + symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomFactor = 1 + (seededRandom(seed) * 0.1 - 0.05); // ±5% variation
    const value = basePrice * randomFactor;
    const volume = Math.floor(seededRandom(seed * 2) * 1000000) + 500000;
    
    let date;
    if (timeframe === '1d') {
      date = new Date(timestamp * 1000).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC' // Use UTC to avoid timezone issues
      });
    } else {
      date = new Date(timestamp * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC' // Use UTC to avoid timezone issues
      });
    }
    
    mockData.push({
      date,
      timestamp,
      value: Number(value.toFixed(2)),
      volume
    });
  }
  
  return mockData;
};

interface RealTimeStockChartProps {
  symbol: string;
  name: string;
  onPriceUpdate?: (price: number, change: number, percentChange: number) => void;
  showVolume?: boolean;
  height?: number;
  initialTimeframe?: string;
  simplified?: boolean;
  showControls?: boolean;
  autoConnect?: boolean;
}

const RealTimeStockChart = ({
  symbol,
  name,
  onPriceUpdate,
  showVolume = true,
  height = 400,
  initialTimeframe = '1d',
  simplified = false,
  showControls = true,
  autoConnect = true
}: RealTimeStockChartProps) => {
  const [selectedRange, setSelectedRange] = useState(initialTimeframe);
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);
  const [percentChange, setPercentChange] = useState<number | null>(null);
  
  // Connect to real-time data for the symbol
  const { 
    data: realtimeData, 
    isConnected, 
    isLoading,
    changeTimeframe 
  } = useRealTimeData('stock', symbol, autoConnect);
  
  // Fetch initial chart data
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Generate mock data first
        const mockData = generateMockChartData(symbol, selectedRange);
        
        // Try to fetch real data from API
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_URL}/api/market-data/chart/${symbol}?timeframe=${selectedRange}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        let chartData;
        if (!response.ok) {
          console.warn('API request failed, using mock data');
          chartData = mockData;
        } else {
          const data = await response.json();
          
          // Format data for the chart
          chartData = data.timestamps.map((timestamp: number, index: number) => {
            let date;
            if (selectedRange === '1d') {
              // Format as HH:MM for 1-day view
              date = new Date(timestamp * 1000).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
            } else {
              // Format as MM/DD for longer timeframes
              date = new Date(timestamp * 1000).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });
            }
            
            return {
              date,
              timestamp,
              value: data.prices[index],
              volume: data.volumes[index]
            };
          });
        }
        
        setChartData(chartData);
        
        // Update current price and changes
        if (chartData.length > 0) {
          const latestDataPoint = chartData[chartData.length - 1];
          const firstDataPoint = chartData[0];
          
          setCurrentPrice(latestDataPoint.value);
          const change = latestDataPoint.value - firstDataPoint.value;
          setPriceChange(change);
          setPercentChange((change / firstDataPoint.value) * 100);
          
          // Notify parent component if callback provided
          if (onPriceUpdate) {
            onPriceUpdate(
              latestDataPoint.value,
              change,
              (change / firstDataPoint.value) * 100
            );
          }
        }
      } catch (error) {
        console.error('Error in chart data handling:', error);
        
        // Use mock data as fallback
        const mockData = generateMockChartData(symbol, selectedRange);
        setChartData(mockData);
        
        // Update current price and changes with mock data
        if (mockData.length > 0) {
          const latestDataPoint = mockData[mockData.length - 1];
          const firstDataPoint = mockData[0];
          
          setCurrentPrice(latestDataPoint.value);
          const change = latestDataPoint.value - firstDataPoint.value;
          setPriceChange(change);
          setPercentChange((change / firstDataPoint.value) * 100);
          
          // Notify parent component if callback provided
          if (onPriceUpdate) {
            onPriceUpdate(
              latestDataPoint.value,
              change,
              (change / firstDataPoint.value) * 100
            );
          }
        }
      }
    };
    
    fetchChartData();
  }, [symbol, selectedRange, onPriceUpdate]);
  
  // Update chart with real-time data
  useEffect(() => {
    if (realtimeData && chartData.length > 0) {
      // In a real implementation, we would update the chart with the new data point
      // Here we'll simulate adding the new price to the chart
      const newPrice = realtimeData.currentPrice;
      const lastTimestamp = chartData[chartData.length - 1].timestamp;
      const newTimestamp = lastTimestamp + 60; // Add 60 seconds
      
      let newDate;
      if (selectedRange === '1d') {
        newDate = new Date(newTimestamp * 1000).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      } else {
        newDate = new Date(newTimestamp * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      }
      
      // Only add a new data point if the timestamp is different
      const shouldAddPoint = !chartData.some(point => point.timestamp === newTimestamp);
      
      if (shouldAddPoint) {
        const newDataPoint = {
          date: newDate,
          timestamp: newTimestamp,
          value: newPrice,
          volume: Math.floor(Math.random() * 1000000) // Random volume
        };
        
        // Update chart data, removing oldest point to keep chart size consistent
        setChartData(prev => [...prev.slice(1), newDataPoint]);
      } else {
        // Update last point if timestamp exists
        setChartData(prev => {
          const updatedData = [...prev];
          updatedData[updatedData.length - 1] = {
            ...updatedData[updatedData.length - 1],
            value: newPrice
          };
          return updatedData;
        });
      }
      
      // Update price and changes
      setCurrentPrice(newPrice);
      const firstDataPoint = chartData[0];
      const change = newPrice - firstDataPoint.value;
      setPriceChange(change);
      setPercentChange((change / firstDataPoint.value) * 100);
      
      // Notify parent component if callback provided
      if (onPriceUpdate) {
        onPriceUpdate(
          newPrice,
          change,
          (change / firstDataPoint.value) * 100
        );
      }
    }
  }, [realtimeData, chartData, selectedRange, onPriceUpdate]);
  
  // Handle range change
  const handleRangeChange = useCallback((rangeId: string) => {
    setSelectedRange(rangeId);
    changeTimeframe(rangeId);
  }, [changeTimeframe]);
  
  // Determine chart color based on price change
  const isPositive = percentChange !== null ? percentChange >= 0 : true;
  const chartColor = isPositive ? '#22c55e' : '#ef4444';
  
  // Format tooltip values
  const formatTooltipValue = (value: string) => {
    return [`$${parseFloat(value).toFixed(2)}`, 'Price'];
  };
  
  // Format tooltip volume
  const formatVolume = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    return value.toString();
  };
  
  return (
    <div className={`bg-gray-900 rounded-xl ${simplified ? 'p-0' : 'p-4'} shadow-lg`}>
      <div className="flex flex-col space-y-4">
        {!simplified && (
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">{symbol}</h2>
              <p className="text-gray-400 text-sm">{name}</p>
            </div>
            <div className="text-right">
              {currentPrice !== null ? (
                <>
                  <motion.p
                    key={currentPrice}
                    initial={{ scale: 1.2, color: isPositive ? '#22c55e' : '#ef4444' }}
                    animate={{ scale: 1, color: 'white' }}
                    transition={{ duration: 0.5 }}
                    className="text-xl font-bold text-white"
                  >
                    ${currentPrice.toFixed(2)}
                  </motion.p>
                  <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    ${priceChange !== null ? Math.abs(priceChange).toFixed(2) : '0.00'} 
                    ({isPositive ? '+' : '-'}
                    {percentChange !== null ? Math.abs(percentChange).toFixed(2) : '0.00'}%)
                  </p>
                </>
              ) : (
                <div className="animate-pulse">
                  <div className="h-6 w-20 bg-gray-700 rounded mb-1"></div>
                  <div className="h-4 w-24 bg-gray-700 rounded"></div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ height: `${height}px` }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              {showVolume && !simplified ? (
                <ComposedChart
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
                    yAxisId="price"
                  />
                  <YAxis
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    width={50}
                    yAxisId="volume"
                    domain={[0, 'dataMax + 1000000']}
                    tickFormatter={formatVolume}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      borderColor: '#374151',
                      borderRadius: '0.5rem',
                      color: 'white'
                    }}
                    itemStyle={{ color: 'white' }}
                    formatter={formatTooltipValue}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    yAxisId="price"
                  />
                  <Bar
                    dataKey="volume"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    yAxisId="volume"
                  />
                </ComposedChart>
              ) : (
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
                  {!simplified && (
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      minTickGap={30}
                    />
                  )}
                  {!simplified && (
                    <YAxis
                      domain={['dataMin - 5', 'dataMax + 5']}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      width={50}
                    />
                  )}
                  {!simplified && (
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        borderColor: '#374151',
                        borderRadius: '0.5rem',
                        color: 'white'
                      }}
                      itemStyle={{ color: 'white' }}
                      formatter={formatTooltipValue}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={chartColor}
                    strokeWidth={simplified ? 1 : 2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {showControls && (
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
        )}
        
        {/* Connection status indicator */}
        {!simplified && (
          <div className="flex items-center justify-end mt-1">
            <div className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <p className="text-xs text-gray-500">
              {isConnected ? 'Real-time data connected' : 'Disconnected'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeStockChart; 