import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { isAdmin } from '@/lib/admins'
import { getSiteStats } from '@/lib/siteStats'
import { getAppDownloadStats, getDownloadStats, getServerClickStats } from '@/lib/downloadCounter'
import { getRequestT } from '@/lib/i18n/server'
import { pluralize } from '@/lib/i18n/pluralize'
import { intlLocale } from '@/lib/i18n/config'
import { filterAvatar } from '@/lib/contentFilter'
import CountUp from './CountUp'
import RoyalKitten from './RoyalKitten'
import { DaysChart, TypeSplit } from './StatsCharts'
import ModrinthTrafficChart from './ModrinthTrafficChart'
import { getModrinthTrafficReport } from '@/lib/modrinthTrafficReport'
import { PLAY_NONSTOP_HOURS, PLAY_WINDOW_HOURS, readPlaySuspects } from '@/lib/playWatch'
import { readAutoGrumpy } from '@/lib/autoGrumpy'
import { IconDiscord, IconGithub, IconTelegram } from '@/lib/icons'

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
  const { t } = await getRequestT()
  return {
    title: isAdmin(await getSessionUser()) ? t('st.metaTitle') : t('notfound.metaTitle'),
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

function MiniTiles({ tiles }) {
  return (
    <div className="mb-5 grid grid-cols-3 gap-3">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-xl bg-gray-800/40 px-3 py-3">
          <div className="text-2xl font-extrabold tabular-nums text-white">
            <CountUp value={tile.value} />
          </div>
          <div className="mt-1 text-xs leading-snug text-gray-600 dark:text-gray-500">{tile.label}</div>
        </div>
      ))}
    </div>
  )
}

