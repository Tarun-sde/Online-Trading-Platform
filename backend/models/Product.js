import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  symbol: {
    type: String,
    required: [true, 'Product symbol is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required']
  },
  productType: {
    type: String,
    required: [true, 'Product type is required'],
    enum: ['stock', 'cryptocurrency', 'forex', 'commodity', 'bond', 'etf', 'future', 'option'],
    index: true
  },
  currentPrice: {
    type: Number,
    required: [true, 'Current price is required'],
    min: [0, 'Price cannot be negative']
  },
  openPrice: {
    type: Number,
    default: 0
  },
  highPrice: {
    type: Number,
    default: 0
  },
  lowPrice: {
    type: Number,
    default: 0
  },
  closePrice: {
    type: Number,
    default: 0
  },
  volume: {
    type: Number,
    default: 0
  },
  marketCap: {
    type: Number,
    default: 0
  },
  availableSupply: {
    type: Number,
    default: 0
  },
  totalSupply: {
    type: Number,
    default: 0
  },
  change24h: {
    type: Number,
    default: 0
  },
  changePercent24h: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tradingHours: {
    open: String,
    close: String,
    timezone: String
  },
  exchange: {
    type: String,
    required: [true, 'Exchange information is required']
  },
  imageUrl: {
    type: String
  },
  priceHistory: [{
    price: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a compound index for efficient querying
ProductSchema.index({ productType: 1, symbol: 1 });

export default mongoose.model('Product', ProductSchema); 