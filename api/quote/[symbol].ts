import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getQuote } from '../lib/yahoo.js';
import { getEconomicIndicator } from '../lib/fred.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  const indicator = getEconomicIndicator(symbol);
  const lookupSymbol = indicator?.yahooSymbol || symbol;

  const quote = await getQuote(lookupSymbol);

  if (!quote) {
    return res.status(404).json({ error: 'Symbol not found' });
  }

  return res.json({
    symbol: symbol.toUpperCase(),
    name: indicator?.name || quote.shortName,
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    timestamp: quote.regularMarketTime,
    isEconomic: !!indicator,
  });
}
