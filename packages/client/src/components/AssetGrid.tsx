import { DisplayAsset } from '../App';
import { AssetCard } from './AssetCard';

interface AssetGridProps {
  assets: DisplayAsset[];
  onAssetStatus?: (symbol: string, status: 'success' | 'failed') => void;
}

export function AssetGrid({ assets, onAssetStatus }: AssetGridProps) {
  return (
    <div
      className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))] [grid-template-rows:masonry] auto-rows-max"
    >
      {assets.map((asset, index) => (
        <AssetCard
          key={`${asset.type}-${asset.symbol}`}
          asset={asset}
          compact
          onStatus={onAssetStatus}
          animationDelay={index * 50}
          isExiting={asset.isExiting}
        />
      ))}
    </div>
  );
}
