'use client'
import Link from 'next/link'
import PeelPanel from './components/PeelPanel'
import HomeLoaders from './components/HomeLoaders'
import { useEffect, useMemo, useState } from 'react'
import { useMinecraftVersions } from './hooks/useMinecraftVersions'
import { useCountUp } from './hooks/useCountUp'
import { getModsVersionRange } from '@/lib/minecraftVersionRange'
import { useI18n, useMessage, useT } from './components/I18nProvider'
import { intlLocale } from '@/lib/i18n/config'

function thousands(n, locale) {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 0 }).format(n)
}

function compactCountEn(n) {
  if (n >= 1_000_000) {
    const wholeM = Math.floor(n / 1_000_000)
    if (wholeM >= 10) {
      return `${wholeM}M+`
    }
    const label = Math.floor(n / 100_000) / 10
    const s = Number.isInteger(label)
      ? String(label)
      : label.toFixed(1).replace(/\.0$/, '')
    return `${s}M+`
  }
  if (n >= 1000) {
    return `${Math.floor(n / 1000)}K+`
  }
  return `${thousands(n, 'ru')}+`
}

function CategoryTitle({ title, count, tone }) {
  const label = count > 0 ? compactCountEn(count) : undefined
  return (
    <h3
      className={`category-title-with-count text-xl font-bold text-white mb-2${tone ? ` category-title-with-count--${tone}` : ''}`}
      {...(label ? { 'data-count': label } : {})}
    >
      {title}
    </h3>
  )
}

const STAT_TONES = {
  green: { text: 'text-modrinth-green', tile: 'bg-modrinth-green/15 text-modrinth-green' },
  blue: { text: 'text-blue-400', tile: 'bg-blue-400/15 text-blue-400' },
  purple: { text: 'text-purple-400', tile: 'bg-purple-400/15 text-purple-400' },
  orange: { text: 'text-orange-400', tile: 'bg-orange-400/15 text-orange-400' },
}

const STAT_ICONS = {
  projects: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
  files:
    'M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9z',
  authors:
    'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0z',
  versions:
    'M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3',
}

function StatIcon({ path, className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d={path} />
    </svg>
  )
}

function StatTile({ value, label, icon, tone }) {
  const [ref, shown] = useCountUp(value)
  const colors = STAT_TONES[tone]
  return (
    <div ref={ref} className="flex items-center gap-3 rounded-xl bg-(--bg-tertiary) p-3 sm:p-4">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colors.tile}`}>
        <StatIcon path={STAT_ICONS[icon]} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className={`text-2xl font-black leading-none tabular-nums sm:text-3xl ${colors.text}`}>
          {compactCountEn(Math.round(shown))}
        </div>
        <div className="mt-1 truncate text-sm text-gray-300">{label}</div>
      </div>
    </div>
  )
}

const CHECK_TONES = {
  accent: 'bg-modrinth-green/15 text-modrinth-green',
  server: 'bg-yellow-500/20 text-orange-700 dark:text-orange-300',
}

function CheckItem({ tone = 'accent', children }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${CHECK_TONES[tone]}`}>
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="text-gray-300">{children}</span>
    </div>
  )
}

const STATS_FALLBACK = {
  projects: 125000,
  files: 1200000,
  authors: 54000,
  versions: 1100000,
}

