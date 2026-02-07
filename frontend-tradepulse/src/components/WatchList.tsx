'use client';

import { useState } from 'react';
import { PlusIcon, StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { useRealTimeData } from '@/hooks/useRealTimeData';

interface StockRow {
  id: string;
  symbol: string;
  name: string;
  favorite: boolean;
}

const initialStocks: StockRow[] = [
  { id: '1', symbol: 'AAPL', name: 'Apple Inc.', favorite: true },
  { id: '2', symbol: 'MSFT', name: 'Microsoft Corporation', favorite: true },
  { id: '3', symbol: 'GOOGL', name: 'Alphabet Inc.', favorite: false },
  { id: '4', symbol: 'AMZN', name: 'Amazon.com, Inc.', favorite: false },
  { id: '5', symbol: 'TSLA', name: 'Tesla, Inc.', favorite: false },
];


// ✅ Row component — each row gets its own live stream
function WatchRow({
  stock,
  onToggle
}: {
  stock: StockRow;
  onToggle: (id: string) => void;
}) {
  const { data } = useRealTimeData("stock", stock.symbol, true);

  const price = data?.currentPrice ?? 0;
  const change = data?.change ?? 0;
  const pct = data?.percentChange ?? 0;

  return (
    <tr className="hover:bg-gray-800 transition-colors">
      <td className="px-3 py-4">
        <button onClick={() => onToggle(stock.id)} className="text-yellow-500">
          {stock.favorite ? (
            <StarIcon className="h-5 w-5" />
          ) : (
            <StarOutline className="h-5 w-5" />
          )}
        </button>
      </td>

      <td className="px-3 py-4 text-sm font-medium text-white">
        {stock.symbol}
      </td>

      <td className="px-3 py-4 text-sm text-gray-300">
        {stock.name}
      </td>

      <td className="px-3 py-4 text-sm text-right text-white">
        ${price.toFixed(2)}
      </td>

      <td className={`px-3 py-4 text-sm text-right ${
        change >= 0 ? 'text-green-500' : 'text-red-500'
      }`}>
        ${Math.abs(change).toFixed(2)}
      </td>

      <td className={`px-3 py-4 text-sm text-right ${
        pct >= 0 ? 'text-green-500' : 'text-red-500'
      }`}>
        {pct >= 0 ? '+' : ''}
        {pct.toFixed(2)}%
      </td>
    </tr>
  );
}



export default function WatchList() {
  const [stocks, setStocks] = useState(initialStocks);

  const toggleFavorite = (id: string) => {
    setStocks(s =>
      s.map(x => x.id === id ? { ...x, favorite: !x.favorite } : x)
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg">

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">My Watchlist</h2>

        <button className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
          <PlusIcon className="h-4 w-4" />
          Add Symbol
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="px-3 py-3 text-left text-sm text-gray-300 w-10"></th>
              <th className="px-3 py-3 text-left text-sm text-gray-300">Symbol</th>
              <th className="px-3 py-3 text-left text-sm text-gray-300">Name</th>
              <th className="px-3 py-3 text-right text-sm text-gray-300">Last Price</th>
              <th className="px-3 py-3 text-right text-sm text-gray-300">Change</th>
              <th className="px-3 py-3 text-right text-sm text-gray-300">% Change</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-800">
            {stocks.map(stock => (
              <WatchRow
                key={stock.id}
                stock={stock}
                onToggle={toggleFavorite}
              />
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
