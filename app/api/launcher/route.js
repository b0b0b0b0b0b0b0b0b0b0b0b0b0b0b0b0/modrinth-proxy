import { getLauncherData } from '@/lib/launcher'

export async function GET() {
  try {
    const data = await getLauncherData();
    if (!data) return Response.json({ error: 'Failed to fetch launcher version' }, { status: 500 });
    return Response.json(data);
  } catch (error) {
    console.error('Failed to fetch launcher version:', error);
    return Response.json({ error: 'Failed to fetch launcher version' }, { status: 500 });
  }
}
