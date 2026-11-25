import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_PRODUCTS, INITIAL_SWATCHES } from '../data/seedData';
import {
  buildLineOaMessageUrl,
  normalizeLineAccountId,
} from '../services/lineIntegration';
import { buildRoutePath, parseRouteFromPath } from './router';
import {
  calculateProductPrice,
  createCartItemFromSelection,
  filterAndSortProducts,
  formatCartLineOrderMessage,
  formatLineOrderMessage,
  formatTWD,
  getEmptySelections,
  getStartingPrice,
  validateRequiredVariants,
} from './pricing';

test('formatTWD formats Taiwanese currency cleanly', () => {
  assert.equal(formatTWD(680), 'NT$ 680');
  assert.equal(formatTWD(1280), 'NT$ 1,280');
  assert.equal(formatTWD(0), 'NT$ 0');
});

test('validateRequiredVariants blocks ordering until every required variant group is selected', () => {
  const customDress = INITIAL_PRODUCTS.find((p) => p.id === 'prod-custom-bonnet-dress')!;
  const empty = getEmptySelections(customDress);
  const invalidCheck = validateRequiredVariants(customDress, empty);

  assert.equal(invalidCheck.isValid, false);
  assert.equal(invalidCheck.missingGroupNames.includes('娃娃尺寸'), true);
  assert.equal(invalidCheck.missingGroupNames.includes('主體布料色卡'), true);

  const completeCheck = validateRequiredVariants(customDress, {
    'vg-size': ['opt-esugly'],
    'vg-fabric-swatch': ['opt-sw-rose'],
    'vg-ribbon-color': ['opt-rib-sage'],
    'vg-bow-style': ['opt-bow-classic'],
    'vg-lace-style': ['opt-lace-cotton'],
    'vg-custom-addons': [],
  });
  assert.equal(completeCheck.isValid, true);
  assert.equal(completeCheck.missingGroupIds.length, 0);
});

test('calculateProductPrice adds single-select and multi-select modifiers accurately', () => {
  const customDress = INITIAL_PRODUCTS.find((p) => p.id === 'prod-custom-bonnet-dress')!;
  const result = calculateProductPrice(
    customDress,
    {
      'vg-size': ['opt-esugly'], // +90
      'vg-fabric-swatch': ['opt-sw-rose'], // +50
      'vg-ribbon-color': ['opt-rib-taupe'], // +20
      'vg-bow-style': ['opt-bow-pearl'], // +60
      'vg-lace-style': ['opt-lace-eyelet'], // +60
      'vg-custom-addons': ['opt-add-bonnet', 'opt-add-tail'], // +220 + 50
    },
    INITIAL_SWATCHES
  );

  assert.equal(result.basePrice, 860);
  assert.equal(result.modifierTotal, 550);
  assert.equal(result.totalPrice, 1410);
  const swatchBreakdown = result.breakdown.find((b) => b.groupId === 'vg-fabric-swatch');
  assert.equal(swatchBreakdown?.swatchCode, 'CG-03');
});

test('getStartingPrice identifies price variance and minimum required cost', () => {
  const overalls = INITIAL_PRODUCTS.find((p) => p.id === 'prod-oatmeal-overalls')!;
  const starting = getStartingPrice(overalls);
  assert.equal(starting.price, 680);
  assert.equal(starting.hasPriceVariance, true);
});

test('formatLineOrderMessage contains all 9 required LINE order fields and estimate disclaimer', () => {
  const customDress = INITIAL_PRODUCTS.find((p) => p.id === 'prod-custom-bonnet-dress')!;
  const message = formatLineOrderMessage({
    product: customDress,
    selections: {
      'vg-size': ['opt-starfish'],
      'vg-fabric-swatch': ['opt-sw-sage'],
      'vg-ribbon-color': ['opt-rib-sage'],
      'vg-bow-style': ['opt-bow-classic'],
      'vg-lace-style': ['opt-lace-cotton'],
      'vg-custom-addons': ['opt-add-bonnet'],
    },
    swatches: INITIAL_SWATCHES,
    customNote: '希望預留貓咪尾巴開孔',
    productUrl: 'https://example.com/product/prod-custom-bonnet-dress',
    brandName: 'YourTreasure娃衣代理',
  });

  assert.match(message, /商品編號：YT-201/);
  assert.match(message, /商品名稱：雙層紗蕾絲邦尼帽洋裝（自由配色）/);
  assert.match(message, /商品網址：https:\/\/example\.com\/product\/prod-custom-bonnet-dress/);
  assert.match(message, /商品分類：客製化娃衣/);
  assert.match(message, /娃娃尺寸：海星體/);
  assert.match(message, /霧灰鼠尾草二重紗（色號 GZ-02）/);
  assert.match(message, /各項加價金額：/);
  assert.match(message, /\+NT\$ 220/);
  assert.match(message, /預估總價格：NT\$ 1,170（預估報價）/);
  assert.match(message, /顧客備註：希望預留貓咪尾巴開孔/);
  assert.match(message, /正式訂單與最終金額仍需由客服確認後成立/);
});

test('buildLineOaMessageUrl encodes LINE official account ID and message with encodeURIComponent', () => {
  assert.equal(normalizeLineAccountId('182oocrl'), '@182oocrl');
  assert.equal(normalizeLineAccountId('@182oocrl'), '@182oocrl');

  const url = buildLineOaMessageUrl('@182oocrl', '你好 NT$ 1,000\n測試');
  assert.ok(url.startsWith('https://line.me/R/oaMessage/%40182oocrl/?'));
  assert.ok(url.includes(encodeURIComponent('你好 NT$ 1,000\n測試')));
});

