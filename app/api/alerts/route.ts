// app/api/alerts/route.ts — CRUD for alerts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const CreateAlertSchema = z.object({
  symbol:    z.string().min(1).max(20).toUpperCase(),
  assetType: z.enum(['CRYPTO', 'STOCK']),
  alertType: z.enum(['PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_CHANGE_UP', 'PERCENT_CHANGE_DOWN']),
  threshold: z.number().positive(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const alerts = await prisma.alert.findMany({
    where: { userId: session.user.id },
    include: {
      alertTriggerLogs: {
        orderBy: { triggeredAt: 'desc' },
        take: 3,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ alerts });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = CreateAlertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Limit: 50 active alerts per user
  const count = await prisma.alert.count({
    where: { userId: session.user.id, isActive: true },
  });
  if (count >= 50) {
    return NextResponse.json({ error: 'Max 50 active alerts allowed' }, { status: 429 });
  }

  const alert = await prisma.alert.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json({ alert }, { status: 201 });
}
