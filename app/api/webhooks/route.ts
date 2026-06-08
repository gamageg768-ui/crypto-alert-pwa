// app/api/webhooks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const CreateWebhookSchema = z.object({
  name:   z.string().min(1).max(80),
  url:    z.string().url(),
  secret: z.string().optional(),
  events: z.array(z.enum(['ALERT_TRIGGERED', 'PRICE_UPDATE', 'ALL'])).min(1),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const webhooks = await prisma.webhook.findMany({
    where: { userId: session.user.id },
    include: {
      deliveries: {
        orderBy: { deliveredAt: 'desc' },
        take: 5,
        select: {
          id: true, event: true, success: true,
          statusCode: true, deliveredAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ webhooks });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = CreateWebhookSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const count = await prisma.webhook.count({ where: { userId: session.user.id } });
  if (count >= 10) return NextResponse.json({ error: 'Max 10 webhooks allowed' }, { status: 429 });

  const webhook = await prisma.webhook.create({
    data: { ...parsed.data, userId: session.user.id },
  });

  return NextResponse.json({ webhook }, { status: 201 });
}
