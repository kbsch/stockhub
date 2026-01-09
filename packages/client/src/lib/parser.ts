export interface ParsedAsset {
  type: 'stock' | 'option' | 'bond' | 'economic';
  symbol: string;
  displaySymbol: string;
  originalText: string;
  metadata?: {
    strike?: number;
    expiry?: string;
    callPut?: 'call' | 'put';
    cusip?: string;
    underlying?: string;
  };
}

// Common economic indicators
const ECONOMIC_INDICATORS = new Set([
  'DXY',
  'VIX',
  'TNX',
  'TYX',
  'FVX',
  'IRX',
  'CASE-SHILLER',
  'CPI',
  'UNEMPLOYMENT',
  'GDP',
  'FEDFUNDS',
  'M2',
]);

// Common company name to ticker mappings
const COMPANY_NAMES: Record<string, string> = {
  apple: 'AAPL',
  microsoft: 'MSFT',
  google: 'GOOGL',
  alphabet: 'GOOGL',
  amazon: 'AMZN',
  tesla: 'TSLA',
  nvidia: 'NVDA',
  meta: 'META',
  facebook: 'META',
  netflix: 'NFLX',
  disney: 'DIS',
  walmart: 'WMT',
  jpmorgan: 'JPM',
  'bank of america': 'BAC',
  'goldman sachs': 'GS',
  'morgan stanley': 'MS',
  berkshire: 'BRK-B',
  visa: 'V',
  mastercard: 'MA',
  paypal: 'PYPL',
  square: 'SQ',
  block: 'SQ',
  stripe: 'STRIP',
  intel: 'INTC',
  amd: 'AMD',
  qualcomm: 'QCOM',
  broadcom: 'AVGO',
  micron: 'MU',
  'texas instruments': 'TXN',
  asml: 'ASML',
  tsmc: 'TSM',
  salesforce: 'CRM',
  adobe: 'ADBE',
  oracle: 'ORCL',
  cisco: 'CSCO',
  ibm: 'IBM',
  sap: 'SAP',
  servicenow: 'NOW',
  workday: 'WDAY',
  splunk: 'SPLK',
  palantir: 'PLTR',
  snowflake: 'SNOW',
  mongodb: 'MDB',
  elastic: 'ESTC',
  coinbase: 'COIN',
  robinhood: 'HOOD',
  sofi: 'SOFI',
  spotify: 'SPOT',
  uber: 'UBER',
  lyft: 'LYFT',
  airbnb: 'ABNB',
  doordash: 'DASH',
  instacart: 'CART',
  crowdstrike: 'CRWD',
  datadog: 'DDOG',
  cloudflare: 'NET',
  zscaler: 'ZS',
  'palo alto': 'PANW',
  fortinet: 'FTNT',
  zoom: 'ZM',
  docusign: 'DOCU',
  twilio: 'TWLO',
  okta: 'OKTA',
  peloton: 'PTON',
  roblox: 'RBLX',
  unity: 'U',
  'electronic arts': 'EA',
  activision: 'ATVI',
  'take-two': 'TTWO',
  draftkings: 'DKNG',
  gamestop: 'GME',
  'amc entertainment': 'AMC',
  amc: 'AMC',
  nio: 'NIO',
  rivian: 'RIVN',
  lucid: 'LCID',
  fisker: 'FSR',
  ford: 'F',
  gm: 'GM',
  'general motors': 'GM',
  toyota: 'TM',
  honda: 'HMC',
  volkswagen: 'VWAGY',
  ferrari: 'RACE',
  boeing: 'BA',
  airbus: 'EADSY',
  lockheed: 'LMT',
  raytheon: 'RTX',
  northrop: 'NOC',
  'general dynamics': 'GD',
  chevron: 'CVX',
  exxon: 'XOM',
  shell: 'SHEL',
  bp: 'BP',
  conocophillips: 'COP',
  schlumberger: 'SLB',
  halliburton: 'HAL',
  'johnson & johnson': 'JNJ',
  pfizer: 'PFE',
  moderna: 'MRNA',
  merck: 'MRK',
  'eli lilly': 'LLY',
  lilly: 'LLY',
  abbvie: 'ABBV',
  amgen: 'AMGN',
  gilead: 'GILD',
  regeneron: 'REGN',
  biogen: 'BIIB',
  unitedhealth: 'UNH',
  anthem: 'ELV',
  cigna: 'CI',
  humana: 'HUM',
  cvs: 'CVS',
  walgreens: 'WBA',
  'home depot': 'HD',
  lowes: 'LOW',
  target: 'TGT',
  costco: 'COST',
  'dollar general': 'DG',
  'dollar tree': 'DLTR',
  ross: 'ROST',
  tjx: 'TJX',
  starbucks: 'SBUX',
  'mcdonalds': 'MCD',
  chipotle: 'CMG',
  'yum brands': 'YUM',
  dominos: 'DPZ',
  'darden restaurants': 'DRI',
  cocacola: 'KO',
  'coca-cola': 'KO',
  coke: 'KO',
  pepsi: 'PEP',
  pepsico: 'PEP',
  'monster beverage': 'MNST',
  'constellation brands': 'STZ',
  'anheuser-busch': 'BUD',
  'procter & gamble': 'PG',
  'procter and gamble': 'PG',
  unilever: 'UL',
  'colgate-palmolive': 'CL',
  'kimberly-clark': 'KMB',
  'estee lauder': 'EL',
  nike: 'NKE',
  adidas: 'ADDYY',
  lululemon: 'LULU',
  'under armour': 'UAA',
  gap: 'GPS',
  'ralph lauren': 'RL',
  tapestry: 'TPR',
  att: 'T',
  'at&t': 'T',
  verizon: 'VZ',
  't-mobile': 'TMUS',
  comcast: 'CMCSA',
  charter: 'CHTR',
  'warner bros': 'WBD',
  paramount: 'PARA',
  fox: 'FOX',
  'new york times': 'NYT',
  'sony': 'SONY',
  nintendo: 'NTDOY',
  arm: 'ARM',
  'super micro': 'SMCI',
  supermicro: 'SMCI',
  dell: 'DELL',
  hp: 'HPQ',
  lenovo: 'LNVGY',
  caterpillar: 'CAT',
  deere: 'DE',
  '3m': 'MMM',
  honeywell: 'HON',
  'general electric': 'GE',
  ge: 'GE',
  siemens: 'SIEGY',
  ups: 'UPS',
  fedex: 'FDX',
  'union pacific': 'UNP',
  csx: 'CSX',
  blackrock: 'BLK',
  vanguard: 'VTI',
  schwab: 'SCHW',
  fidelity: 'FIS',
  'american express': 'AXP',
  amex: 'AXP',
  'capital one': 'COF',
  discover: 'DFS',
  'wells fargo': 'WFC',
  citi: 'C',
  citigroup: 'C',
  'us bancorp': 'USB',
  pnc: 'PNC',
  truist: 'TFC',
};

