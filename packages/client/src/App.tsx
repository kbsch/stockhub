import { useState, useCallback, useRef, useEffect } from 'react';
import { TextInput } from './components/TextInput';
import { AssetGrid } from './components/AssetGrid';
import { StatusTicker } from './components/StatusTicker';
import { parseAssets, ParsedAsset } from './lib/parser';

const MAX_ASSETS = 20;
const EXIT_ANIMATION_DURATION = 300;

export interface TickerStatus {
  symbol: string;
  status: 'success' | 'failed';
}

export interface DisplayAsset extends ParsedAsset {
  isExiting?: boolean;
}

function App() {
  const [assets, setAssets] = useState<DisplayAsset[]>([]);
  const [tickerStatuses, setTickerStatuses] = useState<TickerStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [inputText, setInputText] = useState('');
  const exitTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      exitTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const getAssetKey = (asset: ParsedAsset) => `${asset.type}-${asset.symbol}`;

  const markAssetsAsExiting = useCallback((currentAssets: DisplayAsset[], newAssetKeys: Set<string>) => {
    const updatedAssets: DisplayAsset[] = [];

    for (const asset of currentAssets) {
      const key = getAssetKey(asset);
      if (newAssetKeys.has(key)) {
        // Asset still exists, keep it (remove exiting flag if it had one)
        updatedAssets.push({ ...asset, isExiting: false });
        // Clear any pending exit timeout
        const timeout = exitTimeoutsRef.current.get(key);
        if (timeout) {
          clearTimeout(timeout);
          exitTimeoutsRef.current.delete(key);
        }
      } else if (!asset.isExiting) {
        // Asset is being removed, mark as exiting
        updatedAssets.push({ ...asset, isExiting: true });
        // Schedule actual removal
        const timeout = setTimeout(() => {
          setAssets(prev => prev.filter(a => getAssetKey(a) !== key));
          exitTimeoutsRef.current.delete(key);
        }, EXIT_ANIMATION_DURATION);
        exitTimeoutsRef.current.set(key, timeout);
      } else {
        // Already exiting, keep it
        updatedAssets.push(asset);
      }
    }

    return updatedAssets;
  }, []);

  const handleTextChange = useCallback((text: string) => {
    if (!text.trim()) {
      // Mark all as exiting
      setAssets(prev => {
        if (prev.length === 0) return prev;
        return markAssetsAsExiting(prev, new Set());
      });
      setTickerStatuses([]);
      setError(null);
      setTruncated(false);
      return;
    }

    try {
      setError(null);
      setTickerStatuses([]);
      let parsed = parseAssets(text);

      if (parsed.length > MAX_ASSETS) {
        parsed = parsed.slice(0, MAX_ASSETS);
        setTruncated(true);
      } else {
        setTruncated(false);
      }

      const newAssetKeys = new Set(parsed.map(getAssetKey));

      setAssets(prev => {
        // Mark removed assets as exiting
        const withExiting = markAssetsAsExiting(prev, newAssetKeys);

        // Add new assets
        const existingKeys = new Set(withExiting.map(getAssetKey));
        const newAssets = parsed.filter(a => !existingKeys.has(getAssetKey(a)));

        return [...withExiting, ...newAssets];
      });
    } catch (err) {
      console.error('Parse error:', err);
      setError('Failed to parse text. Please try again with different content.');
      setAssets(prev => markAssetsAsExiting(prev, new Set()));
    }
  }, [markAssetsAsExiting]);

  const handleAssetStatus = useCallback((symbol: string, status: 'success' | 'failed') => {
    setTickerStatuses(prev => {
      if (prev.some(t => t.symbol === symbol)) return prev;
      return [...prev, { symbol, status }];
    });
    if (status === 'failed') {
      // Mark as exiting instead of immediate removal
      setAssets(prev => {
        const newAssetKeys = new Set(
          prev
            .filter(a => a.symbol !== symbol && a.metadata?.underlying !== symbol)
            .map(getAssetKey)
        );
        return markAssetsAsExiting(prev, newAssetKeys);
      });
    }
  }, [markAssetsAsExiting]);

  const handleClear = () => {
    setInputText('');
    setAssets([]);
    setTickerStatuses([]);
    setError(null);
    setTruncated(false);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Status ticker bar - fixed at top, behind sidebar */}
      <div className="fixed top-0 left-0 right-0 z-0">
        <StatusTicker
          successSymbols={tickerStatuses.filter(s => s.status === 'success').map(s => s.symbol)}
          failedSymbols={tickerStatuses.filter(s => s.status === 'failed').map(s => s.symbol)}
        />
      </div>

      {/* Main layout with top padding for ticker */}
      <div className="flex flex-col md:flex-row pt-10">
        {/* Sidebar with text input - left side, overlays ticker */}
        <aside className="w-full md:w-72 lg:w-80 xl:w-96 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-800 bg-gray-900 p-fluid-3 flex flex-col md:h-screen md:sticky md:top-0 md:-mt-10 md:pt-fluid-3 relative z-10">
        <div className="mb-fluid-3">
          <h1 className="text-fluid-xl font-bold text-white">
            Stock<span className="text-blue-500">Hub</span>
          </h1>
          <p className="text-fluid-xs text-gray-400 mt-1">
            Paste text to extract assets
          </p>
        </div>

        <TextInput value={inputText} onChange={setInputText} onSubmit={handleTextChange} />

        {error && (
          <div className="mt-fluid-3 p-fluid-2 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 text-fluid-xs">{error}</p>
          </div>
        )}

        {assets.length > 0 && (
          <div className="mt-fluid-3 flex items-center justify-between">
            <span className="text-fluid-sm text-gray-400">
              {assets.length} asset{assets.length !== 1 ? 's' : ''}
              {truncated && <span className="text-amber-400"> (limited)</span>}
            </span>
            <button
              onClick={handleClear}
              className="text-fluid-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </aside>

        {/* Main content area with charts */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 p-fluid-3 overflow-auto">
            {assets.length > 0 ? (
              <AssetGrid assets={assets} onAssetStatus={handleAssetStatus} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-600">
                <p className="text-fluid-base">Charts will appear here</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
