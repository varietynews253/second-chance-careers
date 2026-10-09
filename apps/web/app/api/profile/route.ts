import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const profileSchema = z.object({
  role: z.enum(['candidate', 'employer']).default('candidate'),
  headline: z.string().max(160).optional().or(z.literal('')),
  summary: z.string().max(2000).optional().or(z.literal('')),
  skills: z.array(z.string().min(1).max(50)).max(20).default([]),
  experience: z.string().max(2000).optional().or(z.literal('')),
  companyName: z.string().max(120).optional().or(z.literal('')),
  industry: z.string().max(120).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = sessionUser.id;
  const [candidateProfile, employerProfile] = await Promise.all([
    prisma.candidateProfile.findUnique({ where: { userId } }).catch(() => null),
    prisma.employerProfile.findUnique({ where: { userId } }).catch(() => null),
  ]);

  return NextResponse.json({
    candidate: candidateProfile,
    employer: employerProfile,
    role: (sessionUser.role as string | undefined) ?? 'candidate',
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide valid profile information.' }, { status: 400 });
    }

    const userId = sessionUser.id;
    const { role, headline, summary, skills, experience, companyName, industry, description } = parsed.data;

    if (role === 'candidate') {
      const profile = await prisma.candidateProfile.upsert({
        where: { userId },
        update: {
          headline: headline || null,
          summary: summary || null,
          skills: skills.map((skill) => skill.trim()).filter(Boolean),
          experience: experience || null,
        },
        create: {
          userId,
          headline: headline || null,
          summary: summary || null,
          skills: skills.map((skill) => skill.trim()).filter(Boolean),
          experience: experience || null,
        },
      });

      return NextResponse.json({ ok: true, profile });
    }

    const profile = await prisma.employerProfile.upsert({
      where: { userId },
      update: {
        companyName: companyName || null,
        industry: industry || null,
        description: description || null,
      },
      create: {
        userId,
        companyName: companyName || null,
        industry: industry || null,
        description: description || null,
      },
    });

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    console.error('Profile save error:', error);
    return NextResponse.json({ error: 'Profile could not be saved.' }, { status: 500 });
  }
}
