const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const { setupWebSocketServer } = require('./utils/websocket');
const { initializeMarketData } = require('./services/marketData.service');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const transactionRoutes = require('./routes/transaction.routes');
const watchlistRoutes = require('./routes/watchlist.routes');
const marketDataRoutes = require('./routes/marketData.routes');
// const tradeRoutes = require('./routes/trade.routes'); // Commented out - file doesn't exist
// const portfolioRoutes = require('./routes/portfolio.routes'); // Commented out - file doesn't exist
const riskManagementRoutes = require('./routes/riskManagement.routes');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Security middleware
app.use(helmet());
app.use(compression());

// Standard middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/market-data', marketDataRoutes);
// app.use('/api/trades', tradeRoutes); // Commented out - file doesn't exist
// app.use('/api/portfolio', portfolioRoutes); // Commented out - file doesn't exist
app.use('/api/risk-management', riskManagementRoutes);

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