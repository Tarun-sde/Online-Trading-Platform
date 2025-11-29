/**
 * WebSocket server configuration for real-time market data with change detection
 */

const setupWebSocketServer = (io) => {
  // Track connected clients and their subscriptions
  const clients = new Map();
  
  // Track last sent data to detect changes
  const lastSentData = {
    symbols: new Map(),      // Stocks
    indices: new Map(),      // Market indices
    forex: new Map(),        // Forex pairs
    crypto: new Map(),       // Cryptocurrencies
    commodities: new Map(),  // Commodities
    economy: new Map()       // Economic indicators
  };

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    
    // Initialize client data
    clients.set(socket.id, {
      subscribedSymbols: new Set(),
      subscribedIndices: new Set(),
      subscribedForex: new Set(),
      subscribedCrypto: new Set(),
      subscribedCommodities: new Set(),
      subscribedEconomy: new Set(),
      subscribedTimeframes: new Set(['1d']), // Default timeframe
      subscribedNewsCategories: new Set(['MARKET']), // Default news category
    });

    // Handle subscriptions to stock symbols
    socket.on('subscribe:symbol', (symbol) => {
      console.log(`Client ${socket.id} subscribed to symbol: ${symbol}`);
      const clientData = clients.get(socket.id);
      clientData.subscribedSymbols.add(symbol);
      
      // Send initial data immediately if available
      const cachedData = lastSentData.symbols.get(symbol);
      if (cachedData) {
        socket.emit('symbol:update', { symbol, data: cachedData, isInitial: true });
      }
    });

    // Handle unsubscribing from stock symbols
    socket.on('unsubscribe:symbol', (symbol) => {
      console.log(`Client ${socket.id} unsubscribed from symbol: ${symbol}`);
      const clientData = clients.get(socket.id);
      clientData.subscribedSymbols.delete(symbol);
    });

    // Handle subscriptions to market indices
    socket.on('subscribe:index', (index) => {
      console.log(`Client ${socket.id} subscribed to index: ${index}`);
      const clientData = clients.get(socket.id);
      clientData.subscribedIndices.add(index);
      
      // Send initial data immediately if available
      const cachedData = lastSentData.indices.get(index);
      if (cachedData) {
        socket.emit('index:update', { index, data: cachedData, isInitial: true });
      }
    });

    // Handle subscriptions to forex pairs
    socket.on('subscribe:forex', (pair) => {
      console.log(`Client ${socket.id} subscribed to forex pair: ${pair}`);
      const clientData = clients.get(socket.id);
      clientData.subscribedForex.add(pair);
      
      // Send initial data immediately if available
      const cachedData = lastSentData.forex.get(pair);
      if (cachedData) {
        socket.emit('forex:update', { pair, data: cachedData, isInitial: true });
      }
    });

    // Handle subscriptions to cryptocurrencies
    socket.on('subscribe:crypto', (crypto) => {
      console.log(`Client ${socket.id} subscribed to crypto: ${crypto}`);
      const clientData = clients.get(socket.id);
      clientData.subscribedCrypto.add(crypto);
      
      // Send initial data immediately if available
      const cachedData = lastSentData.crypto.get(crypto);
      if (cachedData) {
        socket.emit('crypto:update', { crypto, data: cachedData, isInitial: true });
      }
    });

    // Handle subscriptions to commodities
    socket.on('subscribe:commodity', (commodity) => {
      console.log(`Client ${socket.id} subscribed to commodity: ${commodity}`);
      const clientData = clients.get(socket.id);
      clientData.subscribedCommodities.add(commodity);
      
      // Send initial data immediately if available
      const cachedData = lastSentData.commodities.get(commodity);
      if (cachedData) {
        socket.emit('commodity:update', { commodity, data: cachedData, isInitial: true });
      }
    });

    // Handle subscriptions to economic indicators
    socket.on('subscribe:economy', (indicator) => {
      console.log(`Client ${socket.id} subscribed to economic indicator: ${indicator}`);
      const clientData = clients.get(socket.id);
      clientData.subscribedEconomy.add(indicator);
      
      // Send initial data immediately if available
      const cachedData = lastSentData.economy.get(indicator);
      if (cachedData) {
        socket.emit('economy:update', { indicator, data: cachedData, isInitial: true });
      }
    });

    // Handle subscriptions to news categories
    socket.on('subscribe:news', (category) => {
      console.log(`Client ${socket.id} subscribed to news category: ${category}`);
      const clientData = clients.get(socket.id);
      clientData.subscribedNewsCategories.add(category);
    });

    // Handle timeframe changes
    socket.on('subscribe:timeframe', (timeframe) => {
      console.log(`Client ${socket.id} subscribed to timeframe: ${timeframe}`);
      const clientData = clients.get(socket.id);
      clientData.subscribedTimeframes.add(timeframe);
    });

    // Handle client disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      clients.delete(socket.id);
    });
  });

  // Function to detect changes and broadcast symbol updates
  const broadcastSymbolUpdate = (symbol, newData) => {
    // Get previous data if exists
    const previousData = lastSentData.symbols.get(symbol);
    
    // Detect if there's a meaningful change (price, volume change)
    const hasChanged = !previousData || 
      previousData.currentPrice !== newData.currentPrice ||
      previousData.volume !== newData.volume;
    
    if (hasChanged) {
      // Calculate what changed
      let changes = null;
      if (previousData) {
        changes = {
          priceChange: newData.currentPrice - previousData.currentPrice,
          pricePercentChange: ((newData.currentPrice - previousData.currentPrice) / previousData.currentPrice) * 100,
          volumeChange: newData.volume - previousData.volume,
          timestamp: new Date()
        };
      }
      
      // Save new data for future change detection
      lastSentData.symbols.set(symbol, { ...newData });
      
      // Broadcast to subscribed clients
      for (const [socketId, clientData] of clients.entries()) {
        if (clientData.subscribedSymbols.has(symbol)) {
          io.to(socketId).emit('symbol:update', { 
            symbol, 
            data: newData,
            changes, // Include changes if available
            isUpdate: true 
          });
        }
      }
      
      return true; // Data was broadcast
    }
    
    return false; // No change detected, no broadcast
  };

  // Function to broadcast market index updates with change detection
  const broadcastIndexUpdate = (index, newData) => {
    // Get previous data if exists
    const previousData = lastSentData.indices.get(index);
    
    // Detect if there's a meaningful change
    const hasChanged = !previousData || 
      previousData.currentValue !== newData.currentValue;
    
    if (hasChanged) {
      // Calculate what changed
      let changes = null;
      if (previousData) {
        changes = {
          valueChange: newData.currentValue - previousData.currentValue,
          percentChange: ((newData.currentValue - previousData.currentValue) / previousData.currentValue) * 100,
          timestamp: new Date()
        };
      }
      
      // Save new data for future change detection
      lastSentData.indices.set(index, { ...newData });
      
      // Broadcast to subscribed clients
      for (const [socketId, clientData] of clients.entries()) {
        if (clientData.subscribedIndices.has(index)) {
          io.to(socketId).emit('index:update', {
            index,
            data: newData,
            changes, // Include changes if available
            isUpdate: true
          });
        }
      }
      
      return true; // Data was broadcast
    }
    
    return false; // No change detected, no broadcast
  };

  // Function to broadcast forex updates with change detection
  const broadcastForexUpdate = (pair, newData) => {
    // Get previous data if exists
    const previousData = lastSentData.forex.get(pair);
    
    // Detect if there's a meaningful change
    const hasChanged = !previousData || previousData.rate !== newData.rate;
    
    if (hasChanged) {
      // Calculate what changed
      let changes = null;
      if (previousData) {
        changes = {
          rateChange: newData.rate - previousData.rate,
          percentChange: ((newData.rate - previousData.rate) / previousData.rate) * 100,
          timestamp: new Date()
        };
      }
      
      // Save new data for future change detection
      lastSentData.forex.set(pair, { ...newData });
      
      // Broadcast to subscribed clients
      for (const [socketId, clientData] of clients.entries()) {
        if (clientData.subscribedForex.has(pair)) {
          io.to(socketId).emit('forex:update', {
            pair,
            data: newData,
            changes,
            isUpdate: true
          });
        }
      }
      
      return true; // Data was broadcast
    }
    
    return false; // No change detected, no broadcast
  };

  // Function to broadcast crypto updates with change detection
  const broadcastCryptoUpdate = (crypto, newData) => {
    // Get previous data if exists
    const previousData = lastSentData.crypto.get(crypto);
    
    // Detect if there's a meaningful change
    const hasChanged = !previousData || 
      previousData.price !== newData.price ||
      previousData.volume24h !== newData.volume24h;
    
    if (hasChanged) {
      // Calculate what changed
      let changes = null;
      if (previousData) {
        changes = {
          priceChange: newData.price - previousData.price,
          percentChange: ((newData.price - previousData.price) / previousData.price) * 100,
          volumeChange: newData.volume24h - previousData.volume24h,
          timestamp: new Date()
        };
      }
      
      // Save new data for future change detection
      lastSentData.crypto.set(crypto, { ...newData });
      
      // Broadcast to subscribed clients
      for (const [socketId, clientData] of clients.entries()) {
        if (clientData.subscribedCrypto.has(crypto)) {
          io.to(socketId).emit('crypto:update', {
            crypto,
            data: newData,
            changes,
            isUpdate: true
          });
        }
      }
      
      return true; // Data was broadcast
    }
    
    return false; // No change detected, no broadcast
  };

  // Function to broadcast commodity updates with change detection
  const broadcastCommodityUpdate = (commodity, newData) => {
    // Get previous data if exists
    const previousData = lastSentData.commodities.get(commodity);
    
    // Detect if there's a meaningful change
    const hasChanged = !previousData || previousData.price !== newData.price;
    
    if (hasChanged) {
      // Calculate what changed
      let changes = null;
      if (previousData) {
        changes = {
          priceChange: newData.price - previousData.price,
          percentChange: ((newData.price - previousData.price) / previousData.price) * 100,
          timestamp: new Date()
        };
      }
      
      // Save new data for future change detection
      lastSentData.commodities.set(commodity, { ...newData });
      
      // Broadcast to subscribed clients
      for (const [socketId, clientData] of clients.entries()) {
        if (clientData.subscribedCommodities.has(commodity)) {
          io.to(socketId).emit('commodity:update', {
            commodity,
            data: newData,
            changes,
            isUpdate: true
          });
        }
      }
      
      return true; // Data was broadcast
    }
    
    return false; // No change detected, no broadcast
  };

  // Function to broadcast economy updates
  const broadcastEconomyUpdate = (indicator, newData) => {
    // Get previous data if exists
    const previousData = lastSentData.economy.get(indicator);
    
    // Detect if there's a meaningful change
    const hasChanged = !previousData || previousData.value !== newData.value;
    
    if (hasChanged) {
      // Calculate what changed
      let changes = null;
      if (previousData) {
        changes = {
          valueChange: newData.value - previousData.value,
          percentChange: previousData.value !== 0 ? ((newData.value - previousData.value) / previousData.value) * 100 : 0,
          timestamp: new Date()
        };
      }
      
      // Save new data for future change detection
      lastSentData.economy.set(indicator, { ...newData });
      
      // Broadcast to subscribed clients
      for (const [socketId, clientData] of clients.entries()) {
        if (clientData.subscribedEconomy.has(indicator)) {
          io.to(socketId).emit('economy:update', {
            indicator,
            data: newData,
            changes,
            isUpdate: true
          });
        }
      }
      
      return true; // Data was broadcast
    }
    
    return false; // No change detected, no broadcast
  };

  // Function to broadcast news updates by category
  const broadcastNewsUpdate = (news) => {
    // Group news by category
    const newsCategories = {};
    
    // Categorize news (may belong to multiple categories)
    news.forEach(item => {
      const categories = item.categories || ['MARKET']; // Default to MARKET if no categories
      
      categories.forEach(category => {
        if (!newsCategories[category]) {
          newsCategories[category] = [];
        }
        newsCategories[category].push(item);
      });
      
      // Also add to symbol-specific news if related to a symbol
      if (item.related && item.related !== 'MARKET') {
        if (!newsCategories[item.related]) {
          newsCategories[item.related] = [];
        }
        newsCategories[item.related].push(item);
      }
    });
    
    // Broadcast to clients based on their subscriptions
    for (const [socketId, clientData] of clients.entries()) {
      // For each category the client is subscribed to
      clientData.subscribedNewsCategories.forEach(category => {
        if (newsCategories[category]) {
          io.to(socketId).emit('news:update', { 
            category, 
            news: newsCategories[category],
            timestamp: new Date() 
          });
        }
      });
      
      // Also send symbol-specific news
      clientData.subscribedSymbols.forEach(symbol => {
        if (newsCategories[symbol]) {
          io.to(socketId).emit('news:update', { 
            symbol, 
            news: newsCategories[symbol],
            timestamp: new Date() 
          });
        }
      });
    }
  };

  // Return functions that other modules can use to broadcast data
  return {
    broadcastSymbolUpdate,
    broadcastIndexUpdate,
    broadcastForexUpdate,
    broadcastCryptoUpdate,
    broadcastCommodityUpdate,
    broadcastEconomyUpdate,
    broadcastNewsUpdate,
    getClients: () => clients
  };
};

module.exports = {
  setupWebSocketServer
}; 