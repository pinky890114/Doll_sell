import type { CartItem } from '../types/store';

const STORAGE_KEYS = {
  favorites: 'yt_store_favorites_v2',
  cart: 'yt_store_cart_v3',
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
    // Ignore storage quota errors gracefully
  }
}

/**
 * Local browser persistence strictly for shopper favorites and shopping cart
 * (customers do not need to log in). Storefront catalog, swatches, and LINE config
 * are persisted in Firebase Firestore.
 */
export const localShopperStorage = {
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
};

/**
 * Compresses an uploaded image file so it fits comfortably within Firestore document
 * field limits while staying crisp on mobile product cards and previews.
 */
export async function uploadImageLocally(file: File, maxDimension = 720): Promise<string> {
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
        resolve(canvas.toDataURL('image/jpeg', 0.74));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
