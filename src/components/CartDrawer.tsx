import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Info,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  type CartItem,
  type LineIntegrationConfig,
} from '../types/store';
import {
  buildLineOaMessageUrl,
  LINE_BRAND_GREEN,
  normalizeLineAccountId,
} from '../services/lineIntegration';
import { formatCartLineOrderMessage, formatTWD } from '../utils/pricing';
import { SafeImage } from './SafeImage';

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  brandName: string;
  lineConfig: LineIntegrationConfig;
  onClose: () => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onSelectProduct: (productId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  items,
  brandName,
  lineConfig,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onSelectProduct,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lineOpenedNotice, setLineOpenedNotice] = useState(false);

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const estimatedTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.unitEstimatedPrice * item.quantity,
        0
      ),
    [items]
  );

  const cartOrderMessage = useMemo(
    () => formatCartLineOrderMessage(items, undefined, brandName),
    [items, brandName]
  );

  const lineCartOrderUrl = useMemo(
    () => buildLineOaMessageUrl(lineConfig.officialAccountId, cartOrderMessage),
    [lineConfig.officialAccountId, cartOrderMessage]
  );

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(cartOrderMessage);
      } else {
        const temp = document.createElement('textarea');
        temp.value = cartOrderMessage;
        temp.setAttribute('readonly', '');
        temp.style.position = 'fixed';
        temp.style.opacity = '0';
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      setShowPreview(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#2B2825]/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-[#F7F5F0] border-l border-[#E5E0D8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-[#E5E0D8] bg-white px-5 py-4">
          <div>
            <h2
              id="cart-drawer-title"
              className="font-display text-lg font-semibold text-[#2B2825]"
            >
              購物車（{totalQuantity}）
            </h2>
            <p className="text-[11px] text-[#6E6962]">
              透過 LINE 官方帳號 {normalizeLineAccountId(lineConfig.officialAccountId)} 確認訂購
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉購物車"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#6E6962] hover:bg-[#EFECE6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cart Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-[#E5E0D8] bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EFECE6] text-[#6E6962]">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <p className="mt-4 font-display text-base font-medium text-[#2B2825]">
                購物車目前是空的
              </p>
              <p className="mt-1.5 text-xs text-[#6E6962] leading-relaxed">
                在商品頁完成所有必填規格後，可加入購物車合併多件商品，或直接透過 LINE 傳送訂購資訊。
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-5 min-h-[42px] rounded-xl bg-[#2B2825] px-5 text-xs font-medium text-white"
              >
                繼續逛逛娃衣
              </button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <article
                  key={item.cartItemId}
                  className="rounded-2xl border border-[#E5E0D8] bg-white p-3.5 space-y-3"
                >
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectProduct(item.productId);
                      }}
                      className="h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-[#E5E0D8] bg-[#EFECE6]"
                    >
                      <SafeImage
                        src={item.thumbnail}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] text-[#6E6962]">
                            {item.productCode} · {CATEGORY_LABELS[item.categoryId]}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectProduct(item.productId);
                            }}
                            className="mt-0.5 text-left text-sm font-medium text-[#2B2825] line-clamp-2 hover:text-[#5F6F61]"
                          >
                            {item.productName}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.cartItemId)}
                          aria-label={`從購物車移除 ${item.productName}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8E8880] hover:bg-[#EFECE6] hover:text-[#A6726A]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-1.5 space-y-0.5 text-[11px] text-[#6E6962]">
                        {item.specs.map((spec) => (
                          <p key={`${spec.groupId}-${spec.optionId}`}>
                            {spec.groupName}：{spec.optionLabel}
                            {spec.swatchCode ? ` (${spec.swatchCode})` : ''}
                            {spec.priceDelta > 0 ? ` +${formatTWD(spec.priceDelta)}` : ''}
                          </p>
                        ))}
                        {item.customNote && (
                          <p className="text-[#4C4742]">備註：{item.customNote}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#EFECE6] pt-2.5">
                    <div className="inline-flex items-center rounded-lg border border-[#E5E0D8] bg-[#F7F5F0]">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                        aria-label={`減少 ${item.productName} 數量`}
                        className="flex h-8 w-8 items-center justify-center text-[#2B2825] hover:bg-[#EFECE6] rounded-l-lg"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-[28px] text-center text-xs font-medium text-[#2B2825] tabular-price">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                        aria-label={`增加 ${item.productName} 數量`}
                        className="flex h-8 w-8 items-center justify-center text-[#2B2825] hover:bg-[#EFECE6] rounded-r-lg"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] text-[#6E6962]">預估小計</p>
                      <p className="text-sm font-semibold text-[#2B2825] tabular-price">
                        {formatTWD(item.unitEstimatedPrice * item.quantity)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}

              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowPreview((p) => !p)}
                  className="text-xs text-[#5F6F61] hover:underline"
                >
                  {showPreview ? '收合 LINE 訂購訊息預覽' : '檢視 LINE 訂購訊息內容'}
                </button>
                <button
                  type="button"
                  onClick={onClearCart}
                  className="text-xs text-[#8E8880] hover:text-[#A6726A]"
                >
                  清空購物車
                </button>
              </div>

              {showPreview && (
                <pre className="rounded-xl border border-[#E5E0D8] bg-white p-3.5 text-[11px] leading-relaxed text-[#2B2825] whitespace-pre-wrap font-sans select-all">
                  {cartOrderMessage}
                </pre>
              )}
            </>
          )}
        </div>

        {/* Sticky Cart Footer */}
        {items.length > 0 && (
          <div className="border-t border-[#E5E0D8] bg-white p-4 sm:p-5 pb-safe space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="text-xs font-medium text-[#2B2825]">預估總報價</p>
                <p className="text-[11px] text-[#6E6962]">正式金額待 LINE 客服最終確認</p>
              </div>
              <p
                data-testid="cart-estimated-total"
                className="text-xl font-semibold text-[#2B2825] tabular-price"
              >
                {formatTWD(estimatedTotal)}
              </p>
            </div>

            {lineOpenedNotice && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-xl bg-[#F7F5F0] border border-[#E5E0D8] p-3 text-[11px] leading-relaxed text-[#4C4742]"
              >
                <Info className="h-4 w-4 shrink-0 text-[#5F6F61] mt-0.5" />
                <span>
                  已開啟 LINE 官方帳號聊天室，請自行確認訊息內容並點擊傳送。開啟聊天室不代表訂單已成立，待客服回覆確認後方為正式訂單。
                </span>
              </div>
            )}

            <div className="space-y-2">
              <a
                href={lineCartOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setLineOpenedNotice(true)}
                style={{ backgroundColor: LINE_BRAND_GREEN }}
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium text-white transition-opacity hover:opacity-95 active:scale-[0.99]"
              >
                <MessageCircle className="h-4 w-4" />
                <span>透過 LINE 訂購（共 {totalQuantity} 件）</span>
              </a>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#DCD5CA] bg-[#F7F5F0] px-4 text-xs font-medium text-[#2B2825] hover:border-[#2B2825]"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#5F6F61]" />
                    <span>已複製整筆訂購資訊，可手動貼上 LINE</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>複製訂購資訊（無法開啟 LINE 時備用）</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-center text-[#6E6962]">
              ※ 所有價格均為預估報價，正式訂單仍需由客服確認
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
