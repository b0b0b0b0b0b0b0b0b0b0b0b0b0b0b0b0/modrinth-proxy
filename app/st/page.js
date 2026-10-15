import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { getSiteStats } from '@/lib/siteStats'
import { getRequestT } from '@/lib/i18n/server'
import { pluralize } from '@/lib/i18n/pluralize'
import { filterAvatar } from '@/lib/contentFilter'
import CountUp from './CountUp'
import { DaysChart, TypeSplit } from './StatsCharts'

export const dynamic = 'force-dynamic'

const TYPE_LABEL_KEYS = {
  mod: 'nav.mods',
  plugin: 'nav.plugins',
  resourcepack: 'nav.resourcepacks',
  shader: 'nav.shaders',
  datapack: 'nav.datapacks',
  modpack: 'nav.modpacks',
  minecraft_java_server: 'nav.servers',
}

export async function generateMetadata() {
  const { t } = getRequestT()
  return {
    title: t('st.metaTitle'),
    robots: 'noindex, nofollow',
  }
}

function Card({ title, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-gray-800 bg-modrinth-dark p-5 ${className}`}>
      {title ? <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-500">{title}</h2> : null}
      {children}
    </section>
  )
}

function Tile({ value, label, index }) {
  return (
    <div
      className="rounded-2xl border border-gray-800 bg-modrinth-dark px-4 py-4 animate-fade-in-up"
      style={{ animationDelay: `${120 + index * 60}ms`, animationFillMode: 'both' }}
    >
      <div className="text-2xl font-extrabold tabular-nums text-white">
        <CountUp value={value} />
      </div>
      <div className="mt-1 text-xs leading-snug text-gray-600 dark:text-gray-500">{label}</div>
    </div>
  )
}

export default function StatsPage() {
  if (!getSessionUser()) notFound()

  const { t, locale } = getRequestT()
  const stats = getSiteStats()
  const label = pluralize(stats.users, locale, t('st.userOne'), t('st.userFew'), t('st.userMany'))
  const typeLabels = Object.fromEntries(Object.entries(TYPE_LABEL_KEYS).map(([type, key]) => [type, t(key)]))
  const tiles = [
    { value: stats.active, label: t('st.active') },
    { value: stats.github, label: t('st.github') },
    { value: stats.telegram, label: t('st.telegram') },
    { value: stats.favorites, label: t('st.favorites') },
    { value: stats.downloads, label: t('st.downloads') },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-10">
      <div className="relative overflow-hidden rounded-3xl border border-gray-800 bg-modrinth-dark px-8 py-12 text-center shadow-2xl animate-fade-in-up">
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
            <CountUp value={stats.users} />
          </div>
          <div className="mt-3 text-lg font-semibold text-white">{label}</div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-500">{t('st.lead')}</p>
          {stats.today > 0 ? (
            <span className="mt-4 inline-flex items-center rounded-full bg-modrinth-green/15 px-3 py-1 text-xs font-bold text-modrinth-green">
              {t('st.today', { n: stats.today })}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tiles.map((tile, index) => (
          <Tile key={tile.label} index={index} {...tile} />
        ))}
      </div>

      <Card title={t('st.byDay')}>
        <DaysChart days={stats.days} label={t('st.byDay')} />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title={t('st.likes')}>
          <div className="space-y-5">
            <TypeSplit title={t('st.inFavorites')} rows={stats.favoriteTypes} labels={typeLabels} />
            <TypeSplit title={t('st.inDownloads')} rows={stats.downloadTypes} labels={typeLabels} />
          </div>
        </Card>

        {stats.topFavorites.length > 0 ? (
          <Card title={t('st.topFavorites')}>
            <ol className="space-y-2">
              {stats.topFavorites.map((row, index) => {
                const icon = filterAvatar(row.icon_url)
                const href = row.type === 'minecraft_java_server' ? `/server/${row.slug}` : `/project/${row.slug}`
                return (
                  <li key={row.slug}>
                    <Link href={href} className="group flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-white/5">
                      <span className="w-4 text-right text-xs font-bold tabular-nums text-gray-600 dark:text-gray-500">{index + 1}</span>
                      {icon ? (
                        <Image src={icon} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-md" unoptimized />
                      ) : (
                        <span className="h-7 w-7 shrink-0 rounded-md bg-gray-800" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white group-hover:text-modrinth-green">
                        {row.title}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums text-gray-400">
                        <svg className="h-3 w-3 text-modrinth-green" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
                        </svg>
                        {row.n}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </Card>
        ) : null}
      </div>

      <p className="text-center text-[11px] text-gray-600 dark:text-gray-500">{t('st.note')}</p>
    </div>
  )
}
