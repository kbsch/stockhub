import { Router } from 'express';
import { getQuote, getOptionQuote } from '../services/yahoo.js';
import { getEconomicIndicator } from '../services/fred.js';

export const quoteRouter = Router();

quoteRouter.get('/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { strike, callPut, expiry } = req.query;

  if (!symbol) {
    res.status(400).json({ error: 'Symbol is required' });
    return;
  }

  // Check if this is an option quote request
  if (strike && callPut && expiry) {
    const strikeNum = parseFloat(strike as string);
    const callPutStr = (callPut as string).toLowerCase() as 'call' | 'put';
    const expiryStr = expiry as string;

    if (isNaN(strikeNum) || !['call', 'put'].includes(callPutStr)) {
      res.status(400).json({ error: 'Invalid option parameters' });
      return;
    }

    const optionQuote = await getOptionQuote(symbol, strikeNum, callPutStr, expiryStr);

    if (!optionQuote) {
      res.status(404).json({ error: 'Option not found' });
      return;
    }

    res.json({
      symbol: optionQuote.contractSymbol,
      name: `${symbol.toUpperCase()} $${strikeNum} ${callPutStr.toUpperCase()} ${expiryStr}`,
      price: optionQuote.lastPrice,
      change: optionQuote.change,
      changePercent: optionQuote.percentChange,
      timestamp: Date.now() / 1000,
      isOption: true,
      bid: optionQuote.bid,
      ask: optionQuote.ask,
      volume: optionQuote.volume,
      openInterest: optionQuote.openInterest,
      impliedVolatility: optionQuote.impliedVolatility,
    });
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
