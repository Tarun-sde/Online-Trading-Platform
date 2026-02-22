import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';

/**
 * @desc    Get all products with filtering, sorting and pagination
 * @route   GET /api/products
 * @access  Public
 */
const getAllProducts = asyncHandler(async (req, res) => {
  // Setup query parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Build query
  let query = {};
  
  // Apply filters if provided
  if (req.query.productType) {
    query.productType = req.query.productType;
  }
  
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { symbol: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  if (req.query.minPrice) {
    query.currentPrice = { $gte: parseFloat(req.query.minPrice) };
  }
  
  if (req.query.maxPrice) {
    query.currentPrice = { ...query.currentPrice, $lte: parseFloat(req.query.maxPrice) };
  }
  
  // Build sort options
  let sort = {};
  if (req.query.sortBy) {
    const sortField = req.query.sortBy;
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    sort[sortField] = sortOrder;
  } else {
    // Default sort by name ascending
    sort = { name: 1 };
  }
  
  // Count total documents for pagination
  const total = await Product.countDocuments(query);
  
  // Execute query
  const products = await Product.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);
  
  // Return products with pagination info
  res.json({
    products,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

/**
 * @desc    Create a product
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    symbol,
    description,
    productType,
    currentPrice,
    openPrice,
    highPrice,
    lowPrice,
    closePrice,
    volume,
    marketCap,
    availableSupply,
    totalSupply,
    exchange,
    imageUrl,
    tradingHours
  } = req.body;
  
  // Check if product with same symbol already exists
  const productExists = await Product.findOne({ symbol });
  if (productExists) {
    res.status(400);
    throw new Error('Product with this symbol already exists');
  }
  
  // Create new product
  const product = await Product.create({
    name,
    symbol,
    description,
    productType,
    currentPrice,
    openPrice: openPrice || currentPrice,
    highPrice: highPrice || currentPrice,
    lowPrice: lowPrice || currentPrice,
    closePrice: closePrice || currentPrice,
    volume: volume || 0,
    marketCap: marketCap || 0,
    availableSupply: availableSupply || 0,
    totalSupply: totalSupply || 0,
    exchange,
    imageUrl,
    tradingHours,
    priceHistory: [{ price: currentPrice, date: Date.now() }]
  });
  
  if (product) {
    res.status(201).json(product);
  } else {
    res.status(400);
    throw new Error('Invalid product data');
  }
});

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (product) {
    // Basic information
    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.exchange = req.body.exchange || product.exchange;
    product.imageUrl = req.body.imageUrl || product.imageUrl;
    product.isActive = req.body.isActive !== undefined ? req.body.isActive : product.isActive;
    
    // Price and trading info
    if (req.body.currentPrice) {
      // If price is being updated, add to price history
      product.currentPrice = req.body.currentPrice;
      product.priceHistory.push({
        price: req.body.currentPrice,
        date: Date.now()
      });
    }
    
    product.openPrice = req.body.openPrice || product.openPrice;
    product.highPrice = req.body.highPrice || product.highPrice;
    product.lowPrice = req.body.lowPrice || product.lowPrice;
    product.closePrice = req.body.closePrice || product.closePrice;
    product.volume = req.body.volume || product.volume;
    product.marketCap = req.body.marketCap || product.marketCap;
    product.availableSupply = req.body.availableSupply || product.availableSupply;
    product.totalSupply = req.body.totalSupply || product.totalSupply;
    product.change24h = req.body.change24h || product.change24h;
    product.changePercent24h = req.body.changePercent24h || product.changePercent24h;
    
    // Trading hours
    if (req.body.tradingHours) {
      product.tradingHours.open = req.body.tradingHours.open || product.tradingHours.open;
      product.tradingHours.close = req.body.tradingHours.close || product.tradingHours.close;
      product.tradingHours.timezone = req.body.tradingHours.timezone || product.tradingHours.timezone;
    }
    
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (product) {
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

/**
 * @desc    Get products by type
 * @route   GET /api/products/type/:type
 * @access  Public
 */
const getProductsByType = asyncHandler(async (req, res) => {
  const productType = req.params.type;
  
  // Validate product type
  const validTypes = ['stock', 'cryptocurrency', 'forex', 'commodity', 'bond', 'etf', 'future', 'option'];
  if (!validTypes.includes(productType)) {
    res.status(400);
    throw new Error('Invalid product type');
  }
  
  const products = await Product.find({ productType });
  res.json(products);
});

/**
 * @desc    Get product price history
 * @route   GET /api/products/:id/price-history
 * @access  Public
 */
const getProductPriceHistory = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (product) {
    // Get time range from query params
    const range = req.query.range || 'all'; // day, week, month, year, all
    let startDate;
    
    const now = new Date();
    
    switch (range) {
      case 'day':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(0); // from beginning
    }
    
    const filteredHistory = product.priceHistory.filter(
      item => new Date(item.date) >= startDate
    );
    
    res.json(filteredHistory);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

export {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByType,
  getProductPriceHistory
}; 