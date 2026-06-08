// components/AIPortfolioInsight.tsx
'use client';
import { useState } from 'react';
import type { PriceData } from '@/lib/prices';

interface Props {
  prices: PriceData[];
}

export default function AIPortfolioInsight({ prices }: Props) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getInsight = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'portfolio_insight',
          assets: prices.map(p => ({
            symbol: p.symbol,
            type: p.assetType,
            price: p.price,
            change24h: p.change24h,
          })),
        }),
      });
      const data = await res.json();
      setInsight(data.insight ?? 'Analysis unavailable.');
    } catch {
      setInsight('Failed to generate insight. Check your Groq API key.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <h3 className="font-semibold text-gray-900">Groq AI Market Insight</h3>
            <p className="text-xs text-gray-500">Real-time AI analysis of your watchlist</p>
          </div>
        </div>
        <button
          onClick={getInsight}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium disabled:opacity-50"
        >
          {loading ? '⏳ Analyzing…' : '✨ Get AI Insight'}
        </button>
      </div>

      {insight && (
        <div className="mt-4 bg-white border border-purple-100 rounded-lg p-4">
          <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
          <p className="text-xs text-purple-500 mt-2">Powered by Groq · {new Date().toLocaleTimeString()}</p>
        </div>
      )}
    </div>
  );
}
