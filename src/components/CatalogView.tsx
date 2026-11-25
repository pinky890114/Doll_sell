import React, { useMemo, useState } from 'react';
import { RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  DOLL_SIZES,
  STATUS_LABELS,
  type CatalogFilters,
  type CategoryId,
  type DollSize,
  type PriceRangeKey,
  type Product,
  type ProductStatus,
  type SortOption,
} from '../types/store';
import { filterAndSortProducts } from '../utils/pricing';
import { ProductCard } from './ProductCard';

interface CatalogViewProps {
  products: Product[];
  favorites: string[];
  filters: CatalogFilters;
  onFiltersChange: (next: CatalogFilters) => void;
  onToggleFavorite: (productId: string) => void;
  onSelectProduct: (productId: string) => void;
}

const PRICE_RANGES: { key: PriceRangeKey; label: string }[] = [
  { key: 'all', label: '全部價格' },
  { key: 'under_750', label: 'NT$ 750 以下' },
  { key: '750_to_900', label: 'NT$ 750 – 900' },
  { key: 'over_900', label: 'NT$ 900 以上' },
];

const STATUS_OPTIONS: { key: ProductStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部狀態' },
  { key: 'new', label: STATUS_LABELS.new },
  { key: 'in_stock', label: STATUS_LABELS.in_stock },
  { key: 'made_to_order', label: STATUS_LABELS.made_to_order },
  { key: 'sold_out', label: STATUS_LABELS.sold_out },
];

