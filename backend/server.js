import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const socketIo = require('socket.io');
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';
import helmet from 'helmet';
import compression from 'compression';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';
import { setupWebSocketServer } from './utils/websocket.js';
import { initializeMarketData } from './services/marketData.service.js';
import stockRoutes from './routes/stockRoutes.js';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import watchlistRoutes from './routes/watchlist.routes.js';
import marketDataRoutes from './routes/marketData.routes.js';
import demoTradingRoutes from './routes/demoTrading.routes.js';
// import tradeRoutes from './routes/trade.routes'; // Commented out - file doesn't exist
// import portfolioRoutes from './routes/portfolio.routes'; // Commented out - file doesn't exist
import riskManagementRoutes from './routes/riskManagement.routes.js';
import analyzeRoutes from './routes/analyze.js';
import portfolioRoutes from './routes/portfolio.routes.js';
import strategiesRoutes from './routes/strategies.routes.js';
import { seedDefaultStrategies } from './config/defaultStrategies.seed.js';

// Connect to MongoDB, then seed default strategies
connectDB().then(() => seedDefaultStrategies()).catch(() => {});

// Initialize Express app
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://192.168.152.1:3000'
].filter(Boolean);

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/market-data', marketDataRoutes);
app.use('/api/risk-management', riskManagementRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/strategies', strategiesRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/demo', demoTradingRoutes);


// Error middleware
app.use(notFound);
app.use(errorHandler);

// Setup WebSocket server
setupWebSocketServer(io);

// Initialize market data service
initializeMarketData(io);

// Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server is ready for connections`);
}); 