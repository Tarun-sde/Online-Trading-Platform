'use client';

import { useEffect, useState, useRef } from 'react';
import wsService from '@/utils/websocket';

const BASE = "http://localhost:5000/api/market-data";

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

  const latestDataRef = useRef<any>(null);

  // ✅ guards against double execution
  const connectedRef = useRef(false);
  const subscribedRef = useRef(false);

  // =========================
  // REST bootstrap (runs once per symbol/type)
  // =========================

  useEffect(() => {
    let cancelled = false;

    const loadInitial = async () => {
      try {
        let url = "";

        switch (type) {
          case "stock": url = `${BASE}/stocks`; break;
          case "forex": url = `${BASE}/forex`; break;
          case "crypto": url = `${BASE}/crypto`; break;
          case "commodity": url = `${BASE}/commodities`; break;
          case "economy": url = `${BASE}/economy`; break;
          case "index": url = `${BASE}/indices`; break;
          default: return;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error("REST fetch failed");

        const list = await res.json();
        const found = list.find((x: any) => x.symbol === symbol);

        if (!cancelled && found) {
          setData(found);
          latestDataRef.current = found;
          setLastUpdated(new Date(found.lastUpdated || Date.now()));
        }

      } catch (e) {
        if (!cancelled) setError("Initial fetch failed");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadInitial();
    return () => { cancelled = true; };

  }, [type, symbol]);

  // =========================
  // WebSocket connect (guarded)
  // =========================

  useEffect(() => {
    if (!autoConnect) return;
    if (connectedRef.current) return;

    wsService.connect();
    connectedRef.current = true;
    setIsConnected(wsService.isConnected);

  }, [autoConnect]);

  // =========================
  // WebSocket subscribe (guarded)
  // =========================

  useEffect(() => {
    if (!wsService.isConnected) return;
    if (!symbol) return;
    if (subscribedRef.current) return;

    subscribedRef.current = true;

    switch (type) {
      case 'stock': wsService.subscribeToSymbol(symbol); break;
      case 'index': wsService.subscribeToIndex(symbol); break;
      case 'forex': wsService.subscribeToForex(symbol); break;
      case 'crypto': wsService.subscribeToCrypto(symbol); break;
      case 'commodity': wsService.subscribeToCommodity(symbol); break;
      case 'economy': wsService.subscribeToEconomy(symbol); break;
      case 'news': wsService.subscribeToNews(symbol); break;
    }

    const removeListener = wsService.addListener(type, symbol, (update: any) => {
      if (!update?.data) return;

      const prev = latestDataRef.current;

      setData(update.data);
      latestDataRef.current = update.data;

      if (prev?.currentPrice && update.data.currentPrice) {
        const diff = update.data.currentPrice - prev.currentPrice;
        const pct = (diff / prev.currentPrice) * 100;

        setChanges({
          priceChange: diff,
          pricePercentChange: pct,
          timestamp: Date.now()
        });
      }

      setLastUpdated(new Date());
      setIsLoading(false);
    });

    return () => {
      subscribedRef.current = false;

      switch (type) {
        case 'stock': wsService.unsubscribeFromSymbol(symbol); break;
        case 'index': wsService.unsubscribeFromIndex(symbol); break;
        case 'forex': wsService.unsubscribeFromForex(symbol); break;
        case 'crypto': wsService.unsubscribeFromCrypto(symbol); break;
        case 'commodity': wsService.unsubscribeFromCommodity(symbol); break;
        case 'economy': wsService.unsubscribeFromEconomy(symbol); break;
        case 'news': wsService.unsubscribeFromNews(symbol); break;
      }

      removeListener();
    };

  }, [type, symbol]);

  // =========================
  // manual controls
  // =========================

  const connect = () => {
    if (!connectedRef.current) {
      wsService.connect();
      connectedRef.current = true;
    }
    setIsConnected(wsService.isConnected);
  };

  const disconnect = () => {
    wsService.disconnect();
    connectedRef.current = false;
    subscribedRef.current = false;
    setIsConnected(false);
  };

  const changeTimeframe = (tf: string) => {
    wsService.subscribeToTimeframe(tf);
  };

  return {
    data,
    changes,
    isConnected,
    isLoading,
    error,
    lastUpdated,
    connect,
    disconnect,
    changeTimeframe
  };
}
