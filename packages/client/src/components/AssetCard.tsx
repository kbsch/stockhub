import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { ParsedAsset } from '../lib/parser';
import { fetchQuote, fetchChart, QuoteData, ChartData } from '../lib/api';
import { Chart } from './Chart';

interface AssetCardProps {
  asset: ParsedAsset;
  compact?: boolean;
  onStatus?: (symbol: string, status: 'success' | 'failed') => void;
  animationDelay?: number;
  isExiting?: boolean;
}

const TIME_RANGES = ['1D', '1W', '1M', '3M', '1Y', '5Y'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

export function AssetCard({ asset, compact = false, onStatus, animationDelay = 0, isExiting = false }: AssetCardProps) {
  const [range, setRange] = useState<TimeRange>('3M');
  const [reportedStatus, setReportedStatus] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Close expanded view on Escape key
  useEffect(() => {
    if (!expanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expanded]);

  // For options, we chart the underlying
  const chartSymbol = asset.metadata?.underlying || asset.symbol;
  const quoteSymbol = asset.type === 'bond' ? null : chartSymbol;

  const { data: quote, isLoading: quoteLoading, isError: quoteError } = useQuery<QuoteData>({
    queryKey: ['quote', quoteSymbol],
    queryFn: () => fetchQuote(quoteSymbol!),
    enabled: !!quoteSymbol,
    retry: 1,
  });

  const { data: chart, isLoading: chartLoading, isError: chartError } = useQuery<ChartData>({
    queryKey: ['chart', chartSymbol, range],
    queryFn: () => fetchChart(chartSymbol, range),
    enabled: asset.type !== 'bond',
    retry: 1,
  });

  const isInitialLoading = (quoteLoading || chartLoading) && !hasLoadedOnce;
  const hasFailed = (quoteError || chartError) && !quoteLoading && !chartLoading;
  const hasSucceeded = !quoteLoading && !chartLoading && !quoteError && !chartError && (quote || chart);

  // Track when we've successfully loaded data once
  useEffect(() => {
    if (hasSucceeded && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [hasSucceeded, hasLoadedOnce]);

  // Report status when initial loading completes
  useEffect(() => {
    if (reportedStatus || isInitialLoading) return;

    if (hasFailed && onStatus) {
      onStatus(asset.symbol, 'failed');
      setReportedStatus(true);
    } else if (hasSucceeded && onStatus) {
      onStatus(asset.symbol, 'success');
      setReportedStatus(true);
    }
  }, [hasFailed, hasSucceeded, isInitialLoading, onStatus, asset.symbol, reportedStatus]);

  // Don't render during initial load or if failed - only show when data is ready
  if (isInitialLoading || (hasFailed && !hasLoadedOnce)) {
    return null;
  }
  const isPositive = (quote?.change ?? 0) >= 0;

  const getTypeLabel = () => {
    switch (asset.type) {
      case 'stock':
        return 'Stock';
      case 'option':
        return 'Option';
      case 'bond':
        return 'Bond';
      case 'economic':
        return 'Economic';
      default:
        return '';
    }
  };

  const getTypeBadgeColor = () => {
    switch (asset.type) {
      case 'stock':
        return 'bg-blue-500/20 text-blue-400';
      case 'option':
        return 'bg-purple-500/20 text-purple-400';
      case 'bond':
        return 'bg-amber-500/20 text-amber-400';
      case 'economic':
        return 'bg-emerald-500/20 text-emerald-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Expanded overlay - rendered via portal to avoid clipping issues
  const expandedOverlay = expanded ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 animate-fade-in"
        onClick={() => setExpanded(false)}
      />
      {/* Expanded card */}
      <div className="relative w-[75vw] h-[75vh] bg-gray-900 rounded-xl border border-gray-700 overflow-hidden flex flex-col shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getTypeBadgeColor()}`}>
                  {getTypeLabel()}
                </span>
                <span className="text-gray-500 text-sm">{asset.originalText}</span>
              </div>
              <h3 className="text-2xl font-bold text-white mt-1">{asset.displaySymbol}</h3>
              {quote && <p className="text-sm text-gray-400">{quote.name}</p>}
            </div>

            {quote && quote.price != null && (
              <div className="text-right">
                <p className="text-2xl font-bold text-white">${quote.price.toFixed(2)}</p>
                {quote.change != null && quote.changePercent != null && (
                  <p className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => setExpanded(false)}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Option details */}
          {asset.type === 'option' && asset.metadata && (
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-gray-400">
                Strike: <span className="text-white">${asset.metadata.strike}</span>
              </span>
              <span className="text-gray-400">
                Type: <span className={asset.metadata.callPut === 'call' ? 'text-green-400' : 'text-red-400'}>
                  {asset.metadata.callPut?.toUpperCase()}
                </span>
              </span>
              <span className="text-gray-400">
                Expiry: <span className="text-white">{asset.metadata.expiry}</span>
              </span>
            </div>
          )}
        </div>

        {/* Time range selector */}
        <div className="px-4 pt-3 flex-shrink-0">
          <div className="flex items-center gap-1">
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  range === r
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Chart area - fills remaining space */}
        <div className="flex-1 p-4 min-h-0">
          <div className="w-full h-full bg-gray-800/50 rounded-lg overflow-hidden">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-500">Loading...</div>
              </div>
            ) : chart?.data && chart.data.length > 0 ? (
              <Chart data={chart.data} isPositive={isPositive} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-gray-500">No chart data</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div
      className={isExiting ? 'animate-fan-out' : 'animate-fan-in'}
      style={{ animationDelay: isExiting ? '0ms' : `${animationDelay}ms` }}
    >
      {expandedOverlay}
      <div
        className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden transition-all duration-200 hover:border-gray-600 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
        onClick={() => setExpanded(true)}
      >
      {/* Header */}
      <div className={compact ? 'p-2.5' : 'p-4 border-b border-gray-800'}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${getTypeBadgeColor()}`}
              >
                {getTypeLabel()}
              </span>
              <span className="text-gray-500 text-[10px] truncate">
                {asset.originalText}
              </span>
            </div>
            <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-semibold text-white mt-0.5`}>
              {asset.displaySymbol}
            </h3>
            {quote && !compact && (
              <p className="text-xs text-gray-400 truncate">{quote.name}</p>
            )}
          </div>

          {quote && quote.price != null && (
            <div className="text-right flex-shrink-0">
              <p className={`${compact ? 'text-sm' : 'text-lg'} font-semibold text-white`}>
                ${quote.price.toFixed(2)}
              </p>
              {quote.change != null && quote.changePercent != null && (
                <p
                  className={`${compact ? 'text-[10px]' : 'text-sm'} font-medium ${
                    isPositive ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
                </p>
              )}
            </div>
          )}
        </div>

        {/* Option details - compact inline */}
        {asset.type === 'option' && asset.metadata && (
          <div className={`flex items-center gap-2 ${compact ? 'mt-1' : 'mt-2'} text-[10px]`}>
            <span className="text-gray-400">
              ${asset.metadata.strike}{' '}
              <span className={asset.metadata.callPut === 'call' ? 'text-green-400' : 'text-red-400'}>
                {asset.metadata.callPut === 'call' ? 'C' : 'P'}
              </span>
            </span>
            <span className="text-gray-500">{asset.metadata.expiry}</span>
          </div>
        )}

        {/* Bond details */}
        {asset.type === 'bond' && asset.metadata?.cusip && (
          <p className="mt-1 text-[10px] text-gray-500">Bond lookup N/A</p>
        )}
      </div>

      {/* Chart */}
      {asset.type !== 'bond' && (
        <div className={compact ? 'px-2.5 pb-2.5' : 'p-4'}>
          {/* Time range selector */}
          <div className="flex items-center gap-0.5 mb-1.5">
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                onClick={(e) => {
                  e.stopPropagation();
                  setRange(r);
                }}
                className={`px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors ${
                  range === r
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Chart area */}
          <div className={`${compact ? 'h-44' : 'h-48'} bg-gray-800/50 rounded overflow-hidden`}>
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-500 text-xs">Loading...</div>
              </div>
            ) : chartError || quoteError ? (
              <div className="h-full flex items-center justify-center">
                <span className="text-red-400 text-xs">Failed</span>
              </div>
            ) : chart?.data && chart.data.length > 0 ? (
              <Chart data={chart.data} isPositive={isPositive} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-gray-500 text-xs">No data</span>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
