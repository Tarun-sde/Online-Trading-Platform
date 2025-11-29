'use client';

import { 
  BanknotesIcon, 
  ChartPieIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon 
} from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import StatsCard from '@/components/StatsCard';
import StockChart from '@/components/StockChart';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function Portfolio() {
  // Sample portfolio data
  const portfolioStats = {
    totalValue: 124568.45,
    totalProfit: 23456.78,
    totalReturn: 23.21,
    dayChange: 1245.30,
    dayChangePercent: 1.01,
  };

  // Sample portfolio holdings
  const holdings = [
    {
      id: '1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      shares: 25,
      averagePrice: 165.23,
      currentPrice: 187.45,
      value: 4686.25,
      profit: 556.75,
      return: 13.45,
    },
    {
      id: '2',
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      shares: 15,
      averagePrice: 342.67,
      currentPrice: 408.59,
      value: 6128.85,
      profit: 987.9,
      return: 19.24,
    },
    {
      id: '3',
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      shares: 20,
      averagePrice: 242.15,
      currentPrice: 218.89,
      value: 4377.8,
      profit: -465.2,
      return: -9.61,
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
          <div className="mt-6 mb-8">
            <h1 className="text-3xl font-bold">Portfolio</h1>
            <p className="text-gray-400 mt-2">Manage your investments and track performance</p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Portfolio Value"
              value={`$${portfolioStats.totalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              change={portfolioStats.dayChangePercent}
              trend="up"
              color="green"
              icon={<BanknotesIcon className="h-5 w-5 text-white" />}
            />
            <StatsCard
              title="Total Profit/Loss"
              value={`$${portfolioStats.totalProfit.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              change={portfolioStats.totalReturn}
              trend="up"
              color="blue"
              icon={<ChartPieIcon className="h-5 w-5 text-white" />}
            />
            <StatsCard
              title="Daily Change"
              value={`$${portfolioStats.dayChange.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              change={portfolioStats.dayChangePercent}
              trend="up"
              color="indigo"
              icon={<ArrowTrendingUpIcon className="h-5 w-5 text-white" />}
            />
            <StatsCard
              title="Overall Return"
              value={`${portfolioStats.totalReturn.toFixed(2)}%`}
              color="purple"
              icon={<ArrowTrendingUpIcon className="h-5 w-5 text-white" />}
            />
          </div>
          
          {/* Portfolio Chart */}
          <div className="mb-8">
            <StockChart
              symbol="Portfolio"
              name="Total Portfolio Value"
              currentPrice={portfolioStats.totalValue}
              priceChange={portfolioStats.dayChange}
              percentChange={portfolioStats.dayChangePercent}
              trend="up"
            />
          </div>
          
          {/* Holdings Table */}
          <div className="mb-8">
            <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">Your Holdings</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-300">Symbol</th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-300">Name</th>
                      <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-300">Shares</th>
                      <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-300">Avg. Price</th>
                      <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-300">Current Price</th>
                      <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-300">Value</th>
                      <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-300">Profit/Loss</th>
                      <th className="px-4 py-3.5 text-right text-sm font-semibold text-gray-300">Return %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {holdings.map((holding) => (
                      <tr 
                        key={holding.id} 
                        className="hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-white">
                          {holding.symbol}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-300">
                          {holding.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-right text-white">
                          {holding.shares}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-right text-white">
                          ${holding.averagePrice.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-right text-white">
                          ${holding.currentPrice.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm text-right text-white">
                          ${holding.value.toFixed(2)}
                        </td>
                        <td className={`whitespace-nowrap px-4 py-4 text-sm text-right ${
                          holding.profit >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          ${holding.profit.toFixed(2)}
                        </td>
                        <td className={`whitespace-nowrap px-4 py-4 text-sm text-right ${
                          holding.return >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {holding.return >= 0 ? '+' : ''}
                          {holding.return.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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