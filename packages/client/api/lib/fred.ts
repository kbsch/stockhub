export interface FredSeries {
  id: string;
  name: string;
  yahooSymbol?: string;
}

export const ECONOMIC_INDICATORS: Record<string, FredSeries> = {
  DXY: { id: 'DTWEXBGS', name: 'US Dollar Index', yahooSymbol: 'DX-Y.NYB' },
  VIX: { id: 'VIXCLS', name: 'CBOE Volatility Index', yahooSymbol: '^VIX' },
  TNX: { id: 'DGS10', name: '10-Year Treasury Yield', yahooSymbol: '^TNX' },
  TYX: { id: 'DGS30', name: '30-Year Treasury Yield', yahooSymbol: '^TYX' },
  FVX: { id: 'DGS5', name: '5-Year Treasury Yield', yahooSymbol: '^FVX' },
  IRX: { id: 'DTB3', name: '13-Week Treasury Bill', yahooSymbol: '^IRX' },
  'CASE-SHILLER': { id: 'CSUSHPINSA', name: 'Case-Shiller Home Price Index' },
  CPI: { id: 'CPIAUCSL', name: 'Consumer Price Index' },
  UNEMPLOYMENT: { id: 'UNRATE', name: 'Unemployment Rate' },
  GDP: { id: 'GDP', name: 'Gross Domestic Product' },
  FEDFUNDS: { id: 'FEDFUNDS', name: 'Federal Funds Rate' },
  M2: { id: 'M2SL', name: 'M2 Money Supply' },
};

export function getEconomicIndicator(name: string): FredSeries | null {
  const upper = name.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  return ECONOMIC_INDICATORS[upper] || null;
}

export function isEconomicIndicator(name: string): boolean {
  return getEconomicIndicator(name) !== null;
}
