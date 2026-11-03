import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getRequestT } from '@/lib/i18n/server'
import { safeNext } from '@/lib/safeNext'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { t } = await getRequestT()
  return {
    title: t('account.loginMetaTitle'),
    robots: 'noindex, nofollow',
  }
}

export default async function LoginPage(props) {
  const searchParams = await props.searchParams
  if (await getSessionUser()) {
    const next = safeNext(searchParams?.next)
    redirect(next && !next.startsWith('/') ? `/api/auth/sso?next=${encodeURIComponent(next)}` : next || '/account')
  }
  return null
}
