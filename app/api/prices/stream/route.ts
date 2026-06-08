// app/api/prices/stream/route.ts — Server-Sent Events for real-time prices
import { NextRequest } from 'next/server';
import { fetchCryptoPrices, fetchStockPrices, DEFAULT_CRYPTOS, DEFAULT_STOCKS } from '@/lib/prices';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cryptoSymbols = searchParams.get('crypto')?.split(',').filter(Boolean) ?? DEFAULT_CRYPTOS.slice(0, 6);
  const stockSymbols  = searchParams.get('stocks')?.split(',').filter(Boolean) ?? DEFAULT_STOCKS.slice(0, 4);
  const interval      = Math.max(15000, parseInt(searchParams.get('interval') ?? '15000'));

  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {}
      };

      // Initial fetch
      const fetchAndSend = async () => {
        if (isClosed) return;
        try {
          const [crypto, stocks] = await Promise.allSettled([
            fetchCryptoPrices(cryptoSymbols),
            fetchStockPrices(stockSymbols),
          ]);

          const prices = [
            ...(crypto.status === 'fulfilled' ? crypto.value : []),
            ...(stocks.status === 'fulfilled' ? stocks.value : []),
          ];

          send({ type: 'prices', prices, timestamp: new Date().toISOString() });
        } catch {
          send({ type: 'error', message: 'Price fetch failed' });
        }
      };

      await fetchAndSend();

      const timer = setInterval(fetchAndSend, interval);

      // Cleanup when client disconnects
      req.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(timer);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
