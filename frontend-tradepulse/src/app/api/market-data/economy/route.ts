import { NextResponse } from 'next/server';

export async function GET() {
  // Mock economic indicators data
  const indicators = [
    {
      symbol: 'US_CPI',
      name: 'US Consumer Price Index',
      value: 3.8,
      previousValue: 3.7,
      unit: '%',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'US_GDP',
      name: 'US GDP Growth Rate',
      value: 2.5,
      previousValue: 2.1,
      unit: '%',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'US_UNEMPLOYMENT',
      name: 'US Unemployment Rate',
      value: 3.8,
      previousValue: 3.9,
      unit: '%',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'US_INTEREST_RATE',
      name: 'US Federal Funds Rate',
      value: 5.5,
      previousValue: 5.5,
      unit: '%',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'US_NFP',
      name: 'US Non-Farm Payrolls',
      value: 175000,
      previousValue: 142000,
      unit: 'Jobs',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'US_RETAIL_SALES',
      name: 'US Retail Sales MoM',
      value: 0.7,
      previousValue: 0.4,
      unit: '%',
      lastUpdated: new Date().toISOString()
    }
  ];

  return NextResponse.json(indicators);
} 