import { notFound } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { getRequestT } from '@/lib/i18n/server'
import { pluralize } from '@/lib/i18n/pluralize'
import CountUp from './CountUp'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { t } = getRequestT()
  return {
    title: t('st.metaTitle'),
    robots: 'noindex, nofollow',
  }
}

export default function StatsPage() {
  if (!getSessionUser()) notFound()

  const { t, locale } = getRequestT()
  const users = getDb().prepare('SELECT COUNT(*) AS n FROM users').get().n
  const label = pluralize(users, locale, t('st.userOne'), t('st.userFew'), t('st.userMany'))

  return (
    <div className="flex min-h-[55vh] items-center justify-center pb-8">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-800 bg-modrinth-dark px-8 py-12 text-center shadow-2xl animate-fade-in-up">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'rgba(var(--color-green-rgb), 0.25)' }}
        />
        <div className="relative">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-modrinth-green/15 text-modrinth-green">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="mt-6 bg-gradient-to-r from-modrinth-green to-modrinth-green-light bg-clip-text text-7xl font-extrabold tabular-nums leading-none text-transparent">
            <CountUp value={users} />
          </div>
          <div className="mt-3 text-lg font-semibold text-white">{label}</div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-500">{t('st.lead')}</p>
        </div>
      </div>
    </div>
  )
}
