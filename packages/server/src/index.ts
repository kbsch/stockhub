import express from 'express';
import cors from 'cors';
import { quoteRouter } from './routes/quote.js';
import { chartRouter } from './routes/chart.js';
import { searchRouter } from './routes/search.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/quote', quoteRouter);
app.use('/api/chart', chartRouter);
app.use('/api/search', searchRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
