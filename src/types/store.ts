export type CategoryId = 'featured' | 'custom';

export type ProductStatus = 'new' | 'in_stock' | 'made_to_order' | 'sold_out';

export type DollSize = '努努' | '海星體' | '指偶' | 'es熊娃' | 'es醜娃';

export type VariantDisplayType = 'text' | 'color' | 'swatch';

export type SelectionMode = 'single' | 'multi';

export interface FabricSwatch {
  id: string;
  code: string;
  name: string;
  hex: string;
  materialNote: string;
  imageUrl: string;
}

export interface VariantOption {
  id: string;
  label: string;
  priceDelta: number;
  available: boolean;
  previewImage?: string;
  colorHex?: string;
  swatchId?: string;
}

export interface VariantGroup {
  id: string;
  name: string;
  description?: string;
  displayType: VariantDisplayType;
  selectionMode: SelectionMode;
  required: boolean;
  options: VariantOption[];
}

export interface Product {
  id: string;
  code: string;
  name: string;
  categoryId: CategoryId;
  basePrice: number;
  status: ProductStatus;
  dollSizes: DollSize[];
  summary: string;
  materialAndCare: string;
  leadTime: string;
  images: string[];
  variantGroups: VariantGroup[];
  isPublished: boolean;
  isRecommended: boolean;
  isNewArrival: boolean;
  sortOrder: number;
  createdAt: string;
  allowCustomNote: boolean;
}

export interface LineIntegrationConfig {
  officialAccountId: string;
  displayName: string;
  customerServiceGreeting: string;
  liffId?: string;
}

export interface BannerConfig {
  title: string;
  subtitle: string;
  ctaLabel: string;
  targetCategory: CategoryId | 'all';
  imageUrl: string;
}

export interface HomeConfig {
  brandName: string;
  brandSubtitle: string;
  banner: BannerConfig;
  featuredCategoryImage: string;
  customCategoryImage: string;
  lineConfig: LineIntegrationConfig;
}

export interface AdminUser {
  email: string;
  name: string;
  role: 'admin';
  loggedInAt: string;
}

export type SelectedVariantsMap = Record<string, string[]>;

export interface CartItemSpecEntry {
  groupId: string;
  groupName: string;
  optionId: string;
  optionLabel: string;
  priceDelta: number;
  swatchCode?: string;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  productCode: string;
  productName: string;
  categoryId: CategoryId;
  thumbnail: string;
  dollSizeText: string;
  basePrice: number;
  modifierTotal: number;
  unitEstimatedPrice: number;
  quantity: number;
  specs: CartItemSpecEntry[];
  customNote: string;
  addedAt: string;
}

export type SortOption = 'default' | 'newest' | 'price_asc' | 'price_desc';

export type PriceRangeKey = 'all' | 'under_750' | '750_to_900' | 'over_900';

export interface CatalogFilters {
  category: CategoryId | 'all';
  searchQuery: string;
  dollSize: DollSize | 'all';
  status: ProductStatus | 'all';
  priceRange: PriceRangeKey;
  sortBy: SortOption;
  includeUnpublished?: boolean;
}

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  featured: '特色娃衣',
  custom: '客製化娃衣',
};

export const STATUS_LABELS: Record<ProductStatus, string> = {
  new: '新品',
  in_stock: '現貨',
  made_to_order: '接單製作',
  sold_out: '售完',
};

export const DOLL_SIZES: DollSize[] = ['努努', '海星體', '指偶', 'es熊娃', 'es醜娃'];
