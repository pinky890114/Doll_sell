import React from 'react';
import { Heart } from 'lucide-react';
import type { CategoryId, Product } from '../types/store';
import { ProductCard } from './ProductCard';

interface FavoritesViewProps {
  products: Product[];
  favorites: string[];
  onToggleFavorite: (productId: string) => void;
  onSelectProduct: (productId: string) => void;
  onBrowseCatalog: (category: CategoryId | 'all') => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  products,
  favorites,
  onToggleFavorite,
  onSelectProduct,
  onBrowseCatalog,
}) => {
  const savedProducts = products.filter(
    (p) => p.isPublished && favorites.includes(p.id)
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 pb-12">
      <div className="border-b border-[#E5E0D8] pb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B2825]">
          我的收藏
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#6E6962] tabular-price">
          目前收藏了 {savedProducts.length} 件娃衣（儲存在您的瀏覽器裝置中）
        </p>
      </div>

      {savedProducts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[#E5E0D8] bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EFECE6] text-[#6E6962]">
            <Heart className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-lg font-medium text-[#2B2825]">
            還沒有收藏任何娃衣
          </h2>
          <p className="mt-1.5 text-sm text-[#6E6962] max-w-sm mx-auto">
            瀏覽商品時點擊右上角愛心，就能把喜歡的特色套組或客製款式保存在這裡，方便下次查看。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => onBrowseCatalog('featured')}
              className="min-h-[44px] rounded-xl bg-[#2B2825] px-5 text-sm font-medium text-white transition-colors hover:bg-[#3F3B37]"
            >
              逛逛特色娃衣
            </button>
            <button
              type="button"
              onClick={() => onBrowseCatalog('custom')}
              className="min-h-[44px] rounded-xl border border-[#DCD5CA] bg-white px-5 text-sm font-medium text-[#2B2825] transition-colors hover:border-[#2B2825]"
            >
              探索客製化娃衣
            </button>
          </div>
        </div>
      ) : (
        <div
          data-testid="favorites-grid"
          className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6"
        >
          {savedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={true}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};
