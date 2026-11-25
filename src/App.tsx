/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Grid2X2, Heart, Home, ShoppingBag } from 'lucide-react';
import { auth } from './firebase';
import {
  INITIAL_HOME_CONFIG,
  INITIAL_PRODUCTS,
  INITIAL_SWATCHES,
} from './data/seedData';
import {
  getSectionForCategory,
  type AdminUser,
  type CartItem,
  type CatalogCategoryFilter,
  type CatalogFilters,
  type FabricSwatch,
  type HomeConfig,
  type Product,
} from './types/store';
import { localShopperStorage } from './services/storage';
import {
  checkIsVerifiedAdmin,
  deleteProductFromCloud,
  deleteSwatchFromCloud,
  saveHomeConfigToCloud,
  saveProductToCloud,
  saveSwatchToCloud,
  seedInitialStorefrontToCloud,
  signOutAdmin,
  subscribeHomeConfig,
  subscribeProducts,
  subscribeSwatches,
} from './services/firestoreStore';
import {
  buildRoutePath,
  parseRouteFromPath,
  type AppRoute,
} from './utils/router';
import { HomeView } from './components/HomeView';
import { CatalogView } from './components/CatalogView';
import { ProductDetailView } from './components/ProductDetailView';
import { FavoritesView } from './components/FavoritesView';
import { AdminView, type AuthGateState } from './components/AdminView';
import { CartDrawer } from './components/CartDrawer';
import { OfflineIndicator } from './components/PWAInstallButton';

const DEFAULT_FILTERS: CatalogFilters = {
  category: 'all',
  searchQuery: '',
  dollSize: 'all',
  status: 'all',
  priceRange: 'all',
  sortBy: 'default',
};

function BrandSpoolMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M9 8h14M9 24h14"
        stroke="#2B2825"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="11"
        y="8"
        width="10"
        height="16"
        rx="1.5"
        fill="#EFECE6"
        stroke="#2B2825"
        strokeWidth="1.6"
      />
      <path
        d="M11 12.5h10M11 16h10M11 19.5h10"
        stroke="#5F6F61"
        strokeWidth="1.3"
      />
      <path
        d="M21 18c2.6 0 4.2 1.5 4.2 3.4 0 2-1.8 3.2-4 3.2"
        stroke="#A6726A"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [swatches, setSwatches] = useState<FabricSwatch[]>(INITIAL_SWATCHES);
  const [homeConfig, setHomeConfig] = useState<HomeConfig>(INITIAL_HOME_CONFIG);
  const [favorites, setFavorites] = useState<string[]>(() =>
    localShopperStorage.loadFavorites()
  );
  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    localShopperStorage.loadCart()
  );
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [authGate, setAuthGate] = useState<AuthGateState>({
    loading: true,
    signedInEmail: null,
    emailVerified: false,
    isAdmin: false,
  });
  const [cloudError, setCloudError] = useState<string | null>(null);
  const seededOnceRef = useRef(false);

  const initialParsed =
    typeof window !== 'undefined'
      ? parseRouteFromPath(window.location.pathname)
      : ({ page: 'home' } as AppRoute);

  const [route, setRoute] = useState<AppRoute>(initialParsed);
  const [previousRoute, setPreviousRoute] = useState<AppRoute>({ page: 'home' });
  const [cartOpen, setCartOpen] = useState(false);
  const [filters, setFilters] = useState<CatalogFilters>(() => ({
    ...DEFAULT_FILTERS,
    category: initialParsed.page === 'catalog' ? initialParsed.category : 'all',
  }));

  // Firebase Auth listener
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      if (!firebaseUser) {
        setAdminUser(null);
        setAuthGate({
          loading: false,
          signedInEmail: null,
          emailVerified: false,
          isAdmin: false,
        });
        return;
      }

      try {
        const isAdmin = await checkIsVerifiedAdmin(firebaseUser);
        if (!active) return;
        setAuthGate({
          loading: false,
          signedInEmail: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          isAdmin,
        });
        if (isAdmin) {
          setAdminUser({
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || '天冷穿件衣 管理員',
            role: 'admin',
            loggedInAt: new Date().toISOString(),
          });
          if (!seededOnceRef.current) {
            seededOnceRef.current = true;
            void seedInitialStorefrontToCloud(false).catch((err) => {
              console.error('Initial cloud seed skipped:', err);
            });
          }
        } else {
          setAdminUser(null);
        }
      } catch (err) {
        console.error('Admin verification failed:', err);
        if (!active) return;
        setAdminUser(null);
        setAuthGate({
          loading: false,
          signedInEmail: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          isAdmin: false,
        });
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Firestore real-time catalog & storefront settings listeners
  useEffect(() => {
    if (authGate.loading) return;

    const unsubProducts = subscribeProducts(authGate.isAdmin, (cloudProducts, hasCloudDocs) => {
      if (hasCloudDocs) {
        setProducts(cloudProducts);
      } else {
        setProducts(INITIAL_PRODUCTS);
      }
    });

    const unsubSwatches = subscribeSwatches(authGate.isAdmin, (cloudSwatches, hasCloudDocs) => {
      if (hasCloudDocs) {
        setSwatches(cloudSwatches);
      } else {
        setSwatches(INITIAL_SWATCHES);
      }
    });

    const unsubConfig = subscribeHomeConfig((cloudConfig) => {
      if (cloudConfig) {
        setHomeConfig(cloudConfig);
      } else {
        setHomeConfig(INITIAL_HOME_CONFIG);
      }
    });

    return () => {
      unsubProducts();
      unsubSwatches();
      unsubConfig();
    };
  }, [authGate.loading, authGate.isAdmin]);

  const navigate = (nextRoute: AppRoute, replace = false) => {
    setRoute((current) => {
      if (nextRoute.page === 'product' && current.page !== 'product') {
        setPreviousRoute(current);
      }
      return nextRoute;
    });
    if (nextRoute.page === 'catalog') {
      setFilters((prev) => ({ ...prev, category: nextRoute.category }));
    }
    if (typeof window !== 'undefined') {
      const targetPath = buildRoutePath(nextRoute);
      if (window.location.pathname !== targetPath) {
        if (replace) {
          window.history.replaceState(null, '', targetPath);
        } else {
          window.history.pushState(null, '', targetPath);
        }
      }
    }
  };

  // Sync browser back/forward buttons with standalone URLs
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRouteFromPath(window.location.pathname);
      setRoute(parsed);
      if (parsed.page === 'catalog') {
        setFilters((prev) => ({ ...prev, category: parsed.category }));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [route]);

  const handleToggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(productId);
      const next = exists
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      localShopperStorage.saveFavorites(next);
      return next;
    });
  };

  const handleAddToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const next = [item, ...prev];
      localShopperStorage.saveCart(next);
      return next;
    });
  };

  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) => {
      const next = prev
        .map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0);
      localShopperStorage.saveCart(next);
      return next;
    });
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems((prev) => {
      const next = prev.filter((item) => item.cartItemId !== cartItemId);
      localShopperStorage.saveCart(next);
      return next;
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    localShopperStorage.saveCart([]);
  };

  const handleSaveProducts = async (next: Product[]) => {
    const previous = products;
    setProducts(next);
    setCloudError(null);
    try {
      const prevMap = new Map(previous.map((p) => [p.id, p]));
      const nextIds = new Set(next.map((p) => p.id));

      const deletions = previous
        .filter((p) => !nextIds.has(p.id))
        .map((p) => deleteProductFromCloud(p.id));

      const upserts = next
        .filter((p) => {
          const old = prevMap.get(p.id);
          return !old || JSON.stringify(old) !== JSON.stringify(p);
        })
        .map((p) => saveProductToCloud(p));

      await Promise.all([...deletions, ...upserts]);
    } catch {
      setCloudError('無法將商品變更同步至 Firebase 雲端資料庫，請確認管理員權限與圖片大小。');
    }
  };

  const handleSaveSwatches = async (next: FabricSwatch[]) => {
    const previous = swatches;
    setSwatches(next);
    setCloudError(null);
    try {
      const prevMap = new Map(previous.map((s) => [s.id, s]));
      const nextIds = new Set(next.map((s) => s.id));

      const deletions = previous
        .filter((s) => !nextIds.has(s.id))
        .map((s) => deleteSwatchFromCloud(s.id));

      const upserts = next
        .filter((s) => {
          const old = prevMap.get(s.id);
          return !old || JSON.stringify(old) !== JSON.stringify(s);
        })
        .map((s) => saveSwatchToCloud(s));

      await Promise.all([...deletions, ...upserts]);
    } catch {
      setCloudError('無法將色卡變更同步至 Firebase 雲端資料庫，請稍後再試。');
    }
  };

  const handleSaveHomeConfig = async (next: HomeConfig) => {
    setHomeConfig(next);
    setCloudError(null);
    try {
      await saveHomeConfigToCloud(next);
    } catch {
      setCloudError('無法將首頁與 LINE 設定同步至 Firebase 雲端資料庫，請確認管理員權限。');
    }
  };

  const handleResetDemoData = async () => {
    setCloudError(null);
    try {
      await seedInitialStorefrontToCloud(true);
      setProducts(INITIAL_PRODUCTS);
      setSwatches(INITIAL_SWATCHES);
      setHomeConfig(INITIAL_HOME_CONFIG);
    } catch {
      setCloudError('還原預設商品資料至雲端時發生錯誤，請確認管理員權限。');
    }
  };

  const handleAdminLogout = async () => {
    await signOutAdmin();
    setAdminUser(null);
  };

  const navigateToCategory = (category: CatalogCategoryFilter, searchQuery?: string) => {
    setFilters((prev) => ({
      ...prev,
      category,
      searchQuery: searchQuery !== undefined ? searchQuery : prev.searchQuery,
    }));
    navigate({ page: 'catalog', category });
  };

  const handleFiltersChange = (nextFilters: CatalogFilters) => {
    setFilters(nextFilters);
    if (route.page === 'catalog' && nextFilters.category !== route.category) {
      navigate({ page: 'catalog', category: nextFilters.category }, true);
    }
  };

  const openProductDetail = (productId: string) => {
    navigate({ page: 'product', productId });
  };

  const selectedProduct =
    route.page === 'product'
      ? products.find((p) => p.id === route.productId) ?? null
      : null;

  const sectionVisibility = homeConfig.sectionVisibility ?? {
    proxy: true,
    crochet: true,
  };

  const publishedFavoritesCount = products.filter(
    (p) =>
      p.isPublished &&
      sectionVisibility[getSectionForCategory(p.categoryId)] &&
      favorites.includes(p.id)
  ).length;

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const showMobileBottomNav =
    route.page === 'home' || route.page === 'catalog' || route.page === 'favorites';

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-[#2B2825]">
      {/* Sticky Top Header — 3-Zone Desktop Contract + Compact Mobile Top Bar (52px) */}
      <header className="sticky top-0 z-30 h-[52px] md:h-16 border-b border-[#E5E0D8] bg-[#F7F5F0]/95 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigate({ page: 'home' })}
            className="inline-flex items-center gap-2 font-display text-base sm:text-lg font-semibold tracking-tight text-[#2B2825] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2B2825]"
          >
            <BrandSpoolMark />
            <span>{homeConfig.brandName}</span>
          </button>

          {/* Zone 2: Desktop Single-Line Nav Links (5 concise links) */}
          <nav
            aria-label="主導覽列"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#6E6962]"
          >
            <button
              type="button"
              onClick={() => navigate({ page: 'home' })}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                route.page === 'home'
                  ? 'text-[#2B2825] border-b border-[#2B2825]'
                  : 'hover:text-[#2B2825]'
              }`}
            >
              首頁
            </button>
            {sectionVisibility.proxy && (
              <button
                type="button"
                onClick={() => navigateToCategory('proxy', '')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                  route.page === 'catalog' &&
                  (filters.category === 'proxy' ||
                    filters.category === 'featured' ||
                    filters.category === 'custom')
                    ? 'text-[#2B2825] border-b border-[#2B2825]'
                    : 'hover:text-[#2B2825]'
                }`}
              >
                娃衣代理區
              </button>
            )}
            {sectionVisibility.crochet && (
              <button
                type="button"
                onClick={() => navigateToCategory('crochet', '')}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                  route.page === 'catalog' &&
                  (filters.category === 'crochet' ||
                    filters.category === 'crochet_bib' ||
                    filters.category === 'crochet_outfit')
                    ? 'text-[#2B2825] border-b border-[#2B2825]'
                    : 'hover:text-[#2B2825]'
                }`}
              >
                毛線編織
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate({ page: 'favorites' })}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 tabular-price ${
                route.page === 'favorites'
                  ? 'text-[#2B2825] border-b border-[#2B2825]'
                  : 'hover:text-[#2B2825]'
              }`}
            >
              我的收藏{publishedFavoritesCount > 0 ? ` (${publishedFavoritesCount})` : ''}
            </button>
            <button
              type="button"
              onClick={() => navigate({ page: 'admin' })}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 ${
                route.page === 'admin'
                  ? 'text-[#2B2825] border-b border-[#2B2825]'
                  : 'hover:text-[#2B2825]'
              }`}
            >
              管理後台
            </button>
          </nav>

          {/* Zone 3: Single Primary Action (Shopping Cart) */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`開啟購物車，目前有 ${totalCartCount} 件商品`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCD5CA] bg-white px-3 py-1.5 md:px-3.5 md:py-2 text-xs font-medium text-[#2B2825] transition-colors hover:border-[#2B2825] whitespace-nowrap shrink-0 min-h-[38px]"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>購物車</span>
              {totalCartCount > 0 && (
                <span
                  data-testid="header-cart-count"
                  className="ml-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#2B2825] px-1 text-[10px] font-medium text-[#F7F5F0] tabular-price"
                >
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${showMobileBottomNav ? 'pb-18 md:pb-0' : ''}`}>
        {route.page === 'home' && (
          <HomeView
            homeConfig={homeConfig}
            products={products}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onSelectProduct={openProductDetail}
            onNavigateCategory={navigateToCategory}
            onOpenAdmin={() => navigate({ page: 'admin' })}
          />
        )}

        {route.page === 'catalog' && (
          <CatalogView
            products={products}
            favorites={favorites}
            filters={filters}
            sectionVisibility={sectionVisibility}
            brandName={homeConfig.brandName}
            onFiltersChange={handleFiltersChange}
            onToggleFavorite={handleToggleFavorite}
            onSelectProduct={openProductDetail}
          />
        )}

        {route.page === 'product' && selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            swatches={swatches}
            brandName={homeConfig.brandName}
            lineConfig={homeConfig.lineConfig}
            isFavorite={favorites.includes(selectedProduct.id)}
            onToggleFavorite={handleToggleFavorite}
            onAddToCart={handleAddToCart}
            onOpenCart={() => setCartOpen(true)}
            onBack={() =>
              navigate(
                previousRoute.page === 'product'
                  ? { page: 'catalog', category: selectedProduct.categoryId }
                  : previousRoute
              )
            }
            onNavigateCategory={(cat) => navigateToCategory(cat, '')}
          />
        )}

        {route.page === 'product' && !selectedProduct && (
          <div className="mx-auto max-w-md px-4 py-20 text-center">
            <p className="font-display text-lg text-[#2B2825]">找不到此商品資料</p>
            <button
              type="button"
              onClick={() => navigate({ page: 'home' })}
              className="mt-4 min-h-[44px] rounded-xl bg-[#2B2825] px-5 text-sm text-white"
            >
              返回首頁
            </button>
          </div>
        )}

        {route.page === 'favorites' && (
          <FavoritesView
            products={products}
            favorites={favorites}
            sectionVisibility={sectionVisibility}
            onToggleFavorite={handleToggleFavorite}
            onSelectProduct={openProductDetail}
            onBrowseCatalog={(cat) => navigateToCategory(cat, '')}
          />
        )}

        {route.page === 'admin' && (
          <AdminView
            adminUser={adminUser}
            authGate={authGate}
            cloudError={cloudError}
            products={products}
            swatches={swatches}
            homeConfig={homeConfig}
            onLogout={handleAdminLogout}
            onSaveProducts={handleSaveProducts}
            onSaveSwatches={handleSaveSwatches}
            onSaveHomeConfig={handleSaveHomeConfig}
            onResetDemoData={handleResetDemoData}
            onExitAdmin={() => navigate({ page: 'home' })}
          />
        )}
      </main>

      {/* Fixed Mobile Bottom Navigation Bar */}
      {showMobileBottomNav && (
        <nav
          aria-label="底部行動導覽列"
          className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-[#E5E0D8] bg-[#F7F5F0]/95 backdrop-blur-md pb-safe"
        >
          <div className="grid grid-cols-3 h-[58px]">
            <button
              type="button"
              onClick={() => navigate({ page: 'home' })}
              aria-current={route.page === 'home' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                route.page === 'home' ? 'text-[#2B2825]' : 'text-[#7E7870]'
              }`}
            >
              <Home
                className={`h-5 w-5 ${
                  route.page === 'home' ? 'stroke-[2.2]' : 'stroke-[1.7]'
                }`}
              />
              <span className="text-[11px] font-medium">首頁</span>
            </button>

            <button
              type="button"
              onClick={() => navigateToCategory(filters.category)}
              aria-current={route.page === 'catalog' ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                route.page === 'catalog' ? 'text-[#2B2825]' : 'text-[#7E7870]'
              }`}
            >
              <Grid2X2
                className={`h-5 w-5 ${
                  route.page === 'catalog' ? 'stroke-[2.2]' : 'stroke-[1.7]'
                }`}
              />
              <span className="text-[11px] font-medium">商品分類</span>
            </button>

            <button
              type="button"
              onClick={() => navigate({ page: 'favorites' })}
              aria-current={route.page === 'favorites' ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 transition-colors ${
                route.page === 'favorites' ? 'text-[#2B2825]' : 'text-[#7E7870]'
              }`}
            >
              <span className="relative">
                <Heart
                  className={`h-5 w-5 ${
                    route.page === 'favorites'
                      ? 'fill-[#A6726A] text-[#A6726A]'
                      : 'stroke-[1.7]'
                  }`}
                />
                {publishedFavoritesCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#2B2825] px-1 text-[10px] font-medium text-[#F7F5F0] tabular-price">
                    {publishedFavoritesCount}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-medium">我的收藏</span>
            </button>
          </div>
        </nav>
      )}

      {/* Shopping Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        items={cartItems}
        brandName={homeConfig.brandName}
        lineConfig={homeConfig.lineConfig}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onSelectProduct={openProductDetail}
      />

      <OfflineIndicator />
    </div>
  );
}
