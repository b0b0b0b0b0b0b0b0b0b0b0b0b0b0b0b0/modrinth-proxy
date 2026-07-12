import { getAstralRinthData } from '@/lib/astralrinth'

export async function GET() {
  try {
    const data = await getAstralRinthData();
    if (!data) return Response.json({ error: 'Failed to fetch AstralRinth version' }, { status: 503 });
    return Response.json(data);
  } catch (error) {
    console.error('Failed to fetch AstralRinth version:', error);
    return Response.json({ error: 'Failed to fetch AstralRinth version' }, { status: 503 });
  }
}
