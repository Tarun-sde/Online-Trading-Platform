'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { API_BASE } from '@/lib/auth';

interface StockPriceDisplayProps {
  symbol: string;
  name?: string;
  compact?: boolean;
}

const StockPriceDisplay = ({ symbol, name, compact = false }: StockPriceDisplayProps) => {
  const [stockData, setStockData] = useState<any>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);

  // State for animation
  const [isFlashing, setIsFlashing] = useState(false);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'none'>('none');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/stocks/${encodeURIComponent(symbol)}`);
        if (res.ok) {
          const data = await res.json();
          setIsLive(true);
          
          if (lastPrice !== null && data.currentPrice !== lastPrice) {
            setPriceDirection(data.currentPrice > lastPrice ? 'up' : 'down');
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), 1000);
          }
          
          setLastPrice(data.currentPrice);
          setStockData({
            currentPrice: data.currentPrice,
            change: data.closingPrices?.length >= 2 
              ? data.currentPrice - data.closingPrices[data.closingPrices.length - 2]
              : 0,
            percentChange: data.closingPrices?.length >= 2 
              ? ((data.currentPrice - data.closingPrices[data.closingPrices.length - 2]) / data.closingPrices[data.closingPrices.length - 2]) * 100
              : 0,
            lastUpdated: new Date()
          });
        } else {
          setIsLive(false);
        }
      } catch (err) {
        setIsLive(false);
      }
    };

    fetchRealData();
    timerRef.current = setInterval(fetchRealData, 10000); // Poll every 10 seconds

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [symbol, lastPrice]);

  if (!stockData) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-md animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-700 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md">
      {/* Header with stock info */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="font-bold truncate max-w-[150px]" title={name || symbol}>{name || symbol}</h3>
          <p className="text-xs text-gray-400">{symbol}</p>
        </div>
        
        {!compact && (
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${isLive ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <p className="text-xs text-gray-400">
              {isLive ? 'Live API' : 'Offline'}
            </p>
          </div>
        )}
      </div>
      
      {/* Price with animation */}
      <motion.div
        className={`text-2xl font-bold ${
          priceDirection === 'up' 
            ? 'text-green-500' 
            : priceDirection === 'down' 
            ? 'text-red-500' 
            : 'text-white'
        }`}
        animate={{
          backgroundColor: isFlashing 
            ? priceDirection === 'up' 
              ? 'rgba(34, 197, 94, 0.2)' 
              : 'rgba(239, 68, 68, 0.2)'
            : 'transparent'
        }}
        transition={{ duration: 0.5 }}
      >
        ₹{stockData.currentPrice?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
      </motion.div>
      
      {/* Change info */}
      <div className="flex items-center mt-1">
        <span className={`inline-block mr-2 ${stockData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {stockData.change >= 0 ? '▲' : '▼'}
        </span>
        <span className={`${stockData.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          ₹{Math.abs(stockData.change).toFixed(2)} ({Math.abs(stockData.percentChange).toFixed(2)}%)
        </span>
      </div>
      
      {/* Last updated timestamp */}
      {!compact && stockData.lastUpdated && (
        <div className="mt-2 text-xs text-gray-400">
          Sync: {stockData.lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default StockPriceDisplay;