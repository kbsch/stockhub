interface YahooQuote {
  symbol: string;
  shortName: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: number;
}

interface YahooChartData {
  timestamp: number[];
  indicators: {
    quote: Array<{
      open: number[];
      high: number[];
      low: number[];
      close: number[];
      volume: number[];
    }>;
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Yahoo Finance crumb/cookie handling
let yahooCrumb: string | null = null;
let yahooCookies: string | null = null;
let crumbExpiry = 0;

async function getYahooCrumb(): Promise<{ crumb: string; cookies: string } | null> {
  // Return cached crumb if still valid (cache for 1 hour)
  if (yahooCrumb && yahooCookies && Date.now() < crumbExpiry) {
    return { crumb: yahooCrumb, cookies: yahooCookies };
  }

  try {
    // First, get cookies from Yahoo Finance
    const initRes = await fetch('https://fc.yahoo.com', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const cookies = initRes.headers.get('set-cookie') || '';

    // Then get the crumb
    const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookies,
      },
    });

    if (!crumbRes.ok) return null;

    const crumb = await crumbRes.text();
    if (!crumb || crumb.includes('error')) return null;

    // Cache for 1 hour
    yahooCrumb = crumb;
    yahooCookies = cookies;
    crumbExpiry = Date.now() + 60 * 60 * 1000;

    return { crumb, cookies };
  } catch (err) {
    console.error('Error fetching Yahoo crumb:', err);
    return null;
  }
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function getQuote(symbol: string): Promise<YahooQuote | null> {
  const cacheKey = `quote:${symbol}`;
  const cached = getCached<YahooQuote>(cacheKey);
  if (cached) return cached;

  try {
    // Use chart endpoint which doesn't require auth - it includes quote data in meta
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta) return null;

    const result: YahooQuote = {
      symbol: meta.symbol,
      shortName: meta.shortName || meta.longName || meta.symbol,
      regularMarketPrice: meta.regularMarketPrice,
      regularMarketChange: meta.regularMarketPrice - meta.previousClose,
      regularMarketChangePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      regularMarketTime: meta.regularMarketTime,
    };

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`Error fetching quote for ${symbol}:`, err);
    return null;
  }
}

export interface ChartPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getChart(
  symbol: string,
  range: string = '3mo',
  interval: string = '1d'
): Promise<ChartPoint[]> {
  const cacheKey = `chart:${symbol}:${range}:${interval}`;
  const cached = getCached<ChartPoint[]>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const result = data?.chart?.result?.[0];

    if (!result?.timestamp || !result?.indicators?.quote?.[0]) {
      return [];
    }

    const timestamps = result.timestamp as number[];
    const quote = result.indicators.quote[0] as YahooChartData['indicators']['quote'][0];

    const points: ChartPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (
        quote.open[i] != null &&
        quote.high[i] != null &&
        quote.low[i] != null &&
        quote.close[i] != null
      ) {
        points.push({
          time: timestamps[i],
          open: quote.open[i],
          high: quote.high[i],
          low: quote.low[i],
          close: quote.close[i],
          volume: quote.volume[i] || 0,
        });
      }
    }

    setCache(cacheKey, points);
    return points;
  } catch (err) {
    console.error(`Error fetching chart for ${symbol}:`, err);
    return [];
  }
}

export interface OptionQuote {
  contractSymbol: string;
  lastPrice: number;
  change: number;
  percentChange: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  strike: number;
  expiration: number;
}

