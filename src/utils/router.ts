import type { CatalogCategoryFilter } from '../types/store';

export type AppRoute =
  | { page: 'home' }
  | { page: 'catalog'; category: CatalogCategoryFilter }
  | { page: 'product'; productId: string }
  | { page: 'favorites' }
  | { page: 'admin' };

const VALID_CATEGORY_ROUTES: CatalogCategoryFilter[] = [
  'all',
  'proxy',
  'featured',
  'custom',
  'crochet',
  'crochet_bib',
  'crochet_outfit',
];

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

  if (clean === '/category') {
    return { page: 'catalog', category: 'all' };
  }

  const categoryMatch = clean.match(/^\/category\/([^/]+)$/);
  if (categoryMatch) {
    const slug = decodeURIComponent(categoryMatch[1]) as CatalogCategoryFilter;
    if (VALID_CATEGORY_ROUTES.includes(slug)) {
      return { page: 'catalog', category: slug };
    }
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
      : 'https://coldwear.atelier');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseOrigin}${normalizedPath}`;
}

export function buildProductShareUrl(productId: string, origin?: string): string {
  return buildAbsoluteUrl(buildRoutePath({ page: 'product', productId }), origin);
}

export function buildCategoryShareUrl(
  category: CatalogCategoryFilter,
  origin?: string
): string {
  return buildAbsoluteUrl(buildRoutePath({ page: 'catalog', category }), origin);
}
