import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  Gem,
  Home,
  Link2,
  Lock,
  LogOut,
  MessageCircle,
  Package,
  Palette,
  Plus,
  Ribbon,
  RotateCcw,
  Save,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  getSectionForCategory,
  SECTION_LABELS,
  STATUS_LABELS,
  SWATCH_LIBRARY_LABELS,
  SWATCH_LIBRARY_META,
  SWATCH_LIBRARY_ORDER,
  type AdminUser,
  type CatalogCategoryFilter,
  type FabricSwatch,
  type HomeConfig,
  type Product,
  type StoreSectionId,
  type SwatchLibraryType,
} from '../types/store';
import { uploadImageLocally } from '../services/storage';
import {
  sendAdminVerificationEmail,
  signInAdminWithEmailPassword,
  signInAdminWithGoogle,
} from '../services/firestoreStore';
import {
  buildLineOaMessageUrl,
  LINE_BRAND_GREEN,
  normalizeLineAccountId,
} from '../services/lineIntegration';
import {
  DEFAULT_LEAD_TIME,
  DEFAULT_PURCHASE_NOTICE,
  INITIAL_PRODUCTS,
  INITIAL_SWATCHES,
} from '../data/seedData';
import { formatTWD } from '../utils/pricing';
import { buildCategoryShareUrl, buildProductShareUrl } from '../utils/router';
import { AdminProductEditor } from './AdminProductEditor';
import { SafeImage } from './SafeImage';

export interface AuthGateState {
  loading: boolean;
  signedInEmail: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
}

interface AdminViewProps {
  adminUser: AdminUser | null;
  authGate: AuthGateState;
  cloudError: string | null;
  products: Product[];
  swatches: FabricSwatch[];
  homeConfig: HomeConfig;
  onLogout: () => void | Promise<void>;
  onSaveProducts: (next: Product[]) => void | Promise<void>;
  onSaveSwatches: (next: FabricSwatch[]) => void | Promise<void>;
  onSaveHomeConfig: (next: HomeConfig) => void | Promise<void>;
  onResetDemoData: () => void | Promise<void>;
  onExitAdmin: () => void;
}

type AdminTab = 'products' | SwatchLibraryType | 'home';

const SWATCH_LIBRARY_ICONS: Record<SwatchLibraryType, React.ComponentType<{ className?: string }>> = {
  fabric: Palette,
  rhinestone: Gem,
  eye_color: Eye,
  ribbon_color: Ribbon,
  yarn: Sparkles,
};

