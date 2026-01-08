import { Router } from 'express';
import { searchSymbol } from '../services/yahoo.js';

export const searchRouter = Router();

searchRouter.get('/:query', async (req, res) => {
  const { query } = req.params;

  if (!query || query.length < 1) {
    res.status(400).json({ error: 'Query is required' });
    return;
  }

  const results = await searchSymbol(query);
  res.json(results);
});
