/**
 * UserPortfolio.js
 * Simple, user-driven portfolio model.
 * Stores each stock holding as { symbol, quantity, avgPrice }.
 * Starts empty on registration — no seeding, no defaults.
 */

import mongoose from 'mongoose';

const HoldingSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.000001, 'Quantity must be positive'],
    },
    avgPrice: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: false } // No sub-document _id needed
);

const UserPortfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One portfolio document per user
      index: true,
    },
    holdings: {
      type: [HoldingSchema],
      default: [], // Always starts empty
    },
    // User-defined strategy (one active at a time, or null)
    strategy: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('UserPortfolio', UserPortfolioSchema);
