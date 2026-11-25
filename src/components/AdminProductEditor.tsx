import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ImagePlus,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  DOLL_SIZES,
  getSectionForCategory,
  SECTION_LABELS,
  STATUS_LABELS,
  SWATCH_LIBRARY_LABELS,
  SWATCH_LIBRARY_META,
  SWATCH_LIBRARY_ORDER,
  type CategoryId,
  type DollSize,
  type FabricSwatch,
  type Product,
  type ProductStatus,
  type SelectionMode,
  type SwatchLibraryType,
  type VariantDisplayType,
  type VariantGroup,
  type VariantOption,
} from '../types/store';
import { uploadImageLocally } from '../services/storage';
import { SafeImage } from './SafeImage';

interface AdminProductEditorProps {
  initialProduct: Product;
  isCreating: boolean;
  swatches: FabricSwatch[];
  onSave: (product: Product) => void;
  onCancel: () => void;
}

export const AdminProductEditor: React.FC<AdminProductEditorProps> = ({
  initialProduct,
  isCreating,
  swatches,
  onSave,
  onCancel,
}) => {
  const [draft, setDraft] = useState<Product>(() =>
    JSON.parse(JSON.stringify(initialProduct))
  );
  const [basePriceInput, setBasePriceInput] = useState<string>(() =>
    isCreating ? '' : String(initialProduct.basePrice)
  );
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const toggleSize = (size: DollSize) => {
    setDraft((prev) => {
      const exists = prev.dollSizes.includes(size);
      const next = exists
        ? prev.dollSizes.filter((s) => s !== size)
        : [...prev.dollSizes, size];
      return { ...prev, dollSizes: next };
    });
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const dataUrl = await uploadImageLocally(file);
        uploaded.push(dataUrl);
      }
      setDraft((prev) => ({ ...prev, images: [...prev.images, ...uploaded] }));
    } catch {
      setFormError('部分圖片讀取失敗，請重新嘗試');
    } finally {
      setUploading(false);
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    setDraft((prev) => ({ ...prev, images: [...prev.images, trimmed] }));
    setImageUrlInput('');
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.images.length) return;
    setDraft((prev) => {
      const next = [...prev.images];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, images: next };
    });
  };

  const removeImage = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Dynamic Variant Group Builders
  const addVariantGroup = () => {
    const id = `vg-${Date.now()}`;
    const newGroup: VariantGroup = {
      id,
      name: '新規格群組',
      displayType: 'text',
      selectionMode: 'single',
      required: true,
      options: [
        {
          id: `opt-${Date.now()}-1`,
          label: '預設選項',
          priceDelta: 0,
          available: true,
        },
      ],
    };
    setDraft((prev) => ({
      ...prev,
      variantGroups: [...prev.variantGroups, newGroup],
    }));
  };

  const updateGroup = (groupId: string, patch: Partial<VariantGroup>) => {
    setDraft((prev) => ({
      ...prev,
      variantGroups: prev.variantGroups.map((g) =>
        g.id === groupId ? { ...g, ...patch } : g
      ),
    }));
  };

  const moveGroup = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.variantGroups.length) return;
    setDraft((prev) => {
      const next = [...prev.variantGroups];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, variantGroups: next };
    });
  };

  const removeGroup = (groupId: string) => {
    setDraft((prev) => ({
      ...prev,
      variantGroups: prev.variantGroups.filter((g) => g.id !== groupId),
    }));
  };

  const getSwatchesForGroup = (group: VariantGroup): FabricSwatch[] => {
    if (!group.swatchLibrary) return swatches;
    return swatches.filter((s) => (s.libraryType || 'fabric') === group.swatchLibrary);
  };

  const addOption = (group: VariantGroup) => {
    const pool = getSwatchesForGroup(group);
    const firstSwatch = pool[0] || swatches[0];
    const newOpt: VariantOption = {
      id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: group.displayType === 'swatch' && firstSwatch ? firstSwatch.name : '新選項',
      priceDelta: 0,
      available: true,
      colorHex: group.displayType === 'color' ? '#D6CCB9' : undefined,
      swatchId: group.displayType === 'swatch' ? firstSwatch?.id : undefined,
    };
    updateGroup(group.id, { options: [...group.options, newOpt] });
  };

  const importAllLibrarySwatches = (group: VariantGroup) => {
    const pool = getSwatchesForGroup(group);
    if (pool.length === 0) return;
    const existingSwatchIds = new Set(
      group.options.map((o) => o.swatchId).filter(Boolean)
    );
    const newOpts: VariantOption[] = pool
      .filter((sw) => !existingSwatchIds.has(sw.id))
      .map((sw, idx) => ({
        id: `opt-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
        label: sw.name,
        priceDelta: 0,
        available: true,
        swatchId: sw.id,
      }));
    if (newOpts.length === 0) return;
    // If the only existing option is an unbound placeholder, replace it cleanly
    const cleanedExisting =
      group.options.length === 1 && !group.options[0].swatchId
        ? []
        : group.options;
    updateGroup(group.id, { options: [...cleanedExisting, ...newOpts] });
  };

  const updateOption = (
    groupId: string,
    optionId: string,
    patch: Partial<VariantOption>
  ) => {
    setDraft((prev) => ({
      ...prev,
      variantGroups: prev.variantGroups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              options: g.options.map((o) =>
                o.id === optionId ? { ...o, ...patch } : o
              ),
            }
          : g
      ),
    }));
  };

  const removeOption = (groupId: string, optionId: string) => {
    setDraft((prev) => ({
      ...prev,
      variantGroups: prev.variantGroups.map((g) =>
        g.id === groupId
          ? { ...g, options: g.options.filter((o) => o.id !== optionId) }
          : g
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.code.trim()) {
      setFormError('請填寫商品編號');
      return;
    }
    if (!draft.name.trim()) {
      setFormError('請填寫商品名稱');
      return;
    }
    const parsedPrice = Number(basePriceInput);
    if (basePriceInput.trim() === '' || parsedPrice < 0 || Number.isNaN(parsedPrice)) {
      setFormError('請輸入有效的底價金額（新台幣）');
      return;
    }
    if (draft.dollSizes.length === 0) {
      setFormError('請至少勾選一個適用娃娃尺寸');
      return;
    }
    setFormError(null);
    onSave({
      ...draft,
      basePrice: parsedPrice,
      code: draft.code.trim(),
      name: draft.name.trim(),
      summary: draft.summary.trim(),
      materialAndCare: draft.materialAndCare.trim(),
      leadTime: draft.leadTime.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0D8] pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1 rounded-lg border border-[#E5E0D8] bg-white px-3 py-2 text-xs font-medium text-[#2B2825] min-h-[40px]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回列表</span>
          </button>
          <h2 className="font-display text-xl font-semibold text-[#2B2825]">
            {isCreating ? '新增娃衣商品' : '編輯商品資料'}
          </h2>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2B2825] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#3F3B37] min-h-[44px]"
        >
          <Save className="h-4 w-4" />
          <span>儲存商品</span>
        </button>
      </div>

      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-[#A6726A]/40 bg-[#A6726A]/10 px-4 py-3 text-sm text-[#7B4740]"
        >
          {formError}
        </div>
      )}

      {/* Section 1: Basic Info */}
      <section className="rounded-2xl border border-[#E5E0D8] bg-white p-5 space-y-4">
        <h3 className="font-display text-base font-semibold text-[#2B2825]">基本資訊</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="prod-code" className="block text-xs font-medium text-[#6E6962] mb-1.5">
              商品編號 *
            </label>
            <input
              id="prod-code"
              type="text"
              value={draft.code}
              onChange={(e) => setDraft({ ...draft, code: e.target.value })}
              placeholder="例如 YT-105"
              className="w-full min-h-[44px] rounded-xl border border-[#E5E0D8] bg-[#F7F5F0]/50 px-3.5 text-sm font-mono text-[#2B2825] focus:border-[#2B2825] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="prod-name" className="block text-xs font-medium text-[#6E6962] mb-1.5">
              商品名稱 *
            </label>
            <input
              id="prod-name"
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full min-h-[44px] rounded-xl border border-[#E5E0D8] bg-[#F7F5F0]/50 px-3.5 text-sm text-[#2B2825] focus:border-[#2B2825] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="prod-category" className="block text-xs font-medium text-[#6E6962] mb-1.5">
              所屬區塊與商品分類
            </label>
            <select
              id="prod-category"
              value={draft.categoryId}
              onChange={(e) =>
                setDraft({ ...draft, categoryId: e.target.value as CategoryId })
              }
              className="w-full min-h-[44px] rounded-xl border border-[#E5E0D8] bg-white px-3.5 text-sm text-[#2B2825]"
            >
              <optgroup label={SECTION_LABELS.proxy}>
                <option value="featured">{CATEGORY_LABELS.featured}</option>
                <option value="custom">{CATEGORY_LABELS.custom}</option>
              </optgroup>
              <optgroup label={SECTION_LABELS.crochet}>
                <option value="crochet_bib">{CATEGORY_LABELS.crochet_bib}</option>
                <option value="crochet_outfit">{CATEGORY_LABELS.crochet_outfit}</option>
              </optgroup>
            </select>
            {getSectionForCategory(draft.categoryId) === 'crochet' && (
              <p className="mt-1 text-[11px] text-[#5F6F61]">
                此分類隸屬「毛線編織」，下方規格選用「共用素材庫」時將預設連結「線材庫」。
              </p>
            )}
          </div>

          <div>
            <label htmlFor="prod-status" className="block text-xs font-medium text-[#6E6962] mb-1.5">
              供應狀態標籤
            </label>
            <select
              id="prod-status"
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as ProductStatus })
              }
              className="w-full min-h-[44px] rounded-xl border border-[#E5E0D8] bg-white px-3.5 text-sm text-[#2B2825]"
            >
              {(Object.keys(STATUS_LABELS) as ProductStatus[]).map((key) => (
                <option key={key} value={key}>
                  {STATUS_LABELS[key]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prod-base-price" className="block text-xs font-medium text-[#6E6962] mb-1.5">
              商品底價（NT$）*
            </label>
            <input
              id="prod-base-price"
              type="number"
              min={0}
              step={10}
              value={basePriceInput}
              placeholder="請輸入底價金額"
              onChange={(e) => setBasePriceInput(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-[#E5E0D8] bg-[#F7F5F0]/50 px-3.5 text-sm text-[#2B2825] tabular-price focus:border-[#2B2825] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="prod-lead-time" className="block text-xs font-medium text-[#6E6962] mb-1.5">
              預計工期
            </label>
            <input
              id="prod-lead-time"
              type="text"
              value={draft.leadTime}
              onChange={(e) => setDraft({ ...draft, leadTime: e.target.value })}
              placeholder="工期+集運約25天。"
              className="w-full min-h-[44px] rounded-xl border border-[#E5E0D8] bg-[#F7F5F0]/50 px-3.5 text-sm text-[#2B2825] focus:border-[#2B2825] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <span className="block text-xs font-medium text-[#6E6962] mb-1.5">
              適用娃娃尺寸 *
            </span>
            <div className="flex flex-wrap gap-2">
              {DOLL_SIZES.map((size) => {
                const checked = draft.dollSizes.includes(size);
                return (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => toggleSize(size)}
                    className={`min-h-[40px] rounded-lg border px-4 text-xs font-medium transition-colors ${
                      checked
                        ? 'border-[#2B2825] bg-[#2B2825] text-white'
                        : 'border-[#E5E0D8] bg-white text-[#2B2825]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="prod-summary" className="block text-xs font-medium text-[#6E6962] mb-1.5">
              商品簡介（可換行）
            </label>
            <textarea
              id="prod-summary"
              rows={4}
              value={draft.summary}
              placeholder="可按 Enter 換行輸入商品特色與配件說明…"
              onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
              className="w-full rounded-xl border border-[#E5E0D8] bg-[#F7F5F0]/50 p-3 text-sm text-[#2B2825] leading-relaxed focus:border-[#2B2825] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="prod-material" className="block text-xs font-medium text-[#6E6962] mb-1.5">
              購買注意事項
            </label>
            <textarea
              id="prod-material"
              rows={10}
              value={draft.materialAndCare}
              onChange={(e) =>
                setDraft({ ...draft, materialAndCare: e.target.value })
              }
              className="w-full rounded-xl border border-[#E5E0D8] bg-[#F7F5F0]/50 p-3 text-sm text-[#2B2825] leading-relaxed focus:border-[#2B2825] focus:bg-white focus:outline-none"
            />
          </div>

          {/* Toggles */}
          <div className="md:col-span-2 flex flex-wrap gap-4 pt-2 border-t border-[#EFECE6]">
            <label className="inline-flex items-center gap-2 text-sm text-[#2B2825] cursor-pointer min-h-[36px]">
              <input
                type="checkbox"
                checked={draft.isPublished}
                onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })}
                className="h-4 w-4 accent-[#2B2825]"
              />
              <span>前台公開上架</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-[#2B2825] cursor-pointer min-h-[36px]">
              <input
                type="checkbox"
                checked={draft.isNewArrival}
                onChange={(e) => setDraft({ ...draft, isNewArrival: e.target.checked })}
                className="h-4 w-4 accent-[#2B2825]"
              />
              <span>顯示於首頁最新商品</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-[#2B2825] cursor-pointer min-h-[36px]">
              <input
                type="checkbox"
                checked={draft.isRecommended}
                onChange={(e) => setDraft({ ...draft, isRecommended: e.target.checked })}
                className="h-4 w-4 accent-[#2B2825]"
              />
              <span>設為首頁推薦商品</span>
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-[#2B2825] cursor-pointer min-h-[36px]">
              <input
                type="checkbox"
                checked={draft.allowCustomNote}
                onChange={(e) =>
                  setDraft({ ...draft, allowCustomNote: e.target.checked })
                }
                className="h-4 w-4 accent-[#2B2825]"
              />
              <span>顯示客製備註欄位</span>
            </label>
          </div>
        </div>
      </section>

      {/* Section 2: Multi-Image Manager */}
      <section className="rounded-2xl border border-[#E5E0D8] bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold text-[#2B2825]">
              商品圖片（第一張為封面）
            </h3>
            <p className="text-xs text-[#6E6962]">
              支援上傳多張本地圖片或貼上圖片網址，可調整順序
            </p>
          </div>

          <label className="inline-flex items-center gap-1.5 rounded-xl border border-[#2B2825] bg-white px-3.5 py-2 text-xs font-medium text-[#2B2825] hover:bg-[#F7F5F0] cursor-pointer min-h-[40px]">
            <Upload className="h-3.5 w-3.5" />
            <span>{uploading ? '處理圖片中…' : '上傳多張圖片'}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => handleUploadFiles(e.target.files)}
            />
          </label>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={imageUrlInput}
            onChange={(e) => setImageUrlInput(e.target.value)}
            placeholder="或貼上圖片路徑 / 網址（例如 /src/assets/images/...）"
            className="flex-1 min-h-[42px] rounded-xl border border-[#E5E0D8] bg-[#F7F5F0]/50 px-3.5 text-xs sm:text-sm text-[#2B2825]"
          />
          <button
            type="button"
            onClick={handleAddImageUrl}
            className="inline-flex items-center gap-1 rounded-xl border border-[#DCD5CA] bg-white px-3.5 text-xs font-medium text-[#2B2825] hover:border-[#2B2825] min-h-[42px] whitespace-nowrap"
          >
            <ImagePlus className="h-4 w-4" />
            <span>加入網址</span>
          </button>
        </div>

        {draft.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {draft.images.map((imgUrl, idx) => (
              <div
                key={`${imgUrl.slice(0, 24)}-${idx}`}
                className="rounded-xl border border-[#E5E0D8] overflow-hidden bg-[#F7F5F0]"
              >
                <div className="relative aspect-[4/5]">
                  <SafeImage
                    src={imgUrl}
                    alt={`商品圖片 ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute top-2 left-2 rounded bg-[#2B2825]/85 px-1.5 py-0.5 text-[10px] text-white">
                      封面
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between p-1.5 bg-white">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, -1)}
                      aria-label={`前移第 ${idx + 1} 張圖片`}
                      className="flex h-8 w-8 items-center justify-center rounded text-[#2B2825] disabled:opacity-30 hover:bg-[#EFECE6]"
                    >
                      <ArrowUp className="h-3.5 w-3.5 -rotate-90" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === draft.images.length - 1}
                      onClick={() => moveImage(idx, 1)}
                      aria-label={`後移第 ${idx + 1} 張圖片`}
                      className="flex h-8 w-8 items-center justify-center rounded text-[#2B2825] disabled:opacity-30 hover:bg-[#EFECE6]"
                    >
                      <ArrowDown className="h-3.5 w-3.5 -rotate-90" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    aria-label={`移除第 ${idx + 1} 張圖片`}
                    className="flex h-8 w-8 items-center justify-center rounded text-[#A6726A] hover:bg-[#A6726A]/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Dynamic Variant Groups Editor */}
      <section className="rounded-2xl border border-[#E5E0D8] bg-white p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-semibold text-[#2B2825]">
              動態規格群組設定
            </h3>
            <p className="text-xs text-[#6E6962]">
              可自由新增、排序與刪除規格群組，設定文字按鈕、色塊，或連結共用色卡庫、線材庫、鑽盤庫、眼睛顏色與緞帶顏色
            </p>
          </div>
          <button
            type="button"
            onClick={addVariantGroup}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#5F6F61] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#4C5B4E] min-h-[40px]"
          >
            <Plus className="h-4 w-4" />
            <span>新增規格群組</span>
          </button>
        </div>

        {draft.variantGroups.length === 0 ? (
          <p className="rounded-xl bg-[#F7F5F0] p-6 text-center text-xs text-[#6E6962]">
            尚未設定規格群組，點擊右上角「新增規格群組」即可自由建立。
          </p>
        ) : (
          <div className="space-y-4">
            {draft.variantGroups.map((group, gIdx) => (
              <div
                key={group.id}
                className="rounded-xl border border-[#E5E0D8] bg-[#F7F5F0]/55 p-4 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5E0D8]">
                  <span className="text-xs font-semibold text-[#5F6F61]">
                    規格群組 #{gIdx + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={gIdx === 0}
                      onClick={() => moveGroup(gIdx, -1)}
                      aria-label={`上移規格群組 ${group.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E0D8] bg-white disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={gIdx === draft.variantGroups.length - 1}
                      onClick={() => moveGroup(gIdx, 1)}
                      aria-label={`下移規格群組 ${group.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E0D8] bg-white disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeGroup(group.id)}
                      aria-label={`刪除規格群組 ${group.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E0D8] bg-white text-[#A6726A] hover:bg-[#A6726A]/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#6E6962] mb-1">
                      群組名稱
                    </label>
                    <input
                      type="text"
                      value={group.name}
                      onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                      className="w-full min-h-[40px] rounded-lg border border-[#E5E0D8] bg-white px-3 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#6E6962] mb-1">
                      顯示樣式
                    </label>
                    <select
                      value={group.displayType}
                      onChange={(e) => {
                        const nextDisplay = e.target.value as VariantDisplayType;
                        const defaultLib: SwatchLibraryType =
                          getSectionForCategory(draft.categoryId) === 'crochet'
                            ? 'yarn'
                            : 'fabric';
                        updateGroup(group.id, {
                          displayType: nextDisplay,
                          swatchLibrary:
                            nextDisplay === 'swatch'
                              ? group.swatchLibrary || defaultLib
                              : group.swatchLibrary,
                        });
                      }}
                      className="w-full min-h-[40px] rounded-lg border border-[#E5E0D8] bg-white px-3 text-xs sm:text-sm"
                    >
                      <option value="text">文字按鈕</option>
                      <option value="color">顏色色塊</option>
                      <option value="swatch">共用素材庫（色卡／線材／鑽盤／眼睛／緞帶）</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#6E6962] mb-1">
                      選取模式
                    </label>
                    <select
                      value={group.selectionMode}
                      onChange={(e) =>
                        updateGroup(group.id, {
                          selectionMode: e.target.value as SelectionMode,
                          required: e.target.value === 'single',
                        })
                      }
                      className="w-full min-h-[40px] rounded-lg border border-[#E5E0D8] bg-white px-3 text-xs sm:text-sm"
                    >
                      <option value="single">單選（必選一項）</option>
                      <option value="multi">複選（額外加購）</option>
                    </select>
                  </div>
                </div>

                {group.displayType === 'swatch' && (
                  <div className="flex flex-wrap items-end justify-between gap-2.5 rounded-lg border border-[#E5E0D8] bg-white p-3">
                    <div className="min-w-[180px] flex-1">
                      <label className="block text-[11px] font-medium text-[#6E6962] mb-1">
                        綁定素材庫來源
                      </label>
                      <select
                        value={group.swatchLibrary || ''}
                        onChange={(e) =>
                          updateGroup(group.id, {
                            swatchLibrary: (e.target.value || undefined) as
                              | SwatchLibraryType
                              | undefined,
                          })
                        }
                        className="w-full min-h-[38px] rounded-lg border border-[#E5E0D8] bg-white px-2.5 text-xs text-[#2B2825]"
                      >
                        <option value="">全部素材庫（依分類顯示）</option>
                        {SWATCH_LIBRARY_ORDER.map((lib) => {
                          const cnt = swatches.filter(
                            (s) => (s.libraryType || 'fabric') === lib
                          ).length;
                          return (
                            <option key={lib} value={lib}>
                              {SWATCH_LIBRARY_LABELS[lib]}（{SWATCH_LIBRARY_META[lib].sectionHint} · {cnt} 項）
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => importAllLibrarySwatches(group)}
                      className="min-h-[38px] inline-flex items-center gap-1 rounded-lg border border-[#5F6F61] bg-[#5F6F61]/10 px-3 text-xs font-medium text-[#3D4B3F] hover:bg-[#5F6F61]/15 whitespace-nowrap"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>
                        一鍵帶入
                        {group.swatchLibrary
                          ? `「${SWATCH_LIBRARY_LABELS[group.swatchLibrary]}」`
                          : '全部'}
                        項目
                      </span>
                    </button>
                  </div>
                )}

                {/* Options inside group */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#6E6962]">
                      選項清單（{group.options.length}）
                    </span>
                    <button
                      type="button"
                      onClick={() => addOption(group)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#5F6F61] hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>新增選項</span>
                    </button>
                  </div>

                  {group.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center rounded-lg border border-[#E5E0D8] bg-white p-2.5"
                    >
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          value={opt.label}
                          aria-label="選項名稱"
                          placeholder="選項名稱"
                          onChange={(e) =>
                            updateOption(group.id, opt.id, { label: e.target.value })
                          }
                          className="w-full min-h-[38px] rounded-lg border border-[#E5E0D8] px-2.5 text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#6E6962]">
                            +NT$
                          </span>
                          <input
                            type="number"
                            min={0}
                            step={10}
                            aria-label="加價金額"
                            placeholder="0"
                            value={opt.priceDelta === 0 ? '' : opt.priceDelta}
                            onChange={(e) =>
                              updateOption(group.id, opt.id, {
                                priceDelta: e.target.value === '' ? 0 : Number(e.target.value) || 0,
                              })
                            }
                            className="w-full min-h-[38px] rounded-lg border border-[#E5E0D8] pl-11 pr-2 text-xs tabular-price"
                          />
                        </div>
                      </div>

                      {/* Conditional Color Picker or Shared Swatch Selector */}
                      <div className="sm:col-span-3">
                        {group.displayType === 'color' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              aria-label="選擇色碼"
                              value={opt.colorHex || '#D6CCB9'}
                              onChange={(e) =>
                                updateOption(group.id, opt.id, {
                                  colorHex: e.target.value,
                                })
                              }
                              className="h-9 w-10 rounded border border-[#E5E0D8] cursor-pointer"
                            />
                            <span className="font-mono text-[11px] text-[#6E6962]">
                              {opt.colorHex || '#D6CCB9'}
                            </span>
                          </div>
                        ) : group.displayType === 'swatch' ? (
                          <select
                            aria-label="綁定共用素材庫項目"
                            value={opt.swatchId || ''}
                            onChange={(e) => {
                              const sw = swatches.find((s) => s.id === e.target.value);
                              updateOption(group.id, opt.id, {
                                swatchId: e.target.value || undefined,
                                label: sw ? sw.name : opt.label,
                              });
                            }}
                            className="w-full min-h-[38px] rounded-lg border border-[#E5E0D8] px-2 text-xs"
                          >
                            <option value="">
                              {group.swatchLibrary
                                ? `選擇${SWATCH_LIBRARY_LABELS[group.swatchLibrary]}項目…`
                                : '選擇共用素材庫項目…'}
                            </option>
                            {group.swatchLibrary
                              ? getSwatchesForGroup(group).map((sw) => (
                                  <option key={sw.id} value={sw.id}>
                                    {sw.code} · {sw.name}
                                  </option>
                                ))
                              : SWATCH_LIBRARY_ORDER.map((lib) => {
                                  const items = swatches.filter(
                                    (s) => (s.libraryType || 'fabric') === lib
                                  );
                                  if (items.length === 0) return null;
                                  return (
                                    <optgroup key={lib} label={SWATCH_LIBRARY_LABELS[lib]}>
                                      {items.map((sw) => (
                                        <option key={sw.id} value={sw.id}>
                                          {sw.code} · {sw.name}
                                        </option>
                                      ))}
                                    </optgroup>
                                  );
                                })}
                          </select>
                        ) : (
                          <select
                            aria-label="對應切換預覽圖"
                            value={opt.previewImage || ''}
                            onChange={(e) =>
                              updateOption(group.id, opt.id, {
                                previewImage: e.target.value || undefined,
                              })
                            }
                            className="w-full min-h-[38px] rounded-lg border border-[#E5E0D8] px-2 text-xs text-[#6E6962]"
                          >
                            <option value="">不切換預覽圖</option>
                            {draft.images.map((url, idx) => (
                              <option key={`${url.slice(0, 18)}-${idx}`} value={url}>
                                切換至圖片 #{idx + 1}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Preview Image selector when swatch/color */}
                      <div className="sm:col-span-2">
                        {group.displayType !== 'text' && (
                          <select
                            aria-label="對應切換商品圖"
                            value={opt.previewImage || ''}
                            onChange={(e) =>
                              updateOption(group.id, opt.id, {
                                previewImage: e.target.value || undefined,
                              })
                            }
                            className="w-full min-h-[38px] rounded-lg border border-[#E5E0D8] px-2 text-xs text-[#6E6962]"
                          >
                            <option value="">不切圖</option>
                            {draft.images.map((url, idx) => (
                              <option key={`${url.slice(0, 18)}-${idx}`} value={url}>
                                切至圖 #{idx + 1}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-end gap-2">
                        <label className="inline-flex items-center gap-1 text-[11px] text-[#6E6962] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={opt.available}
                            onChange={(e) =>
                              updateOption(group.id, opt.id, {
                                available: e.target.checked,
                              })
                            }
                            className="accent-[#2B2825]"
                          />
                          <span>可選</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeOption(group.id, opt.id)}
                          aria-label={`刪除選項 ${opt.label}`}
                          className="flex h-8 w-8 items-center justify-center rounded text-[#A6726A] hover:bg-[#A6726A]/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] rounded-xl border border-[#DCD5CA] bg-white px-5 text-sm font-medium text-[#2B2825]"
        >
          取消
        </button>
        <button
          type="submit"
          className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl bg-[#2B2825] px-6 text-sm font-medium text-white hover:bg-[#3F3B37]"
        >
          <Save className="h-4 w-4" />
          <span>儲存變更</span>
        </button>
      </div>
    </form>
  );
};
