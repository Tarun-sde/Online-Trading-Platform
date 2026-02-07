"use client";

import PortfolioRow from "@/components/PortfolioRow";

import {
  BanknotesIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import StatsCard from "@/components/StatsCard";
import StockChart from "@/components/StockChart";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function Portfolio() {

  // ✅ holdings (your real positions)
  const holdings = [
    { id: "1", symbol: "AAPL", name: "Apple Inc.", shares: 25, averagePrice: 165.23 },
    { id: "2", symbol: "MSFT", name: "Microsoft Corporation", shares: 15, averagePrice: 342.67 },
    { id: "3", symbol: "TSLA", name: "Tesla, Inc.", shares: 20, averagePrice: 242.15 },
  ];

  // ✅ live prices pushed from PortfolioRow
  const [livePrices, setLivePrices] = useState<
    Record<string, { price: number; prev: number }>
  >({});

  // ✅ callback from rows
  const handlePrice = (symbol: string, price: number, prev: number) => {
    setLivePrices(p => ({ ...p, [symbol]: { price, prev } }));
  };

  // ✅ REAL portfolio math
  const portfolioStats = useMemo(() => {

    let totalValue = 0;
    let totalCost = 0;
    let prevValue = 0;

    for (const h of holdings) {
      const live = livePrices[h.symbol];

      const price = live?.price ?? h.averagePrice;
      const prev = live?.prev ?? price;

      totalValue += price * h.shares;
      prevValue += prev * h.shares;
      totalCost += h.averagePrice * h.shares;
    }

    const totalProfit = totalValue - totalCost;
    const totalReturn = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    const dayChange = totalValue - prevValue;
    const dayChangePercent = prevValue > 0 ? (dayChange / prevValue) * 100 : 0;

    return {
      totalValue,
      totalProfit,
      totalReturn,
      dayChange,
      dayChangePercent,
    };

  }, [holdings, livePrices]);

  const trend = portfolioStats.dayChange >= 0 ? "up" : "down";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">

          <div className="mt-6 mb-8">
            <h1 className="text-3xl font-bold">Portfolio</h1>
            <p className="text-gray-400 mt-2">
              Manage your investments and track performance
            </p>
          </div>

          {/* ✅ Stats Cards — LIVE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

            <StatsCard
              title="Portfolio Value"
              value={`$${portfolioStats.totalValue.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`}

              change={portfolioStats.dayChangePercent}
              trend={trend}
              color="green"
              icon={<BanknotesIcon className="h-5 w-5 text-white" />}
            />

            <StatsCard
              title="Total Profit/Loss"
              value={`$${portfolioStats.totalProfit.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`}

              change={portfolioStats.totalReturn}
              trend={portfolioStats.totalProfit >= 0 ? "up" : "down"}
              color="blue"
              icon={<ChartPieIcon className="h-5 w-5 text-white" />}
            />

            <StatsCard
              title="Daily Change"
              value={`$${portfolioStats.dayChange.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`}

              change={portfolioStats.dayChangePercent}
              trend={trend}
              color="indigo"
              icon={<ArrowTrendingUpIcon className="h-5 w-5 text-white" />}
            />

            <StatsCard
              title="Overall Return"
              value={`${portfolioStats.totalReturn.toFixed(2)}%`}
              change={portfolioStats.totalReturn}
              trend={portfolioStats.totalReturn >= 0 ? "up" : "down"}
              color="purple"
              icon={<ArrowTrendingUpIcon className="h-5 w-5 text-white" />}
            />

          </div>

          {/* ✅ Portfolio Chart uses live total */}
          <div className="mb-8">
            <StockChart
              symbol="PORTFOLIO"
              name="Total Portfolio Value"
              currentPrice={portfolioStats.totalValue}
              priceChange={portfolioStats.dayChange}
              percentChange={portfolioStats.dayChangePercent}
              trend={portfolioStats.dayChange >= 0 ? "up" : "down"}
              forceSimpleSeries
            />

          </div>

          {/* ✅ Holdings table */}
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Your Holdings</h2>

            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Name</th>
                  <th className="text-right">Shares</th>
                  <th className="text-right">Avg Price</th>
                  <th className="text-right">Current</th>
                  <th className="text-right">Value</th>
                  <th className="text-right">P/L</th>
                  <th className="text-right">Return %</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-800">
                {holdings.map(h => (
                  <PortfolioRow
                    key={h.id}
                    {...h}
                    onPrice={handlePrice}
                  />
                ))}
              </tbody>
            </table>
          </div>

        </main>
      </div>
    </ProtectedRoute>
  );
}