function TopRow({ index, href, icon, title, children }) {
  const avatar = filterAvatar(icon)
  return (
    <li>
      <Link href={href} className="group flex items-center gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-white/5">
        <span className="w-4 text-right text-xs font-bold tabular-nums text-gray-600 dark:text-gray-500">{index + 1}</span>
        {avatar ? (
          <Image src={avatar} alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-md" unoptimized />
        ) : (
          <span className="h-7 w-7 shrink-0 rounded-md bg-gray-800" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white group-hover:text-modrinth-green">{title}</span>
        <span className="inline-flex shrink-0 items-center gap-3 text-xs font-bold tabular-nums text-gray-400">{children}</span>
      </Link>
    </li>
  )
}

function NumberCrown() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute right-[-0.1em] top-[-0.32em] h-[0.5em] w-[0.64em] rotate-18 transition-transform duration-300 ease-out group-hover/crown:translate-y-[-0.04em] group-hover/crown:rotate-26"
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

function PlaySuspects({ suspects, t, format }) {
  if (!suspects.length) return <p className="text-sm text-gray-400">{t('st.playEmpty')}</p>
  const kindLabel = (kind) => t(`st.playKinds.${kind}`)
  return (
    <ol className="divide-y divide-white/5">
      {suspects.map((row) => (
        <li key={row.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-baseline gap-2">
            <span className="min-w-0 truncate text-sm font-semibold text-white">{row.username}</span>
            <span className="shrink-0 text-xs tabular-nums text-gray-600 dark:text-gray-500">id {row.id}</span>
          </div>
          <div className="mt-1 space-y-0.5 text-xs leading-snug">
            {row.fast.map((item) => (
              <div key={item.kind} className="text-red-400">
                {t('st.playFast', { kind: kindLabel(item.kind), peak: format(item.peak), limit: format(item.limit) })}
              </div>
            ))}
            {row.nonstop ? (
              <div className="text-amber-400">{t('st.playNonstop', { hours: row.activeHours, window: PLAY_WINDOW_HOURS })}</div>
            ) : null}
            <div className="text-gray-400">
              {row.totals.map((item) => `${kindLabel(item.kind)}: ${format(item.n)}`).join(' · ')}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

function AutoGrumpy({ entries, t }) {
  if (!entries.length) return null
  return (
    <div className="mt-5">
      <div className="mb-2 text-xs font-semibold text-gray-400">{t('st.playAuto')}</div>
      <ol className="space-y-1.5">
        {entries
          .slice(-20)
          .reverse()
          .map((entry) => (
            <li key={entry.id} className="text-xs leading-snug">
              <span className="font-semibold text-white">{entry.name}</span>
              <span className="ml-2 tabular-nums text-gray-600 dark:text-gray-500">
                id {entry.id} · {entry.date}
              </span>
              <div className="text-gray-400">{entry.why}</div>
            </li>
          ))}
      </ol>
    </div>
  )
}

function LoginRows({ rows, total, format }) {
  return (
    <ul className="space-y-4">
      {rows.map(({ key, Icon, color, value, label }) => {
        const share = total > 0 ? Math.min(100, (value / total) * 100) : 0
        return (
          <li key={key} className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `${color}26`, color }}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm text-gray-400">{label}</span>
                <span className="text-xl font-extrabold tabular-nums text-white">
                  <CountUp value={value} />
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-800/60">
                <div className="h-full rounded-full" style={{ width: `${share}%`, background: color }} />
              </div>
              <div className="mt-1 text-[11px] tabular-nums text-gray-600 dark:text-gray-500">{format(share)}</div>
            </div>
          </li>
        )
      })}
    </ul>
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

export default async function StatsPage() {
  if (!isAdmin(await getSessionUser())) notFound()

  const { t, locale } = await getRequestT()
  const stats = getSiteStats()
  const downloads = getDownloadStats()
  const label = pluralize(stats.users, locale, t('st.userOne'), t('st.userFew'), t('st.userMany'))
  const typeLabels = Object.fromEntries(Object.entries(TYPE_LABEL_KEYS).map(([type, key]) => [type, t(key)]))
  const downloadTypeLabels = { ...typeLabels, unknown: t('st.dlUnknown') }
  const sinceFormat = new Intl.DateTimeFormat(intlLocale(locale), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' })
  const numberFormat = new Intl.NumberFormat(intlLocale(locale))
  const formatSince = (ms) => (ms ? sinceFormat.format(new Date(ms)) : null)
  const since = formatSince(downloads.since)
  const downloadTiles = [
    { value: downloads.total, label: t('st.dlTotal') },
    { value: downloads.month, label: t('st.dlMonth') },
    { value: downloads.today, label: t('st.dlToday') },
  ]
  const app = getAppDownloadStats()
  const appSince = formatSince(app.since)
  const servers = getServerClickStats()
  const serversSince = formatSince(servers.since)
  const serverTiles = [
    { value: servers.play, label: t('st.srvPlay') },
    { value: servers.copy, label: t('st.srvCopy') },
    { value: servers.today, label: t('st.dlToday') },
  ]
  const appTiles = [
    { value: app.total, label: t('st.dlTotal') },
    { value: app.month, label: t('st.dlMonth') },
    { value: app.today, label: t('st.dlToday') },
  ]
  const appLabels = {
    modrinth: 'Modrinth App',
    astral: 'AstralRinth',
    windows: 'Windows',
    macos: 'macOS',
    linux: 'Linux',
    exe: 'EXE',
    msi: 'MSI',
    dmg: 'DMG',
    flathub: 'Flathub',
    appimage: 'AppImage',
    deb: 'DEB',
    rpm: 'RPM',
    hero: t('st.appHero'),
    card: t('st.appCard'),
    files: t('st.appFiles'),
  }
  const tiles = [
    { value: stats.active, label: t('st.active') },
    { value: stats.favorites, label: t('st.favorites') },
    { value: stats.downloads, label: t('st.downloads') },
  ]
  const loginRows = [
    { key: 'github', Icon: IconGithub, color: '#e6edf3', value: stats.github, label: t('st.github') },
    { key: 'telegram', Icon: IconTelegram, color: '#2aabee', value: stats.telegram, label: t('st.telegram') },
    { key: 'discord', Icon: IconDiscord, color: '#5865f2', value: stats.discord, label: t('st.discord') },
  ]
  const shareFormat = new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 1 })

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
              <span className="bg-linear-to-r from-modrinth-green to-modrinth-green-light bg-clip-text text-transparent">
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

      <div className="grid grid-cols-3 gap-3">
        {tiles.map((tile, index) => (
          <Tile key={tile.label} index={index} {...tile} />
        ))}
      </div>

      <Card title={t('st.loginsTitle')}>
        <LoginRows
          rows={loginRows}
          total={stats.users}
          format={(share) => t('st.loginsShare', { n: shareFormat.format(share) })}
        />
      </Card>

      <Card title={t('st.playTitle')}>
        <PlaySuspects suspects={readPlaySuspects()} t={t} format={(n) => numberFormat.format(n)} />
        <AutoGrumpy entries={readAutoGrumpy()} t={t} />
        <p className="mt-4 text-[11px] leading-snug text-gray-600 dark:text-gray-500">
          {t('st.playNote', { hours: PLAY_NONSTOP_HOURS, window: PLAY_WINDOW_HOURS })}
        </p>
      </Card>

      <Card title={t('st.byDay')}>
        <DaysChart days={stats.days} label={t('st.byDay')} />
      </Card>

      <Card title={t('st.dlTitle')}>
        <MiniTiles tiles={downloadTiles} />
        <DaysChart days={downloads.days} label={t('st.dlTitle')} />
        <div className="mt-5">
          <TypeSplit title={t('st.dlByType')} rows={downloads.types} labels={downloadTypeLabels} />
        </div>
        <p className="mt-4 text-[11px] leading-snug text-gray-600 dark:text-gray-500">
          {since ? t('st.dlNote', { date: since }) : t('st.dlEmpty')}
        </p>
      </Card>

      <Card title={t('st.appTitle')}>
        <MiniTiles tiles={appTiles} />
        <DaysChart days={app.days} label={t('st.appTitle')} />
        <div className="mt-5 space-y-5">
          <TypeSplit title={t('st.appEdition')} rows={app.editions} labels={appLabels} />
          <TypeSplit title={t('st.appOs')} rows={app.platforms} labels={appLabels} />
          <TypeSplit title={t('st.appFormat')} rows={app.formats} labels={appLabels} />
          <TypeSplit title={t('st.appPlace')} rows={app.places} labels={appLabels} />
        </div>
        <p className="mt-4 text-[11px] leading-snug text-gray-600 dark:text-gray-500">
          {appSince ? t('st.appNote', { date: appSince }) : t('st.appEmpty')}
        </p>
      </Card>

      <Card title={t('st.srvTitle')}>
        <MiniTiles tiles={serverTiles} />
        <DaysChart days={servers.days} label={t('st.srvTitle')} />
        {servers.top.length > 0 ? (
          <div className="mt-5">
            <div className="mb-2 text-xs font-semibold text-gray-400">{t('st.srvTop')}</div>
            <ol className="space-y-2">
              {servers.top.map((row, index) => (
                <TopRow
                  key={row.id}
                  index={index}
                  href={`/server/${row.slug || row.id}`}
                  icon={row.icon_url}
                  title={row.title || row.id}
                >
                  <span className="inline-flex items-center gap-1" title={t('st.srvPlay')}>
                    <svg className="h-3 w-3 text-modrinth-green" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="m5 3 14 9-14 9z" />
                    </svg>
                    {row.play}
                  </span>
                  <span className="inline-flex items-center gap-1" title={t('st.srvCopy')}>
                    <svg className="h-3 w-3 text-sky-400" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
                      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    </svg>
                    {row.copy}
                  </span>
                </TopRow>
              ))}
            </ol>
          </div>
        ) : null}
        <p className="mt-4 text-[11px] leading-snug text-gray-600 dark:text-gray-500">
          {serversSince ? t('st.srvNote', { date: serversSince }) : t('st.srvEmpty')}
        </p>
      </Card>

      <Card title={t('st.mrTitle')}>
        <ModrinthTrafficChart initial={getModrinthTrafficReport()} />
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
              {stats.topFavorites.map((row, index) => (
                <TopRow
                  key={row.slug}
                  index={index}
                  href={row.type === 'minecraft_java_server' ? `/server/${row.slug}` : `/project/${row.slug}`}
                  icon={row.icon_url}
                  title={row.title}
                >
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-3 w-3 text-modrinth-green" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
                    </svg>
                    {row.n}
                  </span>
                </TopRow>
              ))}
            </ol>
          </Card>
        ) : null}
      </div>

      <p className="text-center text-[11px] text-gray-600 dark:text-gray-500">{t('st.note')}</p>
    </div>
  )
}
