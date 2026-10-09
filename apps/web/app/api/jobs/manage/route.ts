import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const jobSchema = z.object({
  title: z.string().min(2).max(140),
  company: z.string().min(2).max(140),
  location: z.string().max(120).optional().or(z.literal('')),
  remote: z.boolean().default(false),
  description: z.string().min(20).max(3000),
  requirements: z.array(z.string().min(1).max(80)).max(12).default([]),
  salaryRange: z.string().max(80).optional().or(z.literal('')),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (sessionUser.role !== 'employer') {
    return NextResponse.json({ error: 'Employer access required.' }, { status: 403 });
  }

  const jobs = await prisma.jobListing.findMany({
    where: { userId: sessionUser.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
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
    const parsed = jobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide valid job details.' }, { status: 400 });
    }

    const payload = parsed.data;
    const job = await prisma.jobListing.upsert({
      where: {
        title_company: {
          title: payload.title,
          company: payload.company,
        },
      },
      update: {
        userId: sessionUser.id,
        location: payload.location || null,
        remote: payload.remote,
        description: payload.description,
        requirements: payload.requirements.map((item) => item.trim()).filter(Boolean),
        salaryRange: payload.salaryRange || null,
      },
      create: {
        userId: sessionUser.id,
        title: payload.title,
        company: payload.company,
        location: payload.location || null,
        remote: payload.remote,
        description: payload.description,
        requirements: payload.requirements.map((item) => item.trim()).filter(Boolean),
        salaryRange: payload.salaryRange || null,
      },
    });

    return NextResponse.json({ ok: true, job }, { status: 201 });
  } catch (error) {
    console.error('Job posting error:', error);
    return NextResponse.json({ error: 'Job could not be posted.' }, { status: 500 });
  }
}
