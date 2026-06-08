// types/index.ts
export type AssetType = 'CRYPTO' | 'STOCK';
export type AlertType = 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PERCENT_CHANGE_UP' | 'PERCENT_CHANGE_DOWN';
export type WebhookEvent = 'ALERT_TRIGGERED' | 'PRICE_UPDATE' | 'ALL';

export interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  marketCap?: number;
  assetType: AssetType;
  timestamp: Date;
}

export interface AlertWithLogs {
  id: string;
  symbol: string;
  assetType: AssetType;
  alertType: AlertType;
  threshold: number;
  isActive: boolean;
  triggered: boolean;
  triggeredAt: Date | null;
  createdAt: Date;
  alertTriggerLogs: {
    id: string;
    triggeredAt: Date;
    priceAt: number;
    message: string | null;
    aiAnalysis: string | null;
  }[];
}

export interface WebhookWithDeliveries {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  isActive: boolean;
  lastFired: Date | null;
  failCount: number;
  createdAt: Date;
  deliveries: {
    id: string;
    event: string;
    success: boolean;
    statusCode: number | null;
    deliveredAt: Date;
  }[];
}

export interface DashboardStats {
  totalAlerts: number;
  activeAlerts: number;
  triggeredToday: number;
  webhooksActive: number;
}

export interface CreateAlertInput {
  symbol: string;
  assetType: AssetType;
  alertType: AlertType;
  threshold: number;
}

export interface CreateWebhookInput {
  name: string;
  url: string;
  secret?: string;
  events: WebhookEvent[];
}
