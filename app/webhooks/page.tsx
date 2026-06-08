// app/webhooks/page.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import Navbar from '@/components/Navbar';
import WebhookManager from '@/components/WebhookManager';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Webhooks' };
export const dynamic = 'force-dynamic';

export default async function WebhooksPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const webhooks = await prisma.webhook.findMany({
    where: { userId: session.user.id },
    include: {
      deliveries: {
        orderBy: { deliveredAt: 'desc' },
        take: 5,
        select: {
          id: true,
          event: true,
          success: true,
          statusCode: true,
          deliveredAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={session.user} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-sm text-gray-500 mt-1">
            Deliver signed notifications to any endpoint when alerts trigger.
          </p>
        </div>
        <WebhookManager webhooks={webhooks as Parameters<typeof WebhookManager>[0]['webhooks']} />
      </main>
    </div>
  );
}
