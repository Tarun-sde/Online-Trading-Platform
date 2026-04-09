import mongoose from 'mongoose';

const WatchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One watchlist array per user makes it easiest
      index: true,
    },
    symbols: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Watchlist', WatchlistSchema);