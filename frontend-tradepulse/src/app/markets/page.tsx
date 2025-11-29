'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StockPriceDisplay from '@/components/StockPriceDisplay';
import NewsSection from '@/components/NewsSection';
import { useRealTimeData } from '@/hooks/useRealTimeData';

// Asset types
interface AssetDisplayProps {
  symbol: string;
  name: string;
  value: number;
  change: number;
  percentChange: number;
  unit?: string;
  isUp?: boolean | null;
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

// Asset class displays
const AssetDisplay = ({ 
  symbol, 
  name, 
  value, 
  change, 
  percentChange,
  unit = '',
  isUp = null,
  lastUpdated = null
}: AssetDisplayProps) => {
  // Determine if price is up or down if not explicitly provided
  const priceIsUp = isUp !== null ? isUp : (percentChange >= 0);
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h3 className="text-sm font-medium text-gray-400">{name}</h3>
          <p className="text-xs text-gray-500">{symbol}</p>
        </div>
      </div>

      <div className="flex items-baseline">
        <span className="text-xl font-bold text-white mr-2">
          {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}{unit && ` ${unit}`}
        </span>
        <div className={`flex items-center text-sm ${priceIsUp ? 'text-green-500' : 'text-red-500'}`}>
          <span>{priceIsUp ? '▲' : '▼'}</span>
          <span className="ml-1">
            {Math.abs(change).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            {unit && ` ${unit}`} ({Math.abs(percentChange).toFixed(2)}%)
          </span>
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

export default function MarketsPage() {
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState('stocks');
  
  // Stocks data
  const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
  
  // Forex data with custom hook
  const { data: forexData } = useRealTimeData('forex', 'EUR/USD', true);
  const [forexPairs, setForexPairs] = useState<ForexPair[]>([]);
  
  // Crypto data
  const { data: cryptoData } = useRealTimeData('crypto', 'BTC/USD', true);
  const [cryptos, setCryptos] = useState<Crypto[]>([]);
  
  // Commodities data
  const { data: commodityData } = useRealTimeData('commodity', 'GOLD', true);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  
  // Economic indicators data
  const { data: economyData } = useRealTimeData('economy', 'US_CPI', true);
  const [indicators, setIndicators] = useState<EconomicIndicator[]>([]);
  
  // Fetch initial data for each asset class
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        // Fetch forex pairs
        const forexRes = await fetch('/api/market-data/forex');
        if (forexRes.ok) {
          const data = await forexRes.json();
          setForexPairs(data);
        }
        
        // Fetch cryptocurrencies
        const cryptoRes = await fetch('/api/market-data/crypto');
        if (cryptoRes.ok) {
          const data = await cryptoRes.json();
          setCryptos(data);
        }
        
        // Fetch commodities
        const commoditiesRes = await fetch('/api/market-data/commodities');
        if (commoditiesRes.ok) {
          const data = await commoditiesRes.json();
          setCommodities(data);
        }
        
        // Fetch economic indicators
        const economyRes = await fetch('/api/market-data/economy');
        if (economyRes.ok) {
          const data = await economyRes.json();
          setIndicators(data);
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };
    
    if (isClient) {
      fetchMarketData();
    }
  }, [isClient]);
  
  // This ensures the component only renders on the client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 pt-20">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 pt-20">
      <h1 className="text-3xl font-bold mb-6">Global Markets</h1>
      
      <Tabs defaultValue="stocks" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6 bg-gray-800">
          <TabsTrigger value="stocks">Stocks</TabsTrigger>
          <TabsTrigger value="forex">Forex</TabsTrigger>
          <TabsTrigger value="crypto">Cryptocurrencies</TabsTrigger>
          <TabsTrigger value="commodities">Commodities</TabsTrigger>
          <TabsTrigger value="economy">Economy</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stocks" className="animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stockSymbols.map(symbol => (
              <StockPriceDisplay key={symbol} symbol={symbol} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="forex" className="animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forexPairs.length > 0 ? (
              forexPairs.map(pair => (
                <AssetDisplay
                  key={pair.symbol}
                  symbol={pair.symbol}
                  name={`${pair.baseCurrency}/${pair.quoteCurrency}`}
                  value={pair.rate}
                  change={pair.change}
                  percentChange={pair.percentChange}
                  lastUpdated={pair.lastUpdated}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">
                Loading forex data...
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="crypto" className="animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cryptos.length > 0 ? (
              cryptos.map(crypto => (
                <AssetDisplay
                  key={crypto.symbol}
                  symbol={crypto.symbol}
                  name={crypto.name}
                  value={crypto.price}
                  change={crypto.change}
                  percentChange={crypto.percentChange}
                  unit="$"
                  lastUpdated={crypto.lastUpdated}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">
                Loading cryptocurrency data...
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="commodities" className="animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {commodities.length > 0 ? (
              commodities.map(commodity => (
                <AssetDisplay
                  key={commodity.symbol}
                  symbol={commodity.symbol}
                  name={commodity.name}
                  value={commodity.price}
                  change={commodity.change}
                  percentChange={commodity.percentChange}
                  unit={commodity.unit}
                  lastUpdated={commodity.lastUpdated}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">
                Loading commodities data...
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="economy" className="animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {indicators.length > 0 ? (
              indicators.map(indicator => (
                <AssetDisplay
                  key={indicator.symbol}
                  symbol={indicator.symbol}
                  name={indicator.name}
                  value={indicator.value}
                  change={indicator.value - indicator.previousValue}
                  percentChange={((indicator.value - indicator.previousValue) / indicator.previousValue) * 100}
                  unit={indicator.unit}
                  lastUpdated={indicator.lastUpdated}
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">
                Loading economic indicators...
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8">
        <NewsSection initialCategory={activeTab.toUpperCase()} maxItems={6} />
      </div>
    </div>
  );
} 