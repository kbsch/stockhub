import { DisplayAsset, SymbolStatus } from '../App';
import { AssetCard } from './AssetCard';

interface AssetGridProps {
  assets: DisplayAsset[];
  onSymbolStatus?: (symbol: string, status: SymbolStatus) => void;
  highlightedAsset?: string | null;
}

export function AssetGrid({ assets, onSymbolStatus, highlightedAsset }: AssetGridProps) {
  return (
    <div
      className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))] [grid-template-rows:masonry] auto-rows-max"
    >
      {assets.map((asset, index) => {
        const assetKey = `${asset.type}-${asset.symbol}`;
        return (
          <AssetCard
            key={assetKey}
            asset={asset}
            compact
            animationDelay={index * 50}
            isExiting={asset.isExiting}
            onStatus={onSymbolStatus}
            isHighlighted={highlightedAsset === assetKey}
            assetKey={assetKey}
          />
        );
      })}
    </div>
  );
}
