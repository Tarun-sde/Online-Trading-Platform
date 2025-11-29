import { NextResponse } from 'next/server';

export async function GET() {
  // Mock commodities data
  const commodities = [
    {
      symbol: 'GOLD',
      name: 'Gold',
      price: 2324.60,
      change: 13.75,
      percentChange: 0.59,
      unit: 'USD/oz',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'SILVER',
      name: 'Silver',
      price: 26.98,
      change: 0.24,
      percentChange: 0.90,
      unit: 'USD/oz',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'CRUDE',
      name: 'Crude Oil (WTI)',
      price: 82.76,
      change: -1.24,
      percentChange: -1.47,
      unit: 'USD/bbl',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'BRENT',
      name: 'Brent Crude',
      price: 86.32,
      change: -0.98,
      percentChange: -1.12,
      unit: 'USD/bbl',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'NG',
      name: 'Natural Gas',
      price: 2.45,
      change: 0.03,
      percentChange: 1.24,
      unit: 'USD/MMBtu',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'COPPER',
      name: 'Copper',
      price: 4.52,
      change: 0.08,
      percentChange: 1.80,
      unit: 'USD/lb',
      lastUpdated: new Date().toISOString()
    }
  ];

  return NextResponse.json(commodities);
} 