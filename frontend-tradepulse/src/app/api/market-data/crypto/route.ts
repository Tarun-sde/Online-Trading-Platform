import { NextResponse } from 'next/server';

export async function GET() {
  // Mock cryptocurrency data
  const cryptos = [
    {
      symbol: 'BTC/USD',
      name: 'Bitcoin',
      price: 63895.32,
      change: 1245.67,
      percentChange: 1.99,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'ETH/USD',
      name: 'Ethereum',
      price: 3474.18,
      change: 87.34,
      percentChange: 2.58,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'XRP/USD',
      name: 'Ripple',
      price: 0.5243,
      change: -0.0182,
      percentChange: -3.36,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'SOL/USD',
      name: 'Solana',
      price: 148.56,
      change: 3.42,
      percentChange: 2.36,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'ADA/USD',
      name: 'Cardano',
      price: 0.4621,
      change: 0.0098,
      percentChange: 2.17,
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'DOT/USD',
      name: 'Polkadot',
      price: 6.78,
      change: -0.12,
      percentChange: -1.74,
      lastUpdated: new Date().toISOString()
    }
  ];

  return NextResponse.json(cryptos);
} 