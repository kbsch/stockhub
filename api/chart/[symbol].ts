import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getChart } from '../lib/yahoo.js';
import { getEconomicIndicator } from '../lib/fred.js';

const RANGE_MAP: Record<string, { range: string; interval: string }> = {
  '1D': { range: '1d', interval: '5m' },
  '1W': { range: '5d', interval: '15m' },
  '1M': { range: '1mo', interval: '1h' },
  '3M': { range: '3mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '5Y': { range: '5y', interval: '1wk' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { symbol, range } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  const rangeKey = (typeof range === 'string' ? range : '3M').toUpperCase();
  const rangeConfig = RANGE_MAP[rangeKey] || RANGE_MAP['3M'];

  const indicator = getEconomicIndicator(symbol);
  const lookupSymbol = indicator?.yahooSymbol || symbol;

  const chart = await getChart(lookupSymbol, rangeConfig.range, rangeConfig.interval);

  if (!chart.length) {
    return res.status(404).json({ error: 'Chart data not found' });
  }

  return res.json({
    symbol: symbol.toUpperCase(),
    range: rangeKey,
    data: chart,
  });
}