export async function getOptionQuote(
  underlying: string,
  strike: number,
  callPut: 'call' | 'put',
  expiry: string // YYYY-MM-DD format
): Promise<OptionQuote | null> {
  const cacheKey = `option:${underlying}:${strike}:${callPut}:${expiry}`;
  const cached = getCached<OptionQuote>(cacheKey);
  if (cached) return cached;

  try {
    // Get Yahoo crumb for authentication
    const auth = await getYahooCrumb();
    if (!auth) {
      console.error('Failed to get Yahoo crumb for options API');
      return null;
    }

    // Convert expiry date to Unix timestamp (midnight UTC)
    const targetDate = new Date(expiry);
    targetDate.setUTCHours(0, 0, 0, 0);
    const targetTimestamp = Math.floor(targetDate.getTime() / 1000);

    // First, fetch available expirations from Yahoo
    const baseUrl = `https://query1.finance.yahoo.com/v7/finance/options/${encodeURIComponent(underlying)}`;
    const baseRes = await fetch(`${baseUrl}?crumb=${encodeURIComponent(auth.crumb)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': auth.cookies,
      },
    });

    if (!baseRes.ok) {
      console.error(`Options API returned ${baseRes.status} for ${underlying}`);
      return null;
    }

    const baseData = await baseRes.json();
    const baseChain = baseData?.optionChain?.result?.[0];
    if (!baseChain) {
      console.error(`No option chain result for ${underlying}`);
      return null;
    }

    const expirationDates: number[] = baseChain.expirationDates || [];
    if (expirationDates.length === 0) {
      console.error(`No expiration dates for ${underlying}`);
      return null;
    }

    // Find the closest expiration date to our target
    let closestExpiration = expirationDates[0];
    let closestDiff = Math.abs(expirationDates[0] - targetTimestamp);

    for (const exp of expirationDates) {
      const diff = Math.abs(exp - targetTimestamp);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestExpiration = exp;
      }
    }

    // Only use the closest expiration if it's within 7 days of our target
    const sevenDays = 7 * 24 * 60 * 60;
    if (closestDiff > sevenDays) {
      console.log(`No expiration within 7 days of ${expiry} for ${underlying}. Closest: ${new Date(closestExpiration * 1000).toISOString()}`);
      return null;
    }

    // Fetch options chain for the matched expiration
    const url = `${baseUrl}?date=${closestExpiration}&crumb=${encodeURIComponent(auth.crumb)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': auth.cookies,
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const optionChain = data?.optionChain?.result?.[0];

    if (!optionChain) return null;

    // Find the options for the requested expiration
    const options = optionChain.options?.[0];
    if (!options) return null;

    // Get the correct list based on call/put
    const contractList = callPut === 'call' ? options.calls : options.puts;
    if (!contractList || contractList.length === 0) return null;

    // Find the contract with matching strike price
    const contract = contractList.find(
      (c: { strike: number }) => Math.abs(c.strike - strike) < 0.01
    );

    if (!contract) return null;

    const result: OptionQuote = {
      contractSymbol: contract.contractSymbol,
      lastPrice: contract.lastPrice ?? 0,
      change: contract.change ?? 0,
      percentChange: contract.percentChange ?? 0,
      bid: contract.bid ?? 0,
      ask: contract.ask ?? 0,
      volume: contract.volume ?? 0,
      openInterest: contract.openInterest ?? 0,
      impliedVolatility: contract.impliedVolatility ?? 0,
      strike: contract.strike,
      expiration: contract.expiration,
    };

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`Error fetching option quote for ${underlying} ${strike}${callPut === 'call' ? 'C' : 'P'} ${expiry}:`, err);
    return null;
  }
}

export async function searchSymbol(
  query: string
): Promise<Array<{ symbol: string; name: string; type: string }>> {
  const cacheKey = `search:${query}`;
  const cached = getCached<Array<{ symbol: string; name: string; type: string }>>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const quotes = data?.quotes || [];

    const results = quotes
      .filter((q: { quoteType?: string }) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF' || q.quoteType === 'INDEX')
      .map((q: { symbol: string; shortname?: string; longname?: string; quoteType: string }) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: q.quoteType.toLowerCase(),
      }));

    setCache(cacheKey, results);
    return results;
  } catch (err) {
    console.error(`Error searching for ${query}:`, err);
    return [];
  }
}
