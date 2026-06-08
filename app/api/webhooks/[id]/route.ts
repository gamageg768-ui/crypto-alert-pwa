// app/api/webhooks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deliverWebhook } from '@/lib/webhooks';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const wh = await prisma.webhook.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!wh) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.webhook.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const wh = await prisma.webhook.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!wh) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.webhook.update({
    where: { id: params.id },
    data: { isActive: body.isActive ?? wh.isActive, failCount: body.resetFails ? 0 : wh.failCount },
  });

  return NextResponse.json({ webhook: updated });
}
