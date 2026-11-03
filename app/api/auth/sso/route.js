import { ensureSsoCookie, getSessionUser } from '@/lib/auth'
import { redirectTo } from '@/lib/githubAuth'
import { safeNext } from '@/lib/safeNext'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const next = safeNext(new URL(request.url).searchParams.get('next'))
  if (!(await getSessionUser())) {
    return redirectTo(next ? `/login?next=${encodeURIComponent(next)}` : '/login')
  }
  await ensureSsoCookie()
  return redirectTo(next || '/account')
}
