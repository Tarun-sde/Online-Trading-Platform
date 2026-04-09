'use client';

/**
 * SymbolContext
 * Provides a globally shared selected stock symbol and its chart data.
 * Any page that calls useSymbol() automatically shares the same symbol state.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ChartDataPoint {
  date: string;
  price: number;
}

interface SymbolState {
  symbol: string;
  currentPrice: number;
  chartData: ChartDataPoint[];
  dataPoints: number;
  loading: boolean;
  error: string | null;
}

interface SymbolContextType extends SymbolState {
  setSymbol: (symbol: string) => void;
  fetchChart: (symbol: string) => Promise<void>;
  clearChart: () => void;
}

const API = 'http://localhost:5000';

const DEFAULT: SymbolState = {
  symbol: '',
  currentPrice: 0,
  chartData: [],
  dataPoints: 0,
  loading: false,
  error: null,
};

const SymbolContext = createContext<SymbolContextType | undefined>(undefined);

export function SymbolProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SymbolState>(DEFAULT);

  const fetchChart = useCallback(async (sym: string) => {
    const trimmed = sym.trim().toUpperCase();
    if (!trimmed) return;

    setState((prev) => ({ ...prev, symbol: trimmed, loading: true, error: null }));

    try {
      const res = await fetch(`${API}/api/stocks/${encodeURIComponent(trimmed)}`);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.error || `Failed to load data for ${trimmed}`,
        }));
        return;
      }

      const data = await res.json();

      setState({
        symbol: data.symbol,
        currentPrice: data.currentPrice ?? 0,
        chartData: (data.chartData ?? []) as ChartDataPoint[],
        dataPoints: data.dataPoints ?? 0,
        loading: false,
        error: null,
      });
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Cannot reach backend on port 5000.',
      }));
    }
  }, []);

  const setSymbol = useCallback((sym: string) => {
    if (sym.trim()) fetchChart(sym);
  }, [fetchChart]);

  const clearChart = useCallback(() => setState(DEFAULT), []);

  return (
    <SymbolContext.Provider value={{ ...state, setSymbol, fetchChart, clearChart }}>
      {children}
    </SymbolContext.Provider>
  );
}

/**
 * Hook to access the global symbol state.
 * Works in Dashboard, Portfolio, Strategy pages — all share the same selected symbol.
 */
export function useSymbol() {
  const ctx = useContext(SymbolContext);
  if (!ctx) throw new Error('useSymbol must be used within a SymbolProvider');
  return ctx;
}
