export interface QuoteData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  isEconomic: boolean;
}

export interface ChartPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartData {
  symbol: string;
  range: string;
  data: ChartPoint[];
}

const API_BASE = '/api';

export async function fetchQuote(symbol: string): Promise<QuoteData> {
  const res = await fetch(`${API_BASE}/quote/${encodeURIComponent(symbol)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch quote for ${symbol}`);
  }
  return res.json();
}

export async function fetchChart(
  symbol: string,
  range: string = '3M'
): Promise<ChartData> {
  const res = await fetch(
    `${API_BASE}/chart/${encodeURIComponent(symbol)}?range=${range}`
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch chart for ${symbol}`);
  }
  return res.json();
}

export async function searchSymbols(
  query: string
): Promise<Array<{ symbol: string; name: string; type: string }>> {
  const res = await fetch(`${API_BASE}/search/${encodeURIComponent(query)}`);
  if (!res.ok) {
    throw new Error(`Failed to search for ${query}`);
  }
  return res.json();
}
