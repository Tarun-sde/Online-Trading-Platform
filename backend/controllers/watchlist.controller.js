const asyncHandler = require('express-async-handler');
const Watchlist = require('../models/Watchlist');
const Product = require('../models/Product');

/**
 * @desc    Create a new watchlist
 * @route   POST /api/watchlist
 * @access  Private
 */
const createWatchlist = asyncHandler(async (req, res) => {
  const { name, description, products } = req.body;
  
  if (!name) {
    res.status(400);
    throw new Error('Watchlist name is required');
  }
  
  // Create watchlist
  const watchlist = await Watchlist.create({
    user: req.user._id,
    name,
    description,
    products: products || [],
    isDefault: false
  });
  
  if (watchlist) {
    res.status(201).json(watchlist);
  } else {
    res.status(400);
    throw new Error('Invalid watchlist data');
  }
});

/**
 * @desc    Get user's watchlists
 * @route   GET /api/watchlist
 * @access  Private
 */
const getUserWatchlists = asyncHandler(async (req, res) => {
  const watchlists = await Watchlist.find({ user: req.user._id })
    .populate('products', 'name symbol currentPrice');
  
  res.json(watchlists);
});

/**
 * @desc    Get watchlist by ID
 * @route   GET /api/watchlist/:id
 * @access  Private
 */
const getWatchlistById = asyncHandler(async (req, res) => {
  const watchlist = await Watchlist.findById(req.params.id)
    .populate('products', 'name symbol currentPrice productType imageUrl change24h changePercent24h');
  
  if (watchlist) {
    // Check if the user is the owner
    if (watchlist.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this watchlist');
    }
    
    res.json(watchlist);
  } else {
    res.status(404);
    throw new Error('Watchlist not found');
  }
});

/**
 * @desc    Update watchlist
 * @route   PUT /api/watchlist/:id
 * @access  Private
 */
const updateWatchlist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  
  const watchlist = await Watchlist.findById(req.params.id);
  
  if (watchlist) {
    // Check if the user is the owner
    if (watchlist.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this watchlist');
    }
    
    watchlist.name = name || watchlist.name;
    watchlist.description = description !== undefined ? description : watchlist.description;
    
    const updatedWatchlist = await watchlist.save();
    res.json(updatedWatchlist);
  } else {
    res.status(404);
    throw new Error('Watchlist not found');
  }
});

/**
 * @desc    Delete watchlist
 * @route   DELETE /api/watchlist/:id
 * @access  Private
 */
const deleteWatchlist = asyncHandler(async (req, res) => {
  const watchlist = await Watchlist.findById(req.params.id);
  
  if (watchlist) {
    // Check if the user is the owner
    if (watchlist.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this watchlist');
    }
    
    // Don't allow deletion of default watchlist
    if (watchlist.isDefault) {
      res.status(400);
      throw new Error('Cannot delete default watchlist');
    }
    
    await watchlist.deleteOne();
    res.json({ message: 'Watchlist removed' });
  } else {
    res.status(404);
    throw new Error('Watchlist not found');
  }
});

/**
 * @desc    Add product to watchlist
 * @route   POST /api/watchlist/:id/products/:productId
 * @access  Private
 */
const addProductToWatchlist = asyncHandler(async (req, res) => {
  const watchlist = await Watchlist.findById(req.params.id);
  const productId = req.params.productId;
  
  if (!watchlist) {
    res.status(404);
    throw new Error('Watchlist not found');
  }
  
  // Check if the user is the owner
  if (watchlist.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this watchlist');
  }
  
  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  
  // Check if product is already in watchlist
  if (watchlist.products.includes(productId)) {
    res.status(400);
    throw new Error('Product already in watchlist');
  }
  
  // Add product to watchlist
  watchlist.products.push(productId);
  await watchlist.save();
  
  // Return updated watchlist with populated products
  const updatedWatchlist = await Watchlist.findById(req.params.id)
    .populate('products', 'name symbol currentPrice productType');
  
  res.json(updatedWatchlist);
});

/**
 * @desc    Remove product from watchlist
 * @route   DELETE /api/watchlist/:id/products/:productId
 * @access  Private
 */
const removeProductFromWatchlist = asyncHandler(async (req, res) => {
  const watchlist = await Watchlist.findById(req.params.id);
  const productId = req.params.productId;
  
  if (!watchlist) {
    res.status(404);
    throw new Error('Watchlist not found');
  }
  
  // Check if the user is the owner
  if (watchlist.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this watchlist');
  }
  
  // Remove product from watchlist
  watchlist.products = watchlist.products.filter(
    (product) => product.toString() !== productId
  );
  
  await watchlist.save();
  
  // Return updated watchlist with populated products
  const updatedWatchlist = await Watchlist.findById(req.params.id)
    .populate('products', 'name symbol currentPrice productType');
  
  res.json(updatedWatchlist);
});

module.exports = {
  createWatchlist,
  getUserWatchlists,
  getWatchlistById,
  updateWatchlist,
  deleteWatchlist,
  addProductToWatchlist,
  removeProductFromWatchlist
}; 