'use client';

import { useEffect, useState } from 'react';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { motion } from 'framer-motion';

interface StockPriceDisplayProps {
  symbol: string;
  name?: string;
  compact?: boolean;
}

const StockPriceDisplay = ({ symbol, name, compact = false }: StockPriceDisplayProps) => {
  const { 
    data: stockData, 
    changes,
    isConnected,
    lastUpdated 
  } = useRealTimeData('stock', symbol, true);
  
  // State for animation
  const [isFlashing, setIsFlashing] = useState(false);
  const [priceDirection, setPriceDirection] = useState('none');
  
  // Apply animation when price changes
  useEffect(() => {
    if (changes && changes.priceChange !== 0) {
      // Set direction for styling
      setPriceDirection(changes.priceChange > 0 ? 'up' : 'down');
      
      // Trigger flash animation
      setIsFlashing(true);
      
      // Reset animation after it completes
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [changes]);
  
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
          <h3 className="font-bold">{name || symbol}</h3>
          <p className="text-xs text-gray-400">{symbol}</p>
        </div>
        
        {!compact && (
          <div className="flex items-center">
            <div 
              className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <p className="text-xs text-gray-400">
              {isConnected ? 'Live' : 'Offline'}
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
        ${stockData.currentPrice?.toFixed(2) || "0.00"}
      </motion.div>
      
      {/* Change info */}
      {changes && (
        <div className="flex items-center mt-1">
          <span 
            className={`inline-block mr-2 ${
              changes.priceChange >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {changes.priceChange >= 0 ? '▲' : '▼'}
          </span>
          <span className={`${changes.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ${Math.abs(changes.priceChange).toFixed(2)} ({Math.abs(changes.pricePercentChange).toFixed(2)}%)
          </span>
        </div>
      )}
      
      {/* Last updated timestamp */}
      {!compact && lastUpdated && (
        <div className="mt-2 text-xs text-gray-400">
          Updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default StockPriceDisplay; 