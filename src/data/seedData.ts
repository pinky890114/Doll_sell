import type { FabricSwatch, HomeConfig, Product } from '../types/store';

// Generated studio assets
export const STUDIO_IMAGES = {
  heroBanner: '/src/assets/images/hero_atelier_banner_1795598173868.jpg',
  oatmealOveralls: '/src/assets/images/prod_oatmeal_overalls_1795598174050.jpg',
  sageSailorSet: '/src/assets/images/prod_sage_sailor_set_1795598176061.jpg',
  rosePinafore: '/src/assets/images/prod_berry_lolita_dress_1795598176377.jpg',
  earlGreyCape: '/src/assets/images/prod_earl_grey_cape_1795598178272.jpg',
  customBonnetDress: '/src/assets/images/prod_custom_bonnet_dress_1795598178054.jpg',
  customKnitCardigan: '/src/assets/images/prod_custom_knit_cardigan_1795598178440.jpg',
  swatchSageGauze: '/src/assets/images/swatch_gauze_sage_1795598181544.jpg',
  swatchRoseGingham: '/src/assets/images/swatch_gingham_rose_1795598180165.jpg',
  swatchCocoaCorduroy: '/src/assets/images/swatch_corduroy_cocoa_1795598179424.jpg',
  crochetBib: '/src/assets/images/prod_crochet_doll_bib_1795618594156.jpg',
  crochetOutfit: '/src/assets/images/prod_crochet_doll_outfit_1795618596010.jpg',
} as const;

