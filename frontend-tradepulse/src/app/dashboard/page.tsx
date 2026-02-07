'use client';

import { 
  BanknotesIcon, 
  ChartPieIcon, 
  ChartBarIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import StockChart from '@/components/StockChart';
import StatsCard from '@/components/StatsCard';
import WatchList from '@/components/WatchList';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function Dashboard() {
  // Sample portfolio data
const holdings = [
  { symbol: "AAPL", shares: 25, avg: 165.23 },
  { symbol: "MSFT", shares: 15, avg: 342.67 },
  { symbol: "TSLA", shares: 20, avg: 242.15 },
];

const [prices, setPrices] = useState<Record<string, any>>({});

useEffect(() => {
  const load = async () => {
    const res = await fetch("http://localhost:5000/api/market-data/stocks");
    const list = await res.json();
    const map: any = {};
    for (const s of list) map[s.symbol] = s;
    setPrices(map);
  };

  load();
  const id = setInterval(load, 60000);
  return () => clearInterval(id);
}, []);

const portfolioData = useMemo(() => {
  let totalValue = 0;
  let prevValue = 0;

  for (const h of holdings) {
    const live = prices[h.symbol];
    const price = live?.currentPrice ?? h.avg;
    const prev = live?.previousClose ?? price;  // ✅ correct key


    totalValue += price * h.shares;
    prevValue += prev * h.shares;
  }

  const dayChange = totalValue - prevValue;
  const dayChangePercent =
    prevValue > 0 ? (dayChange / prevValue) * 100 : 0;

  return {
    totalValue,
    dayChange,
    dayChangePercent,
    weeklyChange: dayChange * 5,
    weeklyChangePercent: dayChangePercent * 5,
    monthlyChange: dayChange * 20,
    monthlyChangePercent: dayChangePercent * 20,
  };
}, [prices]);


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
          <div className="mt-6 mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-400 mt-2">Monitor your portfolio and market performance</p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Portfolio Value"
              value={`$${portfolioData.totalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              change={portfolioData.dayChangePercent}
              trend={portfolioData.dayChangePercent >= 0 ? 'up' : 'down'}
              color="green"
              icon={<BanknotesIcon className="h-5 w-5 text-white" />}
            />
            <StatsCard
              title="Daily Change"
              value={`$${Math.abs(portfolioData.dayChange).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              change={portfolioData.dayChangePercent}
              trend={portfolioData.dayChangePercent >= 0 ? 'up' : 'down'}
              color="blue"
              icon={<ClockIcon className="h-5 w-5 text-white" />}
            />
            <StatsCard
              title="Weekly Change"
              value={`$${Math.abs(portfolioData.weeklyChange).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              change={portfolioData.weeklyChangePercent}
              trend={portfolioData.weeklyChangePercent >= 0 ? 'up' : 'down'}
              color="indigo"
              icon={<ChartBarIcon className="h-5 w-5 text-white" />}
            />
            <StatsCard
              title="Monthly Change"
              value={`$${Math.abs(portfolioData.monthlyChange).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              change={portfolioData.monthlyChangePercent}
              trend={portfolioData.monthlyChangePercent >= 0 ? 'up' : 'down'}
              color="purple"
              icon={<ChartPieIcon className="h-5 w-5 text-white" />}
            />
          </div>
          
          {/* Portfolio Chart */}
          <div className="mb-8">
            <StockChart
              symbol="Portfolio"
              name="Total Portfolio Value"
              currentPrice={portfolioData.totalValue}
              priceChange={portfolioData.dayChange}
              percentChange={portfolioData.dayChangePercent}
              trend="volatile"
            />
          </div>
          
          {/* Portfolio Allocation */}
          <div className="mb-8">
            <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">Portfolio Allocation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">By Asset Class</h3>
                  <div className="flex flex-col space-y-3">
                    <AllocationBar label="Stocks" percentage={65} color="blue" />
                    <AllocationBar label="Bonds" percentage={15} color="green" />
                    <AllocationBar label="Cash" percentage={10} color="yellow" />
                    <AllocationBar label="Crypto" percentage={5} color="purple" />
                    <AllocationBar label="Commodities" percentage={5} color="orange" />
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">By Sector</h3>
                  <div className="flex flex-col space-y-3">
                    <AllocationBar label="Technology" percentage={40} color="indigo" />
                    <AllocationBar label="Healthcare" percentage={20} color="blue" />
                    <AllocationBar label="Financial" percentage={15} color="green" />
                    <AllocationBar label="Consumer" percentage={15} color="yellow" />
                    <AllocationBar label="Energy" percentage={10} color="red" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Watchlist */}
          <div>
            <WatchList />
          </div>
        </main>
        
        <footer className="bg-black/30 border-t border-gray-800 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400">
                © 2025 NexTrade. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-sm text-gray-400 hover:text-white">Terms</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Privacy</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Cookie Policy</a>
                <a href="#" className="text-sm text-gray-400 hover:text-white">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}

interface AllocationBarProps {
  label: string;
  percentage: number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'indigo';
}

const AllocationBar = ({ label, percentage, color }: AllocationBarProps) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    indigo: 'bg-indigo-500',
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="text-sm font-medium text-gray-300">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div className={`${colorClasses[color]} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}; 