export default function HomeClient({ platformStats, categoryTotals }) {
  const t = useT()
  const { locale } = useI18n()
  const rotate = useMessage('home.rotate')
  const words = Array.isArray(rotate) && rotate.length ? rotate : [t('nav.mods')]
  const projectsShown =
    platformStats?.projects > 0 ? platformStats.projects : STATS_FALLBACK.projects
  const filesShown =
    platformStats?.files > 0 ? platformStats.files : STATS_FALLBACK.files
  const authorsShown =
    platformStats?.authors > 0 ? platformStats.authors : STATS_FALLBACK.authors
  const versionsShown =
    platformStats?.versions > 0 ? platformStats.versions : STATS_FALLBACK.versions
  const { release, full } = useMinecraftVersions()
  const { fromVersion, toVersion, snapshotVersion } = useMemo(
    () => getModsVersionRange(release, full),
    [release, full]
  )
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
    
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % words.length)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [words.length])

  return (
    <div className="relative min-h-screen" style={{ marginTop: '-34px', marginBottom: '-34px' }}>
      <div className="relative">
        <div className="flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-3 sm:mb-4 md:mb-6 animate-fade-in-up animation-delay-200 px-2 sm:px-4">
              <span className="text-gray-900 dark:text-white drop-shadow-2xl">
              ModrinthProxy
            </span>
          </h1>
           
          
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl mb-2 sm:mb-3 md:mb-4 animate-fade-in-up animation-delay-400 font-black px-2 sm:px-4">
            <span className="text-gray-900 dark:text-white drop-shadow-2xl">
              {t('home.placeFor')}
            </span>
          </div>

          <div className="h-12 sm:h-14 md:h-16 flex items-center justify-center mb-3 sm:mb-4 overflow-hidden">
            <div className="animated-text text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-semibold">
              <span
                key={currentWordIndex}
                className="animated-word"
                style={{
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  backgroundColor: 'var(--hero-word-bottom)',
                  backgroundImage: 'linear-gradient(180deg, var(--hero-word-top) 0%, var(--hero-word-bottom) 60%)',
                  backgroundSize: '100%',
                  fontWeight: 600,
                  WebkitTextFillColor: 'transparent',
                  MozTextFillColor: 'transparent',
                  color: 'transparent',
                  whiteSpace: 'nowrap',
                  display: 'inline-block'
                }}
              >
                {words[currentWordIndex]}
              </span>
            </div>
          </div>
          
            <p className="text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-200 max-w-4xl mx-auto mb-4 sm:mb-6 md:mb-8 animate-fade-in-up animation-delay-600 px-2 sm:px-4 drop-shadow-md font-light leading-relaxed">
              {t('home.lead')}
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 pt-8 pb-16">
          <div className="text-center mb-12">
          
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              {t('home.discover', { n: thousands(projectsShown, locale) })}
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              {t('home.discoverLead')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {t('home.directAccess')}
              </h3>
              <p className="text-gray-300 text-lg mb-6">
                {t('home.directAccessLead')}
              </p>
              <div className="space-y-4">
                <CheckItem>{t('home.currentFiles')}</CheckItem>
                <CheckItem>{t('home.directLinks')}</CheckItem>
                <CheckItem>{t('home.noStore')}</CheckItem>
              </div>
            </div>
            <PeelPanel className="card-glass bg-modrinth-dark rounded-2xl p-6 sm:p-8">
              <div className="text-center mb-6">
                <h4 className="text-white font-semibold text-lg mb-2">{t('home.statsTitle')}</h4>
                <p className="inline-flex items-center gap-2 text-gray-400 text-sm">
                  <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-modrinth-green opacity-60 motion-reduce:hidden" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-modrinth-green" />
                  </span>
                  {t('home.statsFromApi')}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                <StatTile value={projectsShown} label={t('home.projects')} icon="projects" tone="green" />
                <StatTile value={filesShown} label={t('home.files')} icon="files" tone="blue" />
                <StatTile value={authorsShown} label={t('home.authors')} icon="authors" tone="purple" />
                <StatTile value={versionsShown} label={t('home.versions')} icon="versions" tone="orange" />
              </div>
              <div className="mt-6 flex items-center justify-center gap-3 border-t border-white/10 pt-6">
                <svg className="home-free-heart h-7 w-7 shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
                <div className="text-left">
                  <div className="text-2xl md:text-3xl font-black leading-none text-emerald-400">100%</div>
                  <div className="text-gray-300 text-sm mt-1">{t('home.free')}</div>
                </div>
              </div>
            </PeelPanel>
          </div>

        <div className="relative overflow-hidden">
          
          <div className="relative p-8 md:p-12">
         
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
                <span className="bg-linear-to-r from-white via-modrinth-green to-blue-400 bg-clip-text text-transparent">
                  {t('home.startAdventure')}
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {t('home.startLead')} <span className="text-modrinth-green font-semibold">{t('home.startLeadEm')}</span>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <Link href="/mods" className="relative card-glass bg-modrinth-dark rounded-2xl p-6 pt-12">
                <div className="absolute -top-8 left-6 w-16 h-16 bg-modrinth-darkest rounded-2xl flex items-center justify-center z-10" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                  <svg className="w-8 h-8 text-modrinth-green" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 3L4 14h7v7l9-11h-7V3z"/>
                  </svg>
                </div>
                <div>
                  <CategoryTitle title={t('home.catMods')} count={categoryTotals?.mod} tone="modrinth-green" />
                  <p className="text-sm text-gray-400">{t('home.catModsDesc')}</p>
                </div>
              </Link>

              <Link href="/plugins" className="relative card-glass bg-modrinth-dark rounded-2xl p-6 pt-12">
                <div className="absolute -top-8 left-6 w-16 h-16 bg-modrinth-darkest rounded-2xl flex items-center justify-center z-10" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <CategoryTitle title={t('home.catPlugins')} count={categoryTotals?.plugin} tone="blue" />
                  <p className="text-sm text-gray-400">{t('home.catPluginsDesc')}</p>
                </div>
              </Link>

              <Link href="/shaders" className="relative card-glass bg-modrinth-dark rounded-2xl p-6 pt-12">
                <div className="absolute -top-8 left-6 w-16 h-16 bg-modrinth-darkest rounded-2xl flex items-center justify-center z-10" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <CategoryTitle title={t('home.catShaders')} count={categoryTotals?.shader} tone="cyan" />
                  <p className="text-sm text-gray-400">{t('home.catShadersDesc')}</p>
                </div>
              </Link>

              <Link href="/resourcepacks" className="relative card-glass bg-modrinth-dark rounded-2xl p-6 pt-12">
                <div className="absolute -top-8 left-6 w-16 h-16 bg-modrinth-darkest rounded-2xl flex items-center justify-center z-10" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                  <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <CategoryTitle
                    title={t('home.catRp')}
                    count={categoryTotals?.resourcepack}
                    tone="purple"
                  />
                  <p className="text-sm text-gray-400">{t('home.catRpDesc')}</p>
                </div>
              </Link>

              <Link href="/datapacks" className="relative card-glass bg-modrinth-dark rounded-2xl p-6 pt-12">
                <div className="absolute -top-8 left-6 w-16 h-16 bg-modrinth-darkest rounded-2xl flex items-center justify-center z-10" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                  <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div>
                  <CategoryTitle title={t('home.catDp')} count={categoryTotals?.datapack} tone="orange" />
                  <p className="text-sm text-gray-400">{t('home.catDpDesc')}</p>
                </div>
              </Link>

              <Link href="/modpacks" className="relative card-glass bg-modrinth-dark rounded-2xl p-6 pt-12">
                <div className="absolute -top-8 left-6 w-16 h-16 bg-modrinth-darkest rounded-2xl flex items-center justify-center z-10" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <CategoryTitle title={t('home.catMp')} count={categoryTotals?.modpack} tone="red" />
                  <p className="text-sm text-gray-400">{t('home.catMpDesc')}</p>
                </div>
              </Link>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                {t('home.filesChecked')}
              </p>
            </div>
            </div>
          </div>

          <div className="text-center mb-16 pt-8">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              {t('home.playersTitle')}
            </h2>
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold mb-4 glass-edge minecraft-players-badge" style={{backgroundOrigin: 'border-box', backgroundClip: 'border-box'}}>
              {t('home.forPlayers')}
            </div>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              {t('home.playersLead')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="card-glass bg-modrinth-dark rounded-2xl p-8">
                <div className="text-center mb-6">
                  <h4 className="text-white font-semibold text-lg mb-2">{t('home.platforms')}</h4>
                  <p className="text-gray-400 text-sm">{t('home.platformsLead')}</p>
                </div>
                <HomeLoaders kind="mods" alsoLabel={t('home.alsoLoaders')} />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {t('home.anyLoader')}
              </h3>
              <p className="text-gray-300 text-lg mb-6">
                {t('home.anyLoaderLead')}
              </p>
              <div className="space-y-4">
                <CheckItem>
                  <span className="flex flex-col gap-1">
                    <span>{t('home.mcRange', { from: fromVersion, to: toVersion })}</span>
                    {snapshotVersion ? (
                      <span className="text-gray-400 text-sm">{t('home.mcSnapshot', { version: snapshotVersion })}</span>
                    ) : null}
                  </span>
                </CheckItem>
                <CheckItem>{t('home.autoFilter')}</CheckItem>
                <CheckItem>{t('home.allContentTypes')}</CheckItem>
                <CheckItem>{t('home.updateAlerts')}</CheckItem>
                <CheckItem>{t('home.rememberProfile')}</CheckItem>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative home-section">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              {t('home.pluginsTitle')}
            </h2>
            <div className="inline-block bg-yellow-100 dark:bg-yellow-500/20 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm font-semibold mb-4 glass-edge">
              {t('home.forServerOwners')}
            </div>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              {t('home.pluginsLead')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                {t('home.allServerPlatforms')}
              </h3>
              <p className="text-gray-300 text-lg mb-6">
                {t('home.allServerPlatformsLead')}
              </p>
              <div className="space-y-4">
                <CheckItem tone="server">{t('home.paperSpigot')}</CheckItem>
                <CheckItem tone="server">{t('home.modernPlatforms')}</CheckItem>
                <CheckItem tone="server">{t('home.pluginVersions')}</CheckItem>
                <CheckItem tone="server">{t('home.pluginUpdateAlerts')}</CheckItem>
                <CheckItem tone="server">{t('home.rememberServer')}</CheckItem>
              </div>
            </div>
            <div className="card-glass bg-modrinth-dark rounded-2xl p-8">
              <div className="text-center mb-6">
                <h4 className="text-white font-semibold text-lg mb-2">{t('home.serverPlatforms')}</h4>
                <p className="text-gray-400 text-sm">{t('home.serverCores')}</p>
              </div>
              <HomeLoaders kind="plugins" alsoLabel={t('home.alsoLoaders')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
