import React from 'react';
import { Heart } from 'lucide-react';
import {
  getSectionForCategory,
  type CatalogCategoryFilter,
  type Product,
  type SectionVisibilityConfig,
} from '../types/store';
import { ProductCard } from './ProductCard';

interface FavoritesViewProps {
  products: Product[];
  favorites: string[];
  sectionVisibility: SectionVisibilityConfig;
  onToggleFavorite: (productId: string) => void;
  onSelectProduct: (productId: string) => void;
  onBrowseCatalog: (category: CatalogCategoryFilter) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  products,
  favorites,
  sectionVisibility,
  onToggleFavorite,
  onSelectProduct,
  onBrowseCatalog,
}) => {
  const savedProducts = products.filter(
    (p) =>
      p.isPublished &&
      sectionVisibility[getSectionForCategory(p.categoryId)] &&
      favorites.includes(p.id)
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 pb-12">
      <div className="border-b border-[#E5E0D8] pb-5">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B2825]">
          我的收藏
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-[#6E6962] tabular-price">
          目前收藏了 {savedProducts.length} 件商品（儲存在您的瀏覽器裝置中）
        </p>
      </div>

      {savedProducts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[#E5E0D8] bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EFECE6] text-[#6E6962]">
            <Heart className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-lg font-medium text-[#2B2825]">
            還沒有收藏任何商品
          </h2>
          <p className="mt-1.5 text-sm text-[#6E6962] max-w-sm mx-auto">
            瀏覽商品時點擊右上角愛心，就能把喜歡的娃衣或手工編織作品保存在這裡，方便下次查看。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {sectionVisibility.proxy && (
              <button
                type="button"
                onClick={() => onBrowseCatalog('proxy')}
                className="min-h-[44px] rounded-xl bg-[#2B2825] px-5 text-sm font-medium text-white transition-colors hover:bg-[#3F3B37]"
              >
                逛逛娃衣代理區
              </button>
            )}
            {sectionVisibility.crochet && (
              <button
                type="button"
                onClick={() => onBrowseCatalog('crochet')}
                className="min-h-[44px] rounded-xl border border-[#DCD5CA] bg-white px-5 text-sm font-medium text-[#2B2825] transition-colors hover:border-[#2B2825]"
              >
                探索毛線編織
              </button>
            )}
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
