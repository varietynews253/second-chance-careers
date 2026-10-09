import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: Request, context: { params: { id: string } }) {
  try {
    const job = await prisma.jobListing.findUnique({
      where: { id: context.params.id },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    return NextResponse.json({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location ?? (job.remote ? 'Remote' : 'On-site'),
      salaryRange: job.salaryRange ?? 'Competitive',
      remote: job.remote,
      description: job.description,
      requirements: job.requirements ?? [],
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (error) {
    console.error('Error loading job details:', error);
    return NextResponse.json({ error: 'Unable to load this job.' }, { status: 500 });
  }
}
