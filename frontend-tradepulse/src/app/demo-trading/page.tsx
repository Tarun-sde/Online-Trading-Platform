'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { API_BASE, getAuthHeaders } from '@/lib/auth';
import { useAuth } from '@/components/auth/AuthContext';
import StockChart from '@/components/StockChart';
import StockAutocomplete from '@/components/StockSearch';
import { ArrowPathIcon, BanknotesIcon, ChartBarIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';

interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
}

interface DemoAccount {
  balance: number;
  holdings: Holding[];
}

export default function DemoTradingPage() {
  const { user } = useAuth();
  
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(true);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  
  // Trading Form State
  const [symbolStr, setSymbolStr] = useState<string>('');
  const [selectedStockPrice, setSelectedStockPrice] = useState<number | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState<number>(1);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeAction, setTradeAction] = useState<'BUY'|'SELL'>('BUY');
  const [alertMsg, setAlertMsg] = useState<{ text: string, type: 'error'|'success' } | null>(null);

  const fetchDemoAccount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/demo`, { headers: getAuthHeaders() });
      if (res.ok) {
        setAccount(await res.json());
      }
    } catch {
      console.error("Failed to load demo account");
    } finally {
      setLoadingAccount(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDemoAccount();
  }, [fetchDemoAccount]);

  // Fetch prices for holdings and currently viewed stock every 10 sec
  useEffect(() => {
    let symbolsToFetch = new Set<string>();
    if (symbolStr) symbolsToFetch.add(symbolStr.toUpperCase());
    if (account?.holdings) {
      account.holdings.forEach(h => symbolsToFetch.add(h.symbol));
    }

    const fetchLivePrices = async () => {
      if (symbolsToFetch.size === 0) return;
      
      const priceMap: Record<string, number> = {};
      await Promise.all(
        Array.from(symbolsToFetch).map(async (sym) => {
          try {
            const res = await fetch(`${API_BASE}/api/stocks/${encodeURIComponent(sym)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.currentPrice) {
                priceMap[sym] = data.currentPrice;
              }
            }
          } catch {}
        })
      );
      
      setLivePrices(prev => ({ ...prev, ...priceMap }));
      if (symbolStr && priceMap[symbolStr.toUpperCase()]) {
        setSelectedStockPrice(priceMap[symbolStr.toUpperCase()]);
      }
    };
    
    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 10000);
    return () => clearInterval(interval);
  }, [account?.holdings, symbolStr]);

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset your Paper Trading account? This will wipe your history to virtual ₹1,00,000.")) return;
    try {
      const res = await fetch(`${API_BASE}/api/demo/reset`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setAccount(await res.json());
        setAlertMsg({ text: 'Demo account formally reset.', type: 'success' });
      }
    } catch {
      setAlertMsg({ text: 'Network connection error', type: 'error' });
    }
  };

  const handleTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbolStr || tradeQuantity <= 0) return;
    
    setTradeLoading(true);
    setAlertMsg(null);
    try {
      const url = tradeAction === 'BUY' ? `${API_BASE}/api/demo/buy` : `${API_BASE}/api/demo/sell`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ symbol: symbolStr, quantity: tradeQuantity })
      });
      
      const data = await res.json();
      if (res.ok) {
        setAccount(data);
        setAlertMsg({ text: `Successfully ${tradeAction === 'BUY' ? 'bought' : 'sold'} ${tradeQuantity} shares of ${symbolStr.toUpperCase()}`, type: 'success' });
      } else {
        setAlertMsg({ text: data.message || 'Trade rejected', type: 'error' });
      }
    } catch {
      setAlertMsg({ text: 'Application network proxy failed during trade execution.', type: 'error' });
    } finally {
      setTradeLoading(false);
    }
  };

  // Portfolio Dashboard Stats calculation
  const stats = useMemo(() => {
    if (!account) return { value: 0, cost: 0, pnl: 0, pnlPct: 0 };
    let totalVal = 0, totalCost = 0;
    for (const h of account.holdings) {
      const liveP = livePrices[h.symbol] ?? h.avgPrice;
      totalVal += liveP * h.quantity;
      totalCost += h.avgPrice * h.quantity;
    }
    return {
      value: totalVal,
      cost: totalCost,
      pnl: totalVal - totalCost,
      pnlPct: totalCost > 0 ? ((totalVal - totalCost) / totalCost) * 100 : 0
    };
  }, [account, livePrices]);

  if (loadingAccount) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-950 text-white">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 pt-20"><div className="animate-pulse h-10 w-40 bg-gray-800 rounded"></div></main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <PresentationChartLineIcon className="h-8 w-8 text-emerald-500" /> Paper Trading Environment
              </h1>
              <p className="text-gray-400 mt-2">Simulate real market trades securely with a virtual ₹1,00,000 buffer.</p>
            </div>
            
            <button 
               onClick={handleReset}
               className="mt-4 md:mt-0 px-4 py-2 bg-red-900/40 text-red-400 rounded-lg border border-red-800 hover:bg-red-800 transition"
            >
              Reset Demo Account
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
             <div className="bg-gray-900 rounded-xl p-5 shadow border border-gray-800">
               <div className="flex justify-between text-gray-400 mb-2">
                 <span className="text-sm font-medium">Virtual Balance</span>
                 <BanknotesIcon className="h-5 w-5 text-blue-400" />
               </div>
               <p className="text-3xl font-bold font-mono">₹{account?.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
             </div>
             
             <div className="bg-gray-900 rounded-xl p-5 shadow border border-gray-800">
               <div className="flex justify-between text-gray-400 mb-2">
                 <span className="text-sm font-medium">Portfolio Value</span>
                 <ChartBarIcon className="h-5 w-5 text-indigo-400" />
               </div>
               <p className="text-3xl font-bold font-mono">₹{stats.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
             </div>
             
             <div className="bg-gray-900 rounded-xl p-5 shadow border border-gray-800">
               <span className="text-sm font-medium text-gray-400 mb-2 block">Total P&L</span>
               <p className={`text-3xl font-bold font-mono ${stats.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                 {stats.pnl >= 0 ? '+' : '-'}₹{Math.abs(stats.pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </p>
             </div>
             
             <div className="bg-gray-900 rounded-xl p-5 shadow border border-gray-800">
               <span className="text-sm font-medium text-gray-400 mb-2 block">Net Returns</span>
               <p className={`text-3xl font-bold font-mono ${stats.pnlPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                 {stats.pnlPct >= 0 ? '+' : ''}{stats.pnlPct.toFixed(2)}%
               </p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-8">
              
              <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800">
                <h3 className="text-xl font-bold mb-4">Paper Trading Console</h3>
                
                {alertMsg && (
                  <div className={`p-4 mb-5 rounded-lg border text-sm ${alertMsg.type === 'error' ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-emerald-900/30 border-emerald-800 text-emerald-300'}`}>
                    {alertMsg.text}
                  </div>
                )}
                
                <form onSubmit={handleTradeSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm text-gray-400 mb-2">Search Stock Symbol</label>
                       <StockAutocomplete 
                         value={symbolStr} 
                         onSelect={setSymbolStr} 
                         placeholder="e.g. RELIANCE.NS" 
                         showChips={false} 
                       />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Live Market Price</label>
                      <div className="h-[42px] bg-gray-800 border border-gray-700 rounded-lg flex items-center px-4 font-mono font-bold text-white">
                        {selectedStockPrice !== null ? `₹${selectedStockPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Fetching...'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Quantity</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={tradeQuantity}
                        onChange={e => setTradeQuantity(parseInt(e.target.value) || 1)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Est. Trade Block</label>
                      <div className="h-[42px] flex items-center text-lg font-mono text-gray-300">
                        ₹{selectedStockPrice ? (selectedStockPrice * tradeQuantity).toLocaleString(undefined, { minimumFractionDigits: 2 }) : 0.00}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 pt-4">
                    <button 
                      type="submit" 
                      onClick={() => setTradeAction('BUY')}
                      disabled={!symbolStr || tradeLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {tradeLoading && tradeAction === 'BUY' ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Execute Demo BUY'}
                    </button>
                    
                    <button 
                      type="submit" 
                      onClick={() => setTradeAction('SELL')}
                      disabled={!symbolStr || tradeLoading}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      {tradeLoading && tradeAction === 'SELL' ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Execute Demo SELL'}
                    </button>
                  </div>
                </form>
              </div>

              {symbolStr && (
                  <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 overflow-hidden min-h-[300px]">
                    <StockChart 
                       symbol={symbolStr.toUpperCase()} 
                       variant="default"
                    />
                  </div>
              )}
            </div>

            <div className="bg-gray-900 rounded-xl p-6 shadow-lg border border-gray-800 h-fit max-h-[800px] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 border-b border-gray-800 pb-3">Open Holdings</h3>
              
              {account?.holdings.length === 0 ? (
                <p className="text-gray-500 py-6 text-center italic">No virtual holdings yet</p>
              ) : (
                <div className="space-y-4">
                  {account?.holdings.map((h, i) => {
                    const lPrice = livePrices[h.symbol] ?? h.avgPrice;
                    const val = lPrice * h.quantity;
                    const isProf = lPrice >= h.avgPrice;
                    return (
                      <div key={i} className="p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition flex justify-between items-center cursor-pointer" onClick={() => setSymbolStr(h.symbol)}>
                        <div>
                           <p className="font-bold text-white">{h.symbol}</p>
                           <p className="text-xs text-gray-400">{h.quantity} shares @ ₹{h.avgPrice.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                           <p className="font-mono font-bold">₹{val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                           <p className={`text-xs font-bold ${isProf ? 'text-emerald-400' : 'text-red-400'}`}>
                             {isProf ? '+' : ''}{(((lPrice - h.avgPrice) / h.avgPrice) * 100).toFixed(2)}%
                           </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
