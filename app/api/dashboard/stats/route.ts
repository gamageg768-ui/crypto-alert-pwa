// app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [total, active, triggered24h, webhooks, recentLogs] = await prisma.$transaction([
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
    prisma.alertTriggerLog.findMany({
      where: { alert: { userId: session.user.id } },
      include: { alert: { select: { symbol: true, alertType: true } } },
      orderBy: { triggeredAt: 'desc' },
      take: 10,
    }),
  ]);

  return NextResponse.json({ total, active, triggered24h, webhooks, recentLogs });
}
