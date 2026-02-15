import mongoose from 'mongoose';

const PriceAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  alertType: {
    type: String,
    enum: ['price_above', 'price_below', 'percent_change', 'price_change'],
    required: true
  },
  targetPrice: {
    type: Number,
    required: function() {
      return this.alertType === 'price_above' || this.alertType === 'price_below';
    },
    min: [0, 'Target price cannot be negative']
  },
  percentChange: {
    type: Number,
    required: function() {
      return this.alertType === 'percent_change';
    }
  },
  priceChange: {
    type: Number,
    required: function() {
      return this.alertType === 'price_change';
    }
  },
  triggerOnce: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isTriggered: {
    type: Boolean,
    default: false
  },
  lastTriggeredAt: {
    type: Date
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
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

// Create compound index for more efficient queries
PriceAlertSchema.index({ user: 1, product: 1, isActive: 1 });
PriceAlertSchema.index({ product: 1, alertType: 1, isActive: 1 });

export default mongoose.model('PriceAlert', PriceAlertSchema); 