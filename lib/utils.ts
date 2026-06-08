// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, decimals = 2): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(decimals)}`;
  return `$${price.toFixed(6)}`;
}

export function formatPercent(val: number): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

export function formatMarketCap(val?: number): string {
  if (!val) return 'N/A';
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9)  return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6)  return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toLocaleString()}`;
}

export function formatVolume(val?: number): string {
  return formatMarketCap(val);
}

export function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function getAssetColor(assetType: string): string {
  return assetType === 'CRYPTO' ? 'text-orange-600' : 'text-blue-600';
}

export function getAssetBadgeClass(assetType: string): string {
  return assetType === 'CRYPTO'
    ? 'bg-orange-100 text-orange-700 border border-orange-200'
    : 'bg-blue-100 text-blue-700 border border-blue-200';
}

export function getChangeClass(change: number): string {
  if (change > 0) return 'text-green-600';
  if (change < 0) return 'text-red-500';
  return 'text-gray-500';
}

export function getChangeBg(change: number): string {
  if (change > 0) return 'bg-green-50 text-green-700';
  if (change < 0) return 'bg-red-50 text-red-600';
  return 'bg-gray-50 text-gray-600';
}
