'use client';

import { 
  BanknotesIcon, 
  ChartPieIcon, 
  ChartBarIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import StockChart from '@/components/StockChart';
import StockSearch from '@/components/StockSearch';
import StatsCard from '@/components/StatsCard';
import WatchList from '@/components/WatchList';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useSymbol } from '@/context/SymbolContext';
import { usePortfolio } from '@/context/PortfolioContext';
export default function Dashboard() {
  const { holdings, stats, loading, livePrices } = usePortfolio();

  console.log("Portfolio Data:", holdings);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
          <div className="mt-6 mb-8">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-400 mt-2">Monitor your Indian market portfolio and performance</p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Portfolio Value"
              value={`₹${stats.totalValue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              trend="neutral"
              color="blue"
              icon={<BanknotesIcon className="h-5 w-5 text-white" />}
            />
            <StatsCard
              title="Total Cost"
              value={`₹${stats.totalCost.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              trend="neutral"
              color="indigo"
              icon={<ClockIcon className="h-5 w-5 text-white" />}
            />
            <StatsCard
              title="P&L"
              value={`₹${Math.abs(stats.totalPnL).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              trend={stats.totalPnL >= 0 ? 'up' : 'down'}
              color={stats.totalPnL >= 0 ? 'green' : 'red'}
              icon={<ChartBarIcon className="h-5 w-5 text-white" />}
            />
            <StatsCard
              title="Return %"
              value={`${stats.pnlPct.toFixed(2)}%`}
              change={stats.pnlPct}
              trend={stats.pnlPct >= 0 ? 'up' : 'down'}
              color={stats.pnlPct >= 0 ? 'green' : 'red'}
              icon={<ChartPieIcon className="h-5 w-5 text-white" />}
            />
          </div>
          
          {/* Stock Search + Real Chart (global SymbolContext) */}
          <DashboardChartSection />

          
          {/* Portfolio Allocation */}
          <div className="mb-8">
            <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">Portfolio Allocation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">By Asset Class</h3>
                  <div className="flex flex-col space-y-3">
                    <AllocationBar label="Stocks" percentage={100} color="blue" />
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">Top Holdings</h3>
                  <div className="flex flex-col space-y-3">
                    {holdings.length === 0 ? (
                      <p className="text-sm text-gray-500">No holdings to display.</p>
                    ) : (
                      (() => {
                        const colors: ('indigo' | 'blue' | 'green' | 'yellow' | 'red')[] = ['indigo', 'blue', 'green', 'yellow', 'red'];
                        const top5 = [...holdings]
                          .sort((a, b) => {
                            const valA = a.quantity * (livePrices[a.symbol] ?? a.avgPrice);
                            const valB = b.quantity * (livePrices[b.symbol] ?? b.avgPrice);
                            return valB - valA;
                          })
                          .slice(0, 5);
                          
                        return top5.map((h, i) => {
                          const val = h.quantity * (livePrices[h.symbol] ?? h.avgPrice);
                          const pct = stats.totalValue > 0 ? (val / stats.totalValue) * 100 : 0;
                          return <AllocationBar key={h.symbol} label={h.symbol} percentage={Number(pct.toFixed(1))} color={colors[i % colors.length]} />;
                        });
                      })()
                    )}
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

// ── Stock search + real chart section ─────────────────────────────────────────
// Extracted as a proper component so hooks (useSymbol) are called at component level
function DashboardChartSection() {
  const { symbol, currentPrice, chartData, loading: chartLoading } = useSymbol();
  const priceChange = chartData.length > 1 ? currentPrice - chartData[0].price : 0;
  const pctChange =
    chartData.length > 1 && chartData[0].price > 0
      ? (priceChange / chartData[0].price) * 100
      : 0;

  return (
    <div className="mb-8 space-y-4">
      <div className="bg-gray-900 rounded-xl p-4 shadow-lg">
        <p className="text-sm font-medium text-gray-300 mb-3">Search Stock</p>
        <StockSearch />
      </div>
      {(symbol || chartLoading) && (
        <StockChart
          symbol={symbol || '…'}
          currentPrice={currentPrice}
          priceChange={priceChange}
          percentChange={pctChange}
          chartData={chartData}
          loading={chartLoading}
        />
      )}
    </div>
  );
}
 