import {
  CATEGORY_LABELS,
  getSectionForCategory,
  type CartItem,
  type CatalogFilters,
  type FabricSwatch,
  type Product,
  type SectionVisibilityConfig,
  type SelectedVariantsMap,
} from '../types/store';
import { buildProductShareUrl } from './router';

export interface PriceBreakdownItem {
  groupId: string;
  groupName: string;
  optionId: string;
  optionLabel: string;
  priceDelta: number;
  swatchCode?: string;
}

export interface PriceCalculationResult {
  basePrice: number;
  modifierTotal: number;
  totalPrice: number;
  breakdown: PriceBreakdownItem[];
}

export interface VariantValidationResult {
  isValid: boolean;
  isSoldOut: boolean;
  missingGroupIds: string[];
  missingGroupNames: string[];
}

export function formatTWD(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `NT$ ${safeAmount.toLocaleString('zh-TW')}`;
}

/**
 * Returns an empty initial selection map so customers explicitly confirm
 * all required product variants before adding to cart or ordering via LINE.
 */
export function getEmptySelections(product: Product): SelectedVariantsMap {
  const selections: SelectedVariantsMap = {};
  for (const group of product.variantGroups) {
    selections[group.id] = [];
  }
  return selections;
}

export function getDefaultSelections(product: Product): SelectedVariantsMap {
  const selections: SelectedVariantsMap = {};
  for (const group of product.variantGroups) {
    if (group.selectionMode === 'single') {
      const firstAvailable = group.options.find((o) => o.available);
      if (firstAvailable) {
        selections[group.id] = [firstAvailable.id];
      } else if (group.options.length > 0 && group.required) {
        selections[group.id] = [group.options[0].id];
      } else {
        selections[group.id] = [];
      }
    } else {
      selections[group.id] = [];
    }
  }
  return selections;
}

export function validateRequiredVariants(
  product: Product,
  selections: SelectedVariantsMap
): VariantValidationResult {
  const isSoldOut = product.status === 'sold_out';
  const missingGroupIds: string[] = [];
  const missingGroupNames: string[] = [];

  for (const group of product.variantGroups) {
    if (!group.required) continue;
    const selectedIds = selections[group.id] ?? [];
    const hasValidSelection = selectedIds.some((id) => {
      const opt = group.options.find((o) => o.id === id);
      return Boolean(opt && opt.available);
    });
    if (!hasValidSelection) {
      missingGroupIds.push(group.id);
      missingGroupNames.push(group.name);
    }
  }

  return {
    isValid: !isSoldOut && missingGroupIds.length === 0,
    isSoldOut,
    missingGroupIds,
    missingGroupNames,
  };
}

export function calculateProductPrice(
  product: Product,
  selections: SelectedVariantsMap,
  swatches: FabricSwatch[] = []
): PriceCalculationResult {
  const swatchMap = new Map(swatches.map((s) => [s.id, s]));
  const breakdown: PriceBreakdownItem[] = [];
  let modifierTotal = 0;

  for (const group of product.variantGroups) {
    const selectedIds = selections[group.id] ?? [];
    for (const optionId of selectedIds) {
      const option = group.options.find((o) => o.id === optionId);
      if (!option) continue;
      const swatch = option.swatchId ? swatchMap.get(option.swatchId) : undefined;
      const delta = Number.isFinite(option.priceDelta) ? option.priceDelta : 0;
      modifierTotal += delta;
      breakdown.push({
        groupId: group.id,
        groupName: group.name,
        optionId: option.id,
        optionLabel: swatch ? `${swatch.name}` : option.label,
        priceDelta: delta,
        swatchCode: swatch?.code,
      });
    }
  }

  return {
    basePrice: product.basePrice,
    modifierTotal,
    totalPrice: product.basePrice + modifierTotal,
    breakdown,
  };
}

export function getStartingPrice(product: Product): {
  price: number;
  hasPriceVariance: boolean;
} {
  let minExtra = 0;
  let hasPriceVariance = false;

  for (const group of product.variantGroups) {
    const deltas = group.options
      .filter((o) => o.available)
      .map((o) => o.priceDelta);
    const activeDeltas =
      deltas.length > 0 ? deltas : group.options.map((o) => o.priceDelta);

    if (activeDeltas.some((d) => d > 0)) {
      hasPriceVariance = true;
    }

    if (
      group.required &&
      group.selectionMode === 'single' &&
      activeDeltas.length > 0
    ) {
      const minDelta = Math.min(...activeDeltas);
      if (minDelta > 0) {
        minExtra += minDelta;
      }
    }
  }

  return {
    price: product.basePrice + minExtra,
    hasPriceVariance,
  };
}

