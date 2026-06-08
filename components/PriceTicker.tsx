// components/PriceTicker.tsx
'use client';
import { useEffect, useState, useRef } from 'react';
import { formatPrice, formatPercent, formatMarketCap, cn, getChangeBg } from '@/lib/utils';
import type { PriceData } from '@/lib/prices';

interface PriceTickerProps {
  initialPrices: PriceData[];
}

export default function PriceTicker({ initialPrices }: PriceTickerProps) {
  const [prices, setPrices] = useState<PriceData[]>(initialPrices);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [connected, setConnected] = useState(false);
  const prevPrices = useRef<Map<string, number>>(new Map());
  const [flashMap, setFlashMap] = useState<Map<string, 'up' | 'down'>>(new Map());

  useEffect(() => {
    const cryptoSymbols = initialPrices.filter(p => p.assetType === 'CRYPTO').map(p => p.symbol).join(',');
    const stockSymbols  = initialPrices.filter(p => p.assetType === 'STOCK').map(p => p.symbol).join(',');

    const url = `/api/prices/stream?crypto=${cryptoSymbols}&stocks=${stockSymbols}&interval=20000`;
    const es  = new EventSource(url);

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'prices') {
          const newPrices: PriceData[] = msg.prices;
          const newFlash = new Map<string, 'up' | 'down'>();

          newPrices.forEach(p => {
            const prev = prevPrices.current.get(p.symbol);
            if (prev !== undefined && prev !== p.price) {
              newFlash.set(p.symbol, p.price > prev ? 'up' : 'down');
            }
            prevPrices.current.set(p.symbol, p.price);
          });

          setPrices(newPrices);
          setFlashMap(newFlash);
          setLastUpdate(new Date());

          // Clear flash after 800ms
          setTimeout(() => setFlashMap(new Map()), 800);
        }
      } catch {}
    };

    return () => es.close();
  }, []);

  const cryptos = prices.filter(p => p.assetType === 'CRYPTO');
  const stocks  = prices.filter(p => p.assetType === 'STOCK');

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Live Market Prices</h2>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className={cn('w-2 h-2 rounded-full', connected ? 'bg-green-500 live-dot' : 'bg-red-400')} />
          {connected ? 'Live' : 'Reconnecting'}
          <span>· Updated {lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Crypto section */}
      {cryptos.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            🪙 Cryptocurrency
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cryptos.map(p => (
              <PriceCard key={p.symbol} price={p} flash={flashMap.get(p.symbol)} />
            ))}
          </div>
        </div>
      )}

      {/* Stocks section */}
      {stocks.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            📈 Stocks
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stocks.map(p => (
              <PriceCard key={p.symbol} price={p} flash={flashMap.get(p.symbol)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PriceCard({ price, flash }: { price: PriceData; flash?: 'up' | 'down' }) {
  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-xl p-4 transition-all',
        flash === 'up'   && 'flash-green',
        flash === 'down' && 'flash-red'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-gray-900 text-sm">{price.symbol}</span>
        <span className={cn(
          'text-xs font-medium px-1.5 py-0.5 rounded-full',
          getChangeBg(price.change24h)
        )}>
          {formatPercent(price.change24h)}
        </span>
      </div>
      <div className="text-lg font-bold text-gray-900">{formatPrice(price.price)}</div>
      {price.marketCap && (
        <div className="text-xs text-gray-400 mt-1">
          MCap {formatMarketCap(price.marketCap)}
        </div>
      )}
    </div>
  );
}
