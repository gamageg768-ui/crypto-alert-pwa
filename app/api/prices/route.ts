// app/api/prices/route.ts — Real-time price endpoint
import { NextRequest, NextResponse } from 'next/server';
import { fetchCryptoPrices, fetchStockPrices, DEFAULT_CRYPTOS, DEFAULT_STOCKS } from '@/lib/prices';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cryptos = searchParams.get('crypto')?.split(',').filter(Boolean) ?? DEFAULT_CRYPTOS;
  const stocks  = searchParams.get('stocks')?.split(',').filter(Boolean) ?? DEFAULT_STOCKS;

  try {
    const [cryptoData, stockData] = await Promise.allSettled([
      fetchCryptoPrices(cryptos),
      fetchStockPrices(stocks),
    ]);

    const prices = [
      ...(cryptoData.status === 'fulfilled' ? cryptoData.value : []),
      ...(stockData.status === 'fulfilled' ? stockData.value : []),
    ];

    return NextResponse.json({ prices, fetchedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Price fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}
