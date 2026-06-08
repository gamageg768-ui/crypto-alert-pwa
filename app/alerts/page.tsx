// app/alerts/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { fetchAllPrices, DEFAULT_CRYPTOS, DEFAULT_STOCKS } from '@/lib/prices';
import Navbar from '@/components/Navbar';
import CreateAlertForm from '@/components/CreateAlertForm';
import AlertList from '@/components/AlertList';
import AlertPoller from '@/components/AlertPoller';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Alerts' };
export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [prices, alerts] = await Promise.all([
    fetchAllPrices(DEFAULT_CRYPTOS, DEFAULT_STOCKS).catch(() => []),
    prisma.alert.findMany({
      where: { userId: session.user.id },
      include: {
        alertTriggerLogs: {
          orderBy: { triggeredAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AlertPoller />
      <Navbar user={session.user} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price Alerts</h1>
          <p className="text-sm text-gray-500 mt-1">
            {alerts.filter(a => a.isActive && !a.triggered).length} active ·{' '}
            {alerts.filter(a => a.triggered).length} triggered
          </p>
        </div>

        <div className="grid lg:grid-cols-[380px,1fr] gap-8 items-start">
          <CreateAlertForm prices={prices} />

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Alerts</h2>
            <AlertList alerts={alerts as Parameters<typeof AlertList>[0]['alerts']} />
          </div>
        </div>
      </main>
    </div>
  );
}
