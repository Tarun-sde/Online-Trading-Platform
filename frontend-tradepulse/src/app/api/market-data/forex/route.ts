import { NextResponse } from 'next/server';

export async function GET() {
  // Mock forex data
  const forexPairs = [
    {
      symbol: 'EUR/USD',
      baseCurrency: 'EUR',
      quoteCurrency: 'USD',
      rate: 1.0932,
      change: -0.0021,
      percentChange: -0.19,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'GBP/USD',
      baseCurrency: 'GBP',
      quoteCurrency: 'USD',
      rate: 1.2684,
      change: 0.0018,
      percentChange: 0.14,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'USD/JPY',
      baseCurrency: 'USD',
      quoteCurrency: 'JPY',
      rate: 153.42,
      change: 0.31,
      percentChange: 0.20,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'USD/CHF',
      baseCurrency: 'USD',
      quoteCurrency: 'CHF',
      rate: 0.8957,
      change: -0.0028,
      percentChange: -0.31,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'AUD/USD',
      baseCurrency: 'AUD',
      quoteCurrency: 'USD',
      rate: 0.6642,
      change: 0.0037,
      percentChange: 0.56,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'USD/CAD',
      baseCurrency: 'USD',
      quoteCurrency: 'CAD',
      rate: 1.3624,
      change: -0.0046,
      percentChange: -0.34,
      lastUpdated: new Date().toISOString()
    }
  ];

  return NextResponse.json(forexPairs);
} 