import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authOptions } from '@/lib/auth';

const coverLetterSchema = z.object({
  company: z.string().min(2).max(120),
  role: z.string().min(2).max(120),
  hiringManager: z.string().min(2).max(120).optional().default('Hiring Manager'),
  summary: z.string().min(20).max(2000),
  motivation: z.string().min(20).max(2000),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = coverLetterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide a valid company, role, summary, and motivation.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const { company, role, hiringManager, summary, motivation } = parsed.data;
    const prompt = `Write a concise, professional cover letter for a candidate applying to ${role} at ${company}. Address it to ${hiringManager}. The candidate has the following background: ${summary}. Their motivation: ${motivation}. Keep the tone confident, warm, and clear. Include a strong opening, 2 body paragraphs, and a closing paragraph. The letter should be 250-350 words.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const content = await result.response.text();

    return NextResponse.json({ ok: true, output: content });
  } catch (error) {
    console.error('Cover letter generation error:', error);
    return NextResponse.json({ error: 'Cover letter generation failed.' }, { status: 500 });
  }
}
