import { useState, useCallback, useRef, useEffect } from 'react';
import { TextInput } from './components/TextInput';
import { AssetGrid } from './components/AssetGrid';
import { parseAssets, ParsedAsset } from './lib/parser';

const MAX_ASSETS = 20;
const EXIT_ANIMATION_DURATION = 300;

export interface DisplayAsset extends ParsedAsset {
  isExiting?: boolean;
}

export type SymbolStatus = 'success' | 'failed';

function App() {
  const [assets, setAssets] = useState<DisplayAsset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [inputText, setInputText] = useState('');
  const [symbolStatuses, setSymbolStatuses] = useState<Record<string, SymbolStatus>>({});
  const [highlightedAsset, setHighlightedAsset] = useState<string | null>(null);
  const exitTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      exitTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
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
      setError(null);
      setTruncated(false);
      return;
    }

    try {
      setError(null);
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

  const handleSymbolStatus = useCallback((symbol: string, status: SymbolStatus) => {
    setSymbolStatuses(prev => {
      if (prev[symbol] === status) return prev;
      return { ...prev, [symbol]: status };
    });
  }, []);

  const handleClear = () => {
    setInputText('');
    setAssets([]);
    setSymbolStatuses({});
    setHighlightedAsset(null);
    setError(null);
    setTruncated(false);
  };

  const handleBubbleClick = (assetKey: string) => {
    // Clear any existing highlight timeout
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    // Set the highlighted asset
    setHighlightedAsset(assetKey);

    // Scroll to the chart
    const element = document.getElementById(`asset-card-${assetKey}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Clear highlight after 2 seconds
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedAsset(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row">
      {/* Sidebar with text input */}
      <aside className="w-full md:w-72 lg:w-80 xl:w-96 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-800 bg-gray-900 p-fluid-3 flex flex-col md:h-screen md:sticky md:top-0">
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
          <>
            <div className="mt-fluid-3 flex items-center justify-between">
              <span className="text-fluid-sm text-gray-400">
                {assets.length} asset{assets.length !== 1 ? 's' : ''}
                {truncated && <span className="text-amber-400"> (limited)</span>}
              </span>
              <button
                onClick={handleClear}
                className="px-3 py-1 text-fluid-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                Clear
              </button>
            </div>

            {/* Ticker status bubbles */}
            <div className="mt-fluid-2 flex flex-wrap gap-1.5">
              {assets.filter(a => !a.isExiting).map(asset => {
                const assetKey = getAssetKey(asset);
                const status = symbolStatuses[asset.symbol];
                const isHighlighted = highlightedAsset === assetKey;
                const borderColor = status === 'success'
                  ? 'border-green-500'
                  : status === 'failed'
                    ? 'border-red-500'
                    : 'border-gray-600';
                const glowClass = isHighlighted
                  ? status === 'success'
                    ? 'shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                    : status === 'failed'
                      ? 'shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                      : 'shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                  : '';
                return (
                  <button
                    key={assetKey}
                    onClick={() => handleBubbleClick(assetKey)}
                    className={`px-2 py-0.5 text-fluid-xs rounded-full border ${borderColor} text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 transition-all cursor-pointer ${glowClass}`}
                  >
                    {asset.displaySymbol}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </aside>

      {/* Main content area with charts */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 p-fluid-3 overflow-auto">
          {assets.length > 0 ? (
            <AssetGrid assets={assets} onSymbolStatus={handleSymbolStatus} highlightedAsset={highlightedAsset} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-600">
              <p className="text-fluid-base">Charts will appear here</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
