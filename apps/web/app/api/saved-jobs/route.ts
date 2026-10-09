import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const savedJobSchema = z.object({
  jobId: z.string().min(1).max(120),
  action: z.enum(['toggle', 'remove']).default('toggle'),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const savedJobs = await prisma.savedJob.findMany({
    where: { userId: sessionUser.id },
    include: { job: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    savedJobs: savedJobs.map((savedJob) => ({
      id: savedJob.id,
      jobId: savedJob.jobId,
      createdAt: savedJob.createdAt,
      title: savedJob.job.title,
      company: savedJob.job.company,
      location: savedJob.job.location,
      salaryRange: savedJob.job.salaryRange,
      description: savedJob.job.description,
      remote: savedJob.job.remote,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = savedJobSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide a valid job.' }, { status: 400 });
    }

    const { jobId, action } = parsed.data;
    const existing = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: sessionUser.id,
          jobId,
        },
      },
    });

    if (action === 'remove' || existing) {
      await prisma.savedJob.deleteMany({
        where: {
          userId: sessionUser.id,
          jobId,
        },
      });

      return NextResponse.json({ saved: false });
    }

    const savedJob = await prisma.savedJob.create({
      data: {
        userId: sessionUser.id,
        jobId,
      },
    });

    return NextResponse.json({ saved: true, savedJob });
  } catch (error) {
    console.error('Saved job update error:', error);
    return NextResponse.json({ error: 'Saved job could not be updated.' }, { status: 500 });
  }
}
