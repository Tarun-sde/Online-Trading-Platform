'use client';

import { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import wsService from '@/utils/websocket';

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  time?: string;
  datetime: Date;
  url: string;
  image?: string;
  categories?: string[];
  related?: string;
}

// Category colors for visual distinction
const categoryColors: Record<string, string> = {
  STOCKS: 'bg-blue-500',
  CRYPTO: 'bg-purple-500',
  FOREX: 'bg-green-500',
  COMMODITIES: 'bg-yellow-500',
  ECONOMY: 'bg-red-500',
  MARKET: 'bg-indigo-500',
  TECHNOLOGY: 'bg-cyan-500',
  ENERGY: 'bg-orange-500',
  AUTOMOTIVE: 'bg-pink-500',
};

const categoryNames: Record<string, string> = {
  STOCKS: 'Stocks',
  CRYPTO: 'Crypto',
  FOREX: 'Forex',
  COMMODITIES: 'Commodities',
  ECONOMY: 'Economy',
  MARKET: 'Markets',
  TECHNOLOGY: 'Technology',
  ENERGY: 'Energy',
  AUTOMOTIVE: 'Automotive',
};

interface NewsSectionProps {
  initialCategory?: string;
  maxItems?: number;
  showCategories?: boolean;
}

const NewsSection = ({ 
  initialCategory = 'MARKET', 
  maxItems = 4,
  showCategories = true
}: NewsSectionProps) => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [availableCategories, setAvailableCategories] = useState<string[]>([
    'MARKET', 'STOCKS', 'CRYPTO', 'FOREX', 'COMMODITIES', 'ECONOMY'
  ]);

  // Format relative time
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  // Connect to WebSocket for real-time news updates
  useEffect(() => {
    // Connect to WebSocket if not already connected
    if (!wsService.isConnected) {
      wsService.connect();
    }
    
    // Subscribe to news category
    wsService.socket?.emit('subscribe:news', selectedCategory);
    
    // Listen for news updates
    const handleNewsUpdate = (data: { category?: string, news: NewsItem[] }) => {
      // Format time for display
      const formattedNews = data.news.map(item => ({
        ...item,
        time: getRelativeTime(new Date(item.datetime))
      }));
      
      setNewsItems(prevNews => {
        // Combine with existing news, filter duplicates, and sort by datetime
        const combinedNews = [...formattedNews, ...prevNews];
        const uniqueNews = combinedNews.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );
        
        return uniqueNews
          .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
          .slice(0, maxItems * 2); // Keep a reasonable amount in memory
      });
      
      setLoading(false);
    };
    
    wsService.addListener('news', selectedCategory, handleNewsUpdate);
    
    // Also collect available categories from incoming news
    const categoryCollector = (data: { category?: string, news: NewsItem[] }) => {
      const newCategories = new Set<string>();
      
      data.news.forEach(item => {
        if (item.categories) {
          item.categories.forEach(cat => newCategories.add(cat));
        }
      });
      
      setAvailableCategories(prev => {
        const combined = new Set([...prev, ...newCategories]);
        return Array.from(combined);
      });
    };
    
    wsService.addListener('news', 'MARKET', categoryCollector);
    
    return () => {
      wsService.removeListener('news', selectedCategory, handleNewsUpdate);
      wsService.removeListener('news', 'MARKET', categoryCollector);
    };
  }, [selectedCategory, maxItems]);

  // Fallback to fetch news if WebSocket fails or for initial load
  useEffect(() => {
    // If still loading after 2 seconds, try to fetch from API
    const timeout = setTimeout(() => {
      if (loading && newsItems.length === 0) {
        fetchNewsFromAPI();
      }
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [loading, newsItems]);

  // Fetch news from API if WebSocket not working
  const fetchNewsFromAPI = async () => {
    try {
      const response = await fetch(`/api/market-data/news?category=${selectedCategory}`);
      if (response.ok) {
        const data = await response.json();
        
        // Format time for display
        const formattedNews = data.map((item: NewsItem) => ({
          ...item,
          time: getRelativeTime(new Date(item.datetime))
        }));
        
        setNewsItems(formattedNews);
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
      // Fall back to sample data if API fails
      setNewsItems([
        {
          id: '1',
          headline: 'Fed Signals Potential Rate Cuts as Inflation Cools Down',
          summary: 'Federal Reserve officials indicated they could begin cutting interest rates soon.',
          source: 'Financial Times',
          time: '2 hours ago',
          datetime: new Date(),
          url: '#',
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Financial+News',
          categories: ['MARKET', 'ECONOMY']
        },
        {
          id: '2',
          headline: 'Tech Stocks Rally Following Strong Earnings Reports',
          summary: 'Major technology companies posted better-than-expected quarterly results.',
          source: 'Wall Street Journal',
          time: '3 hours ago',
          datetime: new Date(),
          url: '#',
          image: 'https://placehold.co/400x300/111827/FFFFFF?text=Tech+News',
          categories: ['STOCKS', 'TECHNOLOGY']
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredNews = newsItems.filter(item => {
    if (selectedCategory === 'MARKET') return true;
    return item.categories?.includes(selectedCategory);
  }).slice(0, maxItems);

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Latest Market News</h2>
        
        {showCategories && (
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? `${categoryColors[category] || 'bg-gray-600'} text-white`
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {categoryNames[category] || category}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(maxItems)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex space-x-4">
                <div className="flex-shrink-0 h-24 w-24 bg-gray-800 rounded-md"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-800 rounded w-1/2"></div>
                  <div className="mt-2 h-3 bg-gray-800 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNews.length > 0 ? (
            filteredNews.map((item) => (
              <a 
                key={item.id}
                href={item.url}
                className="block group hover:bg-gray-800 p-3 rounded-lg transition-colors"
              >
                <div className="flex space-x-4">
                  <div className="flex-shrink-0 relative w-24 h-24">
                    <Image
                      src={item.image || 'https://placehold.co/400x300/111827/FFFFFF?text=News'}
                      alt={item.headline || "Market news image"}
                      fill
                      className="object-cover rounded-md"
                    />
                    {item.categories && item.categories[0] && (
                      <div className={`absolute top-0 right-0 ${categoryColors[item.categories[0]] || 'bg-gray-700'} text-white text-xs px-1 rounded-bl rounded-tr`}>
                        {categoryNames[item.categories[0]] || item.categories[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors line-clamp-2">
                      {item.headline}
                    </h3>
                    <div className="flex items-center mt-2 text-sm text-gray-400">
                      <span>{item.source}</span>
                      <span className="mx-1">•</span>
                      <div className="flex items-center">
                        <ClockIcon className="h-3.5 w-3.5 mr-1" />
                        <span>{item.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-gray-500">
              No news articles found for this category.
            </div>
          )}
        </div>
      )}
      
      {filteredNews.length > 0 && (
        <div className="mt-4 text-center">
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium hover:underline transition-colors">
            Show More News
          </button>
        </div>
      )}
    </div>
  );
};

export default NewsSection; 