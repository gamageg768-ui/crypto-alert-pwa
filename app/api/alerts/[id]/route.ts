// app/api/alerts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const alert = await prisma.alert.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.alert.update({
    where: { id: params.id },
    data: {
      isActive: body.isActive !== undefined ? body.isActive : alert.isActive,
      // Re-activate: reset triggered flag
      triggered: body.isActive === true ? false : alert.triggered,
      triggeredAt: body.isActive === true ? null : alert.triggeredAt,
    },
  });

  return NextResponse.json({ alert: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const alert = await prisma.alert.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.alert.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
