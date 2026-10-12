import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getRequestT } from '@/lib/i18n/server'
import { safeNext } from '@/lib/safeNext'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { t } = getRequestT()
  return {
    title: t('account.loginMetaTitle'),
    robots: 'noindex, nofollow',
  }
}

export default function LoginPage({ searchParams }) {
  if (getSessionUser()) redirect(safeNext(searchParams?.next) || '/account')
  return null
}
