import axios from "axios";

const API_KEY = process.env.STOCK_API_KEY;

async function getStockPrice(symbol) {
  const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${API_KEY}`;
  const res = await axios.get(url);
  return res.data;
}

export { getStockPrice };
