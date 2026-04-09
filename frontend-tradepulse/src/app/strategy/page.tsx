'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import StockChart from '@/components/StockChart';
import StockSearch from '@/components/StockSearch';
import { useSymbol } from '@/context/SymbolContext';
import {
  BeakerIcon, PlusIcon, TrashIcon, PlayIcon, ArrowPathIcon,
  ExclamationTriangleIcon, CheckIcon, PencilSquareIcon, DocumentDuplicateIcon,
  InformationCircleIcon, XMarkIcon, ChartBarIcon, TagIcon,
} from '@heroicons/react/24/outline';

import { getAuthHeaders, authFetch, API_BASE } from '@/lib/auth';

const API = API_BASE;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Strategy {
  _id: string;
  name: string;
  logic: string;
  description: string;
  category: string;
  tags: string[];
  isDefault: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  runCount: number;
  _source: 'default' | 'custom';
}

interface RunResult {
  id: string;
  strategy: string;
  logic: string;
  signal: 'BUY' | 'SELL' | 'HOLD' | 'ERROR';
  evaluatedValue?: unknown;
  error?: string;
  isDefault: boolean;
}

interface RunResponse {
  symbol: string;
  currentPrice: number;
  dataPoints: number;
  chartData: { date: string; price: number }[];
  results: RunResult[];
  analyzedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SIGNAL_BADGE: Record<string, string> = {
  BUY:   'bg-emerald-500 text-white',
  SELL:  'bg-red-500 text-white',
  HOLD:  'bg-yellow-500 text-black',
  ERROR: 'bg-gray-700 text-gray-300',
};
const SIGNAL_CARD: Record<string, string> = {
  BUY:   'border-emerald-500/30 bg-emerald-500/5',
  SELL:  'border-red-500/30 bg-red-500/5',
  HOLD:  'border-yellow-500/30 bg-yellow-500/5',
  ERROR: 'border-gray-700 bg-gray-800/30',
};
const DIFFICULTY_COLOR: Record<string, string> = {
  Beginner:     'bg-emerald-900/40 text-emerald-400',
  Intermediate: 'bg-yellow-900/40 text-yellow-400',
  Advanced:     'bg-red-900/40 text-red-400',
};
const CATEGORY_ICON: Record<string, string> = {
  swing:    '📊',
  breakout: '🚀',
  intraday: '⚡',
  trend:    '📈',
  options:  '🔮',
  custom:   '🛠️',
};

const HELPER_TEMPLATES = [
  { label: 'EMA crossover',      expr: 'ema(20) > ema(50)' },
  { label: 'RSI oversold',       expr: 'rsi() < 30' },
  { label: 'SMA breakout',       expr: 'price > sma(50)' },
  { label: 'Price above average',expr: 'price > average()' },
  { label: 'Near 52w low (5%)',  expr: 'price < low * 1.05' },
  { label: 'Bollinger upper',    expr: `(() => { const m=sma(20); const v=prices.slice(-20).reduce((a,b)=>a+Math.pow(b-m,2),0)/20; return price > m + 2*Math.sqrt(v); })()` },
];

// ── Info Modal (standalone) ───────────────────────────────────────────────────

function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">How to Create a Strategy</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-sm">
          <div>
            <h3 className="font-semibold text-white mb-1.5">📌 What is a strategy?</h3>
            <p className="text-gray-400 leading-relaxed">
              A strategy is a JavaScript expression that evaluates to <code className="text-indigo-300">true</code> (→ BUY),
              <code className="text-indigo-300"> false</code> (→ SELL), or the string <code className="text-indigo-300">"BUY"</code> /
              <code className="text-indigo-300"> "SELL"</code> / <code className="text-indigo-300">"HOLD"</code> directly.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">🧮 Available variables & helpers</h3>
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left px-4 py-2 text-gray-300 font-medium">Variable/Function</th>
                    <th className="text-left px-4 py-2 text-gray-300 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {[
                    ['price', 'Latest closing price (number)'],
                    ['prices', 'Array of all closing prices (oldest → newest)'],
                    ['high', 'Maximum price in the dataset'],
                    ['low', 'Minimum price in the dataset'],
                    ['sma(n)', 'Simple Moving Average of last n prices'],
                    ['ema(n)', 'Exponential Moving Average of last n prices'],
                    ['rsi()', '14-period RSI using Wilder\'s smoothing (0-100)'],
                    ['average()', 'Mean of all prices in the dataset'],
                  ].map(([fn, desc]) => (
                    <tr key={fn as string} className="hover:bg-gray-700/30 transition">
                      <td className="px-4 py-2 font-mono text-indigo-300">{fn}</td>
                      <td className="px-4 py-2 text-gray-400">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">💡 Examples</h3>
            <div className="space-y-2">
              {[
                { label: 'Buy when price breaks above SMA(50)', code: 'price > sma(50)' },
                { label: 'RSI oversold (potential reversal)', code: 'rsi() < 30' },
                { label: 'EMA golden cross (trend following)', code: 'ema(20) > ema(50)' },
                { label: 'Price above overall average', code: 'price > average()' },
                { label: 'Multi-condition with HOLD', code: `(() => {\n  if (rsi() < 35 && price > sma(20)) return "BUY";\n  if (rsi() > 65) return "SELL";\n  return "HOLD";\n})()` },
              ].map(({ label, code }) => (
                <div key={label} className="bg-gray-800/70 rounded-lg p-3">
                  <p className="text-gray-300 text-xs mb-1.5">{label}</p>
                  <pre className="text-indigo-300 text-xs font-mono overflow-x-auto">{code}</pre>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4">
            <h3 className="font-semibold text-yellow-400 mb-1.5">⚠️ Restrictions</h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              For security, the following are blocked: <code>require</code>, <code>import</code>,
              <code> process</code>, <code>fetch</code>, <code>eval</code>, <code>fs</code>,
              <code> setTimeout</code>, and other Node.js/browser system APIs.
              Strategies must only use price data and the provided helper functions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function StrategyPage() {
  const { symbol, currentPrice, chartData, loading: chartLoading, error: chartError } = useSymbol();

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [stratLoading, setStratLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // Create form
  const [newName, setNewName]   = useState('');
  const [newLogic, setNewLogic] = useState('');
  const [newDesc, setNewDesc]   = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Run
  const [runResult, setRunResult] = useState<RunResponse | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  // ── Fetch strategies (defaults + user's own) ─────────────────────────────────
  const fetchStrategies = useCallback(async () => {
    setStratLoading(true);
    try {
      const r = await fetch(`${API}/api/strategies`, { headers: getAuthHeaders() });
      if (r.ok) setStrategies(await r.json());
    } catch { /* silent */ }
    setStratLoading(false);
  }, []);

  useEffect(() => { fetchStrategies(); }, [fetchStrategies]);

  // ── Create ───────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    setCreateMsg(null);
    if (!newName.trim()) { setCreateMsg({ type: 'err', text: 'Name is required.' }); return; }
    if (!newLogic.trim()) { setCreateMsg({ type: 'err', text: 'Logic expression is required.' }); return; }
    setCreateLoading(true);
    try {
      const r = await fetch(`${API}/api/strategies`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newName.trim(), logic: newLogic.trim(), description: newDesc.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setCreateMsg({ type: 'err', text: d.message }); }
      else {
        setCreateMsg({ type: 'ok', text: `"${d.name}" created!` });
        setNewName(''); setNewLogic(''); setNewDesc('');
        await fetchStrategies();
      }
    } catch { setCreateMsg({ type: 'err', text: 'Cannot connect to backend.' }); }
    setCreateLoading(false);
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    await fetch(`${API}/api/strategies/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    await fetchStrategies();
  };

  // ── Copy default ─────────────────────────────────────────────────────────────
  const handleCopy = async (id: string) => {
    const r = await fetch(`${API}/api/strategies/copy/${id}`, { method: 'POST', headers: getAuthHeaders() });
    if (r.ok) await fetchStrategies();
  };

  // ── Selection ────────────────────────────────────────────────────────────────
  const toggle = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => {
    if (selectedIds.size === strategies.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(strategies.map(s => s._id)));
  };

  // ── Run ──────────────────────────────────────────────────────────────────────
  const handleRun = async () => {
    setRunError(null); setRunResult(null);
    if (!symbol) { setRunError('Search for a stock symbol first.'); return; }
    if (selectedIds.size === 0) { setRunError('Select at least one strategy.'); return; }
    setRunLoading(true);
    try {
      const r = await fetch(`${API}/api/strategies/run`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ symbol, strategyIds: Array.from(selectedIds) }),
      });
      const d = await r.json();
      if (!r.ok) setRunError(d.message || `Error ${r.status}`);
      else setRunResult(d as RunResponse);
    } catch { setRunError('Cannot connect to backend.'); }
    setRunLoading(false);
  };

  // Separate defaults vs custom
  const defaultStrategies = strategies.filter(s => s._source === 'default');
  const customStrategies  = strategies.filter(s => s._source === 'custom');
  const priceChange = chartData.length > 1 ? currentPrice - chartData[0].price : 0;
  const pctChange   = chartData.length > 1 && chartData[0].price > 0
    ? (priceChange / chartData[0].price) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <BeakerIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold">Strategy Lab</h1>
              <p className="text-gray-500 text-sm">Pre-built + custom strategies · Multi-select · Real data</p>
            </div>
          </div>
          <button
            onClick={() => setShowInfo(true)}
            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/30 border border-blue-800/40 px-3 py-2 rounded-xl transition"
          >
            <InformationCircleIcon className="h-4 w-4" />
            How to create a strategy
          </button>
        </div>

        {/* Symbol Search */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-sm font-medium text-gray-300 mb-3">Stock Symbol</p>
          <StockSearch />
          {chartError && (
            <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
              <ExclamationTriangleIcon className="h-3.5 w-3.5" />{chartError}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── Create Strategy ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PencilSquareIcon className="h-5 w-5 text-indigo-400" />
                <h2 className="text-lg font-bold">Create Strategy</h2>
              </div>
              <button
                onClick={() => setShowInfo(true)}
                title="How to write strategy logic"
                className="text-gray-500 hover:text-blue-400 transition"
              >
                <InformationCircleIcon className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Name</label>
              <input
                id="strategy-name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. My RSI Strategy"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Logic Expression</label>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {HELPER_TEMPLATES.map(t => (
                  <button
                    key={t.label}
                    onClick={() => setNewLogic(t.expr)}
                    className="text-xs px-2 py-0.5 rounded border border-gray-700 bg-gray-800 text-gray-400 hover:text-white hover:border-indigo-500 transition"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <textarea
                id="strategy-logic"
                value={newLogic}
                onChange={e => setNewLogic(e.target.value)}
                placeholder="price > sma(50)"
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1.5">Description (optional)</label>
              <input
                id="strategy-desc"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="What conditions trigger this strategy?"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            {createMsg && (
              <div className={`text-sm rounded-lg px-3 py-2 border ${
                createMsg.type === 'ok'
                  ? 'bg-emerald-900/30 border-emerald-700/40 text-emerald-300'
                  : 'bg-red-900/30 border-red-700/40 text-red-300'
              }`}>
                {createMsg.text}
              </div>
            )}

            <button
              id="create-strategy-btn"
              onClick={handleCreate}
              disabled={createLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              {createLoading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
              Save Strategy
            </button>
          </div>

          {/* ── Strategy List ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-bold">All Strategies</h2>
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{strategies.length}</span>
              </div>
              {strategies.length > 0 && (
                <button onClick={toggleAll} className="text-xs text-blue-400 hover:text-blue-300 transition">
                  {selectedIds.size === strategies.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {stratLoading ? (
              <div className="space-y-2 flex-1">
                {[1,2,3,4,5].map(i => <div key={i} className="animate-pulse h-14 bg-gray-800 rounded-xl" />)}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[480px] pr-1 space-y-4">

                {/* Default strategies */}
                {defaultStrategies.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pre-Built Strategies</p>
                    <ul className="space-y-2">
                      {defaultStrategies.map(s => {
                        const checked = selectedIds.has(s._id);
                        return (
                          <li
                            key={s._id}
                            onClick={() => toggle(s._id)}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                              checked ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-gray-700 hover:border-gray-600'
                            }`}
                          >
                            <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                              checked ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'
                            }`}>
                              {checked && <CheckIcon className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-white">
                                  {CATEGORY_ICON[s.category] || '📊'} {s.name}
                                </span>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${DIFFICULTY_COLOR[s.difficulty] || 'bg-gray-800 text-gray-400'}`}>
                                  {s.difficulty}
                                </span>
                              </div>
                              {s.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{s.description}</p>}
                              {s.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap mt-1">
                                  {s.tags.map(tag => (
                                    <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); handleCopy(s._id); }}
                              title="Copy & Edit"
                              className="text-gray-500 hover:text-indigo-400 transition shrink-0"
                            >
                              <DocumentDuplicateIcon className="h-4 w-4" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* Custom strategies */}
                {customStrategies.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">My Strategies</p>
                    <ul className="space-y-2">
                      {customStrategies.map(s => {
                        const checked = selectedIds.has(s._id);
                        return (
                          <li
                            key={s._id}
                            onClick={() => toggle(s._id)}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                              checked ? 'border-purple-500/50 bg-purple-500/5' : 'border-gray-700 hover:border-gray-600'
                            }`}
                          >
                            <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                              checked ? 'bg-purple-500 border-purple-500' : 'border-gray-600'
                            }`}>
                              {checked && <CheckIcon className="h-3 w-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">🛠️ {s.name}</p>
                              <p className="text-xs font-mono text-gray-400 truncate">{s.logic}</p>
                              {s.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{s.description}</p>}
                              <p className="text-xs text-gray-600 mt-0.5">Ran {s.runCount}×</p>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(s._id); }}
                              title="Delete"
                              className="text-gray-600 hover:text-red-400 transition shrink-0"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {strategies.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-600 py-8">
                    <BeakerIcon className="h-12 w-12 mb-3 opacity-20" />
                    <p className="text-sm">Loading strategies…</p>
                  </div>
                )}
              </div>
            )}

            {/* Run button */}
            <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
              {runError && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                  <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />{runError}
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {selectedIds.size > 0
                  ? <span><span className="text-white font-medium">{selectedIds.size}</span> selected</span>
                  : <span>Click strategies to select them</span>
                }
              </div>
              <button
                id="run-strategies-btn"
                onClick={handleRun}
                disabled={runLoading || selectedIds.size === 0 || !symbol}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
              >
                {runLoading
                  ? <><ArrowPathIcon className="h-5 w-5 animate-spin" /> Running…</>
                  : <><PlayIcon className="h-5 w-5" /> Run {selectedIds.size > 0 ? `${selectedIds.size} ` : ''}Selected</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* ── Real Chart ── */}
        {(symbol || chartLoading) && (
          <StockChart
            symbol={symbol || '…'}
            currentPrice={currentPrice}
            priceChange={priceChange}
            percentChange={pctChange}
            chartData={chartData}
            loading={chartLoading}
          />
        )}

        {/* ── Results ── */}
        {runResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Results — <span className="text-indigo-400">{runResult.symbol}</span>
              </h2>
              <p className="text-xs text-gray-500">
                {runResult.dataPoints} data points · ₹{runResult.currentPrice.toLocaleString('en-IN')} ·{' '}
                {new Date(runResult.analyzedAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {runResult.results.map((r, idx) => (
                <div key={r.id || idx} className={`border rounded-2xl p-5 ${SIGNAL_CARD[r.signal] || SIGNAL_CARD.ERROR}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-white text-sm truncate">{r.strategy}</p>
                      {r.isDefault && (
                        <span className="text-xs text-indigo-300 bg-indigo-900/30 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                          Pre-built
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${SIGNAL_BADGE[r.signal]}`}>
                      {r.signal}
                    </span>
                  </div>

                  {r.error ? (
                    <p className="text-xs text-gray-400 bg-gray-800/50 rounded-lg p-2">{r.error}</p>
                  ) : (
                    <>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-400">Result</span>
                        <span className="font-mono text-white">{String(r.evaluatedValue)}</span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Summary bar */}
            <div className="flex gap-4 flex-wrap text-sm">
              {(['BUY', 'SELL', 'HOLD'] as const).map(sig => {
                const count = runResult.results.filter(r => r.signal === sig).length;
                return count > 0 ? (
                  <div key={sig} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${SIGNAL_CARD[sig]} border`}>
                    <span className={`font-bold ${
                      sig === 'BUY' ? 'text-emerald-400' : sig === 'SELL' ? 'text-red-400' : 'text-yellow-400'
                    }`}>{sig}</span>
                    <span className="text-gray-400">×{count}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