test('formatCartLineOrderMessage summarizes multiple cart items accurately', () => {
  const overalls = INITIAL_PRODUCTS.find((p) => p.id === 'prod-oatmeal-overalls')!;
  const item = createCartItemFromSelection({
    product: overalls,
    selections: {
      'vg-size': ['opt-esugly'],
      'vg-knit-color': ['opt-sage'],
      'vg-addons': [],
    },
    swatches: INITIAL_SWATCHES,
    customNote: '急件請告知',
  });
  item.quantity = 2;

  const msg = formatCartLineOrderMessage([item], 'https://shop.test');
  assert.match(msg, /商品編號：YT-101/);
  assert.match(msg, /訂購數量：2 件/);
  assert.match(msg, /購物車預估總價格：NT\$ 1,580（預估報價）/);
  assert.match(msg, /https:\/\/shop\.test\/product\/prod-oatmeal-overalls/);
});

test('standalone URL router parses and builds category and product detail routes', () => {
  assert.deepEqual(parseRouteFromPath('/'), { page: 'home' });
  assert.deepEqual(parseRouteFromPath('/category/featured'), {
    page: 'catalog',
    category: 'featured',
  });
  assert.deepEqual(parseRouteFromPath('/category/custom'), {
    page: 'catalog',
    category: 'custom',
  });
  assert.deepEqual(parseRouteFromPath('/product/prod-custom-bonnet-dress'), {
    page: 'product',
    productId: 'prod-custom-bonnet-dress',
  });
  assert.equal(
    buildRoutePath({ page: 'product', productId: 'prod-custom-bonnet-dress' }),
    '/product/prod-custom-bonnet-dress'
  );
  assert.equal(
    buildRoutePath({ page: 'catalog', category: 'custom' }),
    '/category/custom'
  );
});

test('filterAndSortProducts searches by product code and hides unpublished products', () => {
  const byCode = filterAndSortProducts(INITIAL_PRODUCTS, {
    category: 'all',
    searchQuery: 'YT-201',
    dollSize: 'all',
    status: 'all',
    priceRange: 'all',
    sortBy: 'default',
  });
  assert.equal(byCode.length, 1);
  assert.equal(byCode[0].id, 'prod-custom-bonnet-dress');
});

test('filterAndSortProducts respects major section visibility and filters proxy vs crochet sections', () => {
  const baseFilters = {
    category: 'all' as const,
    searchQuery: '',
    dollSize: 'all' as const,
    status: 'all' as const,
    priceRange: 'all' as const,
    sortBy: 'default' as const,
  };

  const crochetOnly = filterAndSortProducts(INITIAL_PRODUCTS, {
    ...baseFilters,
    category: 'crochet',
  });
  assert.equal(crochetOnly.length, 2);
  assert.ok(
    crochetOnly.every(
      (p) => p.categoryId === 'crochet_bib' || p.categoryId === 'crochet_outfit'
    )
  );

  const hiddenCrochet = filterAndSortProducts(
    INITIAL_PRODUCTS,
    baseFilters,
    { proxy: true, crochet: false }
  );
  assert.ok(
    hiddenCrochet.every(
      (p) => p.categoryId === 'featured' || p.categoryId === 'custom'
    )
  );

  const hiddenProxy = filterAndSortProducts(
    INITIAL_PRODUCTS,
    baseFilters,
    { proxy: false, crochet: true }
  );
  assert.equal(hiddenProxy.length, 2);
  assert.ok(
    hiddenProxy.every(
      (p) => p.categoryId === 'crochet_bib' || p.categoryId === 'crochet_outfit'
    )
  );

  const bothHidden = filterAndSortProducts(
    INITIAL_PRODUCTS,
    baseFilters,
    { proxy: false, crochet: false }
  );
  assert.equal(bothHidden.length, 0);
});

test('standalone URL router supports proxy and crochet section/sub-category routes', () => {
  assert.deepEqual(parseRouteFromPath('/category/proxy'), {
    page: 'catalog',
    category: 'proxy',
  });
  assert.deepEqual(parseRouteFromPath('/category/crochet'), {
    page: 'catalog',
    category: 'crochet',
  });
  assert.deepEqual(parseRouteFromPath('/category/crochet_bib'), {
    page: 'catalog',
    category: 'crochet_bib',
  });
  assert.deepEqual(parseRouteFromPath('/category/crochet_outfit'), {
    page: 'catalog',
    category: 'crochet_outfit',
  });
  assert.equal(
    buildRoutePath({ page: 'catalog', category: 'crochet_bib' }),
    '/category/crochet_bib'
  );
});

test('crochet product calculates yarn library swatch code and LINE order summary cleanly', () => {
  const bib = INITIAL_PRODUCTS.find((p) => p.id === 'prod-crochet-scallop-bib')!;
  const msg = formatLineOrderMessage({
    product: bib,
    selections: {
      'vg-size': ['opt-esbear'], // +30
      'vg-yarn-swatch': ['opt-yn-rose'], // +30, code YN-03
      'vg-bib-addons': ['opt-bib-pearl'], // +40
    },
    swatches: INITIAL_SWATCHES,
    customNote: '',
    productUrl: 'https://example.com/product/prod-crochet-scallop-bib',
    brandName: '天冷穿件衣',
  });
  assert.match(msg, /天冷穿件衣/);
  assert.match(msg, /商品分類：娃用圍兜兜/);
  assert.match(msg, /柔霧玫瑰蕾絲線（色號 YN-03）/);
  assert.match(msg, /預估總價格：NT\$ 420（預估報價）/);
});
