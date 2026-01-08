import type { VercelRequest, VercelResponse } from '@vercel/node';
import { searchSymbol } from '../lib/yahoo.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { query } = req.query;

  if (!query || typeof query !== 'string' || query.length < 1) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const results = await searchSymbol(query);
  return res.json(results);
}
