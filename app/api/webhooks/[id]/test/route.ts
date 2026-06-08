// app/api/webhooks/[id]/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deliverWebhook } from '@/lib/webhooks';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const wh = await prisma.webhook.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!wh) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const success = await deliverWebhook(params.id, 'ALERT_TRIGGERED', {
    test: true,
    message: 'This is a test webhook delivery from CryptoAlertPWA',
    symbol: 'BTC',
    currentPrice: 65000,
    alertType: 'PRICE_ABOVE',
    threshold: 64000,
    triggeredAt: new Date().toISOString(),
  });

  return NextResponse.json({ success, message: success ? 'Test delivered!' : 'Test failed — check URL.' });
}
