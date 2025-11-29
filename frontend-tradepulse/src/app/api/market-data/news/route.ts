import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'MARKET';
  
  // Mock news data
  const allNews = [
    {
      id: '1',
      title: 'Federal Reserve Signals Potential Rate Cuts',
      summary: 'Fed officials indicate a shift in monetary policy as inflation shows signs of cooling.',
      category: 'ECONOMY',
      source: 'Financial Times',
      url: '#',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['US_INTEREST_RATE', 'SPX']
    },
    {
      id: '2',
      title: 'Apple Announces New Product Line',
      summary: 'Tech giant unveils next generation of devices at annual developer conference.',
      category: 'STOCKS',
      source: 'Tech Today',
      url: '#',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['AAPL']
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
      title: 'Euro Strengthens Against Dollar',
      summary: 'Common currency gains as ECB holds rates steady while Fed signals cuts.',
      category: 'FOREX',
      source: 'FX Daily',
      url: '#',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['EUR/USD']
    },
    {
      id: '6',
      title: 'Market Volatility Increases Amid Economic Uncertainty',
      summary: 'Major indices experience fluctuations as investors react to mixed economic signals.',
      category: 'MARKET',
      source: 'Market Watch',
      url: '#',
      timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['VIX', 'SPX']
    },
    {
      id: '7',
      title: 'Tesla Exceeds Delivery Expectations',
      summary: 'Electric vehicle manufacturer reports stronger than anticipated quarterly deliveries.',
      category: 'STOCKS',
      source: 'Auto News',
      url: '#',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      relatedSymbols: ['TSLA']
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