export const CatalogView: React.FC<CatalogViewProps> = ({
  products,
  favorites,
  filters,
  onFiltersChange,
  onToggleFavorite,
  onSelectProduct,
}) => {
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, filters),
    [products, filters]
  );

  const activeFilterCount =
    (filters.dollSize !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.priceRange !== 'all' ? 1 : 0);

  const setCategory = (category: CategoryId | 'all') =>
    onFiltersChange({ ...filters, category });

  const resetFilters = () =>
    onFiltersChange({
      ...filters,
      searchQuery: '',
      dollSize: 'all',
      status: 'all',
      priceRange: 'all',
      sortBy: 'default',
    });

  const headingTitle =
    filters.category === 'featured'
      ? '特色娃衣'
      : filters.category === 'custom'
      ? '客製化娃衣'
      : '全部商品分類';

  const headingSubtitle =
    filters.category === 'featured'
      ? '工坊原創配色成衣款式，支援尺寸與局部細節選配'
      : filters.category === 'custom'
      ? '自由挑選布料色卡與手作細節，即時試算專屬價格'
      : '瀏覽 YourTreasure娃衣代理 上架中的特色成衣與客製化款式（所有價格皆為預估報價）';

  const renderFilterControls = () => (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-[#6E6962] mb-2">適用娃娃尺寸</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onFiltersChange({ ...filters, dollSize: 'all' })}
            className={`min-h-[40px] rounded-lg border px-3.5 text-xs font-medium transition-colors whitespace-nowrap ${
              filters.dollSize === 'all'
                ? 'border-[#2B2825] bg-[#2B2825] text-white'
                : 'border-[#E5E0D8] bg-white text-[#2B2825] hover:border-[#2B2825]'
            }`}
          >
            全部尺寸
          </button>
          {DOLL_SIZES.map((size: DollSize) => (
            <button
              key={size}
              type="button"
              onClick={() => onFiltersChange({ ...filters, dollSize: size })}
              className={`min-h-[40px] rounded-lg border px-3.5 text-xs font-medium transition-colors whitespace-nowrap ${
                filters.dollSize === size
                  ? 'border-[#2B2825] bg-[#2B2825] text-white'
                  : 'border-[#E5E0D8] bg-white text-[#2B2825] hover:border-[#2B2825]'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-[#6E6962] mb-2">商品供應狀態</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onFiltersChange({ ...filters, status: item.key })}
              className={`min-h-[40px] rounded-lg border px-3.5 text-xs font-medium transition-colors whitespace-nowrap ${
                filters.status === item.key
                  ? 'border-[#2B2825] bg-[#2B2825] text-white'
                  : 'border-[#E5E0D8] bg-white text-[#2B2825] hover:border-[#2B2825]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-[#6E6962] mb-2">價格區間（新台幣）</p>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.key}
              type="button"
              onClick={() => onFiltersChange({ ...filters, priceRange: range.key })}
              className={`min-h-[40px] rounded-lg border px-3.5 text-xs font-medium transition-colors whitespace-nowrap ${
                filters.priceRange === range.key
                  ? 'border-[#2B2825] bg-[#2B2825] text-white'
                  : 'border-[#E5E0D8] bg-white text-[#2B2825] hover:border-[#2B2825]'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 pb-12">
      {/* Header & Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E0D8] pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B2825]">
            {headingTitle}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6E6962]">{headingSubtitle}</p>
        </div>

        <div
          role="tablist"
          aria-label="切換商品分類"
          className="inline-flex rounded-xl bg-[#EFECE6] p-1 self-start"
        >
          {(
            [
              { id: 'all', label: '全部商品' },
              { id: 'featured', label: '特色娃衣' },
              { id: 'custom', label: '客製化娃衣' },
            ] as const
          ).map((tab) => {
            const active = filters.category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(tab.id)}
                className={`min-h-[38px] rounded-lg px-3.5 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-white text-[#2B2825]'
                    : 'text-[#6E6962] hover:text-[#2B2825]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search, Sort & Filter Toolbar */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <label htmlFor="catalog-search" className="sr-only">
            在分類中搜尋商品
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6E6962]" />
          <input
            id="catalog-search"
            type="search"
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            placeholder="搜尋商品名稱、尺寸、蕾絲、布料…"
            className="w-full min-h-[44px] rounded-xl border border-[#E5E0D8] bg-white pl-10 pr-4 text-sm text-[#2B2825] placeholder:text-[#8E8880] focus:border-[#2B2825] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex-1 sm:flex-initial">
            <label htmlFor="catalog-sort" className="sr-only">
              商品排序方式
            </label>
            <select
              id="catalog-sort"
              value={filters.sortBy}
              onChange={(e) =>
                onFiltersChange({ ...filters, sortBy: e.target.value as SortOption })
              }
              className="w-full min-h-[44px] rounded-xl border border-[#E5E0D8] bg-white px-3.5 text-xs sm:text-sm text-[#2B2825] focus:border-[#2B2825] focus:outline-none"
            >
              <option value="default">預設順序</option>
              <option value="newest">最新上架</option>
              <option value="price_asc">價格由低到高</option>
              <option value="price_desc">價格由高到低</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setFilterDrawerOpen((prev) => !prev)}
            aria-expanded={filterDrawerOpen}
            className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl border px-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeFilterCount > 0 || filterDrawerOpen
                ? 'border-[#2B2825] bg-[#2B2825] text-white'
                : 'border-[#E5E0D8] bg-white text-[#2B2825] hover:border-[#2B2825]'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>篩選{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Desktop Collapsible Filter Panel */}
      {filterDrawerOpen && (
        <div className="hidden md:block mt-4 rounded-2xl border border-[#E5E0D8] bg-white p-5">
          {renderFilterControls()}
          <div className="mt-5 flex items-center justify-between border-t border-[#E5E0D8] pt-4">
            <p className="text-xs text-[#6E6962]">
              共符合 <span className="font-medium text-[#2B2825] tabular-price">{filteredProducts.length}</span> 件商品
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6962] hover:text-[#2B2825] min-h-[36px]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>重設條件</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet Filter Drawer */}
      {filterDrawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex items-end bg-[#2B2825]/45"
          role="dialog"
          aria-modal="true"
          aria-label="商品篩選條件"
          onClick={() => setFilterDrawerOpen(false)}
        >
          <div
            className="w-full max-h-[82vh] overflow-y-auto rounded-t-3xl bg-[#F7F5F0] p-5 pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#D6CFC5]" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-[#2B2825]">篩選商品</h2>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                aria-label="關閉篩選視窗"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[#6E6962]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {renderFilterControls()}

            <div className="mt-6 flex items-center gap-3 pt-4 border-t border-[#E5E0D8]">
              <button
                type="button"
                onClick={resetFilters}
                className="flex-1 min-h-[46px] rounded-xl border border-[#DCD5CA] bg-white text-sm font-medium text-[#2B2825]"
              >
                重設
              </button>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="flex-[2] min-h-[46px] rounded-xl bg-[#2B2825] text-sm font-medium text-white"
              >
                查看 {filteredProducts.length} 件商品
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Result Summary */}
      <div className="mt-4 mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6962]">
        <p className="tabular-price">
          顯示 {filteredProducts.length} 件商品
          {filters.dollSize !== 'all' && ` · 尺寸 ${filters.dollSize}`}
          {filters.status !== 'all' && ` · ${STATUS_LABELS[filters.status]}`}
          {filters.priceRange !== 'all' &&
            ` · ${PRICE_RANGES.find((r) => r.key === filters.priceRange)?.label}`}
        </p>
        {(activeFilterCount > 0 || filters.searchQuery.trim() !== '') && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-[#5F6F61] hover:underline"
          >
            清除全部條件
          </button>
        )}
      </div>

      {/* Product Grid — 2 columns on mobile, 3 on tablet, 4 on desktop */}
      {filteredProducts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-[#E5E0D8] bg-white px-6 py-14 text-center">
          <p className="font-display text-lg font-medium text-[#2B2825]">找不到符合條件的娃衣</p>
          <p className="mt-1.5 text-sm text-[#6E6962]">
            試試調整娃娃尺寸、價格區間，或清除關鍵字重新搜尋。
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2B2825] px-5 py-2.5 text-sm font-medium text-white min-h-[44px]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>重設所有篩選</span>
          </button>
        </div>
      ) : (
        <div
          data-testid="catalog-product-grid"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6"
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favorites.includes(product.id)}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      )}
    </div>
  );
};
