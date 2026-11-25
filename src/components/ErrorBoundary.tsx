import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || '發生未預期的應用程式錯誤',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] px-4 text-[#2B2825]">
          <div className="w-full max-w-md rounded-2xl border border-[#E5E0D8] bg-white p-6 text-center space-y-4">
            <h1 className="font-display text-xl font-semibold">資料連線暫時發生異常</h1>
            <p className="text-xs leading-relaxed text-[#6E6962]">
              無法完成目前的雲端資料請求，請重新整理頁面，或確認管理員登入狀態與網路連線。
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[44px] w-full rounded-xl bg-[#2B2825] text-sm font-medium text-white hover:bg-[#3F3B37]"
            >
              重新整理頁面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
