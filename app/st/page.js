import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { isAdmin } from '@/lib/admins'
import { getSiteStats } from '@/lib/siteStats'
import { getRequestT } from '@/lib/i18n/server'
import { pluralize } from '@/lib/i18n/pluralize'
import { filterAvatar } from '@/lib/contentFilter'
import CountUp from './CountUp'
import RoyalKitten from './RoyalKitten'
import { DaysChart, TypeSplit } from './StatsCharts'
import ModrinthTrafficChart from './ModrinthTrafficChart'
import { getModrinthTraffic } from '@/lib/modrinthTraffic'

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
    title: isAdmin(getSessionUser()) ? t('st.metaTitle') : t('notfound.metaTitle'),
    robots: 'noindex, nofollow',
  }
}

function Card({ title, children, className = '' }) {
  return (
    <section className={`rounded-2xl card-glass bg-modrinth-dark p-5 ${className}`}>
      {title ? <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-500">{title}</h2> : null}
      {children}
    </section>
  )
}

function NumberCrown() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -right-[0.1em] -top-[0.32em] h-[0.5em] w-[0.64em] rotate-[18deg] transition-transform duration-300 ease-out group-hover/crown:-translate-y-[0.04em] group-hover/crown:rotate-[26deg]"
    >
      <svg className="h-full w-full overflow-visible drop-shadow-[0_2px_6px_rgba(251,191,36,0.45)]" viewBox="0 0 24 18">
        <defs>
          <linearGradient id="st-crown-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fde68a" />
            <stop offset="1" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <path d="M2.5 14.5 1.6 4.6l5.6 4.8L12 1.6l4.8 7.8 5.6-4.8-.9 9.9Z" fill="url(#st-crown-gold)" stroke="#d97706" strokeWidth="1.1" strokeLinejoin="round" />
        <rect x="2.4" y="13.6" width="19.2" height="3.4" rx="1.2" fill="#f59e0b" stroke="#d97706" strokeWidth="1.1" />
        <circle cx="12" cy="15.3" r="1.1" fill="#f43f5e" />
        <circle cx="6.8" cy="15.3" r="0.8" fill="#38bdf8" />
        <circle cx="17.2" cy="15.3" r="0.8" fill="#38bdf8" />
        <circle cx="1.6" cy="4.2" r="1.2" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
        <circle cx="12" cy="1.4" r="1.3" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
        <circle cx="22.4" cy="4.2" r="1.2" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
        <path
          d="M17.6 5.2l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5Z"
          fill="white"
          className="origin-[17.6px_7px] scale-0 opacity-0 transition-[transform,opacity] duration-300 group-hover/crown:scale-125 group-hover/crown:opacity-100"
        />
      </svg>
    </span>
  )
}

function Tile({ value, label, index }) {
  return (
    <div
      className="rounded-2xl card-glass bg-modrinth-dark px-4 py-4 animate-fade-in-up"
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
  if (!isAdmin(getSessionUser())) notFound()

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
      <div className="relative overflow-hidden rounded-3xl card-glass bg-modrinth-dark px-8 py-12 text-center shadow-2xl animate-fade-in-up">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'rgba(var(--color-green-rgb), 0.25)' }}
        />
        <div className="relative">
          <RoyalKitten />
          <div className="mt-16 text-7xl font-extrabold tabular-nums leading-none">
            <span className="group/crown relative inline-block">
              <span className="bg-gradient-to-r from-modrinth-green to-modrinth-green-light bg-clip-text text-transparent">
                <CountUp value={stats.users} />
              </span>
              <NumberCrown />
            </span>
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

      <Card title={t('st.mrTitle')}>
        <ModrinthTrafficChart initial={getModrinthTraffic()} />
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
