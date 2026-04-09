import DemoAccount from '../models/DemoAccount.js';
import { getHistoricalData } from '../services/stockService.js';

// @desc    Get user's demo account data
// @route   GET /api/demo
// @access  Private
export const getDemoAccount = async (req, res) => {
  try {
    let account = await DemoAccount.findOne({ user: req.user._id });
    
    // Auto-create demo account if not exists
    if (!account) {
      account = await DemoAccount.create({
        user: req.user._id,
        balance: 100000,
        holdings: []
      });
    }
    
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Buy stock in demo account
// @route   POST /api/demo/buy
// @access  Private
export const buyDemoStock = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    
    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid symbol and quantity required' });
    }
    
    const formattedSymbol = symbol.trim().toUpperCase();
    
    // Get live price accurately
    let liveData;
    try {
      liveData = await getHistoricalData(formattedSymbol);
    } catch {
      return res.status(400).json({ message: 'Failed to retrieve live stock data' });
    }
    
    const currentPrice = liveData.currentPrice;
    if (!currentPrice || currentPrice <= 0) {
      return res.status(400).json({ message: 'Invalid current price from API' });
    }
    
    const totalCost = currentPrice * quantity;
    
    let account = await DemoAccount.findOne({ user: req.user._id });
    if (!account) {
      account = await DemoAccount.create({ user: req.user._id, balance: 100000, holdings: [] });
    }
    
    if (account.balance < totalCost) {
      return res.status(400).json({ message: 'Insufficient virtual balance' });
    }
    
    // Deduct balance
    account.balance -= totalCost;
    
    // Update or add holding
    const existingHoldingIndex = account.holdings.findIndex(h => h.symbol === formattedSymbol);
    if (existingHoldingIndex >= 0) {
      const holding = account.holdings[existingHoldingIndex];
      const newTotalValue = (holding.avgPrice * holding.quantity) + totalCost;
      const newQuantity = holding.quantity + quantity;
      
      account.holdings[existingHoldingIndex].avgPrice = newTotalValue / newQuantity;
      account.holdings[existingHoldingIndex].quantity = newQuantity;
    } else {
      account.holdings.push({
        symbol: formattedSymbol,
        quantity,
        avgPrice: currentPrice
      });
    }
    
    await account.save();
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: 'Server error processing demo buy' });
  }
};

// @desc    Sell stock in demo account
// @route   POST /api/demo/sell
// @access  Private
export const sellDemoStock = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    
    if (!symbol || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid symbol and quantity required' });
    }
    
    const formattedSymbol = symbol.trim().toUpperCase();
    
    let account = await DemoAccount.findOne({ user: req.user._id });
    if (!account) {
      return res.status(404).json({ message: 'Demo account not found' });
    }
    
    const holdingIndex = account.holdings.findIndex(h => h.symbol === formattedSymbol);
    if (holdingIndex === -1) {
      return res.status(400).json({ message: 'Stock not found in your portfolio' });
    }
    
    const holding = account.holdings[holdingIndex];
    if (holding.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient shares to sell' });
    }
    
    // Fetch real-time price
    let liveData;
    try {
      liveData = await getHistoricalData(formattedSymbol);
    } catch {
      return res.status(400).json({ message: 'Failed to retrieve live stock data' });
    }
    
    const currentPrice = liveData.currentPrice;
    if (!currentPrice || currentPrice <= 0) {
      return res.status(400).json({ message: 'Invalid current price from API' });
    }
    
    const totalRevenue = currentPrice * quantity;
    
    // Add to balance
    account.balance += totalRevenue;
    
    // Update holding
    account.holdings[holdingIndex].quantity -= quantity;
    if (account.holdings[holdingIndex].quantity === 0) {
      account.holdings.splice(holdingIndex, 1);
    }
    
    await account.save();
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: 'Server error processing demo sell' });
  }
};

// @desc    Reset demo account
// @route   POST /api/demo/reset
// @access  Private
export const resetDemoAccount = async (req, res) => {
  try {
    let account = await DemoAccount.findOne({ user: req.user._id });
    
    if (!account) {
      account = new DemoAccount({ user: req.user._id });
    }
    
    account.balance = 100000;
    account.holdings = [];
    
    await account.save();
    res.json(account);
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset demo account' });
  }
};
