import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { ParsedAsset } from '../lib/parser';
import { fetchQuote, fetchChart, QuoteData, ChartData } from '../lib/api';
import { Chart } from './Chart';
import { SymbolStatus } from '../App';

interface AssetCardProps {
  asset: ParsedAsset;
  compact?: boolean;
  animationDelay?: number;
  isExiting?: boolean;
  onStatus?: (symbol: string, status: SymbolStatus) => void;
  isHighlighted?: boolean;
  assetKey?: string;
}

const TIME_RANGES = ['1D', '1W', '1M', '3M', '1Y', '5Y'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

export function AssetCard({ asset, compact = false, animationDelay = 0, isExiting = false, onStatus, isHighlighted = false, assetKey }: AssetCardProps) {
  const [range, setRange] = useState<TimeRange>('3M');
  const [expanded, setExpanded] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const reportedRef = useRef(false);

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
    if (reportedRef.current || isInitialLoading) return;

    if (hasFailed && onStatus) {
      onStatus(asset.symbol, 'failed');
      reportedRef.current = true;
    } else if (hasSucceeded && onStatus) {
      onStatus(asset.symbol, 'success');
      reportedRef.current = true;
    }
  }, [hasFailed, hasSucceeded, isInitialLoading, onStatus, asset.symbol]);

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
        return 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400';
      case 'option':
        return 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400';
      case 'bond':
        return 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400';
      case 'economic':
        return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400';
      default:
        return 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400';
    }
  };

  // Expanded overlay - rendered via portal to avoid clipping issues
  const expandedOverlay = expanded ? createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-8">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 animate-fade-in"
        onClick={() => setExpanded(false)}
      />
      {/* Expanded card - full screen on mobile, constrained on larger screens */}
      <div className="relative w-full h-full md:w-[85vw] md:h-[85vh] lg:w-[75vw] lg:h-[75vh] xl:max-w-6xl xl:max-h-[80vh] bg-white dark:bg-gray-900 rounded-lg md:rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="p-fluid-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-fluid-xs font-medium px-2 py-0.5 rounded-full ${getTypeBadgeColor()}`}>
                  {getTypeLabel()}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-fluid-sm font-medium">{asset.displaySymbol}</span>
              </div>
              <h3 className="text-fluid-2xl font-bold text-gray-900 dark:text-white mt-1 truncate">{quote?.name || asset.displaySymbol}</h3>
            </div>

            {quote && quote.price != null && (
              <div className="text-right flex-shrink-0">
                <p className="text-fluid-xl sm:text-fluid-2xl font-bold text-gray-900 dark:text-white">${quote.price.toFixed(2)}</p>
                {quote.change != null && quote.changePercent != null && (
                  <p className={`text-fluid-sm font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                  </p>
                )}
              </div>
            )}

            <button
              onClick={() => setExpanded(false)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 flex-shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Option details */}
          {asset.type === 'option' && asset.metadata && (
            <div className="flex items-center gap-2 sm:gap-4 mt-2 text-fluid-sm flex-wrap">
              <span className="text-gray-500 dark:text-gray-400">
                Strike: <span className="text-gray-900 dark:text-white">${asset.metadata.strike}</span>
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                Type: <span className={asset.metadata.callPut === 'call' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                  {asset.metadata.callPut?.toUpperCase()}
                </span>
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                Expiry: <span className="text-gray-900 dark:text-white">{asset.metadata.expiry}</span>
              </span>
            </div>
          )}
        </div>

        {/* Time range selector */}
        <div className="px-fluid-3 pt-fluid-2 flex-shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto">
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2 sm:px-3 py-1 text-fluid-sm font-medium rounded transition-colors flex-shrink-0 ${
                  range === r
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Chart area - fills remaining space */}
        <div className="flex-1 p-fluid-3 min-h-0">
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800/50 rounded-lg overflow-hidden">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-500 text-fluid-base">Loading...</div>
              </div>
            ) : chart?.data && chart.data.length > 0 ? (
              <Chart data={chart.data} isPositive={isPositive} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-gray-500 text-fluid-base">No chart data</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  const highlightGlow = isHighlighted ? 'shadow-[0_0_12px_rgba(59,130,246,0.5)] border-blue-500' : '';

  return (
    <div
      id={assetKey ? `asset-card-${assetKey}` : undefined}
      className={isExiting ? 'animate-fan-out' : 'animate-fan-in'}
      style={{ animationDelay: isExiting ? '0ms' : `${animationDelay}ms` }}
    >
      {expandedOverlay}
      <div
        className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer ${highlightGlow}`}
        onClick={() => setExpanded(true)}
      >
      {/* Header */}
      <div className={compact ? 'p-fluid-2' : 'p-fluid-3 border-b border-gray-200 dark:border-gray-800'}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-fluid-xs font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${getTypeBadgeColor()}`}
              >
                {getTypeLabel()}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-fluid-xs font-medium">
                {asset.displaySymbol}
              </span>
            </div>
            <h3 className={`${compact ? 'text-fluid-sm' : 'text-fluid-lg'} font-semibold text-gray-900 dark:text-white mt-0.5 truncate`}>
              {quote?.name || asset.displaySymbol}
            </h3>
          </div>

          {quote && quote.price != null && (
            <div className="text-right flex-shrink-0">
              <p className={`${compact ? 'text-fluid-sm' : 'text-fluid-lg'} font-semibold text-gray-900 dark:text-white`}>
                ${quote.price.toFixed(2)}
              </p>
              {quote.change != null && quote.changePercent != null && (
                <p
                  className={`${compact ? 'text-fluid-xs' : 'text-fluid-sm'} font-medium ${
                    isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
          <div className={`flex items-center gap-2 ${compact ? 'mt-1' : 'mt-2'} text-fluid-xs`}>
            <span className="text-gray-500 dark:text-gray-400">
              ${asset.metadata.strike}{' '}
              <span className={asset.metadata.callPut === 'call' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {asset.metadata.callPut === 'call' ? 'C' : 'P'}
              </span>
            </span>
            <span className="text-gray-400 dark:text-gray-500">{asset.metadata.expiry}</span>
          </div>
        )}

        {/* Bond details */}
        {asset.type === 'bond' && asset.metadata?.cusip && (
          <p className="mt-1 text-fluid-xs text-gray-500">Bond lookup N/A</p>
        )}
      </div>

      {/* Chart */}
      {asset.type !== 'bond' && (
        <div className={compact ? 'px-fluid-2 pb-fluid-2' : 'p-fluid-3'}>
          {/* Time range selector */}
          <div className="flex items-center gap-0.5 mb-1.5">
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                onClick={(e) => {
                  e.stopPropagation();
                  setRange(r);
                }}
                className={`px-1.5 py-0.5 text-fluid-xs font-medium rounded transition-colors ${
                  range === r
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Chart area - responsive height */}
          <div className={`${compact ? 'h-36 sm:h-40 md:h-44 lg:h-48' : 'h-40 sm:h-44 md:h-48 lg:h-52'} bg-gray-100 dark:bg-gray-800/50 rounded overflow-hidden`}>
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-pulse text-gray-500 text-fluid-xs">Loading...</div>
              </div>
            ) : chartError || quoteError ? (
              <div className="h-full flex items-center justify-center">
                <span className="text-red-500 dark:text-red-400 text-fluid-xs">Failed</span>
              </div>
            ) : chart?.data && chart.data.length > 0 ? (
              <Chart data={chart.data} isPositive={isPositive} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-gray-500 text-fluid-xs">No data</span>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
