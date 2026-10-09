import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  status: z.enum(['saved', 'applied', 'interviewing', 'offer', 'rejected']).optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
  nextStep: z.string().max(200).optional().or(z.literal('')),
  followUpDate: z.string().max(30).optional().or(z.literal('')),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide valid updates.' }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
    });

    if (!application || application.userId !== sessionUser.id) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status ?? application.status,
        notes: parsed.data.notes !== undefined ? parsed.data.notes || null : application.notes,
        nextStep: parsed.data.nextStep !== undefined ? parsed.data.nextStep || null : application.nextStep,
        followUpDate: parsed.data.followUpDate !== undefined ? (parsed.data.followUpDate ? new Date(parsed.data.followUpDate) : null) : application.followUpDate,
      },
    });

    return NextResponse.json({ ok: true, application: updated });
  } catch (error) {
    console.error('Application update error:', error);
    return NextResponse.json({ error: 'Application could not be updated.' }, { status: 500 });
  }
}
