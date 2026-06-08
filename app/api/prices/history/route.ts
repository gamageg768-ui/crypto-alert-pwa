// app/api/prices/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol    = searchParams.get('symbol')?.toUpperCase();
  const assetType = searchParams.get('type') as 'CRYPTO' | 'STOCK' | null;
  const hours     = Math.min(parseInt(searchParams.get('hours') ?? '24'), 168); // max 7 days

  if (!symbol || !assetType) {
    return NextResponse.json({ error: 'symbol and type required' }, { status: 400 });
  }

  const since = new Date(Date.now() - hours * 3600_000);

  const snapshots = await prisma.priceSnapshot.findMany({
    where: {
      symbol,
      assetType,
      timestamp: { gte: since },
    },
    orderBy: { timestamp: 'asc' },
    select: { price: true, timestamp: true, change24h: true },
  });

  return NextResponse.json({
    symbol,
    assetType,
    hours,
    data: snapshots.map(s => ({
      price: s.price,
      change24h: s.change24h,
      t: s.timestamp.toISOString(),
    })),
  });
}
