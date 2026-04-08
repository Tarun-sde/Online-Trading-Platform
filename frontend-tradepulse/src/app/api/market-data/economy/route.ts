import { NextResponse } from 'next/server';

export async function GET() {
  // Mock economic indicators data
  const indicators = [
    {
      symbol: 'IN_CPI',
      name: 'India Consumer Price Index',
      value: 5.1,
      previousValue: 5.3,
      unit: '%',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'IN_GDP',
      name: 'India GDP Growth Rate',
      value: 7.6,
      previousValue: 7.8,
      unit: '%',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'IN_UNEMPLOYMENT',
      name: 'India Unemployment Rate',
      value: 7.1,
      previousValue: 7.3,
      unit: '%',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'RBI_REPO',
      name: 'RBI Repo Rate',
      value: 6.5,
      previousValue: 6.5,
      unit: '%',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'IN_IIP',
      name: 'India Industrial Production',
      value: 5.8,
      previousValue: 5.2,
      unit: '%',
      lastUpdated: new Date().toISOString()
    },
    {
      symbol: 'IN_PMI',
      name: 'India Manufacturing PMI',
      value: 56.5,
      previousValue: 55.7,
      unit: 'Index',
      lastUpdated: new Date().toISOString()
    }
  ];

  return NextResponse.json(indicators);
} 