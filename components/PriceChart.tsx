// components/PriceChart.tsx
'use client';
import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { formatPrice } from '@/lib/utils';

interface ChartPoint {
  time: string;
  price: number;
}

interface Props {
  symbol: string;
  currentPrice: number;
  alertThreshold?: number;
}

export default function PriceChart({ symbol, currentPrice, alertThreshold }: Props) {
  const [data, setData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    // Seed with simulated history (replace with real DB query in production)
    const now = Date.now();
    const points: ChartPoint[] = Array.from({ length: 24 }, (_, i) => {
      const noise = (Math.random() - 0.5) * currentPrice * 0.03;
      return {
        time: new Date(now - (23 - i) * 3600_000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        price: +(currentPrice + noise).toFixed(2),
      };
    });
    points[23].price = currentPrice; // pin last to current
    setData(points);
  }, [currentPrice]);

  const min = Math.min(...data.map(d => d.price));
  const max = Math.max(...data.map(d => d.price));
  const isUp = data.length > 1 && data[data.length - 1].price >= data[0].price;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="font-bold text-gray-900">{symbol}</span>
          <span className="text-sm text-gray-400 ml-2">24h</span>
        </div>
        <span className="text-lg font-bold text-gray-900">{formatPrice(currentPrice)}</span>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            interval={5}
          />
          <YAxis
            domain={[min * 0.999, max * 1.001]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={v => `$${(v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0))}`}
            width={50}
          />
          <Tooltip
            formatter={(v: number) => [formatPrice(v), 'Price']}
            contentStyle={{
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: '8px', fontSize: '12px',
            }}
          />
          {alertThreshold && (
            <ReferenceLine
              y={alertThreshold}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{ value: 'Alert', position: 'right', fontSize: 10, fill: '#f59e0b' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="price"
            stroke={isUp ? '#22c55e' : '#ef4444'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: isUp ? '#22c55e' : '#ef4444' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
