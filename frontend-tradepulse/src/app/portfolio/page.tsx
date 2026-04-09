'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import StockChart, { ChartDataPoint } from '@/components/StockChart';
import StatsCard from '@/components/StatsCard';
import StockAutocomplete from '@/components/StockSearch';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getAuthHeaders, authFetch, API_BASE } from '@/lib/auth';
import { usePortfolio, Holding } from '@/context/PortfolioContext';
import {
  BanknotesIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  BeakerIcon,
  PlayIcon,
  BookmarkIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const API = API_BASE;

// ── Types ─────────────────────────────────────────────────────────────────────

interface StrategyResult {
  signal: 'BUY' | 'SELL' | 'HOLD';
  evaluatedValue: unknown;
  symbol: string;
  currentPrice: number;
  strategy: string;
  analyzedAt: string;
}


const SIGNAL_COLOR = {
  BUY: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  SELL: 'text-red-400 bg-red-500/10 border-red-500/30',
  HOLD: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  // ── State ───────────────────────────────────────────────────────────────────
  const { holdings, livePrices, stats, loading: portfolioLoading, error, refreshPortfolio, strategy: contextStrategy } = usePortfolio();

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [chartSymbol, setChartSymbol] = useState<string>('');
  const [chartLoading, setChartLoading] = useState(false);

  // Buy form
  const [buySymbol, setBuySymbol] = useState('');
  const [buyQty, setBuyQty] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyMsg, setBuyMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Sell form
  const [sellSymbol, setSellSymbol] = useState('');
  const [sellQty, setSellQty] = useState('');
  const [sellLoading, setSellLoading] = useState(false);
  const [sellMsg, setSellMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Strategy
  const [strategyExpr, setStrategyExpr] = useState('');
  const [savedStrategy, setSavedStrategy] = useState<string | null>(null);
  const [strategySymbol, setStrategySymbol] = useState('');
  const [strategyResult, setStrategyResult] = useState<StrategyResult | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyMsg, setStrategyMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Sync strategy from context
  useEffect(() => {
    setSavedStrategy(contextStrategy);
    if (contextStrategy) setStrategyExpr(contextStrategy);
  }, [contextStrategy]);

  // Edit form
  const [editHoldingModal, setEditHoldingModal] = useState<Holding | null>(null);
  const [editQty, setEditQty] = useState('');
  const [editAvgPrice, setEditAvgPrice] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete form
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Load chart for a symbol ────────────────────────────────────────────────
  const loadChart = useCallback(async (symbol: string) => {
    if (!symbol) return;
    setChartLoading(true);
    setChartSymbol(symbol);
    setChartData([]);
    try {
      const r = await fetch(`${API}/api/stocks/${encodeURIComponent(symbol)}`);
      if (r.ok) {
        const d = await r.json();
        setChartData(d.chartData ?? []);
      }
    } catch { /* silent */ }
    setChartLoading(false);
  }, []);

  // ── Buy stock ───────────────────────────────────────────────────────────────
  const handleBuy = async () => {
    setBuyMsg(null);
    setBuyLoading(true);
    try {
      const r = await fetch(`${API}/api/portfolio/buy`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          symbol: buySymbol.trim().toUpperCase(),
          quantity: Number(buyQty),
          buyPrice: Number(buyPrice),
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setBuyMsg({ type: 'err', text: d.message || d.errors?.join(' ') || 'Buy failed.' });
      } else {
        setBuyMsg({ type: 'ok', text: d.message });
        setBuySymbol(''); setBuyQty(''); setBuyPrice('');
        await refreshPortfolio();
      }
    } catch {
      setBuyMsg({ type: 'err', text: 'Cannot connect to backend.' });
    } finally {
      setBuyLoading(false);
    }
  };

  // ── Sell stock ──────────────────────────────────────────────────────────────
  const handleSell = async () => {
    setSellMsg(null);
    setSellLoading(true);
    try {
      const r = await fetch(`${API}/api/portfolio/sell`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          symbol: sellSymbol.trim().toUpperCase(),
          quantity: Number(sellQty),
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setSellMsg({ type: 'err', text: d.message || 'Sell failed.' });
      } else {
        setSellMsg({ type: 'ok', text: d.message });
        setSellSymbol(''); setSellQty('');
        await refreshPortfolio();
      }
    } catch {
      setSellMsg({ type: 'err', text: 'Cannot connect to backend.' });
    } finally {
      setSellLoading(false);
    }
  };

  // ── Edit stock ──────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!editHoldingModal) return;
    setEditLoading(true);
    try {
      const r = await fetch(`${API}/api/portfolio/${editHoldingModal.symbol}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          quantity: Number(editQty),
          avgPrice: Number(editAvgPrice),
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        alert(d.message || 'Edit failed');
      } else {
        setEditHoldingModal(null);
        await refreshPortfolio();
      }
    } catch {
      alert('Cannot connect to backend.');
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete stock ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteConfirmModal) return;
    setDeleteLoading(true);
    try {
      const r = await fetch(`${API}/api/portfolio/${deleteConfirmModal}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const d = await r.json();
      if (!r.ok) {
        alert(d.message || 'Delete failed');
      } else {
        setDeleteConfirmModal(null);
        await refreshPortfolio();
      }
    } catch {
      alert('Cannot connect to backend.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Save strategy ────────────────────────────────────────────────────────────
  const handleSaveStrategy = async () => {
    setStrategyMsg(null);
    try {
      const r = await fetch(`${API}/api/portfolio/strategy`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ strategy: strategyExpr.trim() }),
      });
      const d = await r.json();
      if (!r.ok) {
        setStrategyMsg({ type: 'err', text: d.message });
      } else {
        setSavedStrategy(d.strategy);
        setStrategyMsg({ type: 'ok', text: 'Strategy saved successfully.' });
      }
    } catch {
      setStrategyMsg({ type: 'err', text: 'Cannot connect to backend.' });
    }
  };

  // ── Run strategy ─────────────────────────────────────────────────────────────
  const handleRunStrategy = async () => {
    setStrategyResult(null);
    setStrategyMsg(null);
    setStrategyLoading(true);
    try {
      const r = await fetch(`${API}/api/portfolio/strategy/run`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ symbol: strategySymbol.trim().toUpperCase() }),
      });
      const d = await r.json();
      if (!r.ok) {
        setStrategyMsg({ type: 'err', text: d.message });
      } else {
        setStrategyResult(d as StrategyResult);
        await loadChart(strategySymbol.trim().toUpperCase());
      }
    } catch {
      setStrategyMsg({ type: 'err', text: 'Cannot connect to backend.' });
    } finally {
      setStrategyLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 space-y-8">

          {/* Header */}
          <div className="mt-6">
            <h1 className="text-3xl font-bold">Portfolio</h1>
            <p className="text-gray-400 mt-1 text-sm">
              Your holdings — empty by default. Buy stocks to get started.
            </p>
          </div>

          {/* Backend error */}
          {error && (
            <div className="flex items-start gap-3 bg-red-900/30 border border-red-700/40 rounded-xl p-4">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* ── Stats ── */}
          {holdings.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Portfolio Value"
                value={`₹${stats.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                change={stats.pnlPct}
                trend={stats.pnlPct >= 0 ? 'up' : 'down'}
                color="green"
                icon={<BanknotesIcon className="h-5 w-5 text-white" />}
              />
              <StatsCard
                title="Total Cost"
                value={`₹${stats.totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                trend="neutral"
                color="blue"
                icon={<BanknotesIcon className="h-5 w-5 text-white" />}
              />
              <StatsCard
                title="Total P&L"
                value={`₹${stats.totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                change={stats.pnlPct}
                trend={stats.totalPnL >= 0 ? 'up' : 'down'}
                color={stats.totalPnL >= 0 ? 'green' : 'red'}
                icon={<ChartBarIcon className="h-5 w-5 text-white" />}
              />
              <StatsCard
                title="Return %"
                value={`${stats.pnlPct.toFixed(2)}%`}
                change={stats.pnlPct}
                trend={stats.pnlPct >= 0 ? 'up' : 'down'}
                color="purple"
                icon={<ChartBarIcon className="h-5 w-5 text-white" />}
              />
            </div>
          )}

          {/* ── Buy / Sell ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Buy */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <PlusCircleIcon className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-semibold">Buy Stock</h2>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300 block">Symbol</label>
                <StockAutocomplete
                  value={buySymbol}
                  onSelect={async (sym) => {
                    setBuySymbol(sym);
                    // Fetch live price when selected
                    try {
                      const r = await fetch(`${API}/api/stocks/${encodeURIComponent(sym)}`);
                      if (r.ok) {
                        const d = await r.json();
                        if (d.currentPrice) setBuyPrice(d.currentPrice.toString());
                      }
                    } catch { /* ignore */ }
                  }}
                  placeholder="e.g. RELIANCE.NS"
                  showChips={false}
                />
              </div>
              <Input label="Quantity" id="buy-qty" placeholder="10" type="number" value={buyQty} onChange={setBuyQty} />
              <Input label="Buy Price (₹)" id="buy-price" placeholder="2450" type="number" value={buyPrice} onChange={setBuyPrice} />
              {buyMsg && <Msg type={buyMsg.type} text={buyMsg.text} />}
              <button
                id="buy-btn"
                onClick={handleBuy}
                disabled={buyLoading || !buySymbol || !buyQty || !buyPrice || Number(buyQty) <= 0 || Number(buyPrice) <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                {buyLoading ? <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Processing…</> : 'Buy'}
              </button>
            </div>

            {/* Sell */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MinusCircleIcon className="h-5 w-5 text-red-400" />
                <h2 className="text-lg font-semibold">Sell Stock</h2>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-1.5">Symbol</label>
                <select
                  id="sell-symbol"
                  value={sellSymbol}
                  onChange={(e) => { setSellSymbol(e.target.value); loadChart(e.target.value); }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition"
                >
                  <option value="">-- select holding --</option>
                  {holdings.map((h) => (
                    <option key={h.symbol} value={h.symbol}>
                      {h.symbol} ({h.quantity} shares)
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Quantity to Sell" id="sell-qty" placeholder="5" type="number" value={sellQty} onChange={setSellQty} />
              {sellMsg && <Msg type={sellMsg.type} text={sellMsg.text} />}
              <button
                id="sell-btn"
                onClick={handleSell}
                disabled={sellLoading || holdings.length === 0}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                {sellLoading ? <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Processing…</> : 'Sell'}
              </button>
            </div>
          </div>

          {/* ── Holdings Table ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Holdings</h2>
              <span className="text-sm text-gray-400">{holdings.length} position{holdings.length !== 1 ? 's' : ''}</span>
            </div>

            {portfolioLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-12 bg-gray-800 rounded-lg" />)}
              </div>
            ) : holdings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BanknotesIcon className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Your portfolio is empty. Buy stocks above to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-800">
                      <th className="text-left py-3 px-4 font-medium">Symbol</th>
                      <th className="text-right py-3 px-4 font-medium">Qty</th>
                      <th className="text-right py-3 px-4 font-medium">Avg Price</th>
                      <th className="text-right py-3 px-4 font-medium">Live Price</th>
                      <th className="text-right py-3 px-4 font-medium">Value</th>
                      <th className="text-right py-3 px-4 font-medium">P&L</th>
                      <th className="text-right py-3 px-4 font-medium">Return</th>
                      <th className="py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {holdings.map((h) => {
                      const live = livePrices[h.symbol] ?? h.avgPrice;
                      const value = live * h.quantity;
                      const cost = h.avgPrice * h.quantity;
                      const pnl = value - cost;
                      const ret = cost > 0 ? (pnl / cost) * 100 : 0;
                      return (
                        <tr key={h.symbol} className="hover:bg-gray-800/50 transition">
                          <td className="py-3 px-4 font-semibold text-white">{h.symbol}</td>
                          <td className="py-3 px-4 text-right text-gray-200">{h.quantity}</td>
                          <td className="py-3 px-4 text-right text-gray-300">₹{h.avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right text-white">₹{live.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-3 px-4 text-right text-white">₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className={`py-3 px-4 text-right font-medium ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`py-3 px-4 text-right font-medium ${ret >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {ret >= 0 ? '+' : ''}{ret.toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => loadChart(h.symbol)}
                                className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
                                title="Chart"
                              >
                                <ChartBarIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditQty(h.quantity.toString());
                                  setEditAvgPrice(h.avgPrice.toString());
                                  setEditHoldingModal(h);
                                }}
                                className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1"
                                title="Edit"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmModal(h.symbol)}
                                className="text-xs text-red-500 hover:text-red-400 transition flex items-center gap-1"
                                title="Delete"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Chart ── */}
          {(chartSymbol || chartLoading) && (
            <StockChart
              symbol={chartSymbol || '…'}
              currentPrice={livePrices[chartSymbol] ?? 0}
              priceChange={0}
              percentChange={0}
              chartData={chartData}
              loading={chartLoading}
            />
          )}

          {/* ── Custom Strategy ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <BeakerIcon className="h-5 w-5 text-indigo-400" />
              <h2 className="text-xl font-bold">Custom Strategy</h2>
              <span className="text-xs text-gray-500 ml-1">(one active at a time)</span>
            </div>

            <div>
              <label htmlFor="strategy-expr" className="text-sm font-medium text-gray-300 block mb-1.5">
                Strategy Expression
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Use <code className="text-indigo-400">prices</code> (array) and <code className="text-indigo-400">average(prices)</code>.
                Returns <code className="text-indigo-400">true</code> → BUY, <code className="text-indigo-400">false</code> → SELL.
              </p>
              <textarea
                id="strategy-expr"
                value={strategyExpr}
                onChange={(e) => setStrategyExpr(e.target.value)}
                placeholder="prices[prices.length - 1] > average(prices)"
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
              />
            </div>

            {savedStrategy && (
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg px-4 py-2 text-indigo-300 text-sm font-mono">
                Active: {savedStrategy}
              </div>
            )}

            {strategyMsg && <Msg type={strategyMsg.type} text={strategyMsg.text} />}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="save-strategy-btn"
                onClick={handleSaveStrategy}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                <BookmarkIcon className="h-4 w-4" /> Save Strategy
              </button>
              <div className="flex-1 flex gap-2">
                <input
                  id="strategy-symbol"
                  value={strategySymbol}
                  onChange={(e) => setStrategySymbol(e.target.value)}
                  placeholder="Symbol e.g. TCS.NS"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <button
                  id="run-strategy-btn"
                  onClick={handleRunStrategy}
                  disabled={strategyLoading || !savedStrategy}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
                >
                  {strategyLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <PlayIcon className="h-4 w-4" />}
                  Run
                </button>
              </div>
            </div>

            {/* Strategy Result */}
            {strategyResult && (
              <div className={`border rounded-xl p-4 ${SIGNAL_COLOR[strategyResult.signal]}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-extrabold">{strategyResult.signal}</span>
                  <span className="text-sm text-gray-300">for {strategyResult.symbol}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-400">Current Price:</span> <span className="text-white font-medium">₹{strategyResult.currentPrice.toLocaleString('en-IN')}</span></div>
                  <div><span className="text-gray-400">Evaluated:</span> <span className="text-white font-mono">{String(strategyResult.evaluatedValue)}</span></div>
                </div>
                <p className="text-xs text-gray-400 mt-2 font-mono">{strategyResult.strategy}</p>
              </div>
            )}
          </div>

        </main>
      </div>
      
      {/* ── Edit Holding Modal ── */}
      {editHoldingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Edit {editHoldingModal.symbol}</h3>
            <p className="text-sm text-gray-400 mb-6">Update your holding quantity and average price.</p>
            
            <div className="space-y-4 mb-6">
              <Input label="Total Quantity" id="edit-qty" type="number" value={editQty} onChange={setEditQty} placeholder="New quantity" />
              <Input label="Average Price" id="edit-price" type="number" value={editAvgPrice} onChange={setEditAvgPrice} placeholder="New average price" />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEditHoldingModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={editLoading || !editQty || !editAvgPrice || Number(editQty) <= 0 || Number(editAvgPrice) <= 0}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {editLoading ? 'Updating…' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" /> Remove Holding
            </h3>
            <p className="text-sm text-gray-300 mb-6">
              Are you sure you want to completely remove <strong>{deleteConfirmModal}</strong> from your portfolio? This action cannot be undone.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {deleteLoading ? 'Removing…' : 'Remove stock'}
              </button>
            </div>
          </div>
        </div>
      )}

    </ProtectedRoute>
  );
}

// ── Shared Sub-components ─────────────────────────────────────────────────────

function Input({ label, id, placeholder, value, onChange, type = 'text' }: {
  label: string; id: string; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-gray-300 block mb-1.5">{label}</label>
      <input
        id={id} type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />
    </div>
  );
}

function Msg({ type, text }: { type: 'ok' | 'err'; text: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
      type === 'ok' ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/40'
                   : 'bg-red-900/30 text-red-300 border border-red-700/40'
    }`}>
      {type === 'err' && <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />}
      {text}
    </div>
  );
}
