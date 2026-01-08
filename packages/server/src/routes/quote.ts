import { Router } from 'express';
import { getQuote } from '../services/yahoo.js';
import { getEconomicIndicator } from '../services/fred.js';

export const quoteRouter = Router();

quoteRouter.get('/:symbol', async (req, res) => {
  const { symbol } = req.params;

  if (!symbol) {
    res.status(400).json({ error: 'Symbol is required' });
    return;
  }

  // Check if it's an economic indicator with a Yahoo equivalent
  const indicator = getEconomicIndicator(symbol);
  const lookupSymbol = indicator?.yahooSymbol || symbol;

  const quote = await getQuote(lookupSymbol);

  if (!quote) {
    res.status(404).json({ error: 'Symbol not found' });
    return;
  }

  res.json({
    symbol: symbol.toUpperCase(),
    name: indicator?.name || quote.shortName,
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    timestamp: quote.regularMarketTime,
    isEconomic: !!indicator,
  });
});
