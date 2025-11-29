# Online Trading Platform Backend

This is the backend for an online trading platform built with Node.js, Express, and MongoDB.

## Features

- User authentication (register, login, logout)
- Product management (stocks, cryptocurrencies, etc.)
- Order management (buy/sell orders)
- Portfolio tracking
- Transaction history
- Watchlists
- Notifications and price alerts

## Models

The backend uses the following MongoDB models:

- **User**: User account information
- **Product**: Trading products (stocks, crypto, etc.)
- **Order**: Buy/sell orders
- **Portfolio**: User's holdings
- **Transaction**: Financial transactions
- **Watchlist**: User's watchlists
- **Notification**: System and user notifications
- **PriceAlert**: Price change alerts

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/trading-platform
   JWT_SECRET=your_jwt_secret_key_here
   NODE_ENV=development
   ```
4. Start the server:
   ```
   npm run dev
   ```

## API Routes

The API includes the following main route groups:

- `/api/auth`: Authentication routes
- `/api/users`: User management
- `/api/products`: Product management
- `/api/orders`: Order management
- `/api/transactions`: Transaction handling
- `/api/watchlist`: Watchlist management

## Development

For development, the server runs with nodemon for automatic reloading.

```
npm run dev
```

## Production

For production, run:

```
npm start
``` 