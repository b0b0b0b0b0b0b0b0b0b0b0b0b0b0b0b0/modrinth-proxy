import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getRequestT } from '@/lib/i18n/server'
import { safeNext } from '@/lib/safeNext'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { t } = await getRequestT()
  return {
    title: t('account.registerMetaTitle'),
    robots: 'noindex, nofollow',
  }
}

export default async function RegisterPage(props) {
  const searchParams = await props.searchParams
  if (await getSessionUser()) redirect(safeNext(searchParams?.next) || '/account')
  return null
}
