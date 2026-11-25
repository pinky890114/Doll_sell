import React, { useState } from 'react';
import { Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'card' ? (
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex items-center justify-between gap-4 rounded-xl border border-[#E5E0D8] bg-white px-4 py-3.5 text-left transition-colors hover:border-[#2B2825] min-h-[48px]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFECE6] text-[#2B2825]">
              <Smartphone className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#2B2825]">加入手機主畫面（PWA）</p>
              <p className="text-xs text-[#6E6962] truncate">像原生購物 App 一樣快速開啟瀏覽與收藏</p>
            </div>
          </div>
          <span className="shrink-0 whitespace-nowrap text-xs font-medium text-[#5F6F61]">
            {isInstallable ? '立即安裝' : '安裝方式'}
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCD5CA] bg-white px-3 py-2 text-xs font-medium text-[#2B2825] transition-colors hover:border-[#2B2825] whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <Download className="h-3.5 w-3.5" />
          <span>加入主畫面</span>
        </button>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#2B2825]/45 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-[#F7F5F0] border border-[#E5E0D8] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="pwa-guide-title" className="font-display text-lg font-semibold text-[#2B2825]">
                  將 YourTreasure娃衣代理 加入主畫面
                </h3>
                <p className="mt-1 text-xs text-[#6E6962]">
                  安裝後可全螢幕瀏覽，體驗更貼近手機購物 App
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="關閉安裝說明"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[#6E6962] hover:bg-[#EFECE6]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm text-[#2B2825]">
              {isIOS ? (
                <>
                  <div className="rounded-xl bg-white border border-[#E5E0D8] p-3.5">
                    <p className="font-medium flex items-center gap-1.5">
                      <Share className="h-4 w-4 text-[#5F6F61]" />
                      1. 點擊 Safari 下方的「分享」按鈕
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-[#E5E0D8] p-3.5">
                    <p className="font-medium">2. 向下滑動並選擇「加入主畫面」</p>
                  </div>
                  <div className="rounded-xl bg-white border border-[#E5E0D8] p-3.5">
                    <p className="font-medium">3. 點擊右上角「新增」即可完成</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-white border border-[#E5E0D8] p-3.5">
                    <p className="font-medium">iPhone / iPad（Safari）</p>
                    <p className="mt-1 text-xs text-[#6E6962]">
                      點擊下方分享圖示，選擇「加入主畫面」即可建立圖示。
                    </p>
                  </div>
                  <div className="rounded-xl bg-white border border-[#E5E0D8] p-3.5">
                    <p className="font-medium">Android / Chrome 瀏覽器</p>
                    <p className="mt-1 text-xs text-[#6E6962]">
                      點擊瀏覽器右上角選單，選擇「安裝應用程式」或「加到主畫面」。
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-[#2B2825] text-sm font-medium text-white transition-colors hover:bg-[#3F3B37]"
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-50 flex items-center gap-2 rounded-xl bg-[#2B2825] px-4 py-2.5 text-xs font-medium text-[#F7F5F0]"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-[#D6CCB9]" />
      <span>目前為離線模式，正顯示已快取的商品資料</span>
    </div>
  );
};
