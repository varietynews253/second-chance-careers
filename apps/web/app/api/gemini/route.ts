import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const requestSchema = z.object({
  prompt: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: 'Prompt is required and must be between 10 and 2000 characters.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(parsed.data.prompt);
    const responseText = await result.response.text();

    return Response.json({ output: responseText });
  } catch (error) {
    console.error('Gemini error:', error);
    return Response.json({ error: 'Gemini request failed.' }, { status: 500 });
  }
}
