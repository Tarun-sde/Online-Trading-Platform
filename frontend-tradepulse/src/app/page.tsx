'use client';

import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  GlobeAltIcon, 
  NewspaperIcon 
} from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import StockChart from '@/components/StockChart';
import MarketOverview from '@/components/MarketOverview';
import WatchList from '@/components/WatchList';
import NewsSection from '@/components/NewsSection';
import StatsCard from '@/components/StatsCard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
        <div className="mt-6 mb-8">
          <h1 className="text-3xl font-bold">Welcome to NexTrade</h1>
          <p className="text-gray-400 mt-2">Your modern trading platform for smart investors</p>
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Portfolio Value"
            value="$124,568.45"
            change={2.34}
            trend="up"
            color="green"
            icon={<CurrencyDollarIcon className="h-5 w-5 text-white" />}
          />
          <StatsCard
            title="Today's Change"
            value="$1,245.30"
            change={1.01}
            trend="up"
            color="blue"
            icon={<ChartBarIcon className="h-5 w-5 text-white" />}
          />
          <StatsCard
            title="Active Positions"
            value="16"
            color="purple"
            icon={<GlobeAltIcon className="h-5 w-5 text-white" />}
          />
          <StatsCard
            title="News Alerts"
            value="8 new"
            color="orange"
            icon={<NewspaperIcon className="h-5 w-5 text-white" />}
          />
        </div>
        
        {/* Chart and Market Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <StockChart
              symbol="AAPL"
              name="Apple Inc."
              currentPrice={187.45}
              priceChange={3.28}
              percentChange={1.78}
              trend="up"
            />
          </div>
          <div className="lg:col-span-1">
            <MarketOverview />
          </div>
        </div>
        
        {/* Watchlist */}
        <div className="mb-8">
          <WatchList />
        </div>
        
        {/* News */}
        <div>
          <NewsSection />
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
  );
}
