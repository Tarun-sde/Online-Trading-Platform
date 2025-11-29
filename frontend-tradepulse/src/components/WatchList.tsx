'use client';

import { useState } from 'react';
import { PlusIcon, StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

interface StockItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  percentChange: number;
  favorite: boolean;
}

const WatchList = () => {
  // Sample watchlist data
  const [stocks, setStocks] = useState<StockItem[]>([
    {
      id: '1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 187.45,
      change: 3.28,
      percentChange: 1.78,
      favorite: true,
    },
    {
      id: '2',
      symbol: 'MSFT',
      name: 'Microsoft Corporation',
      price: 408.59,
      change: 4.23,
      percentChange: 1.05,
      favorite: true,
    },
    {
      id: '3',
      symbol: 'GOOGL',
      name: 'Alphabet Inc.',
      price: 142.89,
      change: -0.76,
      percentChange: -0.53,
      favorite: false,
    },
    {
      id: '4',
      symbol: 'AMZN',
      name: 'Amazon.com, Inc.',
      price: 153.42,
      change: 2.31,
      percentChange: 1.53,
      favorite: false,
    },
    {
      id: '5',
      symbol: 'TSLA',
      name: 'Tesla, Inc.',
      price: 218.89,
      change: -3.24,
      percentChange: -1.46,
      favorite: false,
    },
  ]);

  const toggleFavorite = (id: string) => {
    setStocks(
      stocks.map((stock) =>
        stock.id === id ? { ...stock, favorite: !stock.favorite } : stock
      )
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">My Watchlist</h2>
        <button
          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Symbol</span>
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 w-10"></th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Symbol</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Name</th>
              <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-300">Last Price</th>
              <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-300">Change</th>
              <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-300">% Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {stocks.map((stock) => (
              <tr 
                key={stock.id} 
                className="hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <td className="whitespace-nowrap px-3 py-4">
                  <button onClick={() => toggleFavorite(stock.id)} className="text-yellow-500">
                    {stock.favorite ? (
                      <StarIcon className="h-5 w-5" />
                    ) : (
                      <StarOutline className="h-5 w-5" />
                    )}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-white">
                  {stock.symbol}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                  {stock.name}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-white text-right">
                  ${stock.price.toFixed(2)}
                </td>
                <td className={`whitespace-nowrap px-3 py-4 text-sm text-right ${
                  stock.change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  ${Math.abs(stock.change).toFixed(2)}
                </td>
                <td className={`whitespace-nowrap px-3 py-4 text-sm text-right ${
                  stock.percentChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stock.percentChange >= 0 ? '+' : ''}
                  {stock.percentChange.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WatchList; 