export function extractSelectedDollSize(
  product: Product,
  selections: SelectedVariantsMap
): string {
  const sizeGroup = product.variantGroups.find(
    (g) => g.name.includes('尺寸') || g.id.toLowerCase().includes('size')
  );
  if (sizeGroup) {
    const selectedIds = selections[sizeGroup.id] ?? [];
    const labels = sizeGroup.options
      .filter((o) => selectedIds.includes(o.id))
      .map((o) => o.label);
    if (labels.length > 0) {
      return labels.join('、');
    }
  }
  return product.dollSizes.join(' / ');
}

export function filterAndSortProducts(
  products: Product[],
  filters: CatalogFilters,
  sectionVisibility?: SectionVisibilityConfig
): Product[] {
  const query = filters.searchQuery.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (!filters.includeUnpublished && !product.isPublished) {
      return false;
    }
    const section = getSectionForCategory(product.categoryId);
    if (sectionVisibility && !sectionVisibility[section]) {
      return false;
    }
    if (filters.category === 'proxy' && section !== 'proxy') {
      return false;
    }
    if (filters.category === 'crochet' && section !== 'crochet') {
      return false;
    }
    if (
      filters.category !== 'all' &&
      filters.category !== 'proxy' &&
      filters.category !== 'crochet' &&
      product.categoryId !== filters.category
    ) {
      return false;
    }
    if (
      filters.dollSize !== 'all' &&
      !product.dollSizes.includes(filters.dollSize)
    ) {
      return false;
    }
    if (filters.status !== 'all' && product.status !== filters.status) {
      return false;
    }

    const { price } = getStartingPrice(product);
    if (filters.priceRange === 'under_750' && price >= 750) {
      return false;
    }
    if (filters.priceRange === '750_to_900' && (price < 750 || price > 900)) {
      return false;
    }
    if (filters.priceRange === 'over_900' && price <= 900) {
      return false;
    }

    if (query) {
      const inCode = product.code.toLowerCase().includes(query);
      const inName = product.name.toLowerCase().includes(query);
      const inSummary = product.summary.toLowerCase().includes(query);
      const inSizes = product.dollSizes.some((s) =>
        s.toLowerCase().includes(query)
      );
      const inOptions = product.variantGroups.some(
        (g) =>
          g.name.toLowerCase().includes(query) ||
          g.options.some((o) => o.label.toLowerCase().includes(query))
      );
      if (!inCode && !inName && !inSummary && !inSizes && !inOptions) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];
  switch (filters.sortBy) {
    case 'price_asc':
      sorted.sort((a, b) => getStartingPrice(a).price - getStartingPrice(b).price);
      break;
    case 'price_desc':
      sorted.sort((a, b) => getStartingPrice(b).price - getStartingPrice(a).price);
      break;
    case 'newest':
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case 'default':
    default:
      sorted.sort((a, b) => a.sortOrder - b.sortOrder);
      break;
  }

  return sorted;
}

export interface LineOrderMessageParams {
  product: Product;
  selections: SelectedVariantsMap;
  swatches: FabricSwatch[];
  customNote: string;
  productUrl: string;
  brandName?: string;
}

