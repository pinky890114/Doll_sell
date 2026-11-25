import type { CategoryId } from '../types/store';

export type AppRoute =
  | { page: 'home' }
  | { page: 'catalog'; category: CategoryId | 'all' }
  | { page: 'product'; productId: string }
  | { page: 'favorites' }
  | { page: 'admin' };

export function parseRouteFromPath(pathname: string): AppRoute {
  const clean = pathname.replace(/\/+$/, '') || '/';

  if (clean === '/' || clean === '') {
    return { page: 'home' };
  }

  if (clean === '/favorites') {
    return { page: 'favorites' };
  }

  if (clean === '/admin') {
    return { page: 'admin' };
  }

  if (clean === '/category' || clean === '/category/all') {
    return { page: 'catalog', category: 'all' };
  }

  if (clean === '/category/featured') {
    return { page: 'catalog', category: 'featured' };
  }

  if (clean === '/category/custom') {
    return { page: 'catalog', category: 'custom' };
  }

  const productMatch = clean.match(/^\/product\/([^/]+)$/);
  if (productMatch) {
    return {
      page: 'product',
      productId: decodeURIComponent(productMatch[1]),
    };
  }

  return { page: 'home' };
}

export function buildRoutePath(route: AppRoute): string {
  switch (route.page) {
    case 'home':
      return '/';
    case 'catalog':
      return `/category/${route.category}`;
    case 'product':
      return `/product/${encodeURIComponent(route.productId)}`;
    case 'favorites':
      return '/favorites';
    case 'admin':
      return '/admin';
  }
}

export function buildAbsoluteUrl(path: string, origin?: string): string {
  const baseOrigin =
    origin ??
    (typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://yourtreasure.atelier');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseOrigin}${normalizedPath}`;
}

export function buildProductShareUrl(productId: string, origin?: string): string {
  return buildAbsoluteUrl(buildRoutePath({ page: 'product', productId }), origin);
}

export function buildCategoryShareUrl(
  category: CategoryId | 'all',
  origin?: string
): string {
  return buildAbsoluteUrl(buildRoutePath({ page: 'catalog', category }), origin);
}
