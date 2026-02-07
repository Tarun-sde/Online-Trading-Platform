'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StockPriceDisplay from '@/components/StockPriceDisplay';
import NewsSection from '@/components/NewsSection';

// ===== TYPES =====

interface AssetDisplayProps {
  symbol: string;
  name: string;
  value: number;
  change: number;
  percentChange: number;
  unit?: string;
  lastUpdated?: Date | string | null;
}

interface ForexPair {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  change: number;
  percentChange: number;
  lastUpdated: string | Date;
}

interface Crypto {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  lastUpdated: string | Date;
}

interface Commodity {
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  unit: string;
  lastUpdated: string | Date;
}

interface EconomicIndicator {
  symbol: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  lastUpdated: string | Date;
}

// ===== DISPLAY CARD =====

const AssetDisplay = ({
  symbol,
  name,
  value,
  change,
  percentChange,
  unit = '',
  lastUpdated = null
}: AssetDisplayProps) => {

  const priceIsUp = percentChange >= 0;

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md">
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-400">{name}</h3>
        <p className="text-xs text-gray-500">{symbol}</p>
      </div>

      <div className="flex items-baseline">
        <span className="text-xl font-bold text-white mr-2">
          {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          {unit && ` ${unit}`}
        </span>

        <div className={`text-sm ${priceIsUp ? 'text-green-500' : 'text-red-500'}`}>
          {priceIsUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)} ({Math.abs(percentChange).toFixed(2)}%)
        </div>
      </div>

      {lastUpdated && (
        <div className="mt-2 text-xs text-gray-500">
          Updated: {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

// ===== MAIN PAGE =====

export default function MarketsPage() {
  const BASE = 'http://localhost:5000/api/market-data';

  const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];

  const [activeTab, setActiveTab] = useState('stocks');

  const [forexPairs, setForexPairs] = useState<ForexPair[]>([]);
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [fx, cr, cm, ec] = await Promise.all([
          fetch(`${BASE}/forex`).then(r => r.json()),
          fetch(`${BASE}/crypto`).then(r => r.json()),
          fetch(`${BASE}/commodities`).then(r => r.json()),
          fetch(`${BASE}/economy`).then(r => r.json()),
        ]);

        setForexPairs(fx);
        setCryptos(cr);
        setCommodities(cm);
        setIndicators(ec);
        setLoading(false);

      } catch (e) {
        console.error("Market fetch failed", e);
      }
    };

    fetchAll();
    const t = setInterval(fetchAll, 10000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 pt-20">
        Loading markets...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 pt-20">

      <h1 className="text-3xl font-bold mb-6">Global Markets</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>

        <TabsList className="mb-6 bg-gray-800">
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
          <TabsTrigger value="forex">Forex</TabsTrigger>
          <TabsTrigger value="crypto">Cryptocurrencies</TabsTrigger>
          <TabsTrigger value="commodities">Commodities</TabsTrigger>
          <TabsTrigger value="economy">Economy</TabsTrigger>
        </TabsList>

        {/* STOCKS */}

        <TabsContent value="stocks">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stockSymbols.map(symbol => (
              <StockPriceDisplay key={symbol} symbol={symbol} />
            ))}
          </div>
        </TabsContent>

        {/* FOREX */}

        <TabsContent value="forex">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forexPairs.map(p => (
              <AssetDisplay key={p.symbol}
                symbol={p.symbol}
                name={`${p.baseCurrency}/${p.quoteCurrency}`}
                value={p.rate}
                change={p.change}
                percentChange={p.percentChange}
                lastUpdated={p.lastUpdated}
              />
            ))}
          </div>
        </TabsContent>

        {/* CRYPTO */}

        <TabsContent value="crypto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cryptos.map(c => (
              <AssetDisplay key={c.symbol}
                symbol={c.symbol}
                name={c.name}
                value={c.price}
                change={c.change}
                percentChange={c.percentChange}
                unit="$"
                lastUpdated={c.lastUpdated}
              />
            ))}
          </div>
        </TabsContent>

        {/* COMMODITIES */}

        <TabsContent value="commodities">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {commodities.map(c => (
              <AssetDisplay key={c.symbol}
                symbol={c.symbol}
                name={c.name}
                value={c.price}
                change={c.change}
                percentChange={c.percentChange}
                unit={c.unit}
                lastUpdated={c.lastUpdated}
              />
            ))}
          </div>
        </TabsContent>

        {/* ECONOMY */}

        <TabsContent value="economy">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {indicators.map(i => (
              <AssetDisplay key={i.symbol}
                symbol={i.symbol}
                name={i.name}
                value={i.value}
                change={i.value - i.previousValue}
                percentChange={((i.value - i.previousValue) / i.previousValue) * 100}
                unit={i.unit}
                lastUpdated={i.lastUpdated}
              />
            ))}
          </div>
        </TabsContent>

      </Tabs>

      <div className="mt-8">
        <NewsSection initialCategory={activeTab.toUpperCase()} maxItems={6} />
      </div>

    </div>
  );
}
