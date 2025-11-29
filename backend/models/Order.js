const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  orderType: {
    type: String,
    required: true,
    enum: ['market', 'limit', 'stop', 'stop_limit']
  },
  side: {
    type: String,
    required: true,
    enum: ['buy', 'sell']
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.0000001, 'Quantity must be greater than 0']
  },
  price: {
    type: Number,
    required: function() {
      return this.orderType === 'limit' || this.orderType === 'stop_limit';
    },
    min: [0, 'Price cannot be negative']
  },
  stopPrice: {
    type: Number,
    required: function() {
      return this.orderType === 'stop' || this.orderType === 'stop_limit';
    },
    min: [0, 'Stop price cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'filled', 'partially_filled', 'cancelled', 'expired', 'rejected'],
    default: 'pending'
  },
  filledQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Filled quantity cannot be negative']
  },
  averageFilledPrice: {
    type: Number,
    default: 0,
    min: [0, 'Average filled price cannot be negative']
  },
  timeInForce: {
    type: String,
    enum: ['GTC', 'IOC', 'FOK', 'DAY'],
    default: 'GTC' // Good Till Cancelled
  },
  expiresAt: {
    type: Date
  },
  fills: [{
    price: Number,
    quantity: Number,
    fee: Number,
    timestamp: {
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

// Create indexes for more efficient queries
OrderSchema.index({ user: 1, status: 1 });
OrderSchema.index({ product: 1, status: 1 });
OrderSchema.index({ status: 1, orderType: 1 });
OrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Order', OrderSchema); 