// Tactile woven SVG data URIs for additional natural fabric swatches (offline-safe, zero broken images)
function createWovenTextureSvg(
  baseHex: string,
  warpHex: string,
  weftHex: string,
  pattern: 'linen' | 'stripe' | 'dot'
): string {
  let overlay = '';
  if (pattern === 'linen') {
    overlay = `
      <pattern id="weave" width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="12" height="12" fill="${baseHex}"/>
        <path d="M0 3h12M0 9h12" stroke="${warpHex}" stroke-width="1.4" opacity="0.45"/>
        <path d="M3 0v12M9 0v12" stroke="${weftHex}" stroke-width="1.2" opacity="0.42"/>
        <rect x="2" y="2" width="2" height="2" fill="${weftHex}" opacity="0.25"/>
        <rect x="8" y="8" width="2" height="2" fill="${warpHex}" opacity="0.28"/>
      </pattern>`;
  } else if (pattern === 'stripe') {
    overlay = `
      <pattern id="weave" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="${baseHex}"/>
        <rect x="0" y="0" width="4" height="16" fill="${warpHex}" opacity="0.55"/>
        <rect x="8" y="0" width="1.5" height="16" fill="${weftHex}" opacity="0.4"/>
        <path d="M0 4h16M0 12h16" stroke="#ffffff" stroke-width="0.8" opacity="0.3"/>
      </pattern>`;
  } else {
    overlay = `
      <pattern id="weave" width="18" height="18" patternUnits="userSpaceOnUse">
        <rect width="18" height="18" fill="${baseHex}"/>
        <path d="M0 6h18M0 15h18" stroke="${warpHex}" stroke-width="0.8" opacity="0.3"/>
        <circle cx="5" cy="5" r="1.4" fill="${weftHex}" opacity="0.65"/>
        <circle cx="14" cy="14" r="1.4" fill="${weftHex}" opacity="0.65"/>
      </pattern>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><defs>${overlay}</defs><rect width="320" height="320" fill="url(#weave)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createRhinestoneTextureSvg(
  trayHex: string,
  gemHex: string,
  highlightHex: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
    <rect width="320" height="320" fill="${trayHex}"/>
    <circle cx="160" cy="160" r="118" fill="#ffffff" opacity="0.28"/>
    <circle cx="160" cy="160" r="110" fill="none" stroke="${gemHex}" stroke-width="2" opacity="0.45"/>
    <g>
      <circle cx="160" cy="160" r="30" fill="${gemHex}" stroke="${highlightHex}" stroke-width="3"/>
      <polygon points="160,136 177,160 160,184 143,160" fill="${highlightHex}" opacity="0.65"/>
      <circle cx="149" cy="149" r="6" fill="#ffffff" opacity="0.9"/>
      <circle cx="102" cy="118" r="18" fill="${gemHex}" stroke="${highlightHex}" stroke-width="2"/>
      <circle cx="96" cy="112" r="4" fill="#ffffff" opacity="0.85"/>
      <circle cx="218" cy="118" r="18" fill="${gemHex}" stroke="${highlightHex}" stroke-width="2"/>
      <circle cx="212" cy="112" r="4" fill="#ffffff" opacity="0.85"/>
      <circle cx="102" cy="202" r="18" fill="${gemHex}" stroke="${highlightHex}" stroke-width="2"/>
      <circle cx="96" cy="196" r="4" fill="#ffffff" opacity="0.85"/>
      <circle cx="218" cy="202" r="18" fill="${gemHex}" stroke="${highlightHex}" stroke-width="2"/>
      <circle cx="212" cy="196" r="4" fill="#ffffff" opacity="0.85"/>
      <circle cx="160" cy="84" r="14" fill="${highlightHex}" stroke="${gemHex}" stroke-width="1.5"/>
      <circle cx="160" cy="236" r="14" fill="${highlightHex}" stroke="${gemHex}" stroke-width="1.5"/>
      <circle cx="84" cy="160" r="12" fill="${highlightHex}" stroke="${gemHex}" stroke-width="1.5"/>
      <circle cx="236" cy="160" r="12" fill="${highlightHex}" stroke="${gemHex}" stroke-width="1.5"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createEyeColorTextureSvg(
  irisOuter: string,
  irisInner: string,
  glintHex: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
    <defs>
      <radialGradient id="irisGrad" cx="50%" cy="55%" r="50%">
        <stop offset="0%" stop-color="${irisInner}"/>
        <stop offset="68%" stop-color="${irisOuter}"/>
        <stop offset="100%" stop-color="#2B2825"/>
      </radialGradient>
    </defs>
    <rect width="320" height="320" fill="#F4F1EC"/>
    <circle cx="160" cy="160" r="102" fill="url(#irisGrad)"/>
    <circle cx="160" cy="166" r="42" fill="#231F1D"/>
    <ellipse cx="160" cy="208" rx="44" ry="20" fill="${glintHex}" opacity="0.48"/>
    <circle cx="122" cy="122" r="20" fill="#ffffff" opacity="0.92"/>
    <circle cx="198" cy="136" r="8" fill="#ffffff" opacity="0.78"/>
    <circle cx="144" cy="144" r="5" fill="#ffffff" opacity="0.55"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createRibbonTextureSvg(
  ribbonHex: string,
  sheenHex: string,
  edgeHex: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
    <defs>
      <linearGradient id="satin" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${edgeHex}"/>
        <stop offset="18%" stop-color="${ribbonHex}"/>
        <stop offset="48%" stop-color="${sheenHex}"/>
        <stop offset="82%" stop-color="${ribbonHex}"/>
        <stop offset="100%" stop-color="${edgeHex}"/>
      </linearGradient>
    </defs>
    <rect width="320" height="320" fill="#F4F1EC"/>
    <rect x="64" y="0" width="192" height="320" fill="url(#satin)"/>
    <line x1="76" y1="0" x2="76" y2="320" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.55"/>
    <line x1="244" y1="0" x2="244" y2="320" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.55"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createYarnTextureSvg(
  baseHex: string,
  strandHex: string,
  highlightHex: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
    <defs>
      <pattern id="knit" width="24" height="20" patternUnits="userSpaceOnUse">
        <rect width="24" height="20" fill="${baseHex}"/>
        <path d="M2 2 C6 9, 10 13, 12 18 C14 13, 18 9, 22 2" fill="none" stroke="${strandHex}" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M2 12 C6 19, 10 23, 12 28 C14 23, 18 19, 22 12" fill="none" stroke="${strandHex}" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M5 3 C8 8, 10 11, 12 15" fill="none" stroke="${highlightHex}" stroke-width="1.4" stroke-linecap="round" opacity="0.72"/>
        <path d="M19 3 C16 8, 14 11, 12 15" fill="none" stroke="${highlightHex}" stroke-width="1.1" stroke-linecap="round" opacity="0.55"/>
      </pattern>
    </defs>
    <rect width="320" height="320" fill="url(#knit)"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_SWATCHES: FabricSwatch[] = [
  // 1. 色卡庫 (fabric)
  {
    id: 'sw-oat-linen',
    libraryType: 'fabric',
    code: 'LN-01',
    name: '燕麥原色亞麻',
    hex: '#D6CCB9',
    materialNote: '100% 水洗中厚亞麻，帶有自然竹節紋理，適合吊帶褲與外搭背心。',
    imageUrl: createWovenTextureSvg('#DDD4C4', '#C4B7A1', '#EFEAE0', 'linen'),
  },
  {
    id: 'sw-sage-gauze',
    libraryType: 'fabric',
    code: 'GZ-02',
    name: '霧灰鼠尾草二重紗',
    hex: '#92A093',
    materialNote: '日本製純棉二重紗，觸感輕柔透氣、帶自然空氣皺褶感，適合洋裝與襯衫。',
    imageUrl: STUDIO_IMAGES.swatchSageGauze,
  },
  {
    id: 'sw-rose-gingham',
    libraryType: 'fabric',
    code: 'CG-03',
    name: '乾燥玫瑰細格紋',
    hex: '#B88F8B',
    materialNote: '先染純棉 2mm 細格紋布料，低飽和玫瑰藕粉配米白，甜美不刺眼。',
    imageUrl: STUDIO_IMAGES.swatchRoseGingham,
  },
  {
    id: 'sw-cocoa-corduroy',
    libraryType: 'fabric',
    code: 'CD-04',
    name: '暖可可細燈芯絨',
    hex: '#7C604E',
    materialNote: '21 條超細絨棉質燈芯絨，柔軟不厚重，專為手作娃衣打版挑選。',
    imageUrl: STUDIO_IMAGES.swatchCocoaCorduroy,
  },
  {
    id: 'sw-cream-cotton',
    libraryType: 'fabric',
    code: 'CT-05',
    name: '奶油胚布棉麻',
    hex: '#EFE9DC',
    materialNote: '溫潤未漂白奶油色細棉麻，保留極細微天然棉籽點，百搭耐看。',
    imageUrl: createWovenTextureSvg('#F1ECE0', '#DFD7C6', '#FAF7F0', 'dot'),
  },
  {
    id: 'sw-mist-stripe',
    libraryType: 'fabric',
    code: 'ST-06',
    name: '霧灰藍細條紋棉',
    hex: '#9BA8B4',
    materialNote: '細緻高支純棉府綢條紋，布面平整挺括，適合學院風襯衫與水手領。',
    imageUrl: createWovenTextureSvg('#E7EAEC', '#9BA8B4', '#6E7D8B', 'stripe'),
  },

  // 2. 鑽盤庫 (rhinestone)
  {
    id: 'rh-aurora-ab',
    libraryType: 'rhinestone',
    code: 'RH-01',
    name: '冰透AB極光鑽盤',
    hex: '#DDE7F0',
    materialNote: '多切面透白極光水鑽配銀色爪托，自然光下折射細閃，百搭淺色系娃衣。',
    imageUrl: createRhinestoneTextureSvg('#EFECE6', '#C9D9E8', '#F6FAFD'),
  },
  {
    id: 'rh-sakura-pink',
    libraryType: 'rhinestone',
    code: 'RH-02',
    name: '粉櫻愛心水鑽盤',
    hex: '#D9A7AE',
    materialNote: '低飽和櫻花粉主鑽搭配米白小珍珠圍邊，適合甜美洋裝與蝴蝶結中心點綴。',
    imageUrl: createRhinestoneTextureSvg('#F5EFEF', '#D49BA4', '#F8E3E6'),
  },
  {
    id: 'rh-champagne-pearl',
    libraryType: 'rhinestone',
    code: 'RH-03',
    name: '香檳珍珠金邊鑽盤',
    hex: '#D4BE98',
    materialNote: '溫潤香檳金仿珍珠搭配霧金細底座，氣質優雅復古。',
    imageUrl: createRhinestoneTextureSvg('#F2EDE4', '#CBB082', '#F7EFDF'),
  },

  // 3. 眼睛顏色 (eye_color)
  {
    id: 'ey-caramel-amber',
    libraryType: 'eye_color',
    code: 'EY-01',
    name: '焦糖琥珀眼',
    hex: '#A66F3E',
    materialNote: '溫暖琥珀棕漸層虹膜，百搭棕色、燕麥與奶油色系造型頭套。',
    imageUrl: createEyeColorTextureSvg('#9B6435', '#D69F63', '#F5D8A8'),
  },
  {
    id: 'ey-sakura-quartz',
    libraryType: 'eye_color',
    code: 'EY-02',
    name: '櫻花粉晶眼',
    hex: '#C98A95',
    materialNote: '柔和粉水晶漸層眼珠，自帶清透高光，適合兔耳與貓耳造型娃衣。',
    imageUrl: createEyeColorTextureSvg('#B97884', '#E6B2BC', '#FCE3E8'),
  },
  {
    id: 'ey-mist-blue',
    libraryType: 'eye_color',
    code: 'EY-03',
    name: '霧海灰藍眼',
    hex: '#6D889E',
    materialNote: '低飽和霧灰藍海洋虹膜，清新耐看，適合水手服與冷色系套組。',
    imageUrl: createEyeColorTextureSvg('#5B768E', '#97B4C9', '#DCEBF5'),
  },
  {
    id: 'ey-olive-matcha',
    libraryType: 'eye_color',
    code: 'EY-04',
    name: '抹茶橄欖眼',
    hex: '#7B8E6B',
    materialNote: '柔和森系抹茶綠虹膜，與鼠尾草綠及亞麻色布料特別協調。',
    imageUrl: createEyeColorTextureSvg('#6A7E5B', '#A6B993', '#E0ECD2'),
  },

  // 4. 緞帶顏色 (ribbon_color)
  {
    id: 'rb-ivory-satin',
    libraryType: 'ribbon_color',
    code: 'RB-01',
    name: '象牙奶白絲緞',
    hex: '#F2ECE1',
    materialNote: '雙面細緻絲緞帶，光澤柔和不反白，最百搭的領口與蝴蝶結首選。',
    imageUrl: createRibbonTextureSvg('#EDE6D8', '#FAF7F0', '#DDD3C1'),
  },
  {
    id: 'rb-dusty-rose',
    libraryType: 'ribbon_color',
    code: 'RB-02',
    name: '乾燥玫瑰絲緞',
    hex: '#B68984',
    materialNote: '低飽和煙燻玫瑰粉絲緞，溫柔復古，適合蕾絲圍裙與邦尼帽綁帶。',
    imageUrl: createRibbonTextureSvg('#B68984', '#CFA7A2', '#9A6E69'),
  },
  {
    id: 'rb-sage-green',
    libraryType: 'ribbon_color',
    code: 'RB-03',
    name: '莫蘭迪鼠尾草綠',
    hex: '#8E9E8F',
    materialNote: '霧感莫蘭迪鼠尾草綠緞帶，自然清新，不易顯髒。',
    imageUrl: createRibbonTextureSvg('#8E9E8F', '#A9B8AA', '#728273'),
  },
  {
    id: 'rb-oat-milk',
    libraryType: 'ribbon_color',
    code: 'RB-04',
    name: '燕麥奶茶羅紋帶',
    hex: '#C4B39D',
    materialNote: '立體微紋理奶茶色羅紋緞帶，綁結硬挺不易鬆散。',
    imageUrl: createRibbonTextureSvg('#C4B39D', '#D9CCB9', '#A6957F'),
  },

  // 5. 線材庫 (yarn — 毛線編織專用)
  {
    id: 'yn-cream-milk',
    libraryType: 'yarn',
    code: 'YN-01',
    name: '奶霜四股牛奶棉',
    hex: '#EFE8DC',
    materialNote: '親膚柔軟四股精梳牛奶棉，線條飽滿不起毛球，適合鉤織娃用圍兜兜與奶油系小毛衣。',
    imageUrl: createYarnTextureSvg('#EFE8DC', '#D8CEBC', '#FCF9F3'),
  },
  {
    id: 'yn-oat-latte',
    libraryType: 'yarn',
    code: 'YN-02',
    name: '燕麥拿鐵細棉線',
    hex: '#C9B8A0',
    materialNote: '溫潤低飽和燕麥拿鐵色細股棉線，鉤織針目清晰立體，適合漁夫帽與開襟外套。',
    imageUrl: createYarnTextureSvg('#C9B8A0', '#AE9B80', '#E4D8C6'),
  },
  {
    id: 'yn-rose-mohair',
    libraryType: 'yarn',
    code: 'YN-03',
    name: '柔霧玫瑰蕾絲線',
    hex: '#C49691',
    materialNote: '細緻 8 號棉質鉤織蕾絲線，輕盈垂墜，特別適合花邊圍兜兜與層次荷葉領片。',
    imageUrl: createYarnTextureSvg('#C49691', '#A67570', '#E2C0BC'),
  },
  {
    id: 'yn-sage-cotton',
    libraryType: 'yarn',
    code: 'YN-04',
    name: '鼠尾草綠精梳棉',
    hex: '#8FA090',
    materialNote: '霧感莫蘭迪鼠尾草綠純棉毛線，厚薄適中不顯臃腫，日常森系穿搭百搭色選。',
    imageUrl: createYarnTextureSvg('#8FA090', '#718372', '#B5C4B6'),
  },
];

export const INITIAL_HOME_CONFIG: HomeConfig = {
  brandName: '天冷穿件衣',
  brandSubtitle: '',
  banner: {
    title: '一針一線，為掌中夥伴裁出日常溫度',
    subtitle: '精選娃衣代理與手工毛線編織，適用努努、海星體、指偶、es熊娃、es醜娃之特色成衣、圍兜兜與自由配色客製。',
    ctaLabel: '探索全館商品',
    targetCategory: 'all',
    imageUrl: STUDIO_IMAGES.heroBanner,
  },
  featuredCategoryImage: STUDIO_IMAGES.oatmealOveralls,
  customCategoryImage: STUDIO_IMAGES.customBonnetDress,
  crochetBibCategoryImage: STUDIO_IMAGES.crochetBib,
  crochetOutfitCategoryImage: STUDIO_IMAGES.crochetOutfit,
  sectionVisibility: {
    proxy: true,
    crochet: true,
  },
  lineConfig: {
    officialAccountId: '@182oocrl',
    displayName: '天冷穿件衣 官方客服',
    customerServiceGreeting: '您好，我想詢問 天冷穿件衣 的商品與訂購方式，謝謝！',
    liffId: '',
  },
};

export const DEFAULT_LEAD_TIME = '工期+集運約25天。';

export const DEFAULT_PURCHASE_NOTICE = `購前須知

一、適配尺寸說明

本店所有商品皆可製作以下尺寸：

* 10cm 小不點娃（ぬいぐるみ）
* 熊努
* 指偶
* 15cm ES 醜娃

僅適配無骨架的常規海星體努努。帶骨架、胖胖體、特殊改版努努穿脫時可能較為緊繃，下單前請確認自家娃娃的體型，尺寸不合適不屬於品質問題。

注意：娃衣不包含玩偶本體，僅販售服裝及配套蕾絲、蝴蝶結、珍珠、水鑽等裝飾配件。

二、手工製品特性（重要必讀）

所有娃衣皆為純手工縫製及手工黏貼裝飾，並非工廠流水線大量生產的商品。

1. 存在 1～3mm 的細微裁剪、縫製誤差，以及少量外露線頭，皆屬正常手工製作範圍，完美主義者請謹慎下單。
2. 蕾絲、緞帶、珍珠、水鑽、櫻桃等小配件皆為手工固定，用力拉扯或粗暴穿脫可能造成脫落，屬於正常損耗。無內襯的毛絨娃衣在穿脫時可能有少量掉毛，屬正常現象，穿著前可先輕輕抖動或使用黏毛器清理。
3. 不同裝置的螢幕可能存在些微色差，一切以自然光下實拍照片的顏色為準，色差不作為退換貨理由。

三、退換貨政策

1. 手工客製化商品不提供七天無理由退換貨。
2. 收到商品後請錄製完整開箱影片，出貨時的縫製破損、配件缺失等品質問題，僅憑開箱影片受理售後服務。
3. 運送途中因物流擠壓造成的變形，若可透過手動整理蝴蝶結、蕾絲等方式恢復原狀，則不屬於品質問題。

四、保養與使用小提醒

1. 不可水洗！布料、水鑽及珍珠配件遇水容易脫膠、褪色或變形。若有髒汙，僅可使用乾燥毛刷輕輕擦拭。
2. 避免長時間陽光直射或曝曬，以免緞帶、蕾絲老化及泛黃。
3. 穿脫時請保持動作輕柔，勿強行拉扯領口、蝴蝶結及釘珠部位，以延長商品使用壽命。

五、其他補充事項

1. 未成年人購買前須取得監護人同意，下單即視為已閱讀並了解所有規則。

2. 原創設計娃衣禁止二次修改後商用、抄襲及仿製，僅供個人收藏使用。

額外溫馨小提醒

娃衣可能因布料生產批次不同，即使為相同色系，也可能存在極細微的深淺差異，屬於正常現象。`;

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-oatmeal-overalls',
    code: 'YT-101',
    name: '燕麥亞麻吊帶褲針織套組',
    categoryId: 'featured',
    basePrice: 680,
    status: 'new',
    dollSizes: ['努努', '海星體', '指偶', 'es熊娃', 'es醜娃'],
    summary: '奶油坑條針織上衣搭配天然水洗燕麥亞麻吊帶短褲，胸前點綴手工十字小繡紋與原木四孔迷你釦。',
    materialAndCare: DEFAULT_PURCHASE_NOTICE,
    leadTime: DEFAULT_LEAD_TIME,
    images: [
      STUDIO_IMAGES.oatmealOveralls,
      STUDIO_IMAGES.heroBanner,
      STUDIO_IMAGES.customKnitCardigan,
    ],
    variantGroups: [
      {
        id: 'vg-size',
        name: '娃娃尺寸',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-nunu', label: '努努', priceDelta: 0, available: true },
          { id: 'opt-starfish', label: '海星體', priceDelta: 0, available: true },
          { id: 'opt-finger', label: '指偶', priceDelta: 0, available: true },
          { id: 'opt-esbear', label: 'es熊娃', priceDelta: 40, available: true },
          { id: 'opt-esugly', label: 'es醜娃', priceDelta: 80, available: true },
        ],
      },
      {
        id: 'vg-knit-color',
        name: '內搭針織顏色',
        displayType: 'color',
        selectionMode: 'single',
        required: true,
        options: [
          {
            id: 'opt-cream',
            label: '奶油米白',
            priceDelta: 0,
            available: true,
            colorHex: '#F3EEE3',
            previewImage: STUDIO_IMAGES.oatmealOveralls,
          },
          {
            id: 'opt-sand',
            label: '烤燕麥沙色',
            priceDelta: 0,
            available: true,
            colorHex: '#D5C3AA',
            previewImage: STUDIO_IMAGES.customKnitCardigan,
          },
          {
            id: 'opt-sage',
            label: '霧灰鼠尾草',
            priceDelta: 30,
            available: true,
            colorHex: '#95A396',
            previewImage: STUDIO_IMAGES.sageSailorSet,
          },
        ],
      },
      {
        id: 'vg-addons',
        name: '額外裝飾配件',
        description: '可複選加購，與主體同批製作寄出',
        displayType: 'text',
        selectionMode: 'multi',
        required: false,
        options: [
          { id: 'opt-tail-hole', label: '背後尾巴開孔加工', priceDelta: 50, available: true },
          { id: 'opt-beret', label: '加購同色系貝雷帽', priceDelta: 160, available: true },
          { id: 'opt-scarf', label: '加購手織格紋圍巾', priceDelta: 140, available: true },
        ],
      },
    ],
    isPublished: true,
    isRecommended: true,
    isNewArrival: true,
    sortOrder: 1,
    createdAt: '2026-11-20',
    allowCustomNote: true,
  },
  {
    id: 'prod-custom-bonnet-dress',
    code: 'YT-201',
    name: '雙層紗蕾絲邦尼帽洋裝（自由配色）',
    categoryId: 'custom',
    basePrice: 860,
    status: 'made_to_order',
    dollSizes: ['努努', '海星體', '指偶', 'es熊娃', 'es醜娃'],
    summary: '可自由挑選主體布料色卡、蝴蝶結與棉質蕾絲花邊的訂製款小洋裝，附同款鬆緊細褶荷葉下擺，氣質柔和典雅。',
    materialAndCare: DEFAULT_PURCHASE_NOTICE,
    leadTime: DEFAULT_LEAD_TIME,
    images: [
      STUDIO_IMAGES.customBonnetDress,
      STUDIO_IMAGES.rosePinafore,
      STUDIO_IMAGES.heroBanner,
    ],
    variantGroups: [
      {
        id: 'vg-size',
        name: '娃娃尺寸',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-nunu', label: '努努', priceDelta: 0, available: true },
          { id: 'opt-starfish', label: '海星體', priceDelta: 50, available: true },
          { id: 'opt-finger', label: '指偶', priceDelta: 0, available: true },
          { id: 'opt-esbear', label: 'es熊娃', priceDelta: 60, available: true },
          { id: 'opt-esugly', label: 'es醜娃', priceDelta: 90, available: true },
        ],
      },
      {
        id: 'vg-fabric-swatch',
        name: '主體布料色卡',
        description: '點擊右上角放大鏡可查看布料材質近拍與色號',
        displayType: 'swatch',
        selectionMode: 'single',
        required: true,
        options: [
          {
            id: 'opt-sw-cream',
            label: '奶油胚布棉麻',
            priceDelta: 0,
            available: true,
            swatchId: 'sw-cream-cotton',
            previewImage: STUDIO_IMAGES.customBonnetDress,
          },
          {
            id: 'opt-sw-sage',
            label: '霧灰鼠尾草二重紗',
            priceDelta: 40,
            available: true,
            swatchId: 'sw-sage-gauze',
            previewImage: STUDIO_IMAGES.sageSailorSet,
          },
          {
            id: 'opt-sw-rose',
            label: '乾燥玫瑰細格紋',
            priceDelta: 50,
            available: true,
            swatchId: 'sw-rose-gingham',
            previewImage: STUDIO_IMAGES.rosePinafore,
          },
          {
            id: 'opt-sw-oat',
            label: '燕麥原色亞麻',
            priceDelta: 60,
            available: true,
            swatchId: 'sw-oat-linen',
            previewImage: STUDIO_IMAGES.oatmealOveralls,
          },
        ],
      },
      {
        id: 'vg-ribbon-color',
        name: '配件緞帶顏色',
        displayType: 'color',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-rib-sage', label: '莫蘭迪鼠尾草綠', priceDelta: 0, available: true, colorHex: '#8E9E8F' },
          { id: 'opt-rib-ivory', label: '象牙奶白', priceDelta: 0, available: true, colorHex: '#F2ECE1' },
          { id: 'opt-rib-rose', label: '煙燻乾燥玫瑰', priceDelta: 0, available: true, colorHex: '#B68984' },
          { id: 'opt-rib-taupe', label: '冷灰褐', priceDelta: 20, available: true, colorHex: '#9C9289' },
        ],
      },
      {
        id: 'vg-bow-style',
        name: '蝴蝶結款式',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-bow-classic', label: '經典雙耳絲緞結', priceDelta: 0, available: true },
          { id: 'opt-bow-long', label: '飄逸長尾雙層結', priceDelta: 40, available: true },
          { id: 'opt-bow-pearl', label: '手工縫珍珠小結', priceDelta: 60, available: true },
        ],
      },
      {
        id: 'vg-lace-style',
        name: '蕾絲款式',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-lace-cotton', label: '米白棉質小花邊', priceDelta: 0, available: true },
          { id: 'opt-lace-eyelet', label: '復古雕花棉布蕾絲', priceDelta: 60, available: true },
          { id: 'opt-lace-none', label: '簡約無蕾絲抽褶', priceDelta: 0, available: true },
        ],
      },
      {
        id: 'vg-custom-addons',
        name: '額外客製加購',
        displayType: 'text',
        selectionMode: 'multi',
        required: false,
        options: [
          { id: 'opt-add-bonnet', label: '同系列手工蕾絲邦尼帽', priceDelta: 220, available: true },
          { id: 'opt-add-bloomers', label: '純棉荷葉邊內搭燈籠褲', priceDelta: 120, available: true },
          { id: 'opt-add-tail', label: '客製尾巴開孔', priceDelta: 50, available: true },
        ],
      },
    ],
    isPublished: true,
    isRecommended: true,
    isNewArrival: true,
    sortOrder: 2,
    createdAt: '2026-11-22',
    allowCustomNote: true,
  },
  {
    id: 'prod-sage-sailor-set',
    code: 'YT-102',
    name: '鼠尾草水手領三件組',
    categoryId: 'featured',
    basePrice: 760,
    status: 'in_stock',
    dollSizes: ['努努', '海星體', 'es熊娃', 'es醜娃'],
    summary: '低飽和霧灰鼠尾草綠純棉布料配奶油滾邊水手領，內含上衣、百褶短褲與毛球拼接貝雷帽，穿脫方便不卡頭。',
    materialAndCare: DEFAULT_PURCHASE_NOTICE,
    leadTime: DEFAULT_LEAD_TIME,
    images: [
      STUDIO_IMAGES.sageSailorSet,
      STUDIO_IMAGES.heroBanner,
    ],
    variantGroups: [
      {
        id: 'vg-size',
        name: '娃娃尺寸',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-nunu', label: '努努', priceDelta: 0, available: true },
          { id: 'opt-starfish', label: '海星體', priceDelta: 0, available: true },
          { id: 'opt-esbear', label: 'es熊娃', priceDelta: 40, available: true },
          { id: 'opt-esugly', label: 'es醜娃', priceDelta: 60, available: true },
        ],
      },
      {
        id: 'vg-collar-trim',
        name: '領片滾邊配色',
        displayType: 'color',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-trim-cream', label: '奶油白滾邊', priceDelta: 0, available: true, colorHex: '#EFE9DB' },
          { id: 'opt-trim-oat', label: '燕麥暖灰', priceDelta: 0, available: true, colorHex: '#CFC6B8' },
        ],
      },
      {
        id: 'vg-hat-option',
        name: '貝雷帽蝴蝶結方向',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-hat-side', label: '側邊奶油緞帶結', priceDelta: 0, available: true },
          { id: 'opt-hat-plain', label: '極簡無結（僅毛球）', priceDelta: 0, available: true },
        ],
      },
    ],
    isPublished: true,
    isRecommended: true,
    isNewArrival: false,
    sortOrder: 3,
    createdAt: '2026-11-15',
    allowCustomNote: true,
  },
  {
    id: 'prod-custom-knit-cardigan',
    code: 'YT-202',
    name: '手工麻花開襟毛衣燈芯絨套組（客製配色）',
    categoryId: 'custom',
    basePrice: 920,
    status: 'new',
    dollSizes: ['海星體', 'es熊娃', 'es醜娃'],
    summary: '純手工棒針編織微型麻花開襟外套，搭配棉麻襯衫與自選燈芯絨／亞麻短褲，秋冬感十足的質感層次穿搭。',
    materialAndCare: DEFAULT_PURCHASE_NOTICE,
    leadTime: DEFAULT_LEAD_TIME,
    images: [
      STUDIO_IMAGES.customKnitCardigan,
      STUDIO_IMAGES.oatmealOveralls,
    ],
    variantGroups: [
      {
        id: 'vg-size',
        name: '娃娃尺寸',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-starfish', label: '海星體', priceDelta: 0, available: true },
          { id: 'opt-esbear', label: 'es熊娃', priceDelta: 50, available: true },
          { id: 'opt-esugly', label: 'es醜娃', priceDelta: 80, available: true },
        ],
      },
      {
        id: 'vg-pants-swatch',
        name: '短褲布料色卡',
        description: '選擇下身短褲布料，點擊色卡可放大檢視材質細節',
        displayType: 'swatch',
        selectionMode: 'single',
        required: true,
        options: [
          {
            id: 'opt-cocoa',
            label: '暖可可細燈芯絨',
            priceDelta: 0,
            available: true,
            swatchId: 'sw-cocoa-corduroy',
            previewImage: STUDIO_IMAGES.customKnitCardigan,
          },
          {
            id: 'opt-oat',
            label: '燕麥原色亞麻',
            priceDelta: 0,
            available: true,
            swatchId: 'sw-oat-linen',
            previewImage: STUDIO_IMAGES.oatmealOveralls,
          },
          {
            id: 'opt-mist',
            label: '霧灰藍細條紋棉',
            priceDelta: 30,
            available: true,
            swatchId: 'sw-mist-stripe',
          },
        ],
      },
      {
        id: 'vg-yarn-color',
        name: '毛衣毛線色選',
        displayType: 'color',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-yarn-sand', label: '原味燕麥沙', priceDelta: 0, available: true, colorHex: '#CDB99E' },
          { id: 'opt-yarn-milk', label: '暖杏牛奶白', priceDelta: 0, available: true, colorHex: '#EFE9DD' },
          { id: 'opt-yarn-slate', label: '淺灰岩霧藍', priceDelta: 40, available: true, colorHex: '#9EA7AE' },
          { id: 'opt-yarn-moss', label: '苔蘚灰綠（暫缺）', priceDelta: 40, available: false, colorHex: '#7A8674' },
        ],
      },
      {
        id: 'vg-collar-style',
        name: '內搭襯衫領型',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-col-std', label: '經典小翻領', priceDelta: 0, available: true },
          { id: 'opt-col-peter', label: '圓角彼得潘領', priceDelta: 40, available: true },
          { id: 'opt-col-lace', label: '蕾絲荷葉娃娃領', priceDelta: 70, available: true },
        ],
      },
      {
        id: 'vg-knit-addons',
        name: '額外配件加購',
        displayType: 'text',
        selectionMode: 'multi',
        required: false,
        options: [
          { id: 'opt-mini-bag', label: '手工鉤針斜背小包', priceDelta: 150, available: true },
          { id: 'opt-mini-beanie', label: '同色系迷你毛線帽', priceDelta: 130, available: true },
        ],
      },
    ],
    isPublished: true,
    isRecommended: true,
    isNewArrival: true,
    sortOrder: 4,
    createdAt: '2026-11-23',
    allowCustomNote: true,
  },
  {
    id: 'prod-rose-pinafore',
    code: 'YT-103',
    name: '乾燥玫瑰雕花蕾絲圍裙洋裝',
    categoryId: 'featured',
    basePrice: 780,
    status: 'made_to_order',
    dollSizes: ['努努', '海星體', '指偶', 'es熊娃'],
    summary: '溫柔乾燥玫瑰藕色棉布結合下擺與肩帶雕花棉質蕾絲，胸口迷你口袋與奶油緞帶結呈現細膩手作感。',
    materialAndCare: DEFAULT_PURCHASE_NOTICE,
    leadTime: DEFAULT_LEAD_TIME,
    images: [
      STUDIO_IMAGES.rosePinafore,
      STUDIO_IMAGES.customBonnetDress,
    ],
    variantGroups: [
      {
        id: 'vg-size',
        name: '娃娃尺寸',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-nunu', label: '努努', priceDelta: 0, available: true },
          { id: 'opt-starfish', label: '海星體', priceDelta: 30, available: true },
          { id: 'opt-finger', label: '指偶', priceDelta: 0, available: true },
          { id: 'opt-esbear', label: 'es熊娃', priceDelta: 50, available: true },
        ],
      },
      {
        id: 'vg-lace',
        name: '蕾絲款式',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-lace-eyelet', label: '經典米白雕花棉蕾絲', priceDelta: 0, available: true },
          { id: 'opt-lace-frill', label: '雙層細褶棉網蕾絲', priceDelta: 60, available: true },
        ],
      },
      {
        id: 'vg-bow',
        name: '蝴蝶結款式',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-bow-cream', label: '奶油米緞帶結', priceDelta: 0, available: true },
          { id: 'opt-bow-velvet', label: '霧棕絲絨細結', priceDelta: 40, available: true },
        ],
      },
    ],
    isPublished: true,
    isRecommended: false,
    isNewArrival: true,
    sortOrder: 5,
    createdAt: '2026-11-18',
    allowCustomNote: true,
  },
  {
    id: 'prod-earl-grey-cape',
    code: 'YT-104',
    name: '伯爵灰羊毛連帽斗篷與格紋圍巾',
    categoryId: 'featured',
    basePrice: 720,
    status: 'in_stock',
    dollSizes: ['努努', '海星體', '指偶', 'es熊娃', 'es醜娃'],
    summary: '霧暖伯爵灰毛呢連帽小斗篷，搭配三組仿真皮環原木牛角釦，附贈同色調流蘇格紋圍巾，不挑身形皆好穿脫。',
    materialAndCare: DEFAULT_PURCHASE_NOTICE,
    leadTime: DEFAULT_LEAD_TIME,
    images: [
      STUDIO_IMAGES.earlGreyCape,
      STUDIO_IMAGES.heroBanner,
    ],
    variantGroups: [
      {
        id: 'vg-size',
        name: '娃娃尺寸',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-nunu', label: '努努', priceDelta: 0, available: true },
          { id: 'opt-starfish', label: '海星體', priceDelta: 20, available: true },
          { id: 'opt-finger', label: '指偶', priceDelta: 0, available: true },
          { id: 'opt-esbear', label: 'es熊娃', priceDelta: 40, available: true },
          { id: 'opt-esugly', label: 'es醜娃', priceDelta: 60, available: true },
        ],
      },
      {
        id: 'vg-toggle',
        name: '牛角釦款式',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-wood-light', label: '原木淺色牛角釦', priceDelta: 0, available: true },
          { id: 'opt-wood-dark', label: '胡桃深棕牛角釦', priceDelta: 30, available: true },
        ],
      },
    ],
    isPublished: true,
    isRecommended: false,
    isNewArrival: false,
    sortOrder: 6,
    createdAt: '2026-11-10',
    allowCustomNote: true,
  },
  {
    id: 'prod-custom-pinafore-bespoke',
    code: 'YT-203',
    name: '森系吊帶裙自選布料訂製款',
    categoryId: 'custom',
    basePrice: 790,
    status: 'made_to_order',
    dollSizes: ['努努', '海星體', '指偶', 'es熊娃', 'es醜娃'],
    summary: '可自選主體布料色卡與蕾絲滾邊的百搭吊帶裙，內搭白色棉襯衫或單穿都溫柔可愛。',
    materialAndCare: DEFAULT_PURCHASE_NOTICE,
    leadTime: DEFAULT_LEAD_TIME,
    images: [
      STUDIO_IMAGES.rosePinafore,
      STUDIO_IMAGES.oatmealOveralls,
      STUDIO_IMAGES.customBonnetDress,
    ],
    variantGroups: [
      {
        id: 'vg-size',
        name: '娃娃尺寸',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-nunu', label: '努努', priceDelta: 0, available: true },
          { id: 'opt-starfish', label: '海星體', priceDelta: 30, available: true },
          { id: 'opt-finger', label: '指偶', priceDelta: 0, available: true },
          { id: 'opt-esbear', label: 'es熊娃', priceDelta: 50, available: true },
          { id: 'opt-esugly', label: 'es醜娃', priceDelta: 80, available: true },
        ],
      },
      {
        id: 'vg-dress-swatch',
        name: '吊帶裙布料色卡',
        description: '支援從共用色卡庫挑選喜愛的布料花色',
        displayType: 'swatch',
        selectionMode: 'single',
        required: true,
        options: [
          {
            id: 'opt-sw-rose',
            label: '乾燥玫瑰細格紋',
            priceDelta: 0,
            available: true,
            swatchId: 'sw-rose-gingham',
            previewImage: STUDIO_IMAGES.rosePinafore,
          },
          {
            id: 'opt-sw-cocoa',
            label: '暖可可細燈芯絨',
            priceDelta: 50,
            available: true,
            swatchId: 'sw-cocoa-corduroy',
            previewImage: STUDIO_IMAGES.customKnitCardigan,
          },
          {
            id: 'opt-sw-sage',
            label: '霧灰鼠尾草二重紗',
            priceDelta: 20,
            available: true,
            swatchId: 'sw-sage-gauze',
            previewImage: STUDIO_IMAGES.sageSailorSet,
          },
          {
            id: 'opt-sw-mist',
            label: '霧灰藍細條紋棉',
            priceDelta: 30,
            available: true,
            swatchId: 'sw-mist-stripe',
            previewImage: STUDIO_IMAGES.customBonnetDress,
          },
        ],
      },
      {
        id: 'vg-extra-decors',
        name: '額外裝飾配件',
        displayType: 'text',
        selectionMode: 'multi',
        required: false,
        options: [
          { id: 'opt-inner-blouse', label: '加購奶油泡泡袖內搭襯衫', priceDelta: 240, available: true },
          { id: 'opt-hair-clip', label: '同布料迷你蝴蝶結髮夾一對', priceDelta: 90, available: true },
        ],
      },
    ],
    isPublished: true,
    isRecommended: false,
    isNewArrival: false,
    sortOrder: 7,
    createdAt: '2026-11-08',
    allowCustomNote: true,
  },
  {
    id: 'prod-custom-tea-sailor',
    code: 'YT-204',
    name: '午後茶水手服訂製組（秋日限定批）',
    categoryId: 'custom',
    basePrice: 850,
    status: 'sold_out',
    dollSizes: ['努努', 'es熊娃', 'es醜娃'],
    summary: '秋日限定批次訂製水手服套組，此批布料已全數預訂額滿，可先加入收藏追蹤下一梯次開單。',
    materialAndCare: DEFAULT_PURCHASE_NOTICE,
    leadTime: DEFAULT_LEAD_TIME,
    images: [
      STUDIO_IMAGES.sageSailorSet,
      STUDIO_IMAGES.earlGreyCape,
    ],
    variantGroups: [
      {
        id: 'vg-size',
        name: '娃娃尺寸',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-nunu', label: '努努', priceDelta: 0, available: false },
          { id: 'opt-esbear', label: 'es熊娃', priceDelta: 40, available: false },
          { id: 'opt-esugly', label: 'es醜娃', priceDelta: 60, available: false },
        ],
      },
      {
        id: 'vg-main-swatch',
        name: '主體布料色卡',
        displayType: 'swatch',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-sw-sage', label: '霧灰鼠尾草二重紗', priceDelta: 0, available: false, swatchId: 'sw-sage-gauze' },
          { id: 'opt-sw-mist', label: '霧灰藍細條紋棉', priceDelta: 0, available: false, swatchId: 'sw-mist-stripe' },
        ],
      },
    ],
    isPublished: true,
    isRecommended: false,
    isNewArrival: false,
    sortOrder: 8,
    createdAt: '2026-10-28',
    allowCustomNote: true,
  },
  {
    id: 'prod-crochet-scallop-bib',
    code: 'CR-101',
    name: '花邊珍珠手工鉤織娃用圍兜兜',
    categoryId: 'crochet_bib',
    basePrice: 320,
    status: 'made_to_order',
    dollSizes: ['努努', '海星體', '指偶', 'es熊娃', 'es醜娃'],
    summary: '純手工細針鉤織扇貝荷葉邊圍兜兜，可自選線材庫色號與緞帶綁帶配色，單戴或疊搭素色上衣都溫柔可愛。',
    materialAndCare: DEFAULT_PURCHASE_NOTICE,
    leadTime: DEFAULT_LEAD_TIME,
    images: [
      STUDIO_IMAGES.crochetBib,
      STUDIO_IMAGES.crochetOutfit,
    ],
    variantGroups: [
      {
        id: 'vg-size',
        name: '娃娃尺寸',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-nunu', label: '努努', priceDelta: 0, available: true },
          { id: 'opt-starfish', label: '海星體', priceDelta: 0, available: true },
          { id: 'opt-finger', label: '指偶', priceDelta: 0, available: true },
          { id: 'opt-esbear', label: 'es熊娃', priceDelta: 30, available: true },
          { id: 'opt-esugly', label: 'es醜娃', priceDelta: 40, available: true },
        ],
      },
      {
        id: 'vg-yarn-swatch',
        name: '主體線材選擇',
        description: '從線材庫挑選喜愛的毛線質感與色號，點擊右上角可放大檢視',
        displayType: 'swatch',
        swatchLibrary: 'yarn',
        selectionMode: 'single',
        required: true,
        options: [
          {
            id: 'opt-yn-cream',
            label: '奶霜四股牛奶棉',
            priceDelta: 0,
            available: true,
            swatchId: 'yn-cream-milk',
            previewImage: STUDIO_IMAGES.crochetBib,
          },
          {
            id: 'opt-yn-oat',
            label: '燕麥拿鐵細棉線',
            priceDelta: 0,
            available: true,
            swatchId: 'yn-oat-latte',
            previewImage: STUDIO_IMAGES.crochetBib,
          },
          {
            id: 'opt-yn-rose',
            label: '柔霧玫瑰蕾絲線',
            priceDelta: 30,
            available: true,
            swatchId: 'yn-rose-mohair',
            previewImage: STUDIO_IMAGES.crochetBib,
          },
          {
            id: 'opt-yn-sage',
            label: '鼠尾草綠精梳棉',
            priceDelta: 20,
            available: true,
            swatchId: 'yn-sage-cotton',
            previewImage: STUDIO_IMAGES.crochetBib,
          },
        ],
      },
      {
        id: 'vg-bib-addons',
        name: '額外點綴加購',
        displayType: 'text',
        selectionMode: 'multi',
        required: false,
        options: [
          { id: 'opt-bib-pearl', label: '領緣手工縫小米白珍珠', priceDelta: 40, available: true },
          { id: 'opt-bib-ribbon', label: '升級絲緞長尾蝴蝶結綁帶', priceDelta: 30, available: true },
        ],
      },
    ],
    isPublished: true,
    isRecommended: true,
    isNewArrival: true,
    sortOrder: 9,
    createdAt: '2026-11-24',
    allowCustomNote: true,
  },
  {
    id: 'prod-crochet-cardigan-hat',
    code: 'CR-201',
    name: '燕麥奶油手工鉤織毛衣與漁夫帽套組',
    categoryId: 'crochet_outfit',
    basePrice: 690,
    status: 'new',
    dollSizes: ['努努', '海星體', 'es熊娃', 'es醜娃'],
    summary: '全手工一針一線鉤織的軟糯開襟小毛衣與同色系迷你漁夫帽，採用親膚精梳牛奶棉，保暖不臃腫。',
    materialAndCare: DEFAULT_PURCHASE_NOTICE,
    leadTime: DEFAULT_LEAD_TIME,
    images: [
      STUDIO_IMAGES.crochetOutfit,
      STUDIO_IMAGES.crochetBib,
    ],
    variantGroups: [
      {
        id: 'vg-size',
        name: '娃娃尺寸',
        displayType: 'text',
        selectionMode: 'single',
        required: true,
        options: [
          { id: 'opt-nunu', label: '努努', priceDelta: 0, available: true },
          { id: 'opt-starfish', label: '海星體', priceDelta: 20, available: true },
          { id: 'opt-esbear', label: 'es熊娃', priceDelta: 50, available: true },
          { id: 'opt-esugly', label: 'es醜娃', priceDelta: 80, available: true },
        ],
      },
      {
        id: 'vg-outfit-yarn',
        name: '毛衣主體線材',
        description: '點擊線材卡放大查看編織紋理與色號',
        displayType: 'swatch',
        swatchLibrary: 'yarn',
        selectionMode: 'single',
        required: true,
        options: [
          {
            id: 'opt-yn-oat',
            label: '燕麥拿鐵細棉線',
            priceDelta: 0,
            available: true,
            swatchId: 'yn-oat-latte',
            previewImage: STUDIO_IMAGES.crochetOutfit,
          },
          {
            id: 'opt-yn-cream',
            label: '奶霜四股牛奶棉',
            priceDelta: 0,
            available: true,
            swatchId: 'yn-cream-milk',
            previewImage: STUDIO_IMAGES.crochetOutfit,
          },
          {
            id: 'opt-yn-sage',
            label: '鼠尾草綠精梳棉',
            priceDelta: 30,
            available: true,
            swatchId: 'yn-sage-cotton',
            previewImage: STUDIO_IMAGES.crochetOutfit,
          },
          {
            id: 'opt-yn-rose',
            label: '柔霧玫瑰蕾絲線',
            priceDelta: 40,
            available: true,
            swatchId: 'yn-rose-mohair',
            previewImage: STUDIO_IMAGES.crochetOutfit,
          },
        ],
      },
      {
        id: 'vg-crochet-addons',
        name: '額外鉤織配件',
        displayType: 'text',
        selectionMode: 'multi',
        required: false,
        options: [
          { id: 'opt-crochet-bag', label: '加購同色系迷你鉤織斜背包', priceDelta: 120, available: true },
          { id: 'opt-crochet-scarf', label: '加購迷你流蘇小圍巾', priceDelta: 110, available: true },
        ],
      },
    ],
    isPublished: true,
    isRecommended: true,
    isNewArrival: true,
    sortOrder: 10,
    createdAt: '2026-11-25',
    allowCustomNote: true,
  },
];
