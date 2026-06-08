'use server';
import { auth } from '@/lib/auth';
import { fetchAllPrices } from '@/lib/prices';
import { runAlertEngine } from '@/lib/alertEngine';
import { prisma } from '@/lib/db';

export async function checkAlerts() {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const activeAlerts = await prisma.alert.findMany({
    where: { isActive: true, triggered: false },
    select: { symbol: true, assetType: true },
    distinct: ['symbol', 'assetType'],
  });

  if (activeAlerts.length === 0) return { triggered: 0, errors: 0 };

  const cryptoSymbols = activeAlerts.filter(a => a.assetType === 'CRYPTO').map(a => a.symbol);
  const stockSymbols  = activeAlerts.filter(a => a.assetType === 'STOCK').map(a => a.symbol);

  const prices = await fetchAllPrices(cryptoSymbols, stockSymbols);
  return runAlertEngine(prices);
}