export const AdminView: React.FC<AdminViewProps> = ({
  adminUser,
  authGate,
  cloudError,
  products,
  swatches,
  homeConfig,
  onLogout,
  onSaveProducts,
  onSaveSwatches,
  onSaveHomeConfig,
  onResetDemoData,
  onExitAdmin,
}) => {
  const [accountInput, setAccountInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [productSectionFilter, setProductSectionFilter] = useState<'all' | StoreSectionId>('all');
  const [editingProduct, setEditingProduct] = useState<{
    product: Product;
    isCreating: boolean;
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Swatch editor state
  const [swatchForm, setSwatchForm] = useState<FabricSwatch | null>(null);
  const [swatchError, setSwatchError] = useState<string | null>(null);

  // Home config local draft synced with Firestore updates
  const [homeDraft, setHomeDraft] = useState<HomeConfig>(homeConfig);
  const [homeSavedFeedback, setHomeSavedFeedback] = useState(false);
  const [sectionSavedFeedback, setSectionSavedFeedback] = useState<StoreSectionId | null>(null);
  const [copiedLinkKey, setCopiedLinkKey] = useState<string | null>(null);

  useEffect(() => {
    setHomeDraft(homeConfig);
  }, [homeConfig]);

  const copyStandaloneUrl = async (key: string, url: string) => {
    try {
      await navigator.clipboard?.writeText(url);
      setCopiedLinkKey(key);
      window.setTimeout(() => setCopiedLinkKey(null), 2000);
    } catch {
      setCopiedLinkKey(null);
    }
  };

  // Auth Gate when loading or unauthenticated
  if (authGate.loading) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pt-14 pb-16 text-center">
        <p className="text-sm text-[#6E6962]">正在驗證管理員登入狀態…</p>
      </div>
    );
  }

  if (!adminUser || adminUser.role !== 'admin') {
    const handleGoogleSignIn = async () => {
      setLoginError(null);
      setAuthSubmitting(true);
      try {
        await signInAdminWithGoogle();
      } catch (err) {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/popup-closed-by-user') {
          setLoginError('已取消 Google 登入視窗。');
        } else {
          setLoginError('Google 登入失敗，請確認瀏覽器未封鎖彈出視窗後再試。');
        }
      } finally {
        setAuthSubmitting(false);
      }
    };

    const handleEmailLoginSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!accountInput.trim() || !passwordInput.trim()) {
        setLoginError('請輸入管理員帳號與密碼');
        return;
      }
      setLoginError(null);
      setAuthSubmitting(true);
      try {
        await signInAdminWithEmailPassword(accountInput, passwordInput);
      } catch (err) {
        const code = (err as { code?: string })?.code || '';
        if (code === 'auth/operation-not-allowed') {
          setLoginError(
            'Firebase Console 尚未啟用「電子郵件／密碼」登入方式，請先點擊上方「使用 Google 帳號登入」，或到 Firebase Console 啟用 Email/Password 並建立帳號。'
          );
        } else if (
          code === 'auth/invalid-credential' ||
          code === 'auth/user-not-found' ||
          code === 'auth/wrong-password'
        ) {
          setLoginError(
            '帳號或密碼錯誤，或尚未於 Firebase Console 建立此帳密；也可直接使用上方 Google 帳號登入。'
          );
        } else {
          setLoginError('登入驗證失敗，請確認帳號密碼與網路狀態後再試。');
        }
      } finally {
        setAuthSubmitting(false);
      }
    };

    const handleSendVerification = async () => {
      try {
        await sendAdminVerificationEmail();
        setVerificationSent(true);
      } catch {
        setLoginError('寄送驗證信失敗，請稍後再試。');
      }
    };

    return (
      <div className="mx-auto w-full max-w-md px-4 pt-8 pb-16">
        <button
          type="button"
          onClick={onExitAdmin}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-[#6E6962] hover:text-[#2B2825] min-h-[40px]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回前台商店</span>
        </button>

        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFECE6] text-[#2B2825]">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold text-[#2B2825]">
            商品管理後台登入
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-[#6E6962]">
            已串接 Firebase Authentication 與雲端資料庫，僅限通過驗證之授權管理員存取與編輯商品、色卡及 LINE 設定。
          </p>

          {authGate.signedInEmail && !authGate.emailVerified && (
            <div className="mt-5 rounded-xl border border-[#D8C5B8] bg-[#FAF6F2] p-4 space-y-2.5 text-xs">
              <p className="font-medium text-[#2B2825]">
                帳號 {authGate.signedInEmail} 尚未完成信箱驗證
              </p>
              <p className="text-[#6E6962]">
                為保護雲端資料庫安全，請先完成信箱驗證（或改用 Google 帳號直接登入）。
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSendVerification}
                  className="min-h-[38px] rounded-lg bg-[#2B2825] px-3.5 text-xs font-medium text-white"
                >
                  {verificationSent ? '已寄出驗證信' : '寄送驗證信'}
                </button>
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  className="min-h-[38px] rounded-lg border border-[#DCD5CA] bg-white px-3.5 text-xs font-medium text-[#2B2825]"
                >
                  登出切換帳號
                </button>
              </div>
            </div>
          )}

          {authGate.signedInEmail && authGate.emailVerified && !authGate.isAdmin && (
            <div className="mt-5 rounded-xl border border-[#E2C9C5] bg-[#FDF8F7] p-4 space-y-2.5 text-xs">
              <p className="font-medium text-[#9A4B42]">
                帳號 {authGate.signedInEmail} 沒有管理員權限
              </p>
              <p className="text-[#6E6962]">
                請登出並改用授權管理員帳號（pinky890114@gmail.com）登入。
              </p>
              <button
                type="button"
                onClick={() => void onLogout()}
                className="min-h-[38px] rounded-lg border border-[#DCD5CA] bg-white px-3.5 text-xs font-medium text-[#2B2825]"
              >
                登出切換帳號
              </button>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <button
              type="button"
              disabled={authSubmitting}
              onClick={handleGoogleSignIn}
              className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#2B2825] text-sm font-medium text-white transition-colors hover:bg-[#3F3B37] disabled:opacity-60"
            >
              <span>{authSubmitting ? '驗證中…' : '使用 Google 帳號登入（推薦）'}</span>
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-[#E5E0D8]" />
              <span className="mx-3 shrink-0 text-[11px] text-[#8E8880]">
                或使用管理員帳號密碼登入
              </span>
              <div className="flex-grow border-t border-[#E5E0D8]" />
            </div>

            <form onSubmit={handleEmailLoginSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-xs font-medium text-[#6E6962] mb-1.5"
                >
                  管理員帳號／信箱
                </label>
                <input
                  id="admin-email"
                  type="text"
                  value={accountInput}
                  onChange={(e) => setAccountInput(e.target.value)}
                  placeholder="pinky890114 或 pinky890114@gmail.com"
                  autoComplete="username"
                  className="w-full min-h-[44px] rounded-xl border border-[#E5E0D8] bg-[#F7F5F0]/60 px-3.5 text-sm text-[#2B2825] focus:border-[#2B2825] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-passcode"
                  className="block text-xs font-medium text-[#6E6962] mb-1.5"
                >
                  管理員密碼
                </label>
                <input
                  id="admin-passcode"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="請輸入 Firebase 管理員密碼"
                  autoComplete="current-password"
                  className="w-full min-h-[44px] rounded-xl border border-[#E5E0D8] bg-[#F7F5F0]/60 px-3.5 text-sm text-[#2B2825] focus:border-[#2B2825] focus:bg-white focus:outline-none"
                />
              </div>

              {loginError && (
                <p role="alert" className="text-xs font-medium text-[#9A4B42] leading-relaxed">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full min-h-[44px] rounded-xl border border-[#2B2825] bg-white text-sm font-medium text-[#2B2825] transition-colors hover:bg-[#F7F5F0] disabled:opacity-60"
              >
                以帳號密碼驗證登入
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Sort products by sortOrder for admin list
  const sortedProducts = [...products].sort((a, b) => a.sortOrder - b.sortOrder);
  const displayedAdminProducts =
    productSectionFilter === 'all'
      ? sortedProducts
      : sortedProducts.filter(
          (p) => getSectionForCategory(p.categoryId) === productSectionFilter
        );
  const crochetProductCount = products.filter(
    (p) => getSectionForCategory(p.categoryId) === 'crochet'
  ).length;

  const handleImportSampleCrochetProducts = () => {
    const existingIds = new Set(products.map((p) => p.id));
    const crochetSamples = INITIAL_PRODUCTS.filter(
      (p) => getSectionForCategory(p.categoryId) === 'crochet' && !existingIds.has(p.id)
    );
    if (crochetSamples.length === 0) return;
    const maxOrder = products.reduce((max, p) => Math.max(max, p.sortOrder), 0);
    const orderedSamples = crochetSamples.map((p, idx) => ({
      ...p,
      sortOrder: maxOrder + idx + 1,
    }));
    onSaveProducts([...products, ...orderedSamples]);
  };

  const handleCreateProduct = () => {
    const maxOrder = products.reduce((max, p) => Math.max(max, p.sortOrder), 0);
    const isCrochetCreate = productSectionFilter === 'crochet';
    const blank: Product = {
      id: `prod-${Date.now()}`,
      code: isCrochetCreate ? `CR-${101 + crochetProductCount}` : `YT-${101 + products.length}`,
      name: '',
      categoryId: isCrochetCreate ? 'crochet_bib' : 'featured',
      basePrice: 0,
      status: 'new',
      dollSizes: ['努努', '海星體', '指偶', 'es熊娃', 'es醜娃'],
      summary: '',
      materialAndCare: DEFAULT_PURCHASE_NOTICE,
      leadTime: DEFAULT_LEAD_TIME,
      images: [],
      variantGroups: [
        {
          id: `vg-size-${Date.now()}`,
          name: '娃娃尺寸',
          displayType: 'text',
          selectionMode: 'single',
          required: true,
          options: [
            { id: `opt-nunu-${Date.now()}`, label: '努努', priceDelta: 0, available: true },
            { id: `opt-starfish-${Date.now()}`, label: '海星體', priceDelta: 0, available: true },
            { id: `opt-finger-${Date.now()}`, label: '指偶', priceDelta: 0, available: true },
            { id: `opt-esbear-${Date.now()}`, label: 'es熊娃', priceDelta: 0, available: true },
            { id: `opt-esugly-${Date.now()}`, label: 'es醜娃', priceDelta: 0, available: true },
          ],
        },
      ],
      isPublished: true,
      isRecommended: false,
      isNewArrival: true,
      sortOrder: maxOrder + 1,
      createdAt: new Date().toISOString().slice(0, 10),
      allowCustomNote: true,
    };
    setEditingProduct({ product: blank, isCreating: true });
  };

  const handleSaveProduct = (saved: Product) => {
    const exists = products.some((p) => p.id === saved.id);
    const next = exists
      ? products.map((p) => (p.id === saved.id ? saved : p))
      : [saved, ...products];
    onSaveProducts(next);
    setEditingProduct(null);
  };

  const handleMoveProductOrder = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= sortedProducts.length) return;
    const reordered = [...sortedProducts];
    [reordered[index], reordered[targetIdx]] = [reordered[targetIdx], reordered[index]];
    const withUpdatedOrder = reordered.map((p, idx) => ({
      ...p,
      sortOrder: idx + 1,
    }));
    onSaveProducts(withUpdatedOrder);
  };

  const handleTogglePublished = (productId: string) => {
    onSaveProducts(
      products.map((p) =>
        p.id === productId ? { ...p, isPublished: !p.isPublished } : p
      )
    );
  };

  const handleToggleRecommended = (productId: string) => {
    onSaveProducts(
      products.map((p) =>
        p.id === productId ? { ...p, isRecommended: !p.isRecommended } : p
      )
    );
  };

  const handleDeleteProduct = (productId: string) => {
    onSaveProducts(products.filter((p) => p.id !== productId));
    setConfirmDeleteId(null);
  };

  // Swatch / Material Library CRUD
  const isLibraryTab = (tab: AdminTab): tab is SwatchLibraryType =>
    SWATCH_LIBRARY_ORDER.includes(tab as SwatchLibraryType);

  const activeLibrary: SwatchLibraryType | null = isLibraryTab(activeTab)
    ? activeTab
    : null;

  const activeLibrarySwatches = activeLibrary
    ? swatches.filter((s) => (s.libraryType || 'fabric') === activeLibrary)
    : [];

  const startNewSwatch = (libraryType: SwatchLibraryType) => {
    const meta = SWATCH_LIBRARY_META[libraryType];
    const countInLib = swatches.filter(
      (s) => (s.libraryType || 'fabric') === libraryType
    ).length;
    const nextNum = String(countInLib + 1).padStart(2, '0');
    setSwatchError(null);
    setSwatchForm({
      id: `${meta.codePrefix.toLowerCase()}-${Date.now()}`,
      libraryType,
      code: `${meta.codePrefix}-${nextNum}`,
      name: '',
      hex: '#CFC5B4',
      materialNote: '',
      imageUrl: '',
    });
  };

  const handleImportSampleLibrary = (libraryType: SwatchLibraryType) => {
    const samples = INITIAL_SWATCHES.filter((s) => s.libraryType === libraryType);
    const existingIds = new Set(swatches.map((s) => s.id));
    const toAdd = samples.filter((s) => !existingIds.has(s.id));
    if (toAdd.length === 0) return;
    onSaveSwatches([...swatches, ...toAdd]);
  };

  const handleSaveSwatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swatchForm) return;
    if (!swatchForm.name.trim() || !swatchForm.code.trim()) {
      setSwatchError('請填寫項目名稱與編號');
      return;
    }
    const exists = swatches.some((s) => s.id === swatchForm.id);
    const cleaned: FabricSwatch = {
      ...swatchForm,
      libraryType: swatchForm.libraryType || 'fabric',
      code: swatchForm.code.trim(),
      name: swatchForm.name.trim(),
      materialNote: swatchForm.materialNote.trim(),
    };
    const next = exists
      ? swatches.map((s) => (s.id === cleaned.id ? cleaned : s))
      : [...swatches, cleaned];
    onSaveSwatches(next);
    setSwatchForm(null);
    setSwatchError(null);
  };

  const handleDeleteSwatch = (swatchId: string) => {
    onSaveSwatches(swatches.filter((s) => s.id !== swatchId));
  };

  const handleSwatchImageUpload = async (file: File | undefined) => {
    if (!file || !swatchForm) return;
    const dataUrl = await uploadImageLocally(file, 640);
    setSwatchForm({ ...swatchForm, imageUrl: dataUrl });
  };

  const handleHomeImageUpload = async (
    field:
      | 'banner'
      | 'featuredCategoryImage'
      | 'customCategoryImage'
      | 'crochetBibCategoryImage'
      | 'crochetOutfitCategoryImage',
    file: File | undefined
  ) => {
    if (!file) return;
    const dataUrl = await uploadImageLocally(file, 960);
    if (field === 'banner') {
      setHomeDraft((prev) => ({
        ...prev,
        banner: { ...prev.banner, imageUrl: dataUrl },
      }));
    } else {
      setHomeDraft((prev) => ({ ...prev, [field]: dataUrl }));
    }
  };

  const handleToggleSectionVisibility = (sectionId: StoreSectionId) => {
    const currentVis = homeDraft.sectionVisibility ?? { proxy: true, crochet: true };
    const nextConfig: HomeConfig = {
      ...homeDraft,
      sectionVisibility: {
        ...currentVis,
        [sectionId]: !currentVis[sectionId],
      },
    };
    setHomeDraft(nextConfig);
    void onSaveHomeConfig(nextConfig);
    setSectionSavedFeedback(sectionId);
    window.setTimeout(() => setSectionSavedFeedback(null), 1800);
  };

  const handleSaveHome = (e: React.FormEvent) => {
    e.preventDefault();
    void onSaveHomeConfig(homeDraft);
    setHomeSavedFeedback(true);
    window.setTimeout(() => setHomeSavedFeedback(false), 2200);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 md:pt-8 pb-16">
      {cloudError && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-[#E2C9C5] bg-[#FDF8F7] px-4 py-3 text-xs font-medium text-[#9A4B42]"
        >
          {cloudError}
        </div>
      )}
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-5">
        <div>
          <p className="text-xs text-[#5F6F61] font-medium">
            Firebase 雲端已驗證管理員 · {adminUser.name} ({adminUser.email})
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold text-[#2B2825]">
            商品管理後台
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onLogout}
            className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-[#DCD5CA] bg-white px-4 text-xs sm:text-sm font-medium text-[#2B2825] hover:border-[#2B2825] whitespace-nowrap"
          >
            <LogOut className="h-4 w-4" />
            <span>登出管理員</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      {!editingProduct && (
        <div
          role="tablist"
          aria-label="後台管理項目"
          className="mt-5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1"
        >
          {[
            { id: 'products' as const, label: `商品管理 (${products.length})`, icon: Package },
            ...SWATCH_LIBRARY_ORDER.map((lib) => {
              const count = swatches.filter(
                (s) => (s.libraryType || 'fabric') === lib
              ).length;
              return {
                id: lib,
                label: `${SWATCH_LIBRARY_LABELS[lib]} (${count})`,
                icon: SWATCH_LIBRARY_ICONS[lib],
              };
            }),
            { id: 'home' as const, label: '首頁與 LINE 設定', icon: Home },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSwatchForm(null);
                  setSwatchError(null);
                  if (tab.id === 'home') setHomeDraft(homeConfig);
                }}
                className={`min-h-[44px] inline-flex items-center gap-2 rounded-xl px-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#2B2825] text-white'
                    : 'bg-white border border-[#E5E0D8] text-[#2B2825] hover:border-[#2B2825]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* TAB 1: Product Management */}
      {activeTab === 'products' && (
        <div className="mt-6">
          {editingProduct ? (
            <AdminProductEditor
              initialProduct={editingProduct.product}
              isCreating={editingProduct.isCreating}
              swatches={swatches}
              onSave={handleSaveProduct}
              onCancel={() => setEditingProduct(null)}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-xl bg-[#EFECE6] p-1">
                    {(
                      [
                        { id: 'all', label: `全部 (${products.length})` },
                        {
                          id: 'proxy',
                          label: `娃衣代理區 (${products.length - crochetProductCount})`,
                        },
                        {
                          id: 'crochet',
                          label: `毛線編織 (${crochetProductCount})`,
                        },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setProductSectionFilter(item.id)}
                        className={`min-h-[36px] rounded-lg px-3 text-xs font-medium transition-colors whitespace-nowrap ${
                          productSectionFilter === item.id
                            ? 'bg-white text-[#2B2825]'
                            : 'text-[#6E6962] hover:text-[#2B2825]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {crochetProductCount === 0 && (
                    <button
                      type="button"
                      onClick={handleImportSampleCrochetProducts}
                      className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-[#DCD5CA] bg-[#F7F5F0] px-3.5 text-xs font-medium text-[#2B2825] hover:border-[#2B2825] whitespace-nowrap"
                    >
                      <span>匯入毛線編織範例商品</span>
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCreateProduct}
                  className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#2B2825] px-4 text-xs sm:text-sm font-medium text-white hover:bg-[#3F3B37] whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span>新增商品</span>
                </button>
              </div>

              <div className="space-y-3">
                {displayedAdminProducts.map((product) => {
                  const globalIdx = sortedProducts.findIndex((p) => p.id === product.id);
                  const sectionId = getSectionForCategory(product.categoryId);
                  return (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-[#E5E0D8] bg-white p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3.5"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="h-16 w-14 shrink-0 overflow-hidden rounded-lg border border-[#E5E0D8] bg-[#EFECE6]">
                        <SafeImage
                          src={product.images[0] || ''}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#6E6962]">
                          <span className="font-mono text-[#2B2825]">{product.code}</span>
                          <span>·</span>
                          <span>#{globalIdx + 1}</span>
                          <span>·</span>
                          <span className="font-medium text-[#5F6F61]">
                            {SECTION_LABELS[sectionId]}
                          </span>
                          <span>/</span>
                          <span>{CATEGORY_LABELS[product.categoryId]}</span>
                          <span>·</span>
                          <span>{STATUS_LABELS[product.status]}</span>
                          <span>·</span>
                          <span className={product.isPublished ? 'text-[#5F6F61]' : 'text-[#A6726A]'}>
                            {product.isPublished ? '上架中' : '已下架'}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm sm:text-base font-medium text-[#2B2825] truncate">
                          {product.name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6E6962] tabular-price">
                          <span>底價 {formatTWD(product.basePrice)} · {product.variantGroups.length} 組規格</span>
                          <button
                            type="button"
                            onClick={() =>
                              copyStandaloneUrl(product.id, buildProductShareUrl(product.id))
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-[#5F6F61] hover:underline"
                          >
                            <Link2 className="h-3 w-3" />
                            <span>
                              {copiedLinkKey === product.id ? '已複製商品網址' : '複製獨立網址'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#EFECE6]">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={globalIdx <= 0}
                          onClick={() => handleMoveProductOrder(globalIdx, -1)}
                          aria-label={`上移 ${product.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E0D8] bg-[#F7F5F0] disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={globalIdx >= sortedProducts.length - 1}
                          onClick={() => handleMoveProductOrder(globalIdx, 1)}
                          aria-label={`下移 ${product.name}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E0D8] bg-[#F7F5F0] disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleRecommended(product.id)}
                          aria-label={product.isRecommended ? `取消推薦 ${product.name}` : `設為推薦 ${product.name}`}
                          aria-pressed={product.isRecommended}
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                            product.isRecommended
                              ? 'border-[#C5A467] bg-[#C5A467]/15 text-[#9B7A3B]'
                              : 'border-[#E5E0D8] bg-white text-[#8E8880]'
                          }`}
                        >
                          <Star
                            className={`h-4 w-4 ${product.isRecommended ? 'fill-current' : ''}`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTogglePublished(product.id)}
                          aria-label={product.isPublished ? `下架 ${product.name}` : `上架 ${product.name}`}
                          className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#E5E0D8] bg-white px-2.5 text-xs text-[#2B2825] hover:border-[#2B2825]"
                        >
                          {product.isPublished ? (
                            <>
                              <Eye className="h-3.5 w-3.5 text-[#5F6F61]" />
                              <span className="hidden sm:inline">上架</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3.5 w-3.5 text-[#A6726A]" />
                              <span className="hidden sm:inline">下架</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setEditingProduct({ product, isCreating: false })
                          }
                          aria-label={`編輯 ${product.name}`}
                          className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#2B2825] bg-white px-3 text-xs font-medium text-[#2B2825] hover:bg-[#F7F5F0]"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>編輯</span>
                        </button>

                        {confirmDeleteId === product.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="h-9 rounded-lg bg-[#A6726A] px-2.5 text-xs font-medium text-white"
                            >
                              確認刪除
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="h-9 rounded-lg border border-[#E5E0D8] px-2 text-xs text-[#6E6962]"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(product.id)}
                            aria-label={`刪除 ${product.name}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E5E0D8] bg-white text-[#A6726A] hover:bg-[#A6726A]/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2-5: Shared Material & Color Libraries (色卡庫 / 鑽盤庫 / 眼睛顏色 / 緞帶顏色) */}
      {activeLibrary && (() => {
        const meta = SWATCH_LIBRARY_META[activeLibrary];
        const formMeta = swatchForm
          ? SWATCH_LIBRARY_META[swatchForm.libraryType || activeLibrary]
          : meta;
        const hasSamplesToImport = INITIAL_SWATCHES.some(
          (sample) =>
            sample.libraryType === activeLibrary &&
            !swatches.some((s) => s.id === sample.id)
        );

        return (
          <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold text-[#2B2825]">
                    {meta.label}
                  </h2>
                  <span className="text-xs font-medium text-[#5F6F61]">
                    · {meta.sectionHint}
                  </span>
                </div>
                <p className="mt-0.5 text-xs sm:text-sm text-[#6E6962]">
                  {meta.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startNewSwatch(activeLibrary)}
                className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#2B2825] px-4 text-xs sm:text-sm font-medium text-white hover:bg-[#3F3B37] whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>新增{meta.itemLabel}</span>
              </button>
            </div>

            {swatchForm && (
              <form
                onSubmit={handleSaveSwatch}
                className="rounded-2xl border border-[#2B2825] bg-white p-5 space-y-4"
              >
                <h3 className="font-display text-base font-semibold text-[#2B2825]">
                  {swatches.some((s) => s.id === swatchForm.id)
                    ? `編輯${formMeta.itemLabel}`
                    : `新增${formMeta.itemLabel}`}
                </h3>

                {swatchError && (
                  <p role="alert" className="text-xs font-medium text-[#9A4B42]">
                    {swatchError}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label
                      htmlFor="sw-library"
                      className="block text-xs font-medium text-[#6E6962] mb-1"
                    >
                      所屬分類庫 *
                    </label>
                    <select
                      id="sw-library"
                      value={swatchForm.libraryType}
                      onChange={(e) =>
                        setSwatchForm({
                          ...swatchForm,
                          libraryType: e.target.value as SwatchLibraryType,
                        })
                      }
                      className="w-full min-h-[42px] rounded-xl border border-[#E5E0D8] bg-white px-3 text-sm text-[#2B2825]"
                    >
                      {SWATCH_LIBRARY_ORDER.map((lib) => (
                        <option key={lib} value={lib}>
                          {SWATCH_LIBRARY_LABELS[lib]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="sw-code"
                      className="block text-xs font-medium text-[#6E6962] mb-1"
                    >
                      編號／色號 *
                    </label>
                    <input
                      id="sw-code"
                      type="text"
                      value={swatchForm.code}
                      onChange={(e) =>
                        setSwatchForm({ ...swatchForm, code: e.target.value })
                      }
                      placeholder={formMeta.codePlaceholder}
                      className="w-full min-h-[42px] rounded-xl border border-[#E5E0D8] px-3 text-sm font-mono"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sw-name"
                      className="block text-xs font-medium text-[#6E6962] mb-1"
                    >
                      {formMeta.itemLabel}名稱 *
                    </label>
                    <input
                      id="sw-name"
                      type="text"
                      value={swatchForm.name}
                      onChange={(e) =>
                        setSwatchForm({ ...swatchForm, name: e.target.value })
                      }
                      placeholder={formMeta.namePlaceholder}
                      className="w-full min-h-[42px] rounded-xl border border-[#E5E0D8] px-3 text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sw-hex"
                      className="block text-xs font-medium text-[#6E6962] mb-1"
                    >
                      代表色碼
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="sw-hex"
                        type="color"
                        value={swatchForm.hex}
                        onChange={(e) =>
                          setSwatchForm({ ...swatchForm, hex: e.target.value })
                        }
                        className="h-10 w-12 rounded-lg border border-[#E5E0D8]"
                      />
                      <input
                        type="text"
                        value={swatchForm.hex}
                        onChange={(e) =>
                          setSwatchForm({ ...swatchForm, hex: e.target.value })
                        }
                        className="flex-1 min-h-[42px] rounded-xl border border-[#E5E0D8] px-3 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4">
                    <label
                      htmlFor="sw-note"
                      className="block text-xs font-medium text-[#6E6962] mb-1"
                    >
                      材質／款式說明
                    </label>
                    <input
                      id="sw-note"
                      type="text"
                      value={swatchForm.materialNote}
                      onChange={(e) =>
                        setSwatchForm({ ...swatchForm, materialNote: e.target.value })
                      }
                      placeholder={formMeta.notePlaceholder}
                      className="w-full min-h-[42px] rounded-xl border border-[#E5E0D8] px-3 text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#EFECE6]">
                      <SafeImage
                        src={swatchForm.imageUrl}
                        alt={swatchForm.name || `${formMeta.itemLabel}預覽`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <label className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCD5CA] bg-white px-3.5 py-2 text-xs font-medium text-[#2B2825] cursor-pointer min-h-[40px]">
                      <Upload className="h-3.5 w-3.5" />
                      <span>上傳實拍圖片</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleSwatchImageUpload(e.target.files?.[0])}
                      />
                    </label>
                    <input
                      type="text"
                      value={swatchForm.imageUrl}
                      onChange={(e) =>
                        setSwatchForm({ ...swatchForm, imageUrl: e.target.value })
                      }
                      placeholder="或輸入圖片網址"
                      className="flex-1 min-w-[200px] min-h-[40px] rounded-xl border border-[#E5E0D8] px-3 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSwatchForm(null)}
                    className="min-h-[42px] rounded-xl border border-[#DCD5CA] bg-white px-4 text-xs font-medium text-[#2B2825]"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-[#2B2825] px-5 text-xs font-medium text-white"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>儲存{formMeta.itemLabel}</span>
                  </button>
                </div>
              </form>
            )}

            {activeLibrarySwatches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#DCD5CA] bg-white p-8 text-center space-y-3">
                <p className="text-sm font-medium text-[#2B2825]">
                  目前「{meta.label}」尚無項目
                </p>
                <p className="text-xs text-[#6E6962]">
                  點擊下方按鈕立即建立您的第一筆{meta.itemLabel}，或先匯入內建範例方便預覽測試。
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => startNewSwatch(activeLibrary)}
                    className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-[#2B2825] px-4 text-xs font-medium text-white"
                  >
                    <Plus className="h-4 w-4" />
                    <span>新增{meta.itemLabel}</span>
                  </button>
                  {hasSamplesToImport && (
                    <button
                      type="button"
                      onClick={() => handleImportSampleLibrary(activeLibrary)}
                      className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-[#DCD5CA] bg-[#F7F5F0] px-4 text-xs font-medium text-[#2B2825] hover:border-[#2B2825]"
                    >
                      <span>匯入預設{meta.label}範例</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeLibrarySwatches.map((swatch) => (
                  <div
                    key={swatch.id}
                    className="rounded-2xl border border-[#E5E0D8] bg-white overflow-hidden flex flex-col"
                  >
                    <div className="flex items-start gap-3.5 p-4">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#EFECE6]">
                        <SafeImage
                          src={swatch.imageUrl}
                          alt={swatch.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-black/15"
                            style={{ backgroundColor: swatch.hex }}
                          />
                          <span className="font-mono text-xs text-[#6E6962]">
                            {swatch.code} · {swatch.hex}
                          </span>
                        </div>
                        <h3 className="mt-1 text-sm font-semibold text-[#2B2825]">
                          {swatch.name}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-[#6E6962] line-clamp-2">
                          {swatch.materialNote}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto flex items-center justify-end gap-2 border-t border-[#EFECE6] px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => setSwatchForm(swatch)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E5E0D8] px-3 py-1.5 text-xs font-medium text-[#2B2825] hover:border-[#2B2825] min-h-[36px]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>編輯</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSwatch(swatch.id)}
                        aria-label={`刪除${meta.itemLabel} ${swatch.name}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#E5E0D8] px-3 py-1.5 text-xs text-[#A6726A] hover:bg-[#A6726A]/10 min-h-[36px]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>刪除</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* TAB 3: Home Banner, Section Visibility & LINE Settings */}
      {activeTab === 'home' && (
        <div className="mt-6 space-y-6">
          {/* Major Storefront Sections Visibility Control */}
          <section
            aria-labelledby="section-visibility-heading"
            className="rounded-2xl border border-[#E5E0D8] bg-white p-5 space-y-4"
          >
            <div>
              <h2
                id="section-visibility-heading"
                className="font-display text-lg font-semibold text-[#2B2825]"
              >
                前台大區塊顯示／隱藏設定
              </h2>
              <p className="mt-0.5 text-xs text-[#6E6962]">
                隨時獨立開啟或隱藏前台兩大區塊；關閉後首頁、導覽列、商品分類與搜尋皆會自動隱藏該區商品，並即時同步至雲端。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {(
                [
                  {
                    id: 'proxy' as const,
                    title: SECTION_LABELS.proxy,
                    subtitle: '包含：特色娃衣、客製化娃衣（使用色卡庫、鑽盤庫、眼睛顏色、緞帶顏色）',
                  },
                  {
                    id: 'crochet' as const,
                    title: SECTION_LABELS.crochet,
                    subtitle: '包含：娃用圍兜兜、鉤織娃衣（使用線材庫）',
                  },
                ] as const
              ).map((sec) => {
                const isVisible = (homeDraft.sectionVisibility ?? { proxy: true, crochet: true })[sec.id];
                return (
                  <div
                    key={sec.id}
                    className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors ${
                      isVisible
                        ? 'border-[#E5E0D8] bg-[#F7F5F0]/60'
                        : 'border-[#E2C9C5] bg-[#FDF8F7]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#2B2825]">
                          {sec.title}
                        </h3>
                        <span
                          className={`text-xs font-medium ${
                            isVisible ? 'text-[#5F6F61]' : 'text-[#A6726A]'
                          }`}
                        >
                          {sectionSavedFeedback === sec.id
                            ? '· 已同步儲存'
                            : isVisible
                            ? '· 前台顯示中'
                            : '· 已隱藏'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#6E6962] leading-relaxed">
                        {sec.subtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isVisible}
                      aria-label={`切換「${sec.title}」前台顯示狀態`}
                      onClick={() => handleToggleSectionVisibility(sec.id)}
                      className={`min-h-[40px] shrink-0 inline-flex items-center gap-1.5 rounded-xl border px-3.5 text-xs font-medium transition-colors whitespace-nowrap ${
                        isVisible
                          ? 'border-[#2B2825] bg-[#2B2825] text-white hover:bg-[#3F3B37]'
                          : 'border-[#DCD5CA] bg-white text-[#2B2825] hover:border-[#2B2825]'
                      }`}
                    >
                      {isVisible ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span>顯示中（點此隱藏）</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-[#A6726A]" />
                          <span>已隱藏（點此顯示）</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* LINE Official Account Settings & Rich Menu URLs */}
          <form
            onSubmit={handleSaveHome}
            className="rounded-2xl border border-[#E5E0D8] bg-white p-5 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  style={{ backgroundColor: LINE_BRAND_GREEN }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white shrink-0"
                >
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#2B2825]">
                    LINE 官方帳號整合設定
                  </h2>
                  <p className="text-xs text-[#6E6962]">
                    修改後即時套用至所有商品頁訂購按鈕、購物車與首頁客服入口，無須修改程式碼
                  </p>
                </div>
              </div>
              <button
                type="submit"
                className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-[#2B2825] px-5 text-xs sm:text-sm font-medium text-white hover:bg-[#3F3B37]"
              >
                {homeSavedFeedback ? (
                  <>
                    <Check className="h-4 w-4 text-[#C6D8C8]" />
                    <span>已儲存設定</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>儲存 LINE 與首頁設定</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="line-oa-id"
                  className="block text-xs font-medium text-[#6E6962] mb-1"
                >
                  LINE 官方帳號 ID（含 @ 符號）*
                </label>
                <input
                  id="line-oa-id"
                  type="text"
                  value={homeDraft.lineConfig.officialAccountId}
                  onChange={(e) =>
                    setHomeDraft({
                      ...homeDraft,
                      lineConfig: {
                        ...homeDraft.lineConfig,
                        officialAccountId: e.target.value,
                      },
                    })
                  }
                  placeholder="@182oocrl"
                  className="w-full min-h-[42px] rounded-xl border border-[#E5E0D8] px-3.5 text-sm font-mono text-[#2B2825]"
                />
                <p className="mt-1 text-[11px] text-[#6E6962] break-all font-mono">
                  預覽連結：{buildLineOaMessageUrl(homeDraft.lineConfig.officialAccountId, '訂購測試').slice(0, 56)}…
                </p>
              </div>

              <div>
                <label
                  htmlFor="line-display-name"
                  className="block text-xs font-medium text-[#6E6962] mb-1"
                >
                  LINE 客服顯示名稱
                </label>
                <input
                  id="line-display-name"
                  type="text"
                  value={homeDraft.lineConfig.displayName}
                  onChange={(e) =>
                    setHomeDraft({
                      ...homeDraft,
                      lineConfig: {
                        ...homeDraft.lineConfig,
                        displayName: e.target.value,
                      },
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-[#E5E0D8] px-3.5 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="line-cs-greeting"
                  className="block text-xs font-medium text-[#6E6962] mb-1"
                >
                  首頁聯繫客服預設訊息
                </label>
                <input
                  id="line-cs-greeting"
                  type="text"
                  value={homeDraft.lineConfig.customerServiceGreeting}
                  onChange={(e) =>
                    setHomeDraft({
                      ...homeDraft,
                      lineConfig: {
                        ...homeDraft.lineConfig,
                        customerServiceGreeting: e.target.value,
                      },
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-[#E5E0D8] px-3.5 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="line-liff-id"
                  className="block text-xs font-medium text-[#6E6962] mb-1"
                >
                  LIFF ID（選填，預留未來串接 LIFF SDK / LINE Login）
                </label>
                <input
                  id="line-liff-id"
                  type="text"
                  value={homeDraft.lineConfig.liffId || ''}
                  onChange={(e) =>
                    setHomeDraft({
                      ...homeDraft,
                      lineConfig: {
                        ...homeDraft.lineConfig,
                        liffId: e.target.value,
                      },
                    })
                  }
                  placeholder="目前採用 LINE URL Scheme，無須填寫即可使用"
                  className="w-full min-h-[42px] rounded-xl border border-[#E5E0D8] bg-[#F7F5F0]/50 px-3.5 text-xs font-mono"
                />
              </div>
            </div>

            {/* Standalone URLs for LINE Rich Menu */}
            <div className="rounded-xl border border-[#E5E0D8] bg-[#F7F5F0]/70 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-[#2B2825]">
                LINE 圖文選單專用獨立網址（點選複製）
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {(
                  [
                    { key: 'cat-all', label: '全部商品頁', url: buildCategoryShareUrl('all') },
                    { key: 'cat-proxy', label: '娃衣代理區', url: buildCategoryShareUrl('proxy') },
                    { key: 'cat-featured', label: '特色娃衣分類', url: buildCategoryShareUrl('featured') },
                    { key: 'cat-custom', label: '客製化娃衣分類', url: buildCategoryShareUrl('custom') },
                    { key: 'cat-crochet', label: '毛線編織', url: buildCategoryShareUrl('crochet') },
                    { key: 'cat-bib', label: '娃用圍兜兜', url: buildCategoryShareUrl('crochet_bib') },
                    { key: 'cat-outfit', label: '鉤織娃衣', url: buildCategoryShareUrl('crochet_outfit') },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => copyStandaloneUrl(item.key, item.url)}
                    className="flex items-center justify-between gap-2 rounded-lg border border-[#E5E0D8] bg-white px-3 py-2 text-left text-xs hover:border-[#2B2825]"
                  >
                    <span className="truncate font-medium text-[#2B2825]">{item.label}</span>
                    <span className="shrink-0 text-[11px] text-[#5F6F61] inline-flex items-center gap-1">
                      <Copy className="h-3 w-3" />
                      {copiedLinkKey === item.key ? '已複製' : '複製'}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#6E6962]">
                目前套用帳號：{normalizeLineAccountId(homeDraft.lineConfig.officialAccountId)}（所有商品詳細頁亦支援 /product/商品ID 獨立網址）
              </p>
            </div>
          </form>

          <form
            onSubmit={handleSaveHome}
            className="rounded-2xl border border-[#E5E0D8] bg-white p-5 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-[#2B2825]">
                首頁形象 Banner 設定
              </h2>
              <button
                type="submit"
                className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-[#2B2825] px-5 text-xs sm:text-sm font-medium text-white hover:bg-[#3F3B37]"
              >
                {homeSavedFeedback ? (
                  <>
                    <Check className="h-4 w-4 text-[#C6D8C8]" />
                    <span>已儲存首頁設定</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>儲存首頁設定</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="home-brand" className="block text-xs font-medium text-[#6E6962] mb-1">
                  品牌名稱
                </label>
                <input
                  id="home-brand"
                  type="text"
                  value={homeDraft.brandName}
                  onChange={(e) =>
                    setHomeDraft({ ...homeDraft, brandName: e.target.value })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-[#E5E0D8] px-3.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="home-subtitle" className="block text-xs font-medium text-[#6E6962] mb-1">
                  品牌副標語
                </label>
                <input
                  id="home-subtitle"
                  type="text"
                  value={homeDraft.brandSubtitle}
                  onChange={(e) =>
                    setHomeDraft({ ...homeDraft, brandSubtitle: e.target.value })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-[#E5E0D8] px-3.5 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="banner-title" className="block text-xs font-medium text-[#6E6962] mb-1">
                  Banner 主標題
                </label>
                <input
                  id="banner-title"
                  type="text"
                  value={homeDraft.banner.title}
                  onChange={(e) =>
                    setHomeDraft({
                      ...homeDraft,
                      banner: { ...homeDraft.banner, title: e.target.value },
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-[#E5E0D8] px-3.5 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="banner-desc" className="block text-xs font-medium text-[#6E6962] mb-1">
                  Banner 說明文字
                </label>
                <textarea
                  id="banner-desc"
                  rows={2}
                  value={homeDraft.banner.subtitle}
                  onChange={(e) =>
                    setHomeDraft({
                      ...homeDraft,
                      banner: { ...homeDraft.banner, subtitle: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-[#E5E0D8] p-3 text-sm"
                />
              </div>

              <div>
                <label htmlFor="banner-cta" className="block text-xs font-medium text-[#6E6962] mb-1">
                  按鈕文字
                </label>
                <input
                  id="banner-cta"
                  type="text"
                  value={homeDraft.banner.ctaLabel}
                  onChange={(e) =>
                    setHomeDraft({
                      ...homeDraft,
                      banner: { ...homeDraft.banner, ctaLabel: e.target.value },
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-[#E5E0D8] px-3.5 text-sm"
                />
              </div>

              <div>
                <label htmlFor="banner-target" className="block text-xs font-medium text-[#6E6962] mb-1">
                  點擊導向分類
                </label>
                <select
                  id="banner-target"
                  value={homeDraft.banner.targetCategory}
                  onChange={(e) =>
                    setHomeDraft({
                      ...homeDraft,
                      banner: {
                        ...homeDraft.banner,
                        targetCategory: e.target.value as CatalogCategoryFilter,
                      },
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-[#E5E0D8] bg-white px-3.5 text-sm"
                >
                  <option value="all">全部商品</option>
                  <optgroup label={SECTION_LABELS.proxy}>
                    <option value="proxy">娃衣代理區（全部）</option>
                    <option value="featured">特色娃衣</option>
                    <option value="custom">客製化娃衣</option>
                  </optgroup>
                  <optgroup label={SECTION_LABELS.crochet}>
                    <option value="crochet">毛線編織（全部）</option>
                    <option value="crochet_bib">娃用圍兜兜</option>
                    <option value="crochet_outfit">鉤織娃衣</option>
                  </optgroup>
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <span className="block text-xs font-medium text-[#6E6962]">
                  Banner 形象照片
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="h-24 w-40 shrink-0 overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#EFECE6]">
                    <SafeImage
                      src={homeDraft.banner.imageUrl}
                      alt="Banner 預覽"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <label className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCD5CA] bg-white px-4 py-2 text-xs font-medium text-[#2B2825] cursor-pointer min-h-[42px] self-start">
                    <Upload className="h-4 w-4" />
                    <span>更換 Banner 圖片</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) =>
                        handleHomeImageUpload('banner', e.target.files?.[0])
                      }
                    />
                  </label>
                </div>
              </div>

              {/* 4 Category Cover Images */}
              <div className="md:col-span-2 pt-2 border-t border-[#EFECE6] space-y-3">
                <span className="block text-xs font-medium text-[#6E6962]">
                  首頁分類封面照片（娃衣代理區 / 毛線編織）
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(
                    [
                      { field: 'featuredCategoryImage' as const, label: '特色娃衣', section: '娃衣代理區' },
                      { field: 'customCategoryImage' as const, label: '客製化娃衣', section: '娃衣代理區' },
                      { field: 'crochetBibCategoryImage' as const, label: '娃用圍兜兜', section: '毛線編織' },
                      { field: 'crochetOutfitCategoryImage' as const, label: '鉤織娃衣', section: '毛線編織' },
                    ] as const
                  ).map((item) => (
                    <div
                      key={item.field}
                      className="rounded-xl border border-[#E5E0D8] bg-[#F7F5F0]/50 p-3 space-y-2"
                    >
                      <div className="text-xs font-medium text-[#2B2825]">
                        {item.label}
                        <span className="ml-1 text-[11px] font-normal text-[#6E6962]">
                          · {item.section}
                        </span>
                      </div>
                      <div className="aspect-[16/10] w-full overflow-hidden rounded-lg border border-[#E5E0D8] bg-[#EFECE6]">
                        <SafeImage
                          src={homeDraft[item.field]}
                          alt={`${item.label}封面`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <label className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DCD5CA] bg-white px-3 py-1.5 text-xs font-medium text-[#2B2825] cursor-pointer min-h-[36px] hover:border-[#2B2825]">
                        <Upload className="h-3.5 w-3.5" />
                        <span>更換封面</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) =>
                            handleHomeImageUpload(item.field, e.target.files?.[0])
                          }
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>

          {/* Quick Recommended Products Toggle */}
          <section className="rounded-2xl border border-[#E5E0D8] bg-white p-5 space-y-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#2B2825]">
                首頁推薦商品管理
              </h2>
              <p className="text-xs text-[#6E6962]">
                勾選要呈現於首頁「推薦商品」區塊的作品（最多顯示前 4 件已上架推薦商品）
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedProducts.map((product) => (
                <label
                  key={product.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                    product.isRecommended
                      ? 'border-[#2B2825] bg-[#F7F5F0]/70'
                      : 'border-[#E5E0D8] bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={product.isRecommended}
                    onChange={() => handleToggleRecommended(product.id)}
                    className="h-4 w-4 accent-[#2B2825]"
                  />
                  <div className="h-12 w-10 shrink-0 overflow-hidden rounded bg-[#EFECE6]">
                    <SafeImage
                      src={product.images[0] || ''}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#2B2825] truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-[#6E6962]">
                      {CATEGORY_LABELS[product.categoryId]} · {formatTWD(product.basePrice)}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Reset Demo Data */}
          <div className="rounded-2xl border border-[#E5E0D8] bg-white p-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[#2B2825]">還原預設示範資料</p>
              <p className="text-xs text-[#6E6962]">
                將商品、色卡與首頁 Banner 恢復為初始示範狀態
              </p>
            </div>
            {confirmReset ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onResetDemoData();
                    setConfirmReset(false);
                  }}
                  className="min-h-[40px] rounded-xl bg-[#A6726A] px-4 text-xs font-medium text-white"
                >
                  確認還原
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="min-h-[40px] rounded-xl border border-[#E5E0D8] px-3 text-xs text-[#6E6962]"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-[#DCD5CA] bg-white px-4 text-xs font-medium text-[#2B2825] hover:border-[#2B2825]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>還原示範資料</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
