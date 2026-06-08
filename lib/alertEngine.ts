// lib/alertEngine.ts — Core alert checking logic
import { prisma } from '@/lib/db';
import { analyzeAlertTrigger } from '@/lib/groq';
import { fireUserWebhooks } from '@/lib/webhooks';
import type { PriceData } from '@/lib/prices';
import type { Alert, AlertType } from '@prisma/client';

function checkCondition(alert: Alert, price: number, change24h: number): boolean {
  switch (alert.alertType as AlertType) {
    case 'PRICE_ABOVE':
      return price >= alert.threshold;
    case 'PRICE_BELOW':
      return price <= alert.threshold;
    case 'PERCENT_CHANGE_UP':
      return change24h >= alert.threshold;
    case 'PERCENT_CHANGE_DOWN':
      return change24h <= -Math.abs(alert.threshold);
    default:
      return false;
  }
}

export async function runAlertEngine(priceData: PriceData[]): Promise<{
  triggered: number;
  errors: number;
}> {
  const priceMap = new Map<string, PriceData>(
    priceData.map(p => [`${p.symbol}:${p.assetType}`, p])
  );

  // Fetch all active, un-triggered alerts
  const activeAlerts = await prisma.alert.findMany({
    where: { isActive: true, triggered: false },
    include: { user: true },
  });

  let triggered = 0;
  let errors = 0;

  await Promise.allSettled(
    activeAlerts.map(async (alert) => {
      const key = `${alert.symbol}:${alert.assetType}`;
      const price = priceMap.get(key);
      if (!price) return;

      const conditionMet = checkCondition(alert, price.price, price.change24h);
      if (!conditionMet) return;

      try {
        // Get AI analysis from Groq
        const aiAnalysis = await analyzeAlertTrigger({
          symbol: alert.symbol,
          assetType: alert.assetType as 'CRYPTO' | 'STOCK',
          currentPrice: price.price,
          change24h: price.change24h,
          high24h: price.high24h,
          low24h: price.low24h,
          volume24h: price.volume24h,
          alertThreshold: alert.threshold,
          alertType: alert.alertType,
        });

        // Mark alert as triggered + log
        await prisma.$transaction([
          prisma.alert.update({
            where: { id: alert.id },
            data: { triggered: true, triggeredAt: new Date() },
          }),
          prisma.alertTriggerLog.create({
            data: {
              alertId: alert.id,
              priceAt: price.price,
              message: `${alert.symbol} ${alert.alertType.replace(/_/g, ' ')} @ $${price.price.toLocaleString()}`,
              aiAnalysis,
            },
          }),
          prisma.priceSnapshot.create({
            data: {
              symbol: price.symbol,
              assetType: price.assetType,
              price: price.price,
              change24h: price.change24h,
              volume24h: price.volume24h,
              marketCap: price.marketCap,
              high24h: price.high24h,
              low24h: price.low24h,
            },
          }),
        ]);

        // Fire webhooks
        await fireUserWebhooks(alert.userId, 'ALERT_TRIGGERED', {
          alertId: alert.id,
          symbol: alert.symbol,
          assetType: alert.assetType,
          alertType: alert.alertType,
          threshold: alert.threshold,
          currentPrice: price.price,
          change24h: price.change24h,
          aiAnalysis,
          triggeredAt: new Date().toISOString(),
        });

        triggered++;
      } catch (err) {
        console.error(`Alert engine error for ${alert.id}:`, err);
        errors++;
      }
    })
  );

  return { triggered, errors };
}
