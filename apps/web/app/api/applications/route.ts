import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const applicationSchema = z.object({
  jobId: z.string().max(120).optional().or(z.literal('')),
  jobTitle: z.string().min(1).max(200),
  company: z.string().min(1).max(200),
  location: z.string().max(120).optional().or(z.literal('')),
  status: z.enum(['saved', 'applied', 'interviewing', 'offer', 'rejected']).default('saved'),
  notes: z.string().max(2000).optional().or(z.literal('')),
  nextStep: z.string().max(200).optional().or(z.literal('')),
  followUpDate: z.string().max(30).optional().or(z.literal('')),
  source: z.string().max(120).optional().or(z.literal('')),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const applications = await prisma.application.findMany({
    where: { userId: sessionUser.id },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ applications });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = applicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide valid application details.' }, { status: 400 });
    }

    const payload = parsed.data;
    const application = await prisma.application.create({
      data: {
        userId: sessionUser.id,
        jobId: payload.jobId || null,
        jobTitle: payload.jobTitle,
        company: payload.company,
        location: payload.location || null,
        status: payload.status,
        notes: payload.notes || null,
        nextStep: payload.nextStep || null,
        followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : null,
        source: payload.source || null,
      },
    });

    return NextResponse.json({ ok: true, application }, { status: 201 });
  } catch (error) {
    console.error('Application save error:', error);
    return NextResponse.json({ error: 'Application could not be saved.' }, { status: 500 });
  }
}
