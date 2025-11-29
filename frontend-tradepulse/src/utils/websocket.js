'use client';

import { io } from 'socket.io-client';

/**
 * WebSocket client utility for real-time market data with change detection
 */
class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.subscribedSymbols = new Set();
    this.subscribedIndices = new Set();
    this.subscribedForex = new Set();
    this.subscribedCrypto = new Set();
    this.subscribedCommodities = new Set();
    this.subscribedEconomy = new Set();
    this.subscribedNewsCategories = new Set(['MARKET']); // Default news category
    this.subscribedTimeframes = new Set(['1d']); // Default timeframe
    this.lastReceivedData = new Map(); // Track last received data for each symbol/index
  }

  // Initialize WebSocket connection
  connect() {
    if (this.socket) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    this.socket = io(API_URL, {
      reconnectionDelayMax: 10000,
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      
      // Resubscribe to previously subscribed assets
      this.subscribedSymbols.forEach(symbol => {
        this.subscribeToSymbol(symbol);
      });
      
      this.subscribedIndices.forEach(index => {
        this.subscribeToIndex(index);
      });
      
      this.subscribedForex.forEach(pair => {
        this.subscribeToForex(pair);
      });
      
      this.subscribedCrypto.forEach(crypto => {
        this.subscribeToCrypto(crypto);
      });
      
      this.subscribedCommodities.forEach(commodity => {
        this.subscribeToCommodity(commodity);
      });
      
      this.subscribedEconomy.forEach(indicator => {
        this.subscribeToEconomy(indicator);
      });
      
      this.subscribedNewsCategories.forEach(category => {
        this.subscribeToNews(category);
      });
      
      this.subscribedTimeframes.forEach(timeframe => {
        this.subscribeToTimeframe(timeframe);
      });
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
    });

    // Set up listeners for different event types
    this.socket.on('symbol:update', (data) => {
      // Store last received data for this symbol
      if (data.symbol && data.data) {
        this.lastReceivedData.set(`symbol:${data.symbol}`, data.data);
      }
      this.notifyListeners('symbol', data);
    });

    this.socket.on('index:update', (data) => {
      // Store last received data for this index
      if (data.index && data.data) {
        this.lastReceivedData.set(`index:${data.index}`, data.data);
      }
      this.notifyListeners('index', data);
    });

    this.socket.on('forex:update', (data) => {
      // Store last received data for this forex pair
      if (data.pair && data.data) {
        this.lastReceivedData.set(`forex:${data.pair}`, data.data);
      }
      this.notifyListeners('forex', data);
    });

    this.socket.on('crypto:update', (data) => {
      // Store last received data for this crypto
      if (data.crypto && data.data) {
        this.lastReceivedData.set(`crypto:${data.crypto}`, data.data);
      }
      this.notifyListeners('crypto', data);
    });

    this.socket.on('commodity:update', (data) => {
      // Store last received data for this commodity
      if (data.commodity && data.data) {
        this.lastReceivedData.set(`commodity:${data.commodity}`, data.data);
      }
      this.notifyListeners('commodity', data);
    });

    this.socket.on('economy:update', (data) => {
      // Store last received data for this economic indicator
      if (data.indicator && data.data) {
        this.lastReceivedData.set(`economy:${data.indicator}`, data.data);
      }
      this.notifyListeners('economy', data);
    });

    this.socket.on('stock:update', (data) => {
      // Store last received data for this stock
      if (data.symbol && data.data) {
        this.lastReceivedData.set(`stock:${data.symbol}`, data.data);
      }
      this.notifyListeners('stock', data);
    });

    this.socket.on('news:update', (data) => {
      const key = data.category ? `news:${data.category}` : (data.symbol ? `news:${data.symbol}` : 'news:MARKET');
      this.notifyListeners('news', data);
    });
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Add event listener
  addListener(eventType, symbol, callback) {
    const key = `${eventType}:${symbol}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
    
    // Send initial data immediately if available (from cache)
    const cachedData = this.lastReceivedData.get(key);
    if (cachedData) {
      setTimeout(() => {
        callback({ 
          [eventType === 'index' ? 'index' : 
           eventType === 'forex' ? 'pair' :
           eventType === 'crypto' ? 'crypto' :
           eventType === 'commodity' ? 'commodity' :
           eventType === 'economy' ? 'indicator' :
           eventType === 'news' ? 'category' : 'symbol']: symbol, 
          data: cachedData,
          isInitial: true
        });
      }, 0);
    }
    
    return () => this.removeListener(eventType, symbol, callback);
  }

  // Remove event listener
  removeListener(eventType, symbol, callback) {
    const key = `${eventType}:${symbol}`;
    if (this.listeners.has(key)) {
      const callbacks = this.listeners.get(key);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Notify all registered listeners
  notifyListeners(eventType, data) {
    // Determine which key to use based on the event type and data
    let keys = [];
    
    if (data.symbol) {
      keys.push(`${eventType}:${data.symbol}`);
    }
    
    if (data.index) {
      keys.push(`${eventType}:${data.index}`);
    }
    
    if (data.pair) {
      keys.push(`${eventType}:${data.pair}`);
    }
    
    if (data.crypto) {
      keys.push(`${eventType}:${data.crypto}`);
    }
    
    if (data.commodity) {
      keys.push(`${eventType}:${data.commodity}`);
    }
    
    if (data.indicator) {
      keys.push(`${eventType}:${data.indicator}`);
    }
    
    if (data.category) {
      keys.push(`${eventType}:${data.category}`);
    }
    
    // For market-wide updates
    keys.push(`${eventType}:MARKET`);
    
    // Notify all relevant listeners
    keys.forEach(key => {
      if (this.listeners.has(key)) {
        this.listeners.get(key).forEach(callback => callback(data));
      }
    });
  }

  // Subscribe to a specific stock symbol
  subscribeToSymbol(symbol) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:symbol', symbol);
    }
    this.subscribedSymbols.add(symbol);
  }

  // Unsubscribe from a specific stock symbol
  unsubscribeFromSymbol(symbol) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe:symbol', symbol);
    }
    this.subscribedSymbols.delete(symbol);
  }

  // Subscribe to a market index
  subscribeToIndex(index) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:index', index);
    }
    this.subscribedIndices.add(index);
  }

  // Unsubscribe from a market index
  unsubscribeFromIndex(index) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe:index', index);
    }
    this.subscribedIndices.delete(index);
  }

  // Subscribe to a forex pair
  subscribeToForex(pair) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:forex', pair);
    }
    this.subscribedForex.add(pair);
  }

  // Unsubscribe from a forex pair
  unsubscribeFromForex(pair) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe:forex', pair);
    }
    this.subscribedForex.delete(pair);
  }

  // Subscribe to a cryptocurrency
  subscribeToCrypto(crypto) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:crypto', crypto);
    }
    this.subscribedCrypto.add(crypto);
  }

  // Unsubscribe from a cryptocurrency
  unsubscribeFromCrypto(crypto) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe:crypto', crypto);
    }
    this.subscribedCrypto.delete(crypto);
  }

  // Subscribe to a commodity
  subscribeToCommodity(commodity) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:commodity', commodity);
    }
    this.subscribedCommodities.add(commodity);
  }

  // Unsubscribe from a commodity
  unsubscribeFromCommodity(commodity) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe:commodity', commodity);
    }
    this.subscribedCommodities.delete(commodity);
  }

  // Subscribe to an economic indicator
  subscribeToEconomy(indicator) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:economy', indicator);
    }
    this.subscribedEconomy.add(indicator);
  }

  // Unsubscribe from an economic indicator
  unsubscribeFromEconomy(indicator) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe:economy', indicator);
    }
    this.subscribedEconomy.delete(indicator);
  }

  // Subscribe to a news category
  subscribeToNews(category) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:news', category);
    }
    this.subscribedNewsCategories.add(category);
  }

  // Unsubscribe from a news category
  unsubscribeFromNews(category) {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe:news', category);
    }
    this.subscribedNewsCategories.delete(category);
  }

  // Subscribe to a specific timeframe
  subscribeToTimeframe(timeframe) {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:timeframe', timeframe);
    }
    this.subscribedTimeframes.add(timeframe);
  }
  
  // Get last received data for a symbol/index
  getLastData(type, identifier) {
    return this.lastReceivedData.get(`${type}:${identifier}`);
  }
}

// Create singleton instance
const wsService = new WebSocketService();

// Export singleton instance
export default wsService; 