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
  // Big Tech
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

  // Semiconductors
  intel: 'INTC',
  amd: 'AMD',
  qualcomm: 'QCOM',
  broadcom: 'AVGO',
  micron: 'MU',
  'texas instruments': 'TXN',
  asml: 'ASML',
  tsmc: 'TSM',
  arm: 'ARM',
  'super micro': 'SMCI',
  supermicro: 'SMCI',
  marvell: 'MRVL',
  'applied materials': 'AMAT',
  'lam research': 'LRCX',
  'kla corp': 'KLAC',
  skyworks: 'SWKS',
  microchip: 'MCHP',
  'on semiconductor': 'ON',
  onsemi: 'ON',
  lattice: 'LSCC',
  wolfspeed: 'WOLF',

  // Enterprise Software
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
  atlassian: 'TEAM',
  hubspot: 'HUBS',
  zendesk: 'ZEN',
  shopify: 'SHOP',
  squarespace: 'SQSP',
  wix: 'WIX',
  dropbox: 'DBX',
  'ui path': 'PATH',
  uipath: 'PATH',
  confluent: 'CFLT',
  hashicorp: 'HCP',
  gitlab: 'GTLB',
  digitalocean: 'DOCN',
  fastly: 'FSLY',
  sumo: 'SUMO',
  dynatrace: 'DT',
  'new relic': 'NEWR',
  appian: 'APPN',
  veeva: 'VEEV',
  coupa: 'COUP',
  asana: 'ASAN',
  monday: 'MNDY',
  smartsheet: 'SMAR',

  // Cybersecurity
  crowdstrike: 'CRWD',
  datadog: 'DDOG',
  cloudflare: 'NET',
  zscaler: 'ZS',
  'palo alto': 'PANW',
  fortinet: 'FTNT',
  okta: 'OKTA',
  sentinelone: 'S',
  cyberark: 'CYBR',
  qualys: 'QLYS',
  tenable: 'TENB',
  varonis: 'VRNS',
  sailpoint: 'SAIL',
  proofpoint: 'PFPT',

  // Communication/Collaboration
  zoom: 'ZM',
  docusign: 'DOCU',
  twilio: 'TWLO',
  ringcentral: 'RNG',
  '8x8': 'EGHT',
  slack: 'WORK',
  discord: 'DISCORD',

  // Fintech
  paypal: 'PYPL',
  square: 'SQ',
  block: 'SQ',
  stripe: 'STRIP',
  coinbase: 'COIN',
  robinhood: 'HOOD',
  sofi: 'SOFI',
  affirm: 'AFRM',
  upstart: 'UPST',
  lemonade: 'LMND',
  marqeta: 'MQ',
  toast: 'TOST',
  bill: 'BILL',
  'bill.com': 'BILL',
  adyen: 'ADYEY',
  klarna: 'KLARNA',
  plaid: 'PLAID',
  chime: 'CHIME',
  wise: 'WISE',
  revolut: 'REVOLUT',
  nubank: 'NU',

  // Consumer Tech
  spotify: 'SPOT',
  uber: 'UBER',
  lyft: 'LYFT',
  airbnb: 'ABNB',
  doordash: 'DASH',
  instacart: 'CART',
  pinterest: 'PINS',
  snap: 'SNAP',
  snapchat: 'SNAP',
  twitter: 'TWTR',
  reddit: 'RDDT',
  bumble: 'BMBL',
  'match group': 'MTCH',
  tinder: 'MTCH',
  etsy: 'ETSY',
  ebay: 'EBAY',
  chewy: 'CHWY',
  wayfair: 'W',
  carvana: 'CVNA',
  vroom: 'VRM',
  opendoor: 'OPEN',
  redfin: 'RDFN',
  zillow: 'Z',
  yelp: 'YELP',
  tripadvisor: 'TRIP',
  booking: 'BKNG',
  expedia: 'EXPE',
  duolingo: 'DUOL',
  coursera: 'COUR',
  chegg: 'CHGG',

  // Gaming & Entertainment
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
  'warner bros': 'WBD',
  paramount: 'PARA',
  fox: 'FOX',
  disney: 'DIS',
  'new york times': 'NYT',
  sony: 'SONY',
  nintendo: 'NTDOY',
  'live nation': 'LYV',
  roku: 'ROKU',
  fubo: 'FUBO',
  imax: 'IMAX',
  'warner music': 'WMG',
  'universal music': 'UMG',

  // Crypto & Blockchain
  bitcoin: 'BTC-USD',
  btc: 'BTC-USD',
  ethereum: 'ETH-USD',
  eth: 'ETH-USD',
  ether: 'ETH-USD',
  solana: 'SOL-USD',
  sol: 'SOL-USD',
  cardano: 'ADA-USD',
  ada: 'ADA-USD',
  ripple: 'XRP-USD',
  xrp: 'XRP-USD',
  dogecoin: 'DOGE-USD',
  doge: 'DOGE-USD',
  polkadot: 'DOT-USD',
  polygon: 'MATIC-USD',
  matic: 'MATIC-USD',
  avalanche: 'AVAX-USD',
  avax: 'AVAX-USD',
  chainlink: 'LINK-USD',
  link: 'LINK-USD',
  litecoin: 'LTC-USD',
  ltc: 'LTC-USD',
  uniswap: 'UNI-USD',
  aave: 'AAVE-USD',
  maker: 'MKR-USD',
  cosmos: 'ATOM-USD',
  atom: 'ATOM-USD',
  algorand: 'ALGO-USD',
  algo: 'ALGO-USD',
  stellar: 'XLM-USD',
  xlm: 'XLM-USD',
  tezos: 'XTZ-USD',
  xtz: 'XTZ-USD',
  hedera: 'HBAR-USD',
  hbar: 'HBAR-USD',
  vechain: 'VET-USD',
  vet: 'VET-USD',
  filecoin: 'FIL-USD',
  fil: 'FIL-USD',
  apecoin: 'APE-USD',
  ape: 'APE-USD',
  shiba: 'SHIB-USD',
  shib: 'SHIB-USD',
  'shiba inu': 'SHIB-USD',
  pepe: 'PEPE-USD',
  bonk: 'BONK-USD',
  arbitrum: 'ARB-USD',
  arb: 'ARB-USD',
  optimism: 'OP-USD',
  near: 'NEAR-USD',
  'near protocol': 'NEAR-USD',
  fantom: 'FTM-USD',
  ftm: 'FTM-USD',
  render: 'RNDR-USD',
  rndr: 'RNDR-USD',
  injective: 'INJ-USD',
  inj: 'INJ-USD',
  sei: 'SEI-USD',
  sui: 'SUI-USD',
  aptos: 'APT-USD',
  apt: 'APT-USD',

  // Crypto Mining & Related Stocks
  'marathon digital': 'MARA',
  mara: 'MARA',
  riot: 'RIOT',
  'riot platforms': 'RIOT',
  'cleanspark': 'CLSK',
  hut8: 'HUT',
  'hut 8': 'HUT',
  bitfarms: 'BITF',
  'core scientific': 'CORZ',
  hive: 'HIVE',
  'microstrategy': 'MSTR',

  // Hardware
  dell: 'DELL',
  hp: 'HPQ',
  lenovo: 'LNVGY',
  'western digital': 'WDC',
  seagate: 'STX',
  netapp: 'NTAP',
  'pure storage': 'PSTG',
  logitech: 'LOGI',
  corsair: 'CRSR',

  // EV & Automotive
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
  porsche: 'POAHY',
  bmw: 'BMWYY',
  mercedes: 'MBGYY',
  'mercedes-benz': 'MBGYY',
  hyundai: 'HYMTF',
  stellantis: 'STLA',
  polestar: 'PSNY',
  vinfast: 'VFS',
  xpeng: 'XPEV',
  'li auto': 'LI',
  byd: 'BYDDY',
  'quantumscape': 'QS',
  chargepoint: 'CHPT',
  evgo: 'EVGO',
  blink: 'BLNK',

  // Aerospace & Defense
  boeing: 'BA',
  airbus: 'EADSY',
  lockheed: 'LMT',
  'lockheed martin': 'LMT',
  raytheon: 'RTX',
  northrop: 'NOC',
  'northrop grumman': 'NOC',
  'general dynamics': 'GD',
  'l3harris': 'LHX',
  textron: 'TXT',
  'bae systems': 'BAESY',
  spacex: 'SPACEX',
  'rocket lab': 'RKLB',
  astra: 'ASTR',
  virgin: 'SPCE',
  'virgin galactic': 'SPCE',

  // Energy
  chevron: 'CVX',
  exxon: 'XOM',
  exxonmobil: 'XOM',
  shell: 'SHEL',
  bp: 'BP',
  conocophillips: 'COP',
  schlumberger: 'SLB',
  halliburton: 'HAL',
  'baker hughes': 'BKR',
  'phillips 66': 'PSX',
  valero: 'VLO',
  marathon: 'MPC',
  'marathon petroleum': 'MPC',
  occidental: 'OXY',
  pioneer: 'PXD',
  devon: 'DVN',
  diamondback: 'FANG',
  eog: 'EOG',
  'coterra energy': 'CTRA',
  'chesapeake energy': 'CHK',

  // Renewables & Clean Energy
  'first solar': 'FSLR',
  enphase: 'ENPH',
  sunrun: 'RUN',
  'solar edge': 'SEDG',
  solaredge: 'SEDG',
  sunpower: 'SPWR',
  'plug power': 'PLUG',
  'bloom energy': 'BE',
  'fuelcell energy': 'FCEL',
  nextera: 'NEE',
  'brookfield renewable': 'BEPC',

  // Healthcare & Pharma
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
  biontech: 'BNTX',
  novavax: 'NVAX',
  'bristol-myers': 'BMY',
  'bristol myers': 'BMY',
  astrazeneca: 'AZN',
  novartis: 'NVS',
  roche: 'RHHBY',
  'gsk': 'GSK',
  glaxosmithkline: 'GSK',
  sanofi: 'SNY',
  'novo nordisk': 'NVO',
  vertex: 'VRTX',
  illumina: 'ILMN',
  dexcom: 'DXCM',
  intuitive: 'ISRG',
  'intuitive surgical': 'ISRG',
  'boston scientific': 'BSX',
  medtronic: 'MDT',
  'abbott labs': 'ABT',
  abbott: 'ABT',
  'thermo fisher': 'TMO',
  'danaher': 'DHR',
  'becton dickinson': 'BDX',
  stryker: 'SYK',
  'edwards lifesciences': 'EW',
  'idexx': 'IDXX',
  zoetis: 'ZTS',
  'align technology': 'ALGN',
  hologic: 'HOLX',
  'exact sciences': 'EXAS',

  // Health Insurance
  unitedhealth: 'UNH',
  anthem: 'ELV',
  elevance: 'ELV',
  cigna: 'CI',
  humana: 'HUM',
  centene: 'CNC',
  molina: 'MOH',
  cvs: 'CVS',
  walgreens: 'WBA',

  // Retail
  walmart: 'WMT',
  'home depot': 'HD',
  lowes: 'LOW',
  target: 'TGT',
  costco: 'COST',
  'dollar general': 'DG',
  'dollar tree': 'DLTR',
  ross: 'ROST',
  tjx: 'TJX',
  'burlington': 'BURL',
  'five below': 'FIVE',
  'bath & body': 'BBWI',
  ulta: 'ULTA',
  sephora: 'LVMUY',
  'best buy': 'BBY',
  'bed bath': 'BBBY',
  nordstrom: 'JWN',
  macys: 'M',
  "macy's": 'M',
  kohls: 'KSS',
  "kohl's": 'KSS',
  'williams-sonoma': 'WSM',
  'restoration hardware': 'RH',
  rh: 'RH',
  autozone: 'AZO',
  "o'reilly": 'ORLY',
  'advance auto': 'AAP',
  carmax: 'KMX',
  'floor & decor': 'FND',
  tractor: 'TSCO',

  // Food & Beverage
  starbucks: 'SBUX',
  mcdonalds: 'MCD',
  "mcdonald's": 'MCD',
  chipotle: 'CMG',
  'yum brands': 'YUM',
  dominos: 'DPZ',
  "domino's": 'DPZ',
  'darden restaurants': 'DRI',
  cocacola: 'KO',
  'coca-cola': 'KO',
  coke: 'KO',
  pepsi: 'PEP',
  pepsico: 'PEP',
  'monster beverage': 'MNST',
  'constellation brands': 'STZ',
  'anheuser-busch': 'BUD',
  'molson coors': 'TAP',
  'boston beer': 'SAM',
  'kraft heinz': 'KHC',
  'general mills': 'GIS',
  kellogg: 'K',
  "kellogg's": 'K',
  hershey: 'HSY',
  "hershey's": 'HSY',
  mondelez: 'MDLZ',
  'campbell soup': 'CPB',
  smucker: 'SJM',
  'tyson foods': 'TSN',
  hormel: 'HRL',
  'beyond meat': 'BYND',
  sweetgreen: 'SG',
  'shake shack': 'SHAK',
  wingstop: 'WING',
  "papa john's": 'PZZA',
  'dutch bros': 'BROS',

  // Consumer Goods
  'procter & gamble': 'PG',
  'procter and gamble': 'PG',
  unilever: 'UL',
  'colgate-palmolive': 'CL',
  colgate: 'CL',
  'kimberly-clark': 'KMB',
  'estee lauder': 'EL',
  'church & dwight': 'CHD',
  clorox: 'CLX',

  // Apparel & Luxury
  nike: 'NKE',
  adidas: 'ADDYY',
  lululemon: 'LULU',
  'under armour': 'UAA',
  gap: 'GPS',
  'ralph lauren': 'RL',
  tapestry: 'TPR',
  coach: 'TPR',
  'kate spade': 'TPR',
  pvh: 'PVH',
  'calvin klein': 'PVH',
  'tommy hilfiger': 'PVH',
  vf: 'VFC',
  'vf corp': 'VFC',
  'north face': 'VFC',
  vans: 'VFC',
  capri: 'CPRI',
  'michael kors': 'CPRI',
  versace: 'CPRI',
  skechers: 'SKX',
  crocs: 'CROX',
  'on running': 'ONON',
  deckers: 'DECK',
  ugg: 'DECK',
  hoka: 'DECK',
  lvmh: 'LVMUY',
  'louis vuitton': 'LVMUY',
  hermes: 'HESAY',
  gucci: 'KERING',
  kering: 'PPRUY',
  burberry: 'BURBY',
  prada: 'PRDSY',

  // Telecom & Media
  att: 'T',
  'at&t': 'T',
  verizon: 'VZ',
  't-mobile': 'TMUS',
  tmobile: 'TMUS',
  comcast: 'CMCSA',
  charter: 'CHTR',
  'dish network': 'DISH',
  dish: 'DISH',
  lumen: 'LUMN',

  // Banks & Finance
  jpmorgan: 'JPM',
  'jp morgan': 'JPM',
  'bank of america': 'BAC',
  bofa: 'BAC',
  'goldman sachs': 'GS',
  goldman: 'GS',
  'morgan stanley': 'MS',
  berkshire: 'BRK-B',
  'berkshire hathaway': 'BRK-B',
  visa: 'V',
  mastercard: 'MA',
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
  'fifth third': 'FITB',
  regions: 'RF',
  'key bank': 'KEY',
  keycorp: 'KEY',
  'huntington bank': 'HBAN',
  'citizens bank': 'CFG',
  ally: 'ALLY',
  synchrony: 'SYF',
  'state street': 'STT',
  'northern trust': 'NTRS',
  'bank of ny': 'BK',
  'bny mellon': 'BK',

  // Asset Management
  blackrock: 'BLK',
  vanguard: 'VTI',
  schwab: 'SCHW',
  'charles schwab': 'SCHW',
  fidelity: 'FIS',
  't rowe': 'TROW',
  't. rowe price': 'TROW',
  'franklin templeton': 'BEN',
  invesco: 'IVZ',
  'kkr': 'KKR',
  blackstone: 'BX',
  carlyle: 'CG',
  apollo: 'APO',
  ares: 'ARES',

  // Insurance
  progressive: 'PGR',
  allstate: 'ALL',
  'travelers': 'TRV',
  chubb: 'CB',
  aig: 'AIG',
  metlife: 'MET',
  prudential: 'PRU',
  aflac: 'AFL',
  'hartford': 'HIG',
  'lincoln national': 'LNC',
  'principal financial': 'PFG',
  'marsh mclennan': 'MMC',
  aon: 'AON',
  willis: 'WTW',
  'arthur j gallagher': 'AJG',

  // Industrial
  caterpillar: 'CAT',
  deere: 'DE',
  'john deere': 'DE',
  '3m': 'MMM',
  honeywell: 'HON',
  'general electric': 'GE',
  ge: 'GE',
  siemens: 'SIEGY',
  ups: 'UPS',
  fedex: 'FDX',
  'union pacific': 'UNP',
  csx: 'CSX',
  norfolk: 'NSC',
  'norfolk southern': 'NSC',
  'canadian national': 'CNI',
  'canadian pacific': 'CP',
  emerson: 'EMR',
  rockwell: 'ROK',
  'parker hannifin': 'PH',
  illinois: 'ITW',
  'illinois tool': 'ITW',
  eaton: 'ETN',
  'johnson controls': 'JCI',
  trane: 'TT',
  carrier: 'CARR',
  otis: 'OTIS',
  'stanley black': 'SWK',
  'snap-on': 'SNA',
  fastenal: 'FAST',
  'w.w. grainger': 'GWW',
  grainger: 'GWW',
  'xylem': 'XYL',
  dover: 'DOV',
  'fortune brands': 'FBIN',
  masco: 'MAS',
  leggett: 'LEG',
  'cintas': 'CTAS',
  'waste management': 'WM',
  republic: 'RSG',
  'republic services': 'RSG',

  // Real Estate
  'american tower': 'AMT',
  crown: 'CCI',
  'crown castle': 'CCI',
  equinix: 'EQIX',
  'digital realty': 'DLR',
  prologis: 'PLD',
  'public storage': 'PSA',
  'extra space': 'EXR',
  realty: 'O',
  'realty income': 'O',
  'simon property': 'SPG',
  vici: 'VICI',
  'welltower': 'WELL',
  ventas: 'VTR',
  'avalonbay': 'AVB',
  'equity residential': 'EQR',
  'essex property': 'ESS',
  'camden property': 'CPT',
  'invitation homes': 'INVH',
  'american homes': 'AMH',
  cbre: 'CBRE',
  'jones lang': 'JLL',

  // ETFs (common names)
  spy: 'SPY',
  qqq: 'QQQ',
  iwm: 'IWM',
  dia: 'DIA',
  arkk: 'ARKK',
  'ark innovation': 'ARKK',
  arkg: 'ARKG',
  'ark genomics': 'ARKG',
  gld: 'GLD',
  slv: 'SLV',
  uso: 'USO',
  vxx: 'VXX',
  tqqq: 'TQQQ',
  sqqq: 'SQQQ',
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
