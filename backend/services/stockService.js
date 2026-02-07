const axios = require("axios");

const API_KEY = process.env.STOCK_API_KEY;

async function getStockPrice(symbol) {
  const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${API_KEY}`;
  const res = await axios.get(url);
  return res.data;
}

module.exports = { getStockPrice };
