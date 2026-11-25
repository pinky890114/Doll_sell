import {
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  PRIMARY_ADMIN_EMAIL,
} from '../firebase';
import {
  INITIAL_HOME_CONFIG,
  INITIAL_PRODUCTS,
  INITIAL_SWATCHES,
} from '../data/seedData';
import {
  DOLL_SIZES,
  type DollSize,
  type FabricSwatch,
  type HomeConfig,
  type Product,
} from '../types/store';

const VALID_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const VALID_HEX_PATTERN = /^#[0-9a-fA-F]{3,8}$/;

function sanitizeId(raw: string, prefix: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  if (cleaned && VALID_ID_PATTERN.test(cleaned)) {
    return cleaned;
  }
  return `${prefix}-${Date.now()}`;
}

function clampString(val: unknown, maxLen: number): string {
  return String(val ?? '').slice(0, maxLen);
}

function normalizeDollSizes(sizes: unknown): DollSize[] {
  if (!Array.isArray(sizes)) return ['努努'];
  const valid = sizes.filter((s): s is DollSize =>
    DOLL_SIZES.includes(s as DollSize)
  );
  return valid.length > 0 ? valid.slice(0, 5) : ['努努'];
}

function formatCreatedAtString(raw: unknown): string {
  if (raw instanceof Timestamp) {
    return raw.toDate().toISOString().slice(0, 10);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw;
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Normalize an admin login identifier.
 * Allows entering short username "pinky890114" or full email "pinky890114@gmail.com".
 */
export function normalizeAdminLoginEmail(identifier: string): string {
  const trimmed = identifier.trim().toLowerCase();
  if (!trimmed) return '';
  if (trimmed === 'pinky890114') {
    return PRIMARY_ADMIN_EMAIL;
  }
  return trimmed;
}

export async function signInAdminWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function signInAdminWithEmailPassword(
  identifier: string,
  password: string
): Promise<User> {
  const normalizedEmail = normalizeAdminLoginEmail(identifier);
  const result = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  return result.user;
}

export async function sendAdminVerificationEmail(): Promise<void> {
  if (!auth.currentUser) return;
  await sendEmailVerification(auth.currentUser);
}

export async function signOutAdmin(): Promise<void> {
  await signOut(auth);
}

export async function checkIsVerifiedAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified) return false;
  if (user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL) {
    return true;
  }
  const path = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists() && snap.data()?.role === 'admin';
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

const VALID_SWATCH_LIBRARIES = new Set([
  'fabric',
  'rhinestone',
  'eye_color',
  'ribbon_color',
  'yarn',
]);

const VALID_CATEGORIES = new Set([
  'featured',
  'custom',
  'crochet_bib',
  'crochet_outfit',
]);

const VALID_BANNER_TARGETS = new Set([
  'featured',
  'custom',
  'crochet_bib',
  'crochet_outfit',
  'proxy',
  'crochet',
  'all',
]);

function normalizeSwatchLibrary(val: unknown): FabricSwatch['libraryType'] {
  if (typeof val === 'string' && VALID_SWATCH_LIBRARIES.has(val)) {
    return val as FabricSwatch['libraryType'];
  }
  return 'fabric';
}

function normalizeCategoryId(val: unknown): Product['categoryId'] {
  if (typeof val === 'string' && VALID_CATEGORIES.has(val)) {
    return val as Product['categoryId'];
  }
  return 'featured';
}

function sanitizeProductPayload(
  product: Product,
  uid: string,
  existingCreatedAt?: Timestamp
) {
  const id = sanitizeId(product.id, 'prod');
  const images = (product.images || [])
    .filter((img): img is string => typeof img === 'string' && img.length > 0)
    .slice(0, 10)
    .map((img) => img.slice(0, 350000));

  const variantGroups = (product.variantGroups || []).slice(0, 20).map((group) => ({
    id: sanitizeId(group.id, 'vg'),
    name: clampString(group.name || '規格', 80),
    ...(group.description ? { description: clampString(group.description, 240) } : {}),
    displayType: group.displayType,
    selectionMode: group.selectionMode,
    required: Boolean(group.required),
    ...(group.swatchLibrary
      ? { swatchLibrary: normalizeSwatchLibrary(group.swatchLibrary) }
      : {}),
    options: (group.options || []).slice(0, 30).map((opt) => ({
      id: sanitizeId(opt.id, 'opt'),
      label: clampString(opt.label || '選項', 80),
      priceDelta: Math.max(0, Math.min(100000, Number(opt.priceDelta) || 0)),
      available: Boolean(opt.available),
      ...(opt.previewImage ? { previewImage: clampString(opt.previewImage, 350000) } : {}),
      ...(opt.colorHex ? { colorHex: clampString(opt.colorHex, 16) } : {}),
      ...(opt.swatchId ? { swatchId: sanitizeId(opt.swatchId, 'sw') } : {}),
    })),
  }));

  return {
    id,
    code: clampString(product.code.trim() || `YT-${Date.now().toString().slice(-3)}`, 40),
    name: clampString(product.name.trim() || '未命名商品', 120),
    categoryId: normalizeCategoryId(product.categoryId),
    basePrice: Math.max(0, Math.min(1000000, Number(product.basePrice) || 0)),
    status: ['new', 'in_stock', 'made_to_order', 'sold_out'].includes(product.status)
      ? product.status
      : 'new',
    dollSizes: normalizeDollSizes(product.dollSizes),
    summary: clampString(product.summary, 1000),
    materialAndCare: clampString(product.materialAndCare, 2000),
    leadTime: clampString(product.leadTime, 200),
    images,
    variantGroups,
    isPublished: Boolean(product.isPublished),
    isRecommended: Boolean(product.isRecommended),
    isNewArrival: Boolean(product.isNewArrival),
    sortOrder: Math.max(0, Math.min(100000, Number(product.sortOrder) || 0)),
    allowCustomNote: Boolean(product.allowCustomNote),
    updatedBy: uid,
    createdAt: existingCreatedAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function sanitizeSwatchPayload(
  swatch: FabricSwatch,
  uid: string,
  existingCreatedAt?: Timestamp
) {
  const id = sanitizeId(swatch.id, 'sw');
  const rawHex = swatch.hex.trim();
  const hex = VALID_HEX_PATTERN.test(rawHex) ? rawHex : '#D6CCB9';
  return {
    id,
    libraryType: normalizeSwatchLibrary(swatch.libraryType),
    code: clampString(swatch.code.trim() || 'SW-01', 40),
    name: clampString(swatch.name.trim() || '色卡項目', 80),
    hex,
    materialNote: clampString(swatch.materialNote, 600),
    imageUrl: clampString(swatch.imageUrl, 350000),
    isPublic: true,
    updatedBy: uid,
    createdAt: existingCreatedAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function sanitizeStorefrontConfigPayload(config: HomeConfig, uid: string) {
  const liffId = config.lineConfig.liffId?.trim() || '';
  const targetCategory = VALID_BANNER_TARGETS.has(config.banner.targetCategory)
    ? config.banner.targetCategory
    : 'all';
  return {
    brandName: clampString(config.brandName.trim() || '天冷穿件衣', 80),
    brandSubtitle: clampString(config.brandSubtitle, 160),
    banner: {
      title: clampString(config.banner.title.trim() || INITIAL_HOME_CONFIG.banner.title, 160),
      subtitle: clampString(config.banner.subtitle, 400),
      ctaLabel: clampString(config.banner.ctaLabel.trim() || '探索全部商品', 60),
      targetCategory,
      imageUrl: clampString(config.banner.imageUrl, 350000),
    },
    featuredCategoryImage: clampString(config.featuredCategoryImage, 350000),
    customCategoryImage: clampString(config.customCategoryImage, 350000),
    crochetBibCategoryImage: clampString(
      config.crochetBibCategoryImage || INITIAL_HOME_CONFIG.crochetBibCategoryImage,
      350000
    ),
    crochetOutfitCategoryImage: clampString(
      config.crochetOutfitCategoryImage || INITIAL_HOME_CONFIG.crochetOutfitCategoryImage,
      350000
    ),
    sectionVisibility: {
      proxy: config.sectionVisibility?.proxy !== false,
      crochet: config.sectionVisibility?.crochet !== false,
    },
    lineConfig: {
      officialAccountId: clampString(config.lineConfig.officialAccountId.trim() || '@182oocrl', 64),
      displayName: clampString(
        config.lineConfig.displayName.trim() || '天冷穿件衣 官方客服',
        80
      ),
      customerServiceGreeting: clampString(config.lineConfig.customerServiceGreeting, 400),
      liffId: clampString(liffId, 128),
    },
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  };
}

export function subscribeProducts(
  isAdmin: boolean,
  onData: (products: Product[], hasCloudDocs: boolean) => void
): Unsubscribe {
  const path = 'products';
  const q = isAdmin
    ? query(collection(db, path))
    : query(collection(db, path), where('isPublished', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData([], false);
        return;
      }
      const list: Product[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          code: String(d.code || 'YT-101'),
          name: String(d.name || ''),
          categoryId: normalizeCategoryId(d.categoryId),
          basePrice: Number(d.basePrice) || 0,
          status: d.status || 'new',
          dollSizes: normalizeDollSizes(d.dollSizes),
          summary: String(d.summary || ''),
          materialAndCare: String(d.materialAndCare || ''),
          leadTime: String(d.leadTime || ''),
          images: Array.isArray(d.images) ? d.images : [],
          variantGroups: Array.isArray(d.variantGroups) ? d.variantGroups : [],
          isPublished: Boolean(d.isPublished),
          isRecommended: Boolean(d.isRecommended),
          isNewArrival: Boolean(d.isNewArrival),
          sortOrder: Number(d.sortOrder) || 0,
          createdAt: formatCreatedAtString(d.createdAt),
          allowCustomNote: Boolean(d.allowCustomNote),
        };
      });
      list.sort((a, b) => a.sortOrder - b.sortOrder);
      onData(list, true);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeSwatches(
  isAdmin: boolean,
  onData: (swatches: FabricSwatch[], hasCloudDocs: boolean) => void
): Unsubscribe {
  const path = 'swatches';
  const q = isAdmin
    ? query(collection(db, path))
    : query(collection(db, path), where('isPublic', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData([], false);
        return;
      }
      const list: FabricSwatch[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          libraryType: normalizeSwatchLibrary(d.libraryType),
          code: String(d.code || ''),
          name: String(d.name || ''),
          hex: String(d.hex || '#D6CCB9'),
          materialNote: String(d.materialNote || ''),
          imageUrl: String(d.imageUrl || ''),
        };
      });
      list.sort((a, b) => a.code.localeCompare(b.code));
      onData(list, true);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeHomeConfig(
  onData: (config: HomeConfig | null) => void
): Unsubscribe {
  const path = 'settings/storefront';
  return onSnapshot(
    doc(db, 'settings', 'storefront'),
    (docSnap) => {
      if (!docSnap.exists()) {
        onData(null);
        return;
      }
      const d = docSnap.data();
      const rawBrand = String(d.brandName || INITIAL_HOME_CONFIG.brandName);
      const normalizedBrand =
        rawBrand === 'YourTreasure娃衣代理' ? INITIAL_HOME_CONFIG.brandName : rawBrand;
      const rawDisplayName = String(
        d.lineConfig?.displayName || INITIAL_HOME_CONFIG.lineConfig.displayName
      );
      const normalizedDisplayName =
        rawDisplayName === 'YourTreasure娃衣代理 官方客服'
          ? INITIAL_HOME_CONFIG.lineConfig.displayName
          : rawDisplayName;
      const rawGreeting = String(
        d.lineConfig?.customerServiceGreeting ??
          INITIAL_HOME_CONFIG.lineConfig.customerServiceGreeting
      );
      const normalizedGreeting = rawGreeting.replace(
        'YourTreasure娃衣代理',
        INITIAL_HOME_CONFIG.brandName
      );
      onData({
        brandName: normalizedBrand,
        brandSubtitle: String(d.brandSubtitle ?? ''),
        banner: {
          title: String(d.banner?.title || INITIAL_HOME_CONFIG.banner.title),
          subtitle: String(d.banner?.subtitle ?? INITIAL_HOME_CONFIG.banner.subtitle),
          ctaLabel: String(d.banner?.ctaLabel || INITIAL_HOME_CONFIG.banner.ctaLabel),
          targetCategory: VALID_BANNER_TARGETS.has(d.banner?.targetCategory)
            ? d.banner.targetCategory
            : 'all',
          imageUrl: String(d.banner?.imageUrl || INITIAL_HOME_CONFIG.banner.imageUrl),
        },
        featuredCategoryImage: String(
          d.featuredCategoryImage || INITIAL_HOME_CONFIG.featuredCategoryImage
        ),
        customCategoryImage: String(
          d.customCategoryImage || INITIAL_HOME_CONFIG.customCategoryImage
        ),
        crochetBibCategoryImage: String(
          d.crochetBibCategoryImage || INITIAL_HOME_CONFIG.crochetBibCategoryImage
        ),
        crochetOutfitCategoryImage: String(
          d.crochetOutfitCategoryImage || INITIAL_HOME_CONFIG.crochetOutfitCategoryImage
        ),
        sectionVisibility: {
          proxy: d.sectionVisibility?.proxy !== false,
          crochet: d.sectionVisibility?.crochet !== false,
        },
        lineConfig: {
          officialAccountId: String(
            d.lineConfig?.officialAccountId || INITIAL_HOME_CONFIG.lineConfig.officialAccountId
          ),
          displayName: normalizedDisplayName,
          customerServiceGreeting: normalizedGreeting,
          liffId: String(d.lineConfig?.liffId || ''),
        },
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveProductToCloud(product: Product): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('請先登入管理員帳號');
  const id = sanitizeId(product.id, 'prod');
  const path = `products/${id}`;
  try {
    const ref = doc(db, 'products', id);
    const existingSnap = await getDoc(ref);
    const existingCreatedAt = existingSnap.exists()
      ? (existingSnap.data().createdAt as Timestamp | undefined)
      : undefined;
    const payload = sanitizeProductPayload({ ...product, id }, uid, existingCreatedAt);
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteProductFromCloud(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSwatchToCloud(swatch: FabricSwatch): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('請先登入管理員帳號');
  const id = sanitizeId(swatch.id, 'sw');
  const path = `swatches/${id}`;
  try {
    const ref = doc(db, 'swatches', id);
    const existingSnap = await getDoc(ref);
    const existingCreatedAt = existingSnap.exists()
      ? (existingSnap.data().createdAt as Timestamp | undefined)
      : undefined;
    const payload = sanitizeSwatchPayload({ ...swatch, id }, uid, existingCreatedAt);
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSwatchFromCloud(swatchId: string): Promise<void> {
  const path = `swatches/${swatchId}`;
  try {
    await deleteDoc(doc(db, 'swatches', swatchId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveHomeConfigToCloud(config: HomeConfig): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('請先登入管理員帳號');
  const path = 'settings/storefront';
  try {
    const payload = sanitizeStorefrontConfigPayload(config, uid);
    await setDoc(doc(db, 'settings', 'storefront'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function seedInitialStorefrontToCloud(forceReset = false): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('請先登入管理員帳號');

  try {
    const settingsRef = doc(db, 'settings', 'storefront');
    const settingsSnap = await getDoc(settingsRef);
    const productsSnap = await getDocs(collection(db, 'products'));
    const swatchesSnap = await getDocs(collection(db, 'swatches'));

    if (!forceReset && settingsSnap.exists() && !productsSnap.empty && !swatchesSnap.empty) {
      return;
    }

    const batch = writeBatch(db);

    if (forceReset) {
      const seedProdIds = new Set(INITIAL_PRODUCTS.map((p) => p.id));
      for (const snap of productsSnap.docs) {
        if (!seedProdIds.has(snap.id)) {
          batch.delete(snap.ref);
        }
      }
      const seedSwatchIds = new Set(INITIAL_SWATCHES.map((s) => s.id));
      for (const snap of swatchesSnap.docs) {
        if (!seedSwatchIds.has(snap.id)) {
          batch.delete(snap.ref);
        }
      }
    }

    if (forceReset || !settingsSnap.exists()) {
      batch.set(settingsRef, sanitizeStorefrontConfigPayload(INITIAL_HOME_CONFIG, uid));
    }

    if (forceReset || productsSnap.empty) {
      const existingMap = new Map(
        productsSnap.docs.map((d) => [d.id, d.data().createdAt as Timestamp | undefined])
      );
      for (const prod of INITIAL_PRODUCTS) {
        batch.set(
          doc(db, 'products', prod.id),
          sanitizeProductPayload(prod, uid, existingMap.get(prod.id))
        );
      }
    }

    if (forceReset || swatchesSnap.empty) {
      const existingSwatchMap = new Map(
        swatchesSnap.docs.map((d) => [d.id, d.data().createdAt as Timestamp | undefined])
      );
      for (const swatch of INITIAL_SWATCHES) {
        batch.set(
          doc(db, 'swatches', swatch.id),
          sanitizeSwatchPayload(swatch, uid, existingSwatchMap.get(swatch.id))
        );
      }
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch:seed');
  }
}
