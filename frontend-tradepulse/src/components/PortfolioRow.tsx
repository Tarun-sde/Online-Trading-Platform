'use client';

import { useRealTimeData } from '@/hooks/useRealTimeData';
import { useEffect } from 'react';

interface Props {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  averagePrice: number;
  onPrice?: (symbol: string, price: number, prevClose?: number) => void;
}

export default function PortfolioRow({
  symbol,
  name,
  shares,
  averagePrice,
  onPrice
}: Props) {

  const { data } = useRealTimeData("stock", symbol, true);

  const currentPrice = data?.currentPrice ?? averagePrice;
  const prevClose = data?.previousClose ?? currentPrice;

  const value = shares * currentPrice;
  const cost = shares * averagePrice;
  const profit = value - cost;
  const returnPct = (profit / cost) * 100;

  useEffect(() => {
    if (onPrice && data?.currentPrice) {
      onPrice(symbol, data.currentPrice, data.previousClose);
    }
  }, [data?.currentPrice]);

  return (
    <tr className="hover:bg-gray-800">
      <td className="px-4 py-4 text-sm font-medium text-white">{symbol}</td>
      <td className="px-4 py-4 text-sm text-gray-300">{name}</td>
      <td className="px-4 py-4 text-right">{shares}</td>
      <td className="px-4 py-4 text-right">${averagePrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</td>

      <td className="px-4 py-4 text-right">${currentPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</td>

      <td className="px-4 py-4 text-right">${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</td>

      <td className={`px-4 py-4 text-right ${profit>=0?'text-green-500':'text-red-500'}`}>
        ${profit.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}

      </td>
      <td className={`px-4 py-4 text-right ${profit>=0?'text-green-500':'text-red-500'}`}>
        {returnPct.toFixed(2)}%
      </td>
    </tr>
  );
}
