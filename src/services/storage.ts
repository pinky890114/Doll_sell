import {
  INITIAL_HOME_CONFIG,
  INITIAL_PRODUCTS,
  INITIAL_SWATCHES,
} from '../data/seedData';
import type {
  AdminUser,
  CartItem,
  FabricSwatch,
  HomeConfig,
  Product,
} from '../types/store';

const STORAGE_KEYS = {
  products: 'yt_store_products_v3',
  swatches: 'yt_store_swatches_v3',
  homeConfig: 'yt_store_home_v3',
  favorites: 'yt_store_favorites_v2',
  cart: 'yt_store_cart_v3',
  adminSession: 'yt_store_admin_session_v2',
} as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors gracefully in prototype mode
  }
}

/**
 * Store repository abstraction.
 * Currently backed by LocalStorage for the interactive frontend prototype.
 * Swap these methods with REST / GraphQL / Firebase / Supabase API calls when moving to production.
 */
export const storeRepository = {
  loadProducts(): Product[] {
    const stored = readJson<Product[]>(STORAGE_KEYS.products, INITIAL_PRODUCTS);
    return stored.map((p, idx) => ({
      ...p,
      code: p.code || `YT-${101 + idx}`,
    }));
  },
  saveProducts(products: Product[]): void {
    writeJson(STORAGE_KEYS.products, products);
  },

  loadSwatches(): FabricSwatch[] {
    return readJson<FabricSwatch[]>(STORAGE_KEYS.swatches, INITIAL_SWATCHES);
  },
  saveSwatches(swatches: FabricSwatch[]): void {
    writeJson(STORAGE_KEYS.swatches, swatches);
  },

  loadHomeConfig(): HomeConfig {
    const stored = readJson<HomeConfig>(STORAGE_KEYS.homeConfig, INITIAL_HOME_CONFIG);
    const cleanedSubtitle =
      stored.brandSubtitle === '精選質感手作娃衣代理・溫柔日常穿搭'
        ? ''
        : (stored.brandSubtitle ?? INITIAL_HOME_CONFIG.brandSubtitle);
    return {
      ...INITIAL_HOME_CONFIG,
      ...stored,
      brandSubtitle: cleanedSubtitle,
      banner: {
        ...INITIAL_HOME_CONFIG.banner,
        ...(stored.banner || {}),
      },
      lineConfig: {
        ...INITIAL_HOME_CONFIG.lineConfig,
        ...(stored.lineConfig || {}),
      },
    };
  },
  saveHomeConfig(config: HomeConfig): void {
    writeJson(STORAGE_KEYS.homeConfig, config);
  },

  loadFavorites(): string[] {
    return readJson<string[]>(STORAGE_KEYS.favorites, []);
  },
  saveFavorites(favoriteIds: string[]): void {
    writeJson(STORAGE_KEYS.favorites, favoriteIds);
  },

  loadCart(): CartItem[] {
    return readJson<CartItem[]>(STORAGE_KEYS.cart, []);
  },
  saveCart(items: CartItem[]): void {
    writeJson(STORAGE_KEYS.cart, items);
  },

  loadAdminSession(): AdminUser | null {
    return readJson<AdminUser | null>(STORAGE_KEYS.adminSession, null);
  },
  saveAdminSession(user: AdminUser | null): void {
    if (!user) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEYS.adminSession);
      }
      return;
    }
    writeJson(STORAGE_KEYS.adminSession, user);
  },

  resetDemoData(): {
    products: Product[];
    swatches: FabricSwatch[];
    homeConfig: HomeConfig;
  } {
    writeJson(STORAGE_KEYS.products, INITIAL_PRODUCTS);
    writeJson(STORAGE_KEYS.swatches, INITIAL_SWATCHES);
    writeJson(STORAGE_KEYS.homeConfig, INITIAL_HOME_CONFIG);
    return {
      products: INITIAL_PRODUCTS,
      swatches: INITIAL_SWATCHES,
      homeConfig: INITIAL_HOME_CONFIG,
    };
  },
};

/**
 * Prototype Image Upload adapter.
 * Converts uploaded files into compressed data URLs for local persistence.
 * Replace with signed upload to Cloudflare R2 / S3 / Cloud Storage in production.
 */
export async function uploadImageLocally(file: File, maxDimension = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('無法讀取圖片檔案'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.84));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Prototype Admin Auth adapter.
 * Production deployments MUST verify credentials and issue signed sessions on the backend.
 */
export const DEMO_ADMIN_CREDENTIALS = {
  email: 'admin@yourtreasure.shop',
  passcode: 'yt2026',
} as const;

export function authenticateDemoAdmin(email: string, passcode: string): AdminUser | null {
  const normalizedEmail = email.trim().toLowerCase();
  if (
    normalizedEmail === DEMO_ADMIN_CREDENTIALS.email &&
    passcode.trim() === DEMO_ADMIN_CREDENTIALS.passcode
  ) {
    return {
      email: DEMO_ADMIN_CREDENTIALS.email,
      name: 'YourTreasure 管理員',
      role: 'admin',
      loggedInAt: new Date().toISOString(),
    };
  }
  return null;
}
