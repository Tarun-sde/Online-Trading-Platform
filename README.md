# TradePulse (NexTrade) - Final Year Engineering Project

**TradePulse** is a comprehensive full-stack stock trading and analysis platform designed to provide users with real-world market interaction through paper trading, portfolio management, and dynamic charting. Developed as a final year SDE project, it focuses on architectural excellence, real-time data integration, and professional-grade UI/UX.

---

## 🚀 Core Features (Implemented)

### 1. **Live Market Data Engine**
- **Zero-Mock Data**: Real-time stock prices and historical data fetched directly from the Yahoo Finance API.
- **Dynamic Polling**: High-frequency secure polling keeping prices and charts synchronized across the entire platform.
- **Stock Search**: Autocomplete search functionality for all NSE/BSE and International stocks.

### 2. **Portfolio Management (Real Simulation)**
- **Holding Tracking**: Add, edit, and delete actual holdings to track your personal investments.
- **Live P&L Calculation**: Real-time calculation of Portfolio Value, Total Cost, Profit/Loss, and Return percentages.
- **Dynamic Allocation**: Visual breakdown of your portfolio concentration by asset class and top individual holdings.

### 3. **Demo Trading (Paper Trading)**
- **Virtual Sandbox**: Every user gets a virtual balance of **₹1,00,000** to practice trading strategies without real money.
- **Interactive Console**: Buy/Sell panel with live price validation and estimated trade costs.
- **Isolated State**: Demo holdings and balances are kept separate from the real portfolio tracker.

### 4. **Smart Watchlist**
- **Personalized Tracking**: Add your favorite tickers to a custom watchlist mapped to your user profile.
- **Sparkline Charts**: Miniaturized 7-day trend graphs for quick visual analysis of watchlist symbols.
- **Rotational Featured Stock**: A dynamic "Featured" widget that rotates through your watchlist symbols to show detailed analytics.

### 5. **Advanced Charting & UI**
- **Polymorphic Components**: A reusable charting engine supporting full-view detailed analysis and compact sparkline variants.
- **Modern UX**: Built with a sleek glassmorphic dark theme, responsive layouts, and smooth animations using Framer Motion.

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router, Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type-safe development.
- **Styling**: [TailwindCSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) for animations.
- **State**: React Context API (Portfolio & Auth contexts).
- **Icons**: [Heroicons](https://heroicons.com/) & [React Icons](https://react-icons.github.io/react-icons/).

### **Backend**
- **Runtime**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/).
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) modeling.
- **Auth**: [JWT (JSON Web Tokens)](https://jwt.io/) & Bcrypt for secure password hashing.
- **Real-time**: [Socket.io](https://socket.io/) (Ready for streaming extensions).
- **API Interaction**: [Axios](https://axios-http.com/) for external financial data retrieval.

---

## 📂 Project Structure

```bash
├── backend/                # Express.js Server
│   ├── controllers/       # Business logic for trading, watchlist, and auth
│   ├── models/            # Mongoose schemas (User, DemoAccount, Watchlist, etc.)
│   ├── routes/            # API endpoints mapping
│   ├── services/          # Data fetching services (Yahoo Finance integration)
│   └── server.js          # Entry point
├── frontend-tradepulse/    # Next.js Application
│   ├── src/
│   │   ├── app/           # Page routes (Dashboard, Demo, Portfolio, etc.)
│   │   ├── components/    # Reusable UI (Charts, Autocomplete, Nav)
│   │   ├── context/       # Global State (Auth, Portfolio)
│   │   └── lib/           # Auth helpers and API configuration
└── README.md
```

---

## 🔮 Future Roadmap (Final Year Objectives)

- [ ] **Strategy Backtesting Engine**: Implement a system where users can define logic (e.g., "Price > SMA 50") and see historical performance.
- [ ] **Advanced Risk Management**: Integrated Stop-Loss and Take-Profit alerts with real-time browser notifications.
- [ ] **Technical Indicator Integration**: Overlaying RSI, MACD, and Bollinger Bands on the charting engine.
- [ ] **Broker Integration**: Connecting to the Zerodha Kite API for actual live order execution.
- [ ] **Social Trading**: User leaderboards for Paper Trading performance and strategy sharing.

---

## ⚙️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone [your-repo-link]
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   # Add your MONGO_URI and JWT_SECRET to .env
   npm run dev
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend-tradepulse
   npm install
   npm run dev
   ```

---