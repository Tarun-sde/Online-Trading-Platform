import mongoose from 'mongoose';

const connectDB = async () => {
  // Support both DB_URI (env.sample) and MONGO_URI (legacy) — whichever is set
  const uri = process.env.DB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.error(
      '⚠️  [DB] No MongoDB URI found. Set DB_URI in your .env file.\n' +
      '   Routes that require MongoDB (auth, orders, watchlist, etc.) will NOT work.\n' +
      '   Routes that do NOT require MongoDB (e.g. /api/analyze) will work fine.'
    );
    // Do NOT call process.exit() — let the server boot so strategy routes still work
    return null;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ [DB] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ [DB] MongoDB connection failed: ${error.message}`);
    console.error('   The server will continue running. DB-dependent routes will return errors.');
    // Don't crash the process — non-DB routes (Strategy Analyzer) should still work
    return null;
  }
};

export default connectDB;