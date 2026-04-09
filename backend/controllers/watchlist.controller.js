import Watchlist from '../models/Watchlist.js';

async function getOrCreateWatchlist(userId) {
  let watchlist = await Watchlist.findOne({ user: userId });
  if (!watchlist) {
    watchlist = await Watchlist.create({ user: userId, symbols: [] });
  }
  return watchlist;
}

// GET /api/watchlist
export async function getWatchlist(req, res) {
  try {
    const watchlist = await getOrCreateWatchlist(req.user._id);
    return res.json({ symbols: watchlist.symbols });
  } catch (err) {
    console.error('[GET /api/watchlist]', err);
    return res.status(500).json({ message: 'Failed to fetch watchlist.' });
  }
}

// POST /api/watchlist/add
export async function addSymbolToWatchlist(req, res) {
  const { symbol } = req.body ?? {};

  if (!symbol || typeof symbol !== 'string' || !symbol.trim()) {
    return res.status(400).json({ message: 'Symbol is required.' });
  }

  const sym = symbol.trim().toUpperCase();

  try {
    const watchlist = await getOrCreateWatchlist(req.user._id);
    
    if (watchlist.symbols.includes(sym)) {
      return res.status(400).json({ message: `${sym} is already in your watchlist.` });
    }

    watchlist.symbols.push(sym);
    await watchlist.save();

    return res.status(200).json({ message: `Added ${sym} to watchlist.`, symbols: watchlist.symbols });
  } catch (err) {
    console.error('[POST /api/watchlist/add]', err);
    return res.status(500).json({ message: 'Failed to add to watchlist.' });
  }
}

// DELETE /api/watchlist/remove/:symbol
export async function removeSymbolFromWatchlist(req, res) {
  const symbol = req.params.symbol?.trim().toUpperCase();

  if (!symbol) {
    return res.status(400).json({ message: 'Symbol parameter is required.' });
  }

  try {
    const watchlist = await getOrCreateWatchlist(req.user._id);
    const idx = watchlist.symbols.indexOf(symbol);

    if (idx === -1) {
      return res.status(404).json({ message: `${symbol} is not in your watchlist.` });
    }

    watchlist.symbols.splice(idx, 1);
    await watchlist.save();

    return res.status(200).json({ message: `Removed ${symbol} from watchlist.`, symbols: watchlist.symbols });
  } catch (err) {
    console.error('[DELETE /api/watchlist/remove/:symbol]', err);
    return res.status(500).json({ message: 'Failed to remove from watchlist.' });
  }
}