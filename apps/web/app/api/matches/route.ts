import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function tokenize(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildKeywordSet(profile: { headline?: string | null; summary?: string | null; skills?: string[]; experience?: string | null }) {
  const keywords = new Set<string>();

  for (const source of [profile.headline, profile.summary, profile.experience]) {
    for (const token of tokenize(source)) {
      if (token.length > 2) {
        keywords.add(token);
      }
    }
  }

  for (const skill of profile.skills ?? []) {
    for (const token of tokenize(skill)) {
      if (token.length > 2) {
        keywords.add(token);
      }
    }
  }

  return Array.from(keywords);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = sessionUser.id;
  const [profile, jobs] = await Promise.all([
    prisma.candidateProfile.findUnique({ where: { userId } }).catch(() => null),
    prisma.jobListing.findMany({ orderBy: { createdAt: 'desc' } }).catch(() => []),
  ]);

  if (!profile) {
    return NextResponse.json({
      profile: null,
      matches: [],
      message: 'Complete your profile to unlock personalized job matches.',
    });
  }

  const keywords = buildKeywordSet(profile);

  if (keywords.length === 0) {
    return NextResponse.json({
      profile,
      matches: jobs.slice(0, 5).map((job) => ({
        ...job,
        matchScore: 0,
        reason: 'Add more profile details to get stronger matches.',
      })),
      message: 'Add details to your profile so we can recommend the right roles.',
    });
  }

  const rankedJobs = jobs
    .map((job) => {
      const jobTokens = new Set(tokenize([job.title, job.company, job.description, ...(job.requirements ?? [])].join(' ')));
      const overlap = [...keywords].filter((keyword) => jobTokens.has(keyword));
      const titleMatches = tokenize(job.title).filter((token) => keywords.includes(token)).length;
      const score = Math.min(
        99,
        Math.max(10, Math.round(((overlap.length + titleMatches * 2) / Math.max(keywords.length, 1)) * 100)),
      );

      return {
        ...job,
        matchScore: score,
        reason: overlap.slice(0, 4).join(', ') || 'Strong role fit based on your background.',
      };
    })
    .sort((jobA, jobB) => Number(jobB.matchScore) - Number(jobA.matchScore))
    .slice(0, 5);

  return NextResponse.json({
    profile,
    matches: rankedJobs,
    message: rankedJobs.length > 0 ? 'Here are the roles that best match your profile.' : 'No strong matches found yet. Try updating your skills or experience.',
  });
}
