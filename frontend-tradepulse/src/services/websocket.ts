import socketIOClient from 'socket.io-client';

type Callback = (data: any) => void;

/**
 * WebSocket Service using Singleton pattern
 * Provides a central place to manage WebSocket connections
 */
class WebSocketService {
  private socket: any = null;
  private isConnected: boolean = false;
  private listeners: Map<string, Callback[]> = new Map();
  private subscribedSymbols: Set<string> = new Set();
  private subscribedIndices: Set<string> = new Set();
  private subscribedTimeframes: Set<string> = new Set(['1d']); // Default timeframe
  
  /**
   * Initialize WebSocket connection
   */
  connect(): void {
    if (this.socket) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    // Use a simple connection with no special options
    this.socket = socketIOClient(API_URL);

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      
      // Resubscribe to previously subscribed symbols and indices
      this.subscribedSymbols.forEach(symbol => {
        this.subscribeToSymbol(symbol);
      });
      
      this.subscribedIndices.forEach(index => {
        this.subscribeToIndex(index);
      });
      
      this.subscribedTimeframes.forEach(timeframe => {
        this.subscribeToTimeframe(timeframe);
      });
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.isConnected = false;
    });
    
    // Setup default event listeners
    this.setupDefaultEventListeners();
  }
  
  /**
   * Set up default event listeners for common events
   */
  private setupDefaultEventListeners(): void {
    if (!this.socket) return;
    
    // Market data updates
    this.socket.on('market-data', (data: any) => {
      this.notifyChannelListeners('market-updates', { type: 'market-data', stocks: data });
    });
    
    // Market indices updates
    this.socket.on('indices-update', (data: any) => {
      this.notifyChannelListeners('market-updates', { type: 'indices-update', indices: data });
    });
    
    // Symbol updates
    this.socket.on('symbol:update', (data: any) => {
      if (data.symbol) {
        this.notifySymbolListeners('stock', data.symbol, data);
      }
    });
    
    // Index updates
    this.socket.on('index:update', (data: any) => {
      if (data.index) {
        this.notifySymbolListeners('index', data.index, data);
      }
    });
    
    // News updates
    this.socket.on('news:update', (data: any) => {
      if (data.symbol) {
        this.notifySymbolListeners('news', data.symbol, data);
      }
    });
  }
  
  /**
   * Add event listener
   * @param eventType - Event type (stock, index, news)
   * @param symbol - Symbol or index name
   * @param callback - Callback to execute when event is received
   */
  addListener(eventType: string, symbol: string, callback: Callback): () => void {
    const key = `${eventType}:${symbol}`;
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    this.listeners.get(key)?.push(callback);
    
    return () => this.removeListener(eventType, symbol, callback);
  }
  
  /**
   * Remove event listener
   * @param eventType - Event type
   * @param symbol - Symbol or index name
   * @param callback - Callback to remove
   */
  removeListener(eventType: string, symbol: string, callback: Callback): void {
    const key = `${eventType}:${symbol}`;
    if (this.listeners.has(key)) {
      const callbacks = this.listeners.get(key) || [];
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  /**
   * Subscribe to a specific stock symbol
   * @param symbol - Stock symbol
   */
  subscribeToSymbol(symbol: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:symbol', symbol);
    }
    this.subscribedSymbols.add(symbol);
  }
  
  /**
   * Unsubscribe from a specific stock symbol
   * @param symbol - Stock symbol
   */
  unsubscribeFromSymbol(symbol: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('unsubscribe:symbol', symbol);
    }
    this.subscribedSymbols.delete(symbol);
  }
  
  /**
   * Subscribe to a market index
   * @param index - Index name
   */
  subscribeToIndex(index: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:index', index);
    }
    this.subscribedIndices.add(index);
  }
  
  /**
   * Subscribe to a specific timeframe
   * @param timeframe - Timeframe (1d, 1w, 1m, etc.)
   */
  subscribeToTimeframe(timeframe: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe:timeframe', timeframe);
    }
    this.subscribedTimeframes.add(timeframe);
  }
  
  /**
   * Subscribe to a channel/event
   * @param channel - Channel/event name
   * @param callback - Callback to execute when event is received
   */
  subscribe(channel: string, callback: Callback): void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    
    this.listeners.get(channel)?.push(callback);
  }
  
  /**
   * Unsubscribe from a channel/event
   * @param channel - Channel/event name
   * @param callback - Callback to remove (if not provided, removes all callbacks)
   */
  unsubscribe(channel: string, callback?: Callback): void {
    if (!this.listeners.has(channel)) return;
    
    if (callback) {
      // Remove specific callback
      const callbacks = this.listeners.get(channel) || [];
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    } else {
      // Remove all callbacks for this channel
      this.listeners.delete(channel);
    }
  }
  
  /**
   * Notify all registered listeners for a channel
   * @param channel - Channel name
   * @param data - Data to send to callbacks
   */
  private notifyChannelListeners(channel: string, data: any): void {
    if (this.listeners.has(channel)) {
      const callbacks = this.listeners.get(channel) || [];
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket listener callback:', error);
        }
      });
    }
  }
  
  /**
   * Notify all registered listeners for a symbol
   * @param eventType - Event type 
   * @param symbol - Symbol name
   * @param data - Data to send to callbacks
   */
  private notifySymbolListeners(eventType: string, symbol: string, data: any): void {
    const key = `${eventType}:${symbol}`;
    
    if (this.listeners.has(key)) {
      const callbacks = this.listeners.get(key) || [];
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket listener callback:', error);
        }
      });
    }
  }
  
  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
  
  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
  
  /**
   * Emit an event to the server
   * @param event - Event name
   * @param data - Data to send
   */
  emit(event: string, data: any): void {
    if (!this.socket || !this.isConnected) {
      console.warn('Cannot emit event: WebSocket not connected');
      return;
    }
    
    this.socket.emit(event, data);
  }
}

// Create singleton instance
export const wsService = new WebSocketService(); 