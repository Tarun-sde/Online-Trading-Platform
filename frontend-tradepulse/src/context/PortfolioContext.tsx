'use client';

/**
 * PortfolioContext.tsx
 * Global single source of truth for portfolio data, live prices, and stats.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { API_BASE, getAuthHeaders } from '@/lib/auth';
import { useAuth } from '@/components/auth/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
}

export interface LivePrices {
  [symbol: string]: number;
}

export interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  pnlPct: number;
}

interface PortfolioContextType {
  holdings: Holding[];
  livePrices: LivePrices;
  stats: PortfolioStats;
  loading: boolean;
  error: string | null;
  refreshPortfolio: () => Promise<void>;
  strategy: string | null;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(); // We need to refetch if user changes
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [strategy, setStrategy] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<LivePrices>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch from backend
  const refreshPortfolio = useCallback(async () => {
    // If not authenticated, clear portfolio
    if (!user) {
      setHoldings([]);
      setStrategy(null);
      setLivePrices({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const authHeaders = getAuthHeaders();
      const r = await fetch(`${API_BASE}/api/portfolio`, { headers: authHeaders });
      
      if (r.status === 401) {
        setError('Session expired. Please log in again.');
        return;
      }
      if (!r.ok) throw new Error(`Server error ${r.status}`);
      
      const data = await r.json();
      setHoldings(data.holdings ?? []);
      setStrategy(data.strategy ?? null);
      console.log('[PortfolioContext] Data fetched:', data.holdings);
    } catch (err) {
      setError('Cannot reach backend.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refetch when user logs in/out
  useEffect(() => {
    refreshPortfolio();
  }, [refreshPortfolio]);

  // Live prices poller
  useEffect(() => {
    if (holdings.length === 0) return;

    const fetchPrices = async () => {
      const updated: LivePrices = {};
      await Promise.all(
        holdings.map(async (h) => {
          try {
            const r = await fetch(`${API_BASE}/api/stocks/${encodeURIComponent(h.symbol)}`);
            if (r.ok) {
              const d = await r.json();
              if (d.currentPrice) updated[h.symbol] = d.currentPrice;
            }
          } catch { /* silent fallback */ }
        })
      );
      setLivePrices((prev) => ({ ...prev, ...updated }));
    };

    fetchPrices();
    const id = setInterval(fetchPrices, 60000); // 1 minute
    return () => clearInterval(id);
  }, [holdings]);

  // Derived computing
  const stats = useMemo(() => {
    let totalValue = 0, totalCost = 0;
    for (const h of holdings) {
      const price = livePrices[h.symbol] ?? h.avgPrice;
      totalValue += price * h.quantity;
      totalCost += h.avgPrice * h.quantity;
    }
    const totalPnL = totalValue - totalCost;
    const pnlPct = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
    
    return { totalValue, totalCost, totalPnL, pnlPct };
  }, [holdings, livePrices]);

  const value = {
    holdings,
    livePrices,
    stats,
    loading,
    error,
    refreshPortfolio,
    strategy,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return ctx;
}
