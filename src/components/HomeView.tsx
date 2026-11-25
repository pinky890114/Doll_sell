import React, { useState } from 'react';
import { ArrowRight, MessageCircle, Search, ShieldCheck } from 'lucide-react';
import type { CategoryId, HomeConfig, Product } from '../types/store';
import {
  buildLineCustomerServiceUrl,
  LINE_BRAND_GREEN,
  normalizeLineAccountId,
} from '../services/lineIntegration';
import { ProductCard } from './ProductCard';
import { PWAInstallButton } from './PWAInstallButton';
import { SafeImage } from './SafeImage';

interface HomeViewProps {
  homeConfig: HomeConfig;
  products: Product[];
  favorites: string[];
  onToggleFavorite: (productId: string) => void;
  onSelectProduct: (productId: string) => void;
  onNavigateCategory: (category: CategoryId | 'all', searchQuery?: string) => void;
  onOpenAdmin: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  homeConfig,
  products,
  favorites,
  onToggleFavorite,
  onSelectProduct,
  onNavigateCategory,
  onOpenAdmin,
}) => {
  const [searchInput, setSearchInput] = useState('');

  const publishedProducts = products
    .filter((p) => p.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const newArrivals = publishedProducts
    .filter((p) => p.isNewArrival)
    .slice(0, 4);

  const recommendedProducts = publishedProducts
    .filter((p) => p.isRecommended)
    .slice(0, 4);

  const featuredCount = publishedProducts.filter((p) => p.categoryId === 'featured').length;
  const customCount = publishedProducts.filter((p) => p.categoryId === 'custom').length;
  const lineServiceUrl = buildLineCustomerServiceUrl(homeConfig.lineConfig);
  const normalizedLineId = normalizeLineAccountId(homeConfig.lineConfig.officialAccountId);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigateCategory('all', searchInput.trim());
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pb-10">
      {/* Search Bar */}
      <section aria-label="商品搜尋" className="pt-3 pb-4 md:pt-6 md:pb-6">
        <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto md:mx-0">
          <label htmlFor="home-search-input" className="sr-only">
            搜尋娃衣名稱、尺寸或材質
          </label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6E6962]" />
          <input
            id="home-search-input"
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜尋娃衣、編號、尺寸或布料…"
            className="w-full min-h-[44px] rounded-xl border border-[#E5E0D8] bg-white pl-10 pr-20 text-sm text-[#2B2825] placeholder:text-[#8E8880] focus:border-[#2B2825] focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[#EFECE6] px-3 py-1.5 text-xs font-medium text-[#2B2825] transition-colors hover:bg-[#E5E0D8] min-h-[34px] whitespace-nowrap"
          >
            搜尋
          </button>
        </form>
      </section>

      {/* Brand Hero Banner */}
      <section aria-label="品牌形象" className="mb-8 md:mb-12">
        <div className="relative overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#EFECE6] aspect-[16/10] sm:aspect-[16/8] lg:aspect-[21/9]">
          <SafeImage
            src={homeConfig.banner.imageUrl}
            alt={homeConfig.banner.title}
            fallbackTitle={homeConfig.brandName}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B18]/88 via-[#1E1B18]/48 to-[#1E1B18]/10" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10 text-[#F7F5F0]">
            {homeConfig.brandSubtitle.trim() && (
              <p className="mb-1.5 text-xs sm:text-sm text-[#F7F5F0]/90 tracking-wide">
                {homeConfig.brandSubtitle}
              </p>
            )}
            <h1 className="font-display text-xl sm:text-3xl lg:text-4xl font-semibold leading-snug max-w-2xl">
              {homeConfig.banner.title}
            </h1>
            <p className="mt-2 hidden sm:block text-sm text-[#F7F5F0]/90 max-w-2xl leading-relaxed">
              {homeConfig.banner.subtitle}
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => onNavigateCategory(homeConfig.banner.targetCategory)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#F7F5F0] px-4 py-2.5 text-xs sm:text-sm font-medium text-[#2B2825] transition-colors hover:bg-white min-h-[42px] whitespace-nowrap"
              >
                <span>{homeConfig.banner.ctaLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Two Main Category Image Cards */}
      <section aria-labelledby="categories-heading" className="mb-10 md:mb-14">
        <div className="flex items-baseline justify-between mb-4">
          <h2 id="categories-heading" className="font-display text-lg sm:text-xl font-semibold text-[#2B2825]">
            商品分類
          </h2>
          <button
            type="button"
            onClick={() => onNavigateCategory('all')}
            className="text-xs sm:text-sm text-[#6E6962] hover:text-[#2B2825] transition-colors min-h-[40px] inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span>瀏覽全部</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:gap-6">
          <button
            type="button"
            onClick={() => onNavigateCategory('featured')}
            className="group relative overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#EFECE6] aspect-[4/5] sm:aspect-[16/11] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2B2825]"
          >
            <SafeImage
              src={homeConfig.featuredCategoryImage}
              alt="特色娃衣分類"
              fallbackTitle="特色娃衣"
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211E1B]/75 via-[#211E1B]/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-[#F7F5F0]">
              <p className="text-[11px] sm:text-xs text-[#F7F5F0]/80">
                精選成衣 · {featuredCount} 款
              </p>
              <h3 className="mt-0.5 font-display text-base sm:text-2xl font-semibold">
                特色娃衣
              </h3>
              <p className="mt-1 hidden sm:block text-xs text-[#F7F5F0]/80">
                日常溫柔系成衣套組，少量現貨與接單製作
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigateCategory('custom')}
            className="group relative overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#EFECE6] aspect-[4/5] sm:aspect-[16/11] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2B2825]"
          >
            <SafeImage
              src={homeConfig.customCategoryImage}
              alt="客製化娃衣分類"
              fallbackTitle="客製化娃衣"
              className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#211E1B]/75 via-[#211E1B]/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 text-[#F7F5F0]">
              <p className="text-[11px] sm:text-xs text-[#F7F5F0]/80">
                自由配色與布料色卡 · {customCount} 款
              </p>
              <h3 className="mt-0.5 font-display text-base sm:text-2xl font-semibold">
                客製化娃衣
              </h3>
              <p className="mt-1 hidden sm:block text-xs text-[#F7F5F0]/80">
                自選布料色卡、蝴蝶結與蕾絲，打造專屬穿搭
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section aria-labelledby="new-arrivals-heading" className="mb-10 md:mb-14">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 id="new-arrivals-heading" className="font-display text-lg sm:text-xl font-semibold text-[#2B2825]">
              最新商品
            </h2>
            <p className="text-xs text-[#6E6962] mt-0.5">本季新上架的手作款式</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateCategory('all')}
            className="text-xs sm:text-sm text-[#6E6962] hover:text-[#2B2825] transition-colors min-h-[40px] inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span>查看全部</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-6">
          {(newArrivals.length > 0 ? newArrivals : publishedProducts.slice(0, 4)).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favorites.includes(product.id)}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* Recommended Products Section */}
      <section aria-labelledby="recommended-heading" className="mb-12">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 id="recommended-heading" className="font-display text-lg sm:text-xl font-semibold text-[#2B2825]">
              推薦商品
            </h2>
            <p className="text-xs text-[#6E6962] mt-0.5">主理人精選人氣搭配</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateCategory('featured')}
            className="text-xs sm:text-sm text-[#6E6962] hover:text-[#2B2825] transition-colors min-h-[40px] inline-flex items-center gap-1 whitespace-nowrap"
          >
            <span>更多推薦</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-6">
          {(recommendedProducts.length > 0 ? recommendedProducts : publishedProducts.slice(0, 4)).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favorites.includes(product.id)}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelectProduct}
            />
          ))}
        </div>
      </section>

      {/* LINE Official Service & PWA Install Footer */}
      <footer className="border-t border-[#E5E0D8] pt-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* LINE Customer Service Entry */}
          <a
            href={lineServiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 rounded-xl border border-[#E5E0D8] bg-white px-4 py-3.5 text-left transition-colors hover:border-[#06C755] min-h-[48px]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                style={{ backgroundColor: LINE_BRAND_GREEN }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
              >
                <MessageCircle className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#2B2825]">
                  聯繫 LINE 官方客服
                </p>
                <p className="text-xs text-[#6E6962] truncate">
                  {normalizedLineId} · 詢問尺寸版型、布料配色與訂購進度
                </p>
              </div>
            </div>
            <span
              style={{ color: LINE_BRAND_GREEN }}
              className="shrink-0 whitespace-nowrap text-xs font-medium"
            >
              開啟 LINE
            </span>
          </a>

          <PWAInstallButton variant="card" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[#6E6962]">
          <div>
            <p className="font-display text-sm font-medium text-[#2B2825]">{homeConfig.brandName}</p>
            <p className="mt-1">
              所有網站標示價格皆為新台幣（NT$）預估報價，正式訂單仍需透過 LINE 客服確認。
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 text-xs text-[#6E6962] hover:text-[#2B2825] underline-offset-4 hover:underline min-h-[40px]"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>商品管理後台</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
