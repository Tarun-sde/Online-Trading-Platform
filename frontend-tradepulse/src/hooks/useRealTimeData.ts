'use client';

import { useEffect, useState, useRef } from 'react';
import wsService from '@/utils/websocket';

interface RealTimeDataResult {
  data: any;
  changes: any | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  connect: () => void;
  disconnect: () => void;
  changeTimeframe: (timeframe: string) => void;
}

/**
 * Custom hook for subscribing to real-time market data with change detection
 * 
 * @param {string} type - Type of data to subscribe to (stock, index, forex, crypto, commodity, economy, news)
 * @param {string} symbol - Symbol or identifier to subscribe to
 * @param {boolean} autoConnect - Automatically connect to WebSocket on mount
 * @returns {RealTimeDataResult} - Real-time data and connection state
 */
export function useRealTimeData(
  type: string, 
  symbol: string, 
  autoConnect: boolean = true
): RealTimeDataResult {
  const [data, setData] = useState<any>(null);
  const [changes, setChanges] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Keep track of the latest data for comparison
  const latestDataRef = useRef<any>(null);

  // Connect to WebSocket on mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connectToWebSocket();
    }
    
    return () => {
      // Unsubscribe when component unmounts
      if (wsService.isConnected) {
        switch (type) {
          case 'stock':
            wsService.unsubscribeFromSymbol(symbol);
            break;
          case 'index':
            wsService.unsubscribeFromIndex(symbol);
            break;
          case 'forex':
            wsService.unsubscribeFromForex(symbol);
            break;
          case 'crypto':
            wsService.unsubscribeFromCrypto(symbol);
            break;
          case 'commodity':
            wsService.unsubscribeFromCommodity(symbol);
            break;
          case 'economy':
            wsService.unsubscribeFromEconomy(symbol);
            break;
          case 'news':
            wsService.unsubscribeFromNews(symbol);
            break;
        }
      }
    };
  }, [type, symbol, autoConnect]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!wsService.isConnected || !type || !symbol) return;
    
    setIsLoading(true);
    
    // Subscribe based on data type
    switch (type) {
      case 'stock':
        wsService.subscribeToSymbol(symbol);
        break;
      case 'index':
        wsService.subscribeToIndex(symbol);
        break;
      case 'forex':
        wsService.subscribeToForex(symbol);
        break;
      case 'crypto':
        wsService.subscribeToSymbol(symbol);
        break;
      case 'commodity':
        wsService.subscribeToCommodity(symbol);
        break;
      case 'economy':
        wsService.subscribeToEconomy(symbol);
        break;
      case 'news':
        wsService.subscribeToNews(symbol);
        break;
    }
    
    // Register event listener
    const removeListener = wsService.addListener(type, symbol, (update: any) => {
      if (update.data) {
        setData(update.data);
      }
      
      // Handle changes if provided
      if (update.changes) {
        setChanges(update.changes);
        setLastUpdated(new Date(update.changes.timestamp || Date.now()));
      }
      
      // Update latest data reference
      latestDataRef.current = update.data;
      
      setIsLoading(false);
    });
    
    // Cleanup on unmount or when dependencies change
    return removeListener;
  }, [type, symbol, isConnected]);

  // Function to manually connect to WebSocket
  const connectToWebSocket = () => {
    try {
      wsService.connect();
      setIsConnected(wsService.isConnected);
      setError(null);
    } catch (err) {
      console.error('Failed to connect to WebSocket:', err);
      setError('Failed to connect to real-time data service');
      setIsConnected(false);
    }
  };

  // Function to manually disconnect from WebSocket
  const disconnectFromWebSocket = () => {
    wsService.disconnect();
    setIsConnected(false);
  };

  // Function to manually change the timeframe
  const changeTimeframe = (timeframe: string) => {
    wsService.subscribeToTimeframe(timeframe);
  };

  return {
    data,
    changes,
    isConnected,
    isLoading,
    error,
    lastUpdated,
    connect: connectToWebSocket,
    disconnect: disconnectFromWebSocket,
    changeTimeframe,
  };
} 