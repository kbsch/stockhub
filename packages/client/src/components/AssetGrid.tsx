import { DisplayAsset } from '../App';
import { AssetCard } from './AssetCard';

interface AssetGridProps {
  assets: DisplayAsset[];
  onAssetStatus?: (symbol: string, status: 'success' | 'failed') => void;
}

export function AssetGrid({ assets, onAssetStatus }: AssetGridProps) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(308px, 384px))' }}
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
