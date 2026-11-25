import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Expand,
  Heart,
  Info,
  MessageCircle,
  Ruler,
  ShoppingBag,
  Sparkles,
  X,
  ZoomIn,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  type CartItem,
  type CategoryId,
  type FabricSwatch,
  type LineIntegrationConfig,
  type Product,
  type SelectedVariantsMap,
  type VariantGroup,
  type VariantOption,
} from '../types/store';
import {
  buildLineCustomerServiceUrl,
  buildLineOaMessageUrl,
  LINE_BRAND_GREEN,
} from '../services/lineIntegration';
import {
  calculateProductPrice,
  createCartItemFromSelection,
  formatLineOrderMessage,
  formatTWD,
  getEmptySelections,
  validateRequiredVariants,
} from '../utils/pricing';
import { buildProductShareUrl } from '../utils/router';
import { SafeImage } from './SafeImage';

interface ProductDetailViewProps {
  product: Product;
  swatches: FabricSwatch[];
  brandName: string;
  lineConfig: LineIntegrationConfig;
  isFavorite: boolean;
  onToggleFavorite: (productId: string) => void;
  onAddToCart: (item: CartItem) => void;
  onOpenCart: () => void;
  onBack: () => void;
  onNavigateCategory: (category: CategoryId) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  swatches,
  brandName,
  lineConfig,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
  onOpenCart,
  onBack,
  onNavigateCategory,
}) => {
  const [selections, setSelections] = useState<SelectedVariantsMap>(() =>
    getEmptySelections(product)
  );
  const [customNote, setCustomNote] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [overridePreviewUrl, setOverridePreviewUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomedSwatch, setZoomedSwatch] = useState<{
    swatch: FabricSwatch;
    groupId: string;
    option: VariantOption;
  } | null>(null);
  const [copiedState, setCopiedState] = useState<'idle' | 'copied'>('idle');
  const [showCopyTextBox, setShowCopyTextBox] = useState(false);
  const [addedToCartToast, setAddedToCartToast] = useState(false);
  const [lineOpenedHint, setLineOpenedHint] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const variantSectionRef = useRef<HTMLElement | null>(null);

  // Reset selections when switching to a different product
  useEffect(() => {
    setSelections(getEmptySelections(product));
    setCustomNote('');
    setActiveImageIndex(0);
    setOverridePreviewUrl(null);
    setCopiedState('idle');
    setShowCopyTextBox(false);
    setAddedToCartToast(false);
    setLineOpenedHint(false);
    setValidationAttempted(false);
  }, [product]);

  const galleryImages = useMemo(() => {
    const base = product.images.filter(Boolean);
    const list = base.length > 0 ? [...base] : [''];
    if (overridePreviewUrl && !list.includes(overridePreviewUrl)) {
      list.push(overridePreviewUrl);
    }
    return list;
  }, [product.images, overridePreviewUrl]);

  const swatchMap = useMemo(
    () => new Map(swatches.map((s) => [s.id, s])),
    [swatches]
  );

  const validation = useMemo(
    () => validateRequiredVariants(product, selections),
    [product, selections]
  );

  const priceCalc = useMemo(
    () => calculateProductPrice(product, selections, swatches),
    [product, selections, swatches]
  );

  const productShareUrl = useMemo(
    () => buildProductShareUrl(product.id),
    [product.id]
  );

  const orderMessage = useMemo(
    () =>
      formatLineOrderMessage({
        product,
        selections,
        swatches,
        customNote,
        productUrl: productShareUrl,
        brandName,
      }),
    [product, selections, swatches, customNote, productShareUrl, brandName]
  );

  const lineOrderUrl = useMemo(
    () => buildLineOaMessageUrl(lineConfig.officialAccountId, orderMessage),
    [lineConfig.officialAccountId, orderMessage]
  );

  const lineProductServiceUrl = useMemo(() => {
    const csMsg = `您好，我想詢問商品「${product.name}」（編號 ${product.code}）的細節：\n${productShareUrl}`;
    return buildLineCustomerServiceUrl(lineConfig, csMsg);
  }, [lineConfig, product.code, product.name, productShareUrl]);

  const handleSelectOption = (group: VariantGroup, option: VariantOption) => {
    if (!option.available) return;

    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      if (group.selectionMode === 'single') {
        return { ...prev, [group.id]: [option.id] };
      }
      const exists = current.includes(option.id);
      return {
        ...prev,
        [group.id]: exists
          ? current.filter((id) => id !== option.id)
          : [...current, option.id],
      };
    });

    if (option.previewImage) {
      const existingIdx = product.images.indexOf(option.previewImage);
      if (existingIdx >= 0) {
        setOverridePreviewUrl(null);
        setActiveImageIndex(existingIdx);
      } else {
        setOverridePreviewUrl(option.previewImage);
        setActiveImageIndex(product.images.length);
      }
    }
  };

  const scrollToMissingVariants = () => {
    setValidationAttempted(true);
    variantSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAddToCartClick = () => {
    if (!validation.isValid) {
      scrollToMissingVariants();
      return;
    }
    const item = createCartItemFromSelection({
      product,
      selections,
      swatches,
      customNote,
    });
    onAddToCart(item);
    setAddedToCartToast(true);
    window.setTimeout(() => setAddedToCartToast(false), 3200);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) =>
      prev === 0 ? galleryImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) =>
      prev === galleryImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || galleryImages.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const diff = touchStartX.current - endX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNextImage();
      else handlePrevImage();
    }
    touchStartX.current = null;
  };

  const handleCopyOrderInfo = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(orderMessage);
      } else {
        const temp = document.createElement('textarea');
        temp.value = orderMessage;
        temp.setAttribute('readonly', '');
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      setCopiedState('copied');
      window.setTimeout(() => setCopiedState('idle'), 2600);
    } catch {
      setShowCopyTextBox(true);
    }
  };

  const currentImage = galleryImages[activeImageIndex] ?? galleryImages[0] ?? '';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-3 md:pt-8 pb-32 md:pb-28">
      {/* Breadcrumb & Back */}
      <div className="mb-4 flex items-center justify-between gap-2 text-xs text-[#6E6962]">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-[#2B2825] hover:text-[#5F6F61] min-h-[38px] pr-2 whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            onClick={() => onNavigateCategory(product.categoryId)}
            className="hover:text-[#2B2825] whitespace-nowrap shrink-0"
          >
            {CATEGORY_LABELS[product.categoryId]}
          </button>
          <span aria-hidden="true" className="hidden sm:inline">/</span>
          <span className="hidden sm:inline truncate text-[#2B2825]">{product.name}</span>
        </div>

        <span className="shrink-0 text-xs font-medium text-[#5F6F61]">
          {STATUS_LABELS[product.status]}
        </span>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        {/* Left: Swipeable Image Gallery */}
        <div className="lg:col-span-6 lg:sticky lg:top-20">
          <div
            className="relative overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#EFECE6] aspect-[4/5] select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="全螢幕放大預覽商品圖片"
              className="block h-full w-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2B2825]"
            >
              <SafeImage
                src={currentImage}
                alt={`${product.name} - 圖片 ${activeImageIndex + 1}`}
                fallbackTitle={product.name}
                className="h-full w-full object-cover transition-opacity duration-200"
              />
            </button>

            <div
              data-testid="gallery-counter"
              className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-[#2B2825]/75 px-2.5 py-1 text-xs font-medium text-[#F7F5F0] tabular-price"
            >
              {activeImageIndex + 1} / {galleryImages.length}
            </div>

            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label="開啟全螢幕圖片檢視"
              className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5F0]/88 text-[#2B2825] backdrop-blur-xs hover:bg-white transition-colors"
            >
              <Expand className="h-4 w-4" />
            </button>

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="上一張商品圖片"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5F0]/85 text-[#2B2825] backdrop-blur-xs hover:bg-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="下一張商品圖片"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5F0]/85 text-[#2B2825] backdrop-blur-xs hover:bg-white transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="mt-3 flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`切換至第 ${idx + 1} 張圖片`}
                  aria-current={activeImageIndex === idx ? 'true' : undefined}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition-all ${
                    activeImageIndex === idx
                      ? 'border-[#2B2825] ring-2 ring-[#2B2825] ring-offset-1 ring-offset-[#F7F5F0]'
                      : 'border-[#E5E0D8] opacity-75 hover:opacity-100'
                  }`}
                >
                  <SafeImage
                    src={imgUrl}
                    alt={`${product.name} 縮圖 ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info, Dynamic Variants, Customizer & Summary */}
        <div className="lg:col-span-6 space-y-6">
          {/* Basic Info Header */}
          <div className="border-b border-[#E5E0D8] pb-5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#6E6962]">
              <span className="font-mono text-[#2B2825]">{product.code}</span>
              <span aria-hidden="true">·</span>
              <span>{CATEGORY_LABELS[product.categoryId]}</span>
              <span aria-hidden="true">·</span>
              <span>{STATUS_LABELS[product.status]}</span>
              <span aria-hidden="true">·</span>
              <span>適用 {product.dollSizes.join(' / ')}</span>
            </div>

            <div className="mt-2 flex items-start justify-between gap-3">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B2825] leading-snug">
                {product.name}
              </h1>
              <button
                type="button"
                onClick={() => onToggleFavorite(product.id)}
                aria-label={isFavorite ? '取消收藏此商品' : '收藏此商品'}
                aria-pressed={isFavorite}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E5E0D8] bg-white hover:border-[#2B2825] transition-colors"
              >
                <Heart
                  className={`h-5 w-5 ${
                    isFavorite ? 'fill-[#A6726A] text-[#A6726A]' : 'text-[#2B2825]'
                  }`}
                />
              </button>
            </div>

            {/* Dynamic Estimated Quote Display */}
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span
                data-testid="detail-total-price"
                className="text-2xl font-semibold text-[#2B2825] tabular-price"
              >
                {formatTWD(priceCalc.totalPrice)}
              </span>
              <span className="text-xs font-medium text-[#5F6F61]">
                預估報價
              </span>
              {priceCalc.modifierTotal > 0 ? (
                <span className="text-xs text-[#6E6962] tabular-price">
                  （底價 {formatTWD(priceCalc.basePrice)} + 加價 {formatTWD(priceCalc.modifierTotal)}）
                </span>
              ) : (
                <span className="text-xs text-[#6E6962] tabular-price">
                  （底價 {formatTWD(priceCalc.basePrice)}）
                </span>
              )}
            </div>

            <p className="mt-3.5 text-sm leading-relaxed text-[#4C4742]">
              {product.summary}
            </p>
          </div>

          {/* Product Craft Specifications — unified hairline-divided block */}
          <div className="rounded-xl bg-white border border-[#E5E0D8] divide-y divide-[#EFECE6] text-xs">
            <div className="grid grid-cols-2 divide-x divide-[#EFECE6]">
              <div className="p-3">
                <p className="flex items-center gap-1.5 font-medium text-[#2B2825]">
                  <Ruler className="h-3.5 w-3.5 text-[#5F6F61] shrink-0" />
                  <span>適用尺寸</span>
                </p>
                <p className="mt-1 text-[#6E6962]">{product.dollSizes.join('、')}</p>
              </div>
              <div className="p-3">
                <p className="flex items-center gap-1.5 font-medium text-[#2B2825]">
                  <Clock className="h-3.5 w-3.5 text-[#5F6F61] shrink-0" />
                  <span>預計工期</span>
                </p>
                <p className="mt-1 text-[#6E6962] leading-snug">{product.leadTime}</p>
              </div>
            </div>
            <div className="p-3">
              <p className="font-medium text-[#2B2825]">購買注意事項</p>
              <p className="mt-1 leading-relaxed text-[#6E6962]">{product.materialAndCare}</p>
            </div>
            <div className="p-3 flex items-center justify-between gap-2 bg-[#F7F5F0]/55">
              <span className="text-[#6E6962]">對尺寸、布料或交期有疑問？</span>
              <a
                href={lineProductServiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: LINE_BRAND_GREEN }}
                className="inline-flex items-center gap-1 font-medium hover:underline whitespace-nowrap shrink-0"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>聯繫 LINE 客服詢問</span>
              </a>
            </div>
          </div>

          {/* Dynamic Variant Groups */}
          <section
            ref={variantSectionRef}
            aria-label="商品規格選擇"
            className="space-y-6 pt-1 scroll-mt-20"
          >
            {!validation.isValid && !validation.isSoldOut && (
              <div
                data-testid="missing-variants-banner"
                className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed ${
                  validationAttempted
                    ? 'border-[#A6726A] bg-[#A6726A]/10 text-[#7B4740]'
                    : 'border-[#E5E0D8] bg-white text-[#6E6962]'
                }`}
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  請完成所有必填規格後方可加入購物車或透過 LINE 訂購，尚未選擇：
                  <strong className="font-medium text-[#2B2825]">
                    {validation.missingGroupNames.join('、')}
                  </strong>
                </span>
              </div>
            )}

            {product.variantGroups.map((group) => {
              const selectedIds = selections[group.id] ?? [];
              const isMissing = validation.missingGroupIds.includes(group.id);
              const selectedLabels = group.options
                .filter((o) => selectedIds.includes(o.id))
                .map((o) => {
                  const sw = o.swatchId ? swatchMap.get(o.swatchId) : undefined;
                  return sw ? `${sw.name} (${sw.code})` : o.label;
                });

              return (
                <div
                  key={group.id}
                  className={`space-y-2.5 rounded-xl transition-colors ${
                    validationAttempted && isMissing
                      ? 'bg-[#A6726A]/5 p-3 -mx-3 border border-[#A6726A]/40'
                      : ''
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h2 className="font-sans text-sm font-semibold text-[#2B2825]">
                        {group.name}
                        {group.required ? (
                          <span className="ml-1.5 text-[11px] font-medium text-[#A6726A]">
                            * 必填
                          </span>
                        ) : (
                          <span className="ml-1.5 text-xs font-normal text-[#6E6962]">
                            （選填，可複選）
                          </span>
                        )}
                      </h2>
                      {group.description && (
                        <p className="mt-0.5 text-xs text-[#6E6962]">{group.description}</p>
                      )}
                    </div>
                    {selectedLabels.length > 0 ? (
                      <span className="text-xs text-[#5F6F61]">
                        已選：{selectedLabels.join('、')}
                      </span>
                    ) : group.required ? (
                      <span className="text-xs text-[#A6726A]">請選擇</span>
                    ) : null}
                  </div>

                  {/* Type 1: Text Options */}
                  {group.displayType === 'text' && (
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => {
                        const isSelected = selectedIds.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={!option.available}
                            aria-pressed={isSelected}
                            onClick={() => handleSelectOption(group, option)}
                            className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-xs sm:text-sm transition-all text-left flex items-center gap-2 ${
                              !option.available
                                ? 'border-[#E5E0D8] bg-[#EFECE6]/70 text-[#9B958D] line-through cursor-not-allowed'
                                : isSelected
                                ? 'border-[#2B2825] bg-white text-[#2B2825] ring-2 ring-[#2B2825] font-medium'
                                : 'border-[#E5E0D8] bg-white text-[#2B2825] hover:border-[#8E8880]'
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-[#2B2825]" />}
                            <span>{option.label}</span>
                            {option.priceDelta > 0 && (
                              <span className="text-[11px] font-medium text-[#5F6F61] tabular-price whitespace-nowrap">
                                +{formatTWD(option.priceDelta)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Type 2: Color Swatch Chips */}
                  {group.displayType === 'color' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {group.options.map((option) => {
                        const isSelected = selectedIds.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            disabled={!option.available}
                            aria-pressed={isSelected}
                            onClick={() => handleSelectOption(group, option)}
                            className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left min-h-[48px] transition-all ${
                              !option.available
                                ? 'border-[#E5E0D8] bg-[#EFECE6]/70 text-[#9B958D] opacity-65 cursor-not-allowed'
                                : isSelected
                                ? 'border-[#2B2825] bg-white ring-2 ring-[#2B2825]'
                                : 'border-[#E5E0D8] bg-white hover:border-[#8E8880]'
                            }`}
                          >
                            <span
                              className="h-7 w-7 shrink-0 rounded-lg border border-black/10"
                              style={{ backgroundColor: option.colorHex || '#DCD5CA' }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-[#2B2825] truncate">
                                {option.label}
                              </p>
                              {option.priceDelta > 0 && (
                                <p className="text-[11px] text-[#5F6F61] tabular-price">
                                  +{formatTWD(option.priceDelta)}
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Type 3: Photo Fabric Swatch Cards */}
                  {group.displayType === 'swatch' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {group.options.map((option) => {
                        const swatch = option.swatchId
                          ? swatchMap.get(option.swatchId)
                          : undefined;
                        const isSelected = selectedIds.includes(option.id);
                        const swatchImage = swatch?.imageUrl || option.previewImage || '';
                        const displayName = swatch?.name || option.label;
                        const displayCode = swatch?.code || '';

                        return (
                          <div
                            key={option.id}
                            className={`relative rounded-xl border bg-white overflow-hidden transition-all ${
                              !option.available
                                ? 'border-[#E5E0D8] opacity-55'
                                : isSelected
                                ? 'border-[#2B2825] ring-2 ring-[#2B2825]'
                                : 'border-[#E5E0D8] hover:border-[#8E8880]'
                            }`}
                          >
                            <button
                              type="button"
                              disabled={!option.available}
                              aria-pressed={isSelected}
                              onClick={() => handleSelectOption(group, option)}
                              className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#2B2825]"
                            >
                              <div className="relative aspect-square w-full bg-[#EFECE6]">
                                <SafeImage
                                  src={swatchImage}
                                  alt={`${displayName} 布料色卡`}
                                  fallbackTitle={displayName}
                                  className="h-full w-full object-cover"
                                />
                                {isSelected && (
                                  <span className="absolute bottom-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2B2825] text-white">
                                    <Check className="h-3 w-3" />
                                  </span>
                                )}
                              </div>

                              <div className="p-2.5">
                                {displayCode && (
                                  <p className="font-mono text-[10px] text-[#6E6962]">
                                    {displayCode}
                                  </p>
                                )}
                                <p className="text-xs font-medium text-[#2B2825] line-clamp-1">
                                  {displayName}
                                </p>
                                <p className="mt-0.5 text-[11px] text-[#5F6F61] tabular-price">
                                  {option.priceDelta > 0
                                    ? `+${formatTWD(option.priceDelta)}`
                                    : '標準含價'}
                                </p>
                              </div>
                            </button>

                            {swatch && (
                              <button
                                type="button"
                                onClick={() =>
                                  setZoomedSwatch({ swatch, groupId: group.id, option })
                                }
                                aria-label={`放大查看 ${displayName} 色卡`}
                                className="absolute top-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#F7F5F0]/90 text-[#2B2825] backdrop-blur-xs hover:bg-white transition-colors"
                              >
                                <ZoomIn className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          {/* Custom Note Field */}
          {(product.categoryId === 'custom' || product.allowCustomNote) && (
            <div className="space-y-2 pt-2">
              <label
                htmlFor="custom-note-input"
                className="block text-sm font-semibold text-[#2B2825]"
              >
                顧客備註（選填）
              </label>
              <textarea
                id="custom-note-input"
                rows={3}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="例如：娃娃頭圍較大、需要預留尾巴開孔位置、或希望蝴蝶結改縫於左側…"
                className="w-full rounded-xl border border-[#E5E0D8] bg-white p-3.5 text-sm text-[#2B2825] placeholder:text-[#8E8880] focus:border-[#2B2825] focus:outline-none"
              />
            </div>
          )}

          {/* Specification Summary & Copy Order Fallback Box */}
          <section
            aria-label="訂購規格與預估報價摘要"
            className="rounded-2xl border border-[#E5E0D8] bg-white p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold text-[#2B2825] flex items-center gap-1.5">
                {product.categoryId === 'custom' && (
                  <Sparkles className="h-4 w-4 text-[#5F6F61]" />
                )}
                <span>訂購規格與預估報價</span>
              </h2>
              <span className="font-mono text-xs text-[#6E6962]">{product.code}</span>
            </div>

            <dl className="space-y-2 text-xs sm:text-sm border-y border-[#EFECE6] py-3.5">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-[#6E6962]">商品基礎價格</dt>
                <dd className="font-medium text-[#2B2825] tabular-price">
                  {formatTWD(priceCalc.basePrice)}
                </dd>
              </div>
              {priceCalc.breakdown.length === 0 ? (
                <p className="text-xs text-[#8E8880]">尚未選擇商品規格</p>
              ) : (
                priceCalc.breakdown.map((item) => (
                  <div
                    key={`${item.groupId}-${item.optionId}`}
                    className="flex items-start justify-between gap-4"
                  >
                    <dt className="text-[#6E6962]">
                      {item.groupName}：
                      <span className="text-[#2B2825] font-medium">
                        {item.optionLabel}
                        {item.swatchCode ? ` (${item.swatchCode})` : ''}
                      </span>
                    </dt>
                    <dd className="shrink-0 text-[#5F6F61] tabular-price">
                      {item.priceDelta > 0 ? `+${formatTWD(item.priceDelta)}` : 'NT$ 0'}
                    </dd>
                  </div>
                ))
              )}
              {customNote.trim() && (
                <div className="pt-1.5 border-t border-dashed border-[#E5E0D8]">
                  <dt className="text-[#6E6962] mb-0.5">顧客備註</dt>
                  <dd className="text-[#2B2825] break-words">{customNote.trim()}</dd>
                </div>
              )}
            </dl>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-sm font-medium text-[#2B2825]">預估總價格</span>
                <p className="text-[11px] text-[#6E6962]">
                  正式訂單與金額仍需由 LINE 客服確認
                </p>
              </div>
              <span className="text-xl font-semibold text-[#2B2825] tabular-price">
                {formatTWD(priceCalc.totalPrice)}
              </span>
            </div>

            {addedToCartToast && (
              <div
                role="status"
                className="flex items-center justify-between gap-3 rounded-xl bg-[#5F6F61]/12 border border-[#5F6F61]/30 px-3.5 py-2.5 text-xs text-[#2B2825]"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <Check className="h-4 w-4 text-[#5F6F61]" />
                  已加入購物車
                </span>
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="font-medium text-[#5F6F61] underline underline-offset-2"
                >
                  查看購物車並透過 LINE 訂購
                </button>
              </div>
            )}

            {lineOpenedHint && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl bg-[#F7F5F0] border border-[#E5E0D8] p-3 text-xs leading-relaxed text-[#4C4742]"
              >
                <Info className="h-4 w-4 shrink-0 text-[#5F6F61] mt-0.5" />
                <span>
                  已為您開啟 LINE 官方帳號聊天室並預填訂購訊息，請於 LINE 中確認並手動傳送；開啟聊天室不代表訂單已送出，須待客服回覆確認後訂單始成立。
                </span>
              </div>
            )}

            {/* Copy Order Info Fallback Button */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopyOrderInfo}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-[#DCD5CA] bg-[#F7F5F0] px-4 text-xs sm:text-sm font-medium text-[#2B2825] transition-colors hover:border-[#2B2825]"
              >
                {copiedState === 'copied' ? (
                  <>
                    <Check className="h-4 w-4 text-[#5F6F61]" />
                    <span>已複製訂購資訊（可手動貼上 LINE）</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>複製訂購資訊</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowCopyTextBox((prev) => !prev)}
                className="min-h-[44px] rounded-xl border border-[#E5E0D8] px-4 text-xs font-medium text-[#6E6962] hover:border-[#2B2825] hover:text-[#2B2825] whitespace-nowrap"
              >
                {showCopyTextBox ? '收合訊息預覽' : '檢視 LINE 訊息'}
              </button>
            </div>

            {showCopyTextBox && (
              <pre className="rounded-xl bg-[#F7F5F0] border border-[#E5E0D8] p-3.5 text-xs leading-relaxed text-[#2B2825] whitespace-pre-wrap font-sans select-all">
                {orderMessage}
              </pre>
            )}
          </section>
        </div>
      </div>

      {/* Fixed Bottom Action Bar (Mobile & Desktop) — Estimated Price + Add to Cart + LINE Order (#06C755) */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[#E5E0D8] bg-[#F7F5F0]/95 backdrop-blur-md pb-safe">
        <div className="mx-auto max-w-6xl px-3.5 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-2.5 sm:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] text-[#6E6962] truncate">
              {validation.isSoldOut
                ? '目前狀態：已售完'
                : !validation.isValid
                ? `尚缺必填：${validation.missingGroupNames.join('、')}`
                : '預估報價（待客服確認）'}
            </p>
            <p
              data-testid="pdp-sticky-price"
              className="text-base sm:text-xl font-semibold text-[#2B2825] tabular-price leading-tight"
            >
              {formatTWD(priceCalc.totalPrice)}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAddToCartClick}
              disabled={validation.isSoldOut}
              aria-disabled={!validation.isValid}
              className={`min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 sm:px-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                validation.isValid
                  ? 'border-[#2B2825] bg-white text-[#2B2825] hover:bg-[#EFECE6]'
                  : 'border-[#DCD5CA] bg-[#EFECE6] text-[#8E8880]'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>加入購物車</span>
            </button>

            {validation.isValid ? (
              <a
                data-testid="line-order-button"
                href={lineOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setLineOpenedHint(true)}
                style={{ backgroundColor: LINE_BRAND_GREEN }}
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 sm:px-5 text-xs sm:text-sm font-medium text-white transition-opacity hover:opacity-95 active:scale-[0.98] whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4" />
                <span>透過 LINE 訂購</span>
              </a>
            ) : (
              <button
                type="button"
                data-testid="line-order-button-disabled"
                onClick={scrollToMissingVariants}
                disabled={validation.isSoldOut}
                aria-disabled="true"
                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#9EC9AC] px-3.5 sm:px-5 text-xs sm:text-sm font-medium text-white cursor-not-allowed whitespace-nowrap"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{validation.isSoldOut ? '已售完' : '透過 LINE 訂購'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1C1A18]/92 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="商品圖片全螢幕放大預覽"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="w-full max-w-4xl flex items-center justify-between text-[#F7F5F0] mb-3">
            <span className="text-xs sm:text-sm tabular-price">
              {product.name} · {activeImageIndex + 1} / {galleryImages.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              aria-label="關閉全螢幕預覽"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            className="relative flex w-full max-w-3xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <SafeImage
              src={currentImage}
              alt={`${product.name} 全螢幕大圖`}
              className="max-h-[78vh] w-auto rounded-xl object-contain"
            />
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="上一張大圖"
                  className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="下一張大圖"
                  className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fabric Swatch Zoom Modal */}
      {zoomedSwatch && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2B2825]/55 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="swatch-modal-title"
          onClick={() => setZoomedSwatch(null)}
        >
          <div
            className="w-full sm:max-w-md overflow-hidden rounded-t-3xl sm:rounded-2xl bg-[#F7F5F0] border border-[#E5E0D8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-square w-full bg-[#EFECE6]">
              <SafeImage
                src={zoomedSwatch.swatch.imageUrl}
                alt={`${zoomedSwatch.swatch.name} 材質近拍`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setZoomedSwatch(null)}
                aria-label="關閉色卡放大檢視"
                className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F5F0]/90 text-[#2B2825]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-[#6E6962]">
                    色號 {zoomedSwatch.swatch.code} · {zoomedSwatch.swatch.hex}
                  </p>
                  <h3
                    id="swatch-modal-title"
                    className="font-display text-lg font-semibold text-[#2B2825]"
                  >
                    {zoomedSwatch.swatch.name}
                  </h3>
                </div>
                <span
                  className="h-9 w-9 shrink-0 rounded-lg border border-black/10"
                  style={{ backgroundColor: zoomedSwatch.swatch.hex }}
                />
              </div>

              <p className="text-sm leading-relaxed text-[#4C4742]">
                {zoomedSwatch.swatch.materialNote}
              </p>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setZoomedSwatch(null)}
                  className="flex-1 min-h-[44px] rounded-xl border border-[#DCD5CA] bg-white text-sm font-medium text-[#2B2825]"
                >
                  關閉
                </button>
                {zoomedSwatch.option.available && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetGroup = product.variantGroups.find(
                        (g) => g.id === zoomedSwatch.groupId
                      );
                      if (targetGroup) {
                        handleSelectOption(targetGroup, zoomedSwatch.option);
                      }
                      setZoomedSwatch(null);
                    }}
                    className="flex-[2] min-h-[44px] rounded-xl bg-[#2B2825] text-sm font-medium text-white"
                  >
                    套用此布料色卡
                    {zoomedSwatch.option.priceDelta > 0
                      ? ` (+${formatTWD(zoomedSwatch.option.priceDelta)})`
                      : ''}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
