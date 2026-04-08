import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'MARKET';
  
  // Mock news data
  const allNews = [
    {
      id: '1',
      title: 'RBI Signals Potential Repo Rate Cut as Inflation Eases',
      summary: 'RBI officials indicate a shift in monetary policy as CPI inflation shows signs of cooling below 5%.',
      category: 'ECONOMY',
      source: 'Economic Times',
      url: '#',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['RBI_REPO', '^NSEI']
    },
    {
      id: '2',
      title: 'TCS Reports Strong Quarterly Earnings, Beats Estimates',
      summary: 'India\'s largest IT services company posts robust revenue growth driven by cloud and AI deals.',
      category: 'STOCKS',
      source: 'Moneycontrol',
      url: '#',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['TCS.NS']
    },
    {
      id: '3',
      title: 'Oil Prices Surge on Supply Concerns',
      summary: 'Crude oil futures rise amid geopolitical tensions in major producing regions.',
      category: 'COMMODITIES',
      source: 'Energy Report',
      url: '#',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['CRUDE', 'BRENT']
    },
    {
      id: '4',
      title: 'Bitcoin Reaches New All-Time High',
      summary: 'Leading cryptocurrency breaks previous record amid institutional adoption.',
      category: 'CRYPTO',
      source: 'Crypto News',
      url: '#',
      timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['BTC/USD']
    },
    {
      id: '5',
      title: 'Rupee Strengthens Against Dollar on Strong FII Inflows',
      summary: 'Indian rupee gains as foreign institutional investors increase equity allocations to India.',
      category: 'FOREX',
      source: 'Livemint',
      url: '#',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['USD/INR']
    },
    {
      id: '6',
      title: 'NIFTY Hits Record High Amid Strong FII Inflows',
      summary: 'Benchmark indices rally as foreign investors pour capital into Indian equities.',
      category: 'MARKET',
      source: 'Moneycontrol',
      url: '#',
      timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['^NSEI', '^BSESN']
    },
    {
      id: '7',
      title: 'Reliance Industries Plans Major Green Energy Push',
      summary: 'India\'s largest conglomerate announces massive investment in renewable energy and hydrogen.',
      category: 'STOCKS',
      source: 'Business Standard',
      url: '#',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['RELIANCE.NS']
    },
    {
      id: '8',
      title: 'Gold Prices Retreat from Record Highs',
      summary: 'Precious metal sees profit-taking after reaching historic levels last week.',
      category: 'COMMODITIES',
      source: 'Metals Daily',
      url: '#',
      timestamp: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['GOLD']
    }
  ];
  
  // Filter news by category if provided
  let filteredNews;
  if (category === 'MARKET') {
    // For market category, return all news
    filteredNews = allNews;
  } else {
    // Filter by the requested category
    filteredNews = allNews.filter(news => news.category === category);
    
    // If no news for that category, return some market news
    if (filteredNews.length === 0) {
      filteredNews = allNews.filter(news => news.category === 'MARKET');
    }
  }
  
  // Sort by timestamp (newest first)
  filteredNews.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  return NextResponse.json(filteredNews);
} 