'use client';

import { useState, useEffect } from 'react';
import StockPriceDisplay from '@/components/StockPriceDisplay';

export default function RealTimeDemo() {
  const [isClient, setIsClient] = useState(false);
  
  // This ensures the component only renders on the client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-3xl font-bold mb-8">Loading...</h1>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Real-Time Stock Data with Change Detection</h1>
      
      <p className="text-gray-400 mb-8">
        This page demonstrates real-time stock price updates with change detection. 
        The stock prices update every 10 seconds with random changes. 
        When a price increases, it flashes green; when it decreases, it flashes red.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StockPriceDisplay symbol="AAPL" name="Apple Inc." />
        <StockPriceDisplay symbol="MSFT" name="Microsoft Corp." />
        <StockPriceDisplay symbol="GOOGL" name="Alphabet Inc." />
        <StockPriceDisplay symbol="AMZN" name="Amazon.com Inc." />
        <StockPriceDisplay symbol="TSLA" name="Tesla Inc." />
      </div>
      
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Features Implemented:</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          <li>Real-time data updates using WebSockets</li>
          <li>Change detection to track price movements</li>
          <li>Visual feedback for price changes (green for increases, red for decreases)</li>
          <li>Animated price updates</li>
          <li>Connection status indicators</li>
          <li>Optimized network usage by only sending data when actual changes occur</li>
          <li>Timestamp of last update</li>
        </ul>
      </div>
    </div>
  );
} 