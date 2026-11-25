import type { LineIntegrationConfig } from '../types/store';

export const LINE_BRAND_GREEN = '#06C755';

/**
 * Normalizes a LINE Official Account ID so it always starts with "@".
 */
export function normalizeLineAccountId(rawId: string): string {
  const trimmed = rawId.trim();
  if (!trimmed) return '@182oocrl';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

/**
 * Builds the official LINE OA pre-filled message URL Scheme using encodeURIComponent
 * for both the LINE Official Account ID and the message payload.
 * Format: https://line.me/R/oaMessage/{encodedLineId}/?{encodedMessage}
 */
export function buildLineOaMessageUrl(
  lineAccountId: string,
  message: string
): string {
  const normalizedId = normalizeLineAccountId(lineAccountId);
  const encodedId = encodeURIComponent(normalizedId);
  const encodedMessage = encodeURIComponent(message);
  return `https://line.me/R/oaMessage/${encodedId}/?${encodedMessage}`;
}

/**
 * Builds a LINE Official Account customer service inquiry URL.
 */
export function buildLineCustomerServiceUrl(
  config: LineIntegrationConfig,
  customMessage?: string
): string {
  const message =
    customMessage?.trim() ||
    config.customerServiceGreeting?.trim() ||
    '您好，我想詢問 天冷穿件衣 的商品資訊，謝謝！';
  return buildLineOaMessageUrl(config.officialAccountId, message);
}

/* --------------------------------------------------------------------------
 * Modular Extension Points for Future Production Integrations
 * (LIFF SDK, LINE Login, Messaging API, Order Database)
 * No forced login or API keys are required in the current storefront.
 * -------------------------------------------------------------------------- */

export interface LineLiffUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

export interface LiffAdapter {
  readonly isConfigured: boolean;
  init(liffId?: string): Promise<boolean>;
  isInClient(): boolean;
  getProfileIfLoggedIn(): Promise<LineLiffUserProfile | null>;
  sendOrderViaLiff(message: string): Promise<'sent' | 'fallback_url_scheme'>;
}

export interface OrderDraftPayload {
  channel: 'line_oa_url_scheme' | 'liff' | 'messaging_api';
  estimatedTotalTWD: number;
  messageBody: string;
  createdAt: string;
  lineUserId?: string;
}

export interface OrderDatabaseAdapter {
  saveOrderDraft(payload: OrderDraftPayload): Promise<{ draftId: string; persisted: boolean }>;
}

/**
 * Default client-side adapter.
 * Uses LINE Official Account URL Scheme without requiring LIFF ID, LINE Login, or Messaging API secrets.
 */
export const lineIntegrationClient: {
  liff: LiffAdapter;
  orderDb: OrderDatabaseAdapter;
} = {
  liff: {
    isConfigured: false,
    async init() {
      return false;
    },
    isInClient() {
      if (typeof navigator === 'undefined') return false;
      return /Line\//i.test(navigator.userAgent);
    },
    async getProfileIfLoggedIn() {
      return null;
    },
    async sendOrderViaLiff() {
      return 'fallback_url_scheme';
    },
  },
  orderDb: {
    async saveOrderDraft() {
      return {
        draftId: `draft-${Date.now()}`,
        persisted: false,
      };
    },
  },
};
