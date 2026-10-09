import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authOptions } from '@/lib/auth';

const interviewPrepSchema = z.object({
  role: z.string().min(2).max(120),
  company: z.string().min(2).max(120),
  summary: z.string().min(20).max(2000),
  challenge: z.string().min(10).max(1000).optional().default(''),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string } | undefined;

  if (!sessionUser?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = interviewPrepSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide a valid role, company, and summary.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const { role, company, summary, challenge } = parsed.data;
    const prompt = `You are a career coach helping a candidate prepare for an interview for ${role} at ${company}. Candidate background: ${summary}. Specific concern: ${challenge || 'No major concern provided; prepare a general interview plan.'}. Provide: 1) a short list of likely interview questions, 2) strong sample answers with STAR examples, 3) a concise explanation of what to emphasize in the interview, and 4) 5 smart questions to ask the interviewer. Keep the response supportive and practical, under 700 words.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const content = await result.response.text();

    return NextResponse.json({ ok: true, output: content });
  } catch (error) {
    console.error('Interview prep generation error:', error);
    return NextResponse.json({ error: 'Interview prep generation failed.' }, { status: 500 });
  }
}