// CUSIP check digit validation
function validateCusip(cusip: string): boolean {
  if (cusip.length !== 9) return false;

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    let val: number;
    const c = cusip[i];
    if (c >= '0' && c <= '9') {
      val = parseInt(c, 10);
    } else if (c >= 'A' && c <= 'Z') {
      val = c.charCodeAt(0) - 55; // A=10, B=11, etc.
    } else if (c === '*') {
      val = 36;
    } else if (c === '@') {
      val = 37;
    } else if (c === '#') {
      val = 38;
    } else {
      return false;
    }

    if (i % 2 === 1) {
      val *= 2;
    }
    sum += Math.floor(val / 10) + (val % 10);
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return parseInt(cusip[8], 10) === checkDigit;
}

// Month name to number mapping
const MONTH_MAP: Record<string, string> = {
  jan: '01',
  january: '01',
  feb: '02',
  february: '02',
  mar: '03',
  march: '03',
  apr: '04',
  april: '04',
  may: '05',
  jun: '06',
  june: '06',
  jul: '07',
  july: '07',
  aug: '08',
  august: '08',
  sep: '09',
  sept: '09',
  september: '09',
  oct: '10',
  october: '10',
  nov: '11',
  november: '11',
  dec: '12',
  december: '12',
};

export function parseAssets(text: string): ParsedAsset[] {
  const assets: ParsedAsset[] = [];
  const seenSymbols = new Set<string>();

  // 1. Parse cashtags ($AAPL)
  const cashtagRegex = /\$([A-Z]{1,5})\b/gi;
  let match;
  while ((match = cashtagRegex.exec(text)) !== null) {
    const symbol = match[1].toUpperCase();
    const key = `stock:${symbol}`;
    if (!seenSymbols.has(key)) {
      seenSymbols.add(key);
      assets.push({
        type: 'stock',
        symbol,
        displaySymbol: symbol,
        originalText: match[0],
      });
    }
  }

  // 2. Parse options: AAPL 150C 1/19 or AAPL Jan 19 $150 call
  // Format 1: AAPL 150C 1/19 or AAPL 150P 12/20
  const optionRegex1 = /\b([A-Z]{1,5})\s+(\d+(?:\.\d+)?)\s*([CP])\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/gi;
  while ((match = optionRegex1.exec(text)) !== null) {
    const underlying = match[1].toUpperCase();
    const strike = parseFloat(match[2]);
    const callPut = match[3].toUpperCase() === 'C' ? 'call' : 'put';
    const month = match[4].padStart(2, '0');
    const day = match[5].padStart(2, '0');
    let year = match[6] || new Date().getFullYear().toString().slice(-2);
    if (year.length === 2) {
      year = (parseInt(year, 10) > 50 ? '19' : '20') + year;
    }
    const expiry = `${year}-${month}-${day}`;

    const key = `option:${underlying}:${strike}:${callPut}:${expiry}`;
    if (!seenSymbols.has(key)) {
      seenSymbols.add(key);
      assets.push({
        type: 'option',
        symbol: underlying,
        displaySymbol: `${underlying} $${strike}${callPut === 'call' ? 'C' : 'P'} ${month}/${day}`,
        originalText: match[0],
        metadata: {
          underlying,
          strike,
          callPut,
          expiry,
        },
      });
    }
  }

  // Format 2: AAPL Jan 19 $150 call
  const optionRegex2 =
    /\b([A-Z]{1,5})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:\s+|\s*\$?\s*)(\d+(?:\.\d+)?)\s*(call|put|calls|puts|c|p)\b/gi;
  while ((match = optionRegex2.exec(text)) !== null) {
    const underlying = match[1].toUpperCase();
    const monthName = match[2].toLowerCase();
    const day = match[3].padStart(2, '0');
    const strike = parseFloat(match[4]);
    const callPutRaw = match[5].toLowerCase();
    const callPut = callPutRaw.startsWith('c') ? 'call' : 'put';
    const month = MONTH_MAP[monthName.slice(0, 3)] || '01';
    const year = new Date().getFullYear().toString();
    const expiry = `${year}-${month}-${day}`;

    const key = `option:${underlying}:${strike}:${callPut}:${expiry}`;
    if (!seenSymbols.has(key)) {
      seenSymbols.add(key);
      assets.push({
        type: 'option',
        symbol: underlying,
        displaySymbol: `${underlying} $${strike}${callPut === 'call' ? 'C' : 'P'} ${month}/${day}`,
        originalText: match[0],
        metadata: {
          underlying,
          strike,
          callPut,
          expiry,
        },
      });
    }
  }

  // 3. Parse economic indicators
  const economicRegex = /\b(DXY|VIX|TNX|TYX|FVX|IRX|CASE[- ]?SHILLER|CPI|UNEMPLOYMENT|GDP|FEDFUNDS|M2)\b/gi;
  while ((match = economicRegex.exec(text)) !== null) {
    const indicator = match[1].toUpperCase().replace(/\s+/g, '-');
    const normalized = indicator.replace(/-/g, '-');
    if (ECONOMIC_INDICATORS.has(normalized)) {
      const key = `economic:${normalized}`;
      if (!seenSymbols.has(key)) {
        seenSymbols.add(key);
        assets.push({
          type: 'economic',
          symbol: normalized,
          displaySymbol: normalized,
          originalText: match[0],
        });
      }
    }
  }

  // 4. Parse CUSIPs (9-character alphanumeric with check digit)
  const cusipRegex = /\b([A-Z0-9]{9})\b/gi;
  while ((match = cusipRegex.exec(text)) !== null) {
    const cusip = match[1].toUpperCase();
    // Validate it's a real CUSIP (has letters and numbers, valid check digit)
    if (
      /[A-Z]/.test(cusip) &&
      /[0-9]/.test(cusip) &&
      validateCusip(cusip)
    ) {
      const key = `bond:${cusip}`;
      if (!seenSymbols.has(key)) {
        seenSymbols.add(key);
        assets.push({
          type: 'bond',
          symbol: cusip,
          displaySymbol: `CUSIP: ${cusip}`,
          originalText: match[0],
          metadata: {
            cusip,
          },
        });
      }
    }
  }

  // 5. Parse company names (case-insensitive)
  const lowerText = text.toLowerCase();
  for (const [name, ticker] of Object.entries(COMPANY_NAMES)) {
    const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerText)) {
      const key = `stock:${ticker}`;
      if (!seenSymbols.has(key)) {
        seenSymbols.add(key);
        // Find the original match for the originalText
        const foundMatch = text.match(regex);
        assets.push({
          type: 'stock',
          symbol: ticker,
          displaySymbol: ticker,
          originalText: foundMatch ? foundMatch[0] : name,
        });
      }
    }
  }

  return assets;
}
