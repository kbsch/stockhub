import { Router } from 'express';
import { getChart } from '../services/yahoo.js';
import { getEconomicIndicator } from '../services/fred.js';

export const chartRouter = Router();

const RANGE_MAP: Record<string, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '5m' },
  '1W': { range: '5d', interval: '15m' },
  '1M': { range: '1mo', interval: '1h' },
  '3M': { range: '3mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '5Y': { range: '5y', interval: '1wk' },
};

chartRouter.get('/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const rangeKey = ((req.query.range as string) || '3M').toUpperCase();

  if (!symbol) {
    res.status(400).json({ error: 'Symbol is required' });
    return;
  }

  const rangeConfig = RANGE_MAP[rangeKey] || RANGE_MAP['3M'];

  // Check if it's an economic indicator with a Yahoo equivalent
  const indicator = getEconomicIndicator(symbol);
  const lookupSymbol = indicator?.yahooSymbol || symbol;

  const chart = await getChart(lookupSymbol, rangeConfig.range, rangeConfig.interval);

  if (!chart.length) {
    res.status(404).json({ error: 'Chart data not found' });
    return;
  }

  res.json({
    symbol: symbol.toUpperCase(),
    range: rangeKey,
    data: chart,
  });
});
