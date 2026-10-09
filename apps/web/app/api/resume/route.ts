import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const resumeSchema = z.object({
  title: z.string().min(2).max(120),
  role: z.string().min(2).max(120),
  summary: z.string().min(20).max(2000),
  skills: z.array(z.string().min(1).max(60)).max(20).default([]),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const drafts = await prisma.resumeDraft.findMany({
    where: { userId: sessionUser.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return NextResponse.json(drafts);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = resumeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide a valid title, role, summary, and skills.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const { title, role, summary, skills } = parsed.data;
    const prompt = `Write a polished professional resume summary for a person seeking a ${role} role. Use concise, strong action-oriented language. Include a strong opening statement, 2–3 focused achievement bullets, and key skills. Candidate background: ${summary}. Relevant skills: ${skills.join(', ') || 'general teamwork and communication'}. Keep it under 250 words.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const content = await result.response.text();

    const draft = await prisma.resumeDraft.create({
      data: {
        userId: sessionUser.id,
        title,
        content,
      },
    });

    return NextResponse.json({ ok: true, draft, output: content });
  } catch (error) {
    console.error('Resume generation error:', error);
    return NextResponse.json({ error: 'Resume generation failed.' }, { status: 500 });
  }
}
