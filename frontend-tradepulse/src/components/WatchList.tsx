'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrashIcon, PlusIcon, ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { API_BASE, getAuthHeaders } from '@/lib/auth';
import { useAuth } from '@/components/auth/AuthContext';
import StockAutocomplete from '@/components/StockSearch';
import StockChart, { ChartDataPoint } from '@/components/StockChart';

interface WatchlistData {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  percentChange: number;
  chartData: ChartDataPoint[];
  loading: boolean;
}

export default function WatchList() {
  const { user } = useAuth();
  const [symbols, setSymbols] = useState<string[]>([]);
  const [dataMap, setDataMap] = useState<Record<string, WatchlistData>>({});
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Adding state
  const [addMode, setAddMode] = useState(false);
  const [addSymbolStr, setAddSymbolStr] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // 1. Fetch the user's saved symbols from the API
  const fetchWatchlistSymbols = useCallback(async () => {
    if (!user) return;
    setListLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/watchlist`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch watchlist');
      const json = await res.json();
      setSymbols(json.symbols ?? []);
    } catch (err) {
      setError('Could not load watchlist.');
    } finally {
      setListLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchlistSymbols();
  }, [fetchWatchlistSymbols]);

  // 2. Hydrate each symbol individually via our stock route
  useEffect(() => {
    symbols.forEach(async (sym) => {
      // Create initial loading state for this symbol
      setDataMap(prev => ({
        ...prev,
        [sym]: prev[sym] || { symbol: sym, name: sym, currentPrice: 0, change: 0, percentChange: 0, chartData: [], loading: true }
      }));
      
      try {
        const res = await fetch(`${API_BASE}/api/stocks/${encodeURIComponent(sym)}`);
        if (res.ok) {
          const fetched = await res.json();
          // Calculate changes
          const prices = fetched.closingPrices ?? [];
          let change = 0, percentChange = 0;
          if (prices.length >= 2) {
            const current = fetched.currentPrice ?? prices[prices.length - 1];
            const prev = prices[prices.length - 2];
            change = current - prev;
            percentChange = (change / prev) * 100;
          }
          
          setDataMap(prev => ({
            ...prev,
            [sym]: {
              symbol: sym,
              name: fetched.name || sym,
              currentPrice: fetched.currentPrice ?? 0,
              change,
              percentChange,
              chartData: fetched.chartData ?? [],
              loading: false
            }
          }));
        } else {
          // Failed to fetch data for this symbol
          setDataMap(prev => ({
            ...prev,
            [sym]: { ...prev[sym], loading: false }
          }));
        }
      } catch {
        setDataMap(prev => ({
          ...prev,
          [sym]: { ...prev[sym], loading: false }
        }));
      }
    });
  }, [symbols]);

  // 3. Handlers
  const handleAddSymbol = async () => {
    if (!addSymbolStr) return;
    setAddLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/watchlist/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ symbol: addSymbolStr })
      });
      if (res.ok) {
        setAddMode(false);
        setAddSymbolStr('');
        fetchWatchlistSymbols();
      } else {
        const d = await res.json();
        alert(d.message || 'Failed to add symbol');
      }
    } catch {
      alert('Network error while adding symbol');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveSymbol = async (sym: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/watchlist/remove/${encodeURIComponent(sym)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        // Cleanup state
        setDataMap(prev => {
          const curr = { ...prev };
          delete curr[sym];
          return curr;
        });
        fetchWatchlistSymbols();
      }
    } catch {
      alert('Network error while removing symbol');
    }
  };

  if (!user) return null;

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
        <h2 className="text-xl font-bold text-white">My Watchlist</h2>
        
        {!addMode ? (
          <button 
            onClick={() => setAddMode(true)}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <PlusIcon className="h-4 w-4" /> Add Symbol
          </button>
        ) : (
          <button 
            onClick={() => setAddMode(false)}
            className="text-gray-400 hover:text-white text-sm"
          >
            Cancel
          </button>
        )}
      </div>

      {addMode && (
        <div className="mb-6 bg-gray-800 p-4 rounded-xl flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">Search & Select</label>
            <StockAutocomplete
              value={addSymbolStr}
              onSelect={setAddSymbolStr}
              placeholder="Start typing to search..."
              showChips={false}
            />
          </div>
          <button
            onClick={handleAddSymbol}
            disabled={!addSymbolStr || addLoading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm transition flex items-center h-[42px]"
          >
            {addLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 'Confirm Add'}
          </button>
        </div>
      )}

      {error ? (
        <div className="flex items-center justify-center p-6 text-red-400 gap-2">
          <ExclamationCircleIcon className="h-5 w-5" />
          {error}
        </div>
      ) : listLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="animate-pulse h-16 bg-gray-800 rounded-lg"></div>)}
        </div>
      ) : symbols.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>Your watchlist is empty.</p>
          <p className="text-sm">Click "Add Symbol" to start tracking stocks.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="font-semibold py-3 pl-2">Symbol</th>
                <th className="font-semibold py-3 text-right">Price</th>
                <th className="font-semibold py-3 text-right">Change</th>
                <th className="font-semibold py-3 text-center w-32 hidden md:table-cell">7 Day Trend</th>
                <th className="font-semibold py-3 pr-2 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {symbols.map(sym => {
                const item = dataMap[sym];
                if (!item) return null;
                
                const isPositive = item.percentChange >= 0;
                
                return (
                  <tr key={sym} className="hover:bg-gray-800/40 transition">
                    <td className="py-4 pl-2 font-bold text-white">
                      {sym}
                      <p className="text-xs text-gray-500 font-normal truncate max-w-[120px]">{item.name}</p>
                    </td>
                    <td className="py-4 text-right font-medium text-white">
                      {item.loading ? (
                        <div className="h-4 bg-gray-700 w-16 ml-auto rounded animate-pulse"></div>
                      ) : (
                        `₹${item.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                      )}
                    </td>
                    <td className={`py-4 text-right font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {item.loading ? (
                        <div className="h-4 bg-gray-700 w-16 ml-auto rounded animate-pulse"></div>
                      ) : (
                        <>
                          {isPositive ? '+' : ''}₹{item.change.toFixed(2)}
                          <p className="text-xs font-medium">({isPositive ? '+' : ''}{item.percentChange.toFixed(2)}%)</p>
                        </>
                      )}
                    </td>
                    <td className="py-4 text-center hidden md:table-cell p-0 h-[60px] w-32 relative align-middle">
                      {item.loading ? (
                        <div className="h-8 bg-gray-700 w-full rounded animate-pulse"></div>
                      ) : (
                        <StockChart 
                          symbol={sym} 
                          percentChange={item.percentChange} 
                          chartData={item.chartData} 
                          variant="sparkline" 
                        />
                      )}
                    </td>
                    <td className="py-4 pr-2 text-right">
                      <button 
                        onClick={() => handleRemoveSymbol(sym)}
                        className="text-gray-500 hover:text-red-400 transition ml-auto block"
                        title="Remove from Watchlist"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
