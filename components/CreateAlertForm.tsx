// components/CreateAlertForm.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PriceData } from '@/lib/prices';
import type { CreateAlertInput } from '@/types';
import { formatPrice } from '@/lib/utils';

interface Props {
  prices: PriceData[];
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  PRICE_ABOVE:          '📈 Price rises above',
  PRICE_BELOW:          '📉 Price drops below',
  PERCENT_CHANGE_UP:    '🚀 % Change up ≥',
  PERCENT_CHANGE_DOWN:  '💥 % Change down ≥',
};

export default function CreateAlertForm({ prices }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<CreateAlertInput>({
    symbol: prices[0]?.symbol ?? 'BTC',
    assetType: prices[0]?.assetType ?? 'CRYPTO',
    alertType: 'PRICE_ABOVE',
    threshold: 0,
  });

  const selectedPrice = prices.find(p => p.symbol === form.symbol);
  const isPercent = form.alertType.startsWith('PERCENT');

  const handleSymbolChange = (symbol: string) => {
    const asset = prices.find(p => p.symbol === symbol);
    setForm(f => ({
      ...f,
      symbol,
      assetType: asset?.assetType ?? 'CRYPTO',
      threshold: 0,
    }));
  };

  const suggestWithAI = async () => {
    if (!selectedPrice) return;
    setAiSuggesting(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest_threshold',
          symbol: selectedPrice.symbol,
          currentPrice: selectedPrice.price,
          assetType: selectedPrice.assetType,
          change24h: selectedPrice.change24h,
        }),
      });
      const data = await res.json();
      if (data.suggestion) {
        const val = form.alertType === 'PRICE_BELOW'
          ? data.suggestion.below
          : data.suggestion.above;
        setForm(f => ({ ...f, threshold: val }));
        setSuccess(`AI suggests: ${data.suggestion.reasoning}`);
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch {}
    setAiSuggesting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Failed to create alert');

      setSuccess(`✅ Alert created for ${form.symbol}!`);
      setTimeout(() => setSuccess(''), 3000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating alert');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="font-semibold text-gray-900 mb-5">🔔 Create New Alert</h2>

      {error   && <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {success && <div className="mb-4 bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Symbol */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Asset</label>
            <select
              className="input w-full"
              value={form.symbol}
              onChange={e => handleSymbolChange(e.target.value)}
            >
              <optgroup label="🪙 Crypto">
                {prices.filter(p => p.assetType === 'CRYPTO').map(p => (
                  <option key={p.symbol} value={p.symbol}>{p.symbol} — {formatPrice(p.price)}</option>
                ))}
              </optgroup>
              <optgroup label="📈 Stocks">
                {prices.filter(p => p.assetType === 'STOCK').map(p => (
                  <option key={p.symbol} value={p.symbol}>{p.symbol} — {formatPrice(p.price)}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alert Type</label>
            <select
              className="input w-full"
              value={form.alertType}
              onChange={e => setForm(f => ({ ...f, alertType: e.target.value as CreateAlertInput['alertType'] }))}
            >
              {Object.entries(ALERT_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Threshold */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {isPercent ? 'Percentage Threshold (%)' : 'Price Threshold (USD)'}
            {selectedPrice && !isPercent && (
              <span className="ml-2 text-gray-400">Current: {formatPrice(selectedPrice.price)}</span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              className="input flex-1"
              placeholder={isPercent ? 'e.g. 5 (for 5%)' : 'e.g. 70000'}
              value={form.threshold || ''}
              onChange={e => setForm(f => ({ ...f, threshold: parseFloat(e.target.value) || 0 }))}
              min={0}
              step={isPercent ? 0.1 : 0.01}
              required
            />
            {!isPercent && (
              <button
                type="button"
                onClick={suggestWithAI}
                disabled={aiSuggesting || !selectedPrice}
                className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-2 rounded-lg hover:bg-purple-100 transition font-medium disabled:opacity-50 whitespace-nowrap"
              >
                {aiSuggesting ? '⏳' : '🤖'} AI Suggest
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || form.threshold <= 0}
          className="btn-primary w-full"
        >
          {loading ? 'Creating…' : '+ Create Alert'}
        </button>
      </form>
    </div>
  );
}
