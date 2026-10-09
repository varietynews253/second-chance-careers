import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const updateSchema = z.object({
  status: z.enum(['saved', 'applied', 'interviewing', 'offer', 'rejected']).optional(),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (sessionUser.role !== 'employer') {
    return NextResponse.json({ error: 'Employer access required.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide valid updates.' }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: { job: true },
    });

    if (!application || application.job?.userId !== sessionUser.id) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    const updated = await prisma.application.update({
      where: { id: params.id },
      data: {
        status: parsed.data.status ?? application.status,
        notes: parsed.data.notes !== undefined ? parsed.data.notes || null : application.notes,
      },
    });

    return NextResponse.json({ ok: true, application: updated });
  } catch (error) {
    console.error('Applicant update error:', error);
    return NextResponse.json({ error: 'Application could not be updated.' }, { status: 500 });
  }
}
