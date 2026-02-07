export function calcPortfolioStats(
  holdings: { shares: number; averagePrice: number }[],
  livePrices: Record<string, { price: number; prev: number }>
) {
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

  return { totalValue, totalProfit, totalReturn, dayChange, dayChangePercent };
}
