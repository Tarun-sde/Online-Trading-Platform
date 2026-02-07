const express = require("express");
const router = express.Router();
const { getStockPrice } = require("../services/stockService");

router.get("/:symbol", async (req, res) => {
  try {
    const data = await getStockPrice(req.params.symbol);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stock" });
  }
});

module.exports = router;
