export type StoreSectionId = 'proxy' | 'crochet';

export type CategoryId =
  | 'featured'
  | 'custom'
  | 'crochet_bib'
  | 'crochet_outfit';

export type CatalogCategoryFilter = CategoryId | StoreSectionId | 'all';

export type ProductStatus = 'new' | 'in_stock' | 'made_to_order' | 'sold_out';

export type DollSize = '努努' | '海星體' | '指偶' | 'es熊娃' | 'es醜娃';

export type VariantDisplayType = 'text' | 'color' | 'swatch';

export type SelectionMode = 'single' | 'multi';

export type SwatchLibraryType =
  | 'fabric'
  | 'rhinestone'
  | 'eye_color'
  | 'ribbon_color'
  | 'yarn';

export interface FabricSwatch {
  id: string;
  libraryType: SwatchLibraryType;
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
  swatchLibrary?: SwatchLibraryType;
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
  targetCategory: CatalogCategoryFilter;
  imageUrl: string;
}

export interface SectionVisibilityConfig {
  proxy: boolean;
  crochet: boolean;
}

export interface HomeConfig {
  brandName: string;
  brandSubtitle: string;
  banner: BannerConfig;
  featuredCategoryImage: string;
  customCategoryImage: string;
  crochetBibCategoryImage: string;
  crochetOutfitCategoryImage: string;
  sectionVisibility: SectionVisibilityConfig;
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
  category: CatalogCategoryFilter;
  searchQuery: string;
  dollSize: DollSize | 'all';
  status: ProductStatus | 'all';
  priceRange: PriceRangeKey;
  sortBy: SortOption;
  includeUnpublished?: boolean;
}

export const SECTION_LABELS: Record<StoreSectionId, string> = {
  proxy: '娃衣代理區',
  crochet: '毛線編織',
};

export const SECTION_CATEGORIES: Record<StoreSectionId, CategoryId[]> = {
  proxy: ['featured', 'custom'],
  crochet: ['crochet_bib', 'crochet_outfit'],
};

export function getSectionForCategory(categoryId: CategoryId): StoreSectionId {
  return categoryId === 'crochet_bib' || categoryId === 'crochet_outfit'
    ? 'crochet'
    : 'proxy';
}

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  featured: '特色娃衣',
  custom: '客製化娃衣',
  crochet_bib: '娃用圍兜兜',
  crochet_outfit: '鉤織娃衣',
};

export const STATUS_LABELS: Record<ProductStatus, string> = {
  new: '新品',
  in_stock: '現貨',
  made_to_order: '接單製作',
  sold_out: '售完',
};

export const DOLL_SIZES: DollSize[] = ['努努', '海星體', '指偶', 'es熊娃', 'es醜娃'];

export const SWATCH_LIBRARY_ORDER: SwatchLibraryType[] = [
  'fabric',
  'rhinestone',
  'eye_color',
  'ribbon_color',
  'yarn',
];

export const SWATCH_LIBRARY_LABELS: Record<SwatchLibraryType, string> = {
  fabric: '色卡庫',
  rhinestone: '鑽盤庫',
  eye_color: '眼睛顏色',
  ribbon_color: '緞帶顏色',
  yarn: '線材庫',
};

export interface SwatchLibraryMeta {
  id: SwatchLibraryType;
  label: string;
  itemLabel: string;
  sectionHint: string;
  codePrefix: string;
  description: string;
  codePlaceholder: string;
  namePlaceholder: string;
  notePlaceholder: string;
}

export const SWATCH_LIBRARY_META: Record<SwatchLibraryType, SwatchLibraryMeta> = {
  fabric: {
    id: 'fabric',
    label: '色卡庫',
    itemLabel: '布料色卡',
    sectionHint: '娃衣代理區',
    codePrefix: 'SW',
    description: '娃衣代理區共用的布料色卡，修改後前台商品將同步更新。',
    codePlaceholder: '例如 LN-07',
    namePlaceholder: '例如 焦糖奶霜二重紗',
    notePlaceholder: '描述布料觸感、厚度與適合製作的款式',
  },
  rhinestone: {
    id: 'rhinestone',
    label: '鑽盤庫',
    itemLabel: '鑽盤',
    sectionHint: '娃衣代理區',
    codePrefix: 'RH',
    description: '集中管理水鑽、珍珠、愛心鑽等鑽盤款式，供商品規格重複引用並放大檢視。',
    codePlaceholder: '例如 RH-04',
    namePlaceholder: '例如 冰透AB極光水鑽盤',
    notePlaceholder: '描述鑽飾尺寸、切面光澤、搭配配件建議',
  },
  eye_color: {
    id: 'eye_color',
    label: '眼睛顏色',
    itemLabel: '眼睛顏色',
    sectionHint: '娃衣代理區',
    codePrefix: 'EY',
    description: '集中管理娃娃或娃衣動物造型適用的眼睛色選，讓顧客下單時直覺點選。',
    codePlaceholder: '例如 EY-05',
    namePlaceholder: '例如 焦糖琥珀玻璃眼',
    notePlaceholder: '描述眼珠材質、光澤感或適配頭飾款式',
  },
  ribbon_color: {
    id: 'ribbon_color',
    label: '緞帶顏色',
    itemLabel: '緞帶顏色',
    sectionHint: '共用素材',
    codePrefix: 'RB',
    description: '集中管理絲緞、羅紋與絲絨蝴蝶結緞帶色卡，方便代理區與編織區商品快速綁定。',
    codePlaceholder: '例如 RB-05',
    namePlaceholder: '例如 霧灰玫瑰絲緞帶',
    notePlaceholder: '描述緞帶寬度、霧面／亮面光澤與綁結質感',
  },
  yarn: {
    id: 'yarn',
    label: '線材庫',
    itemLabel: '編織線材',
    sectionHint: '毛線編織',
    codePrefix: 'YN',
    description: '毛線編織專用線材庫（適用娃用圍兜兜、鉤織娃衣），管理牛奶棉、蕾絲線與馬海毛色號。',
    codePlaceholder: '例如 YN-05',
    namePlaceholder: '例如 奶霜四股牛奶棉',
    notePlaceholder: '描述線材股數、柔軟度、粗細與適合鉤織的單品',
  },
};
