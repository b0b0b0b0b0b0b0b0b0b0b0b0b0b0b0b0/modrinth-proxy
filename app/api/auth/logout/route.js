import { endSession, isSameOrigin } from '@/lib/auth'

export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 })
  endSession()
  return Response.json({ ok: true })
}
