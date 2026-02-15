import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  transactionType: {
    type: String,
    required: true,
    enum: ['buy', 'sell', 'deposit', 'withdrawal', 'fee', 'dividend', 'interest', 'transfer', 'refund', 'adjustment'],
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  fee: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String
  },
  metadata: {
    type: Map,
    of: String
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'credit_card', 'debit_card', 'paypal', 'crypto', 'internal_transfer', 'other'],
    default: 'internal_transfer'
  },
  reference: {
    type: String
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

// Create indexes for more efficient queries
TransactionSchema.index({ user: 1, transactionType: 1 });
TransactionSchema.index({ user: 1, product: 1 });
TransactionSchema.index({ createdAt: 1 });
TransactionSchema.index({ status: 1 });

export default mongoose.model('Transaction', TransactionSchema); 