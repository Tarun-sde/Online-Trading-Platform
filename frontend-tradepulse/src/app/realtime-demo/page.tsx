'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import StockPriceDisplay from '@/components/StockPriceDisplay';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function LiveMarketPage() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-950 text-white">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
            <h1 className="text-3xl font-bold mb-8">Loading...</h1>
          </main>
        </div>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
          <div className="mt-6 mb-8">
            <h1 className="text-3xl font-bold text-white">Live Market</h1>
            <p className="text-gray-400 mt-2">
              Authentic streaming data powered by Yahoo Finance API. Prices and charts update dynamically via secure polling protocols without socket connection loss.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StockPriceDisplay symbol="RELIANCE.NS" name="Reliance Industries Ltd." />
            <StockPriceDisplay symbol="TCS.NS" name="Tata Consultancy Services Ltd." />
            <StockPriceDisplay symbol="INFY.NS" name="Infosys Ltd." />
            <StockPriceDisplay symbol="HDFCBANK.NS" name="HDFC Bank Ltd." />
            <StockPriceDisplay symbol="ICICIBANK.NS" name="ICICI Bank Ltd." />
            <StockPriceDisplay symbol="SBIN.NS" name="State Bank of India" />
            <StockPriceDisplay symbol="BHARTIARTL.NS" name="Bharti Airtel Ltd." />
            <StockPriceDisplay symbol="ITC.NS" name="ITC Ltd." />
            <StockPriceDisplay symbol="LT.NS" name="Larsen & Toubro Ltd." />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}