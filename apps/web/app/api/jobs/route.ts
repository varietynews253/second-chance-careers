import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const fallbackJobs = [
  {
    id: 'job-1',
    title: 'Customer Support Specialist',
    company: 'North Harbor Solutions',
    location: 'Remote',
    salaryRange: '$42k - $55k',
    remote: true,
    description: 'Help customers troubleshoot issues and build trust while supporting inclusive service experiences.',
  },
  {
    id: 'job-2',
    title: 'Warehouse Operations Coordinator',
    company: 'Greenline Logistics',
    location: 'Chicago, IL',
    salaryRange: '$38k - $48k',
    remote: false,
    description: 'Coordinate inventory flow, shipping details, and team routines for a fast-moving logistics operation.',
  },
  {
    id: 'job-3',
    title: 'Administrative Assistant',
    company: 'Civic Pathways',
    location: 'Hybrid',
    salaryRange: '$36k - $45k',
    remote: false,
    description: 'Provide scheduling, records support, and client intake services for a mission-driven nonprofit team.',
  },
];

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(fallbackJobs);
  }

  try {
    const jobs = await prisma.jobListing.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
    });

    if (jobs.length > 0) {
      return NextResponse.json(
        jobs.map((job) => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location ?? (job.remote ? 'Remote' : 'On-site'),
          salaryRange: job.salaryRange ?? 'Competitive',
          remote: job.remote,
          description: job.description,
        })),
      );
    }
  } catch (error) {
    console.warn('Falling back to mock jobs because Prisma is unavailable:', error);
  }

  return NextResponse.json(fallbackJobs);
}