export function formatLineOrderMessage({
  product,
  selections,
  swatches,
  customNote,
  productUrl,
  brandName = '天冷穿件衣',
}: LineOrderMessageParams): string {
  const calc = calculateProductPrice(product, selections, swatches);
  const dollSize = extractSelectedDollSize(product, selections);
  const surchargeItems = calc.breakdown.filter((b) => b.priceDelta > 0);

  const lines: string[] = [
    `【${brandName}｜LINE 訂購詢問單】`,
    `商品編號：${product.code}`,
    `商品名稱：${product.name}`,
    `商品網址：${productUrl}`,
    `商品分類：${CATEGORY_LABELS[product.categoryId]}`,
    `娃娃尺寸：${dollSize}`,
  ];

  lines.push('已選擇客製化規格：');
  if (calc.breakdown.length === 0) {
    lines.push('・尚未選擇規格');
  } else {
    for (const item of calc.breakdown) {
      const codeStr = item.swatchCode ? `（色號 ${item.swatchCode}）` : '';
      lines.push(`・${item.groupName}：${item.optionLabel}${codeStr}`);
    }
  }

  lines.push('各項加價金額：');
  lines.push(`・商品基礎價格：${formatTWD(calc.basePrice)}`);
  if (surchargeItems.length === 0) {
    lines.push('・規格加價：無額外加價（NT$ 0）');
  } else {
    for (const item of surchargeItems) {
      lines.push(`・${item.groupName}（${item.optionLabel}）：+${formatTWD(item.priceDelta)}`);
    }
  }

  lines.push(`預估總價格：${formatTWD(calc.totalPrice)}（預估報價）`);
  lines.push(`顧客備註：${customNote.trim() || '無'}`);
  lines.push('※ 以上價格為預估報價，正式訂單與最終金額仍需由客服確認後成立。');

  return lines.join('\n');
}

export function createCartItemFromSelection(params: {
  product: Product;
  selections: SelectedVariantsMap;
  swatches: FabricSwatch[];
  customNote: string;
}): CartItem {
  const calc = calculateProductPrice(
    params.product,
    params.selections,
    params.swatches
  );
  const dollSizeText = extractSelectedDollSize(params.product, params.selections);
  return {
    cartItemId: `cart-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: params.product.id,
    productCode: params.product.code,
    productName: params.product.name,
    categoryId: params.product.categoryId,
    thumbnail: params.product.images[0] || '',
    dollSizeText,
    basePrice: calc.basePrice,
    modifierTotal: calc.modifierTotal,
    unitEstimatedPrice: calc.totalPrice,
    quantity: 1,
    specs: calc.breakdown,
    customNote: params.customNote.trim(),
    addedAt: new Date().toISOString(),
  };
}

export function formatCartLineOrderMessage(
  items: CartItem[],
  origin?: string,
  brandName = '天冷穿件衣'
): string {
  const totalEstimated = items.reduce(
    (sum, item) => sum + item.unitEstimatedPrice * item.quantity,
    0
  );
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const lines: string[] = [
    `【${brandName}｜購物車 LINE 訂購詢問單】`,
    `共 ${items.length} 項商品（總計 ${totalQuantity} 件）`,
    '--------------------',
  ];

  items.forEach((item, index) => {
    const productUrl = buildProductShareUrl(item.productId, origin);
    const surcharges = item.specs.filter((s) => s.priceDelta > 0);
    lines.push(`【商品 ${index + 1}】`);
    lines.push(`商品編號：${item.productCode}`);
    lines.push(`商品名稱：${item.productName}`);
    lines.push(`商品網址：${productUrl}`);
    lines.push(`商品分類：${CATEGORY_LABELS[item.categoryId]}`);
    lines.push(`娃娃尺寸：${item.dollSizeText}`);
    lines.push(`訂購數量：${item.quantity} 件`);
    lines.push('已選擇客製化規格：');
    item.specs.forEach((spec) => {
      const codeStr = spec.swatchCode ? `（色號 ${spec.swatchCode}）` : '';
      lines.push(`・${spec.groupName}：${spec.optionLabel}${codeStr}`);
    });
    lines.push('各項加價金額：');
    lines.push(`・基礎價：${formatTWD(item.basePrice)}`);
    if (surcharges.length === 0) {
      lines.push('・規格加價：無額外加價（NT$ 0）');
    } else {
      surcharges.forEach((s) => {
        lines.push(`・${s.groupName}（${s.optionLabel}）：+${formatTWD(s.priceDelta)}`);
      });
    }
    lines.push(`小計預估報價：${formatTWD(item.unitEstimatedPrice * item.quantity)}`);
    lines.push(`顧客備註：${item.customNote || '無'}`);
    lines.push('--------------------');
  });

  lines.push(`購物車預估總價格：${formatTWD(totalEstimated)}（預估報價）`);
  lines.push('※ 以上價格皆為預估報價，正式訂單與最終金額仍需由客服確認後成立。');
  return lines.join('\n');
}
