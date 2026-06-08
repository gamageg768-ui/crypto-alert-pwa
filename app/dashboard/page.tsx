// app/dashboard/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { fetchAllPrices, DEFAULT_CRYPTOS, DEFAULT_STOCKS } from '@/lib/prices';
import Navbar from '@/components/Navbar';
import PriceTicker from '@/components/PriceTicker';
import StatsCards from '@/components/StatsCards';
import AIPortfolioInsight from '@/components/AIPortfolioInsight';
import PriceChart from '@/components/PriceChart';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [prices, stats, recentLogs] = await Promise.all([
    fetchAllPrices(DEFAULT_CRYPTOS.slice(0, 8), DEFAULT_STOCKS.slice(0, 4)).catch(() => []),
    prisma.$transaction([
      prisma.alert.count({ where: { userId: session.user.id } }),
      prisma.alert.count({ where: { userId: session.user.id, isActive: true, triggered: false } }),
      prisma.alert.count({
        where: {
          userId: session.user.id,
          triggered: true,
          triggeredAt: { gte: new Date(Date.now() - 86400_000) },
        },
      }),
      prisma.webhook.count({ where: { userId: session.user.id, isActive: true } }),
    ]),
    prisma.alertTriggerLog.findMany({
      where: { alert: { userId: session.user.id } },
      include: { alert: { select: { symbol: true, alertType: true, assetType: true } } },
      orderBy: { triggeredAt: 'desc' },
      take: 5,
    }),
  ]);

  const [totalAlerts, activeAlerts, triggeredToday, webhooksActive] = stats;

  const btc = prices.find(p => p.symbol === 'BTC');
  const eth = prices.find(p => p.symbol === 'ETH');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session.user.name?.split(' ')[0] ?? 'Trader'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time market overview · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Stats */}
        <StatsCards
          totalAlerts={totalAlerts}
          activeAlerts={activeAlerts}
          triggeredToday={triggeredToday}
          webhooksActive={webhooksActive}
        />

        {/* AI Insight */}
        {prices.length > 0 && (
          <AIPortfolioInsight prices={prices.slice(0, 8)} />
        )}

        {/* Charts row */}
        {(btc || eth) && (
          <div className="grid md:grid-cols-2 gap-5">
            {btc && <PriceChart symbol="BTC" currentPrice={btc.price} />}
            {eth && <PriceChart symbol="ETH" currentPrice={eth.price} />}
          </div>
        )}

        {/* Live price ticker */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <PriceTicker initialPrices={prices} />
        </div>

        {/* Recent Alert Triggers */}
        {recentLogs.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">⚡ Recent Alert Triggers</h2>
            <div className="space-y-3">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{log.alert.symbol}</span>
                      <span className="text-xs text-gray-500">{log.alert.alertType.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-gray-400">
                        @ ${ log.priceAt.toLocaleString()}
                      </span>
                    </div>
                    {log.aiAnalysis && (
                      <p className="text-xs text-purple-700 mt-1 line-clamp-2">
                        🤖 {log.aiAnalysis}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(log.triggeredAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
