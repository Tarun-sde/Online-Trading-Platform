/**
 * UserStrategy.js — updated
 * Stores both system (default) strategies and user-created strategies.
 *
 * System strategies: user = null, isDefault = true
 * User strategies:   user = ObjectId, isDefault = false
 */

import mongoose from 'mongoose';

const UserStrategySchema = new mongoose.Schema(
  {
    // null for system/default strategies; ObjectId for user-created
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Strategy name is required'],
      trim: true,
      maxlength: [100, 'Name must be 100 characters or less'],
    },
    logic: {
      type: String,
      required: [true, 'Strategy logic is required'],
      trim: true,
      maxlength: [2000, 'Logic expression must be 2000 characters or less'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    // "swing", "breakout", "intraday", "trend", "options", "custom"
    category: {
      type: String,
      trim: true,
      default: 'custom',
    },
    // Display tags e.g. ["RSI", "Volume", "EMA"]
    tags: {
      type: [String],
      default: [],
    },
    // System strategies: cannot be deleted by users, can be copied
    isDefault: {
      type: Boolean,
      default: false,
    },
    // Difficulty badge for UI
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    runCount: {
      type: Number,
      default: 0,
    },
    lastRun: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index: one strategy name per user (null = system)
UserStrategySchema.index({ user: 1, name: 1 });

export default mongoose.model('UserStrategy', UserStrategySchema);
