import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (sessionUser.role !== 'employer') {
    return NextResponse.json({ error: 'Employer access required.' }, { status: 403 });
  }

  const applications = await prisma.application.findMany({
    where: {
      job: {
        userId: sessionUser.id,
      },
    },
    include: {
      user: true,
      job: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({
    applications: applications.map((application) => ({
      id: application.id,
      status: application.status,
      notes: application.notes,
      source: application.source,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      candidateName: application.user.name ?? 'Candidate',
      candidateEmail: application.user.email ?? '',
      jobTitle: application.jobTitle || application.job?.title || 'Role',
      company: application.company || application.job?.company || '',
      location: application.location || application.job?.location || '',
      role: application.job?.title ?? application.jobTitle,
    })),
  });
}
