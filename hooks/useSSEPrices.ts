// hooks/useSSEPrices.ts
'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import type { PriceData } from '@/lib/prices';

interface SSEState {
  prices: PriceData[];
  connected: boolean;
  lastUpdate: Date | null;
  error: string | null;
}

export function useSSEPrices(
  initialPrices: PriceData[],
  interval = 20000
): SSEState & { reconnect: () => void } {
  const [state, setState] = useState<SSEState>({
    prices: initialPrices,
    connected: false,
    lastUpdate: null,
    error: null,
  });

  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);

  const connect = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
    }

    const cryptos = initialPrices
      .filter(p => p.assetType === 'CRYPTO')
      .map(p => p.symbol)
      .join(',');
    const stocks = initialPrices
      .filter(p => p.assetType === 'STOCK')
      .map(p => p.symbol)
      .join(',');

    const url = `/api/prices/stream?crypto=${cryptos}&stocks=${stocks}&interval=${interval}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      retryCount.current = 0;
      setState(s => ({ ...s, connected: true, error: null }));
    };

    es.onerror = () => {
      setState(s => ({ ...s, connected: false }));
      es.close();
      // Exponential back-off: 2s, 4s, 8s … max 30s
      const delay = Math.min(2000 * Math.pow(2, retryCount.current), 30_000);
      retryCount.current += 1;
      retryRef.current = setTimeout(connect, delay);
    };

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'prices' && Array.isArray(msg.prices)) {
          setState(s => ({
            ...s,
            prices: msg.prices,
            lastUpdate: new Date(msg.timestamp),
            connected: true,
          }));
        }
      } catch {
        // ignore parse errors
      }
    };
  }, [initialPrices, interval]);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [connect]);

  return { ...state, reconnect: connect };
}
