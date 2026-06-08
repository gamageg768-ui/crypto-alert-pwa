// app/api/cron/check-alerts/route.ts — Called by Vercel Cron or external scheduler
import { NextRequest, NextResponse } from 'next/server';
import { fetchAllPrices } from '@/lib/prices';
import { runAlertEngine } from '@/lib/alertEngine';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Get all unique symbols with active alerts
    const activeAlerts = await prisma.alert.findMany({
      where: { isActive: true, triggered: false },
      select: { symbol: true, assetType: true },
      distinct: ['symbol', 'assetType'],
    });

    const cryptoSymbols = activeAlerts
      .filter(a => a.assetType === 'CRYPTO')
      .map(a => a.symbol);
    const stockSymbols = activeAlerts
      .filter(a => a.assetType === 'STOCK')
      .map(a => a.symbol);

    if (cryptoSymbols.length === 0 && stockSymbols.length === 0) {
      return NextResponse.json({ message: 'No active alerts', duration: Date.now() - startTime });
    }

    const prices = await fetchAllPrices(cryptoSymbols, stockSymbols);

    // Save price snapshots for history
    if (prices.length > 0) {
      await prisma.priceSnapshot.createMany({
        data: prices.map(p => ({
          symbol: p.symbol,
          assetType: p.assetType,
          price: p.price,
          change24h: p.change24h,
          volume24h: p.volume24h,
          marketCap: p.marketCap,
          high24h: p.high24h,
          low24h: p.low24h,
        })),
      });
    }

    const result = await runAlertEngine(prices);

    return NextResponse.json({
      success: true,
      pricesFetched: prices.length,
      alertsChecked: activeAlerts.length,
      alertsTriggered: result.triggered,
      errors: result.errors,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Cron failed', details: String(error) }, { status: 500 });
  }
}
