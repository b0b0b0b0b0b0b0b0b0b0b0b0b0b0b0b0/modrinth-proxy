'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useMinecraftVersions } from './hooks/useMinecraftVersions'
import { buildHomeModsVersionCopy } from '@/lib/minecraftVersionRange'
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
  const words = Array.isArray(rotate) && rotate.length ? rotate : ['модов', 'плагинов', 'шейдеров', 'ресурспаков', 'датапаков']
  const projectsShown =
    platformStats?.projects > 0 ? platformStats.projects : STATS_FALLBACK.projects
  const filesShown =
    platformStats?.files > 0 ? platformStats.files : STATS_FALLBACK.files
  const authorsShown =
    platformStats?.authors > 0 ? platformStats.authors : STATS_FALLBACK.authors
  const versionsShown =
    platformStats?.versions > 0 ? platformStats.versions : STATS_FALLBACK.versions
  const { release, full } = useMinecraftVersions()
  const { stableLine, snapshotLine } = useMemo(
    () => buildHomeModsVersionCopy(release, full),
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
                  backgroundColor: 'var(--color-green-bright)',
                  backgroundImage: 'linear-gradient(180deg, var(--color-blue-light) 0%, var(--color-green-bright) 60%)',
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
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-base font-bold mb-4 border minecraft-players-badge" style={{backgroundOrigin: 'border-box', backgroundClip: 'border-box'}}>
              <span>{t('home.forPlayers')}</span>
            </div>
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
                <div className="flex items-center gap-3">
                 
                  <span className="text-gray-300">{t('home.currentFiles')}</span>
                </div>
                <div className="flex items-center gap-3">
                 
                  <span className="text-gray-300">{t('home.directLinks')}</span>
                </div>
                <div className="flex items-center gap-3">
                  
                  <span className="text-gray-300">{t('home.noStore')}</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-8">
              <div className="text-center mb-6">
                <h4 className="text-white font-semibold text-lg mb-2">{t('home.statsTitle')}</h4>
                <p className="text-gray-400 text-sm">{t('home.statsFromApi')}</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-black text-modrinth-green mb-2">
                    {compactCountEn(projectsShown)}
                  </div>
                  <div className="text-gray-300 text-sm">{t('home.projects')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-blue-400 mb-2">
                    {compactCountEn(filesShown)}
                  </div>
                  <div className="text-gray-300 text-sm">{t('home.files')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-purple-400 mb-2">
                    {compactCountEn(authorsShown)}
                  </div>
                  <div className="text-gray-300 text-sm">{t('home.authors')}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-orange-400 mb-2">
                    {compactCountEn(versionsShown)}
                  </div>
                  <div className="text-gray-300 text-sm">{t('home.versions')}</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <div className="text-2xl md:text-3xl font-black text-emerald-400">100%</div>
                <div className="text-gray-300 text-sm mt-1">{t('home.free')}</div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <h4 className="text-white font-semibold text-lg mb-2">{t('home.platforms')}</h4>
                  <p className="text-gray-400 text-sm">{t('home.platformsLead')}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
                  <Link href="/mods?g=categories%3Aforge" className="relative text-center p-4 pt-12 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-modrinth-darkest rounded-lg flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                      <svg className="w-6 h-6 text-orange-500" xmlSpace="preserve" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="1.5" clipRule="evenodd" viewBox="0 0 24 24">
                        <path fill="none" d="M0 0h24v24H0z"></path>
                        <path fill="none" stroke="currentColor" strokeWidth="2" d="M2 7.5h8v-2h12v2s-7 3.4-7 6 3.1 3.1 3.1 3.1l.9 3.9H5l1-4.1s3.8.1 4-2.9c.2-2.7-6.5-.7-8-6Z"></path>
                      </svg>
                    </div>
                    <div className="text-white font-medium text-sm">Forge</div>
                  </Link>
                  <Link href="/mods?g=categories%3Afabric" className="relative text-center p-4 pt-12 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-modrinth-darkest rounded-lg flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                      <svg className="w-6 h-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round" clipRule="evenodd" viewBox="0 0 24 24">
                        <path fill="none" d="M0 0h24v24H0z"></path>
                        <path fill="none" stroke="currentColor" strokeWidth="23" d="m820 761-85.6-87.6c-4.6-4.7-10.4-9.6-25.9 1-19.9 13.6-8.4 21.9-5.2 25.4 8.2 9 84.1 89 97.2 104 2.5 2.8-20.3-22.5-6.5-39.7 5.4-7 18-12 26-3 6.5 7.3 10.7 18-3.4 29.7-24.7 20.4-102 82.4-127 103-12.5 10.3-28.5 2.3-35.8-6-7.5-8.9-30.6-34.6-51.3-58.2-5.5-6.3-4.1-19.6 2.3-25 35-30.3 91.9-73.8 111.9-90.8" transform="matrix(.08671 0 0 .0867 -49.8 -56)"></path>
                      </svg>
                    </div>
                    <div className="text-white font-medium text-sm">Fabric</div>
                  </Link>
                  <Link href="/mods?g=categories%3Aquilt" className="relative text-center p-4 pt-12 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-modrinth-darkest rounded-lg flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                      <svg className="w-6 h-6 text-purple-400" xmlSpace="preserve" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="2" clipRule="evenodd" viewBox="0 0 24 24">
                        <defs>
                          <path id="quilt" fill="none" stroke="currentColor" strokeWidth="65.6" d="M442.5 233.9c0-6.4-5.2-11.6-11.6-11.6h-197c-6.4 0-11.6 5.2-11.6 11.6v197c0 6.4 5.2 11.6 11.6 11.6h197c6.4 0 11.6-5.2 11.6-11.7v-197Z"></path>
                        </defs>
                        <path fill="none" d="M0 0h24v24H0z"></path>
                        <use href="#quilt" strokeWidth="65.6" transform="matrix(.03053 0 0 .03046 -3.2 -3.2)"></use>
                        <use href="#quilt" strokeWidth="65.6" transform="matrix(.03053 0 0 .03046 -3.2 7)"></use>
                        <use href="#quilt" strokeWidth="65.6" transform="matrix(.03053 0 0 .03046 6.9 -3.2)"></use>
                        <path fill="none" stroke="currentColor" strokeWidth="70.4" d="M442.5 234.8c0-7-5.6-12.5-12.5-12.5H234.7c-6.8 0-12.4 5.6-12.4 12.5V430c0 6.9 5.6 12.5 12.4 12.5H430c6.9 0 12.5-5.6 12.5-12.5V234.8Z" transform="rotate(45 3.5 24) scale(.02843 .02835)"></path>
                      </svg>
                    </div>
                    <div className="text-white font-medium text-sm">Quilt</div>
                  </Link>
                  <Link href="/mods?g=categories%3Aneoforge" className="relative text-center p-4 pt-12 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-modrinth-darkest rounded-lg flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                      <svg className="w-6 h-6 text-modrinth-green-light" enableBackground="new 0 0 24 24" version="1.1" viewBox="0 0 24 24" xmlSpace="preserve">
                        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                          <path d="m12 19.2v2m0-2v2"></path>
                          <path d="m8.4 1.3c0.5 1.5 0.7 3 0.1 4.6-0.2 0.5-0.9 1.5-1.6 1.5m8.7-6.1c-0.5 1.5-0.7 3-0.1 4.6 0.2 0.6 0.9 1.5 1.6 1.5"></path>
                          <path d="m3.6 15.8h-1.7m18.5 0h1.7"></path>
                          <path d="m3.2 12.1h-1.7m19.3 0h1.8"></path>
                          <path d="m8.1 12.7v1.6m7.8-1.6v1.6"></path>
                          <path d="m10.8 18h1.2m0 1.2-1.2-1.2m2.4 0h-1.2m0 1.2 1.2-1.2"></path>
                          <path d="m4 9.7c-0.5 1.2-0.8 2.4-0.8 3.7 0 3.1 2.9 6.3 5.3 8.2 0.9 0.7 2.2 1.1 3.4 1.1m0.1-17.8c-1.1 0-2.1 0.2-3.2 0.7m11.2 4.1c0.5 1.2 0.8 2.4 0.8 3.7 0 3.1-2.9 6.3-5.3 8.2-0.9 0.7-2.2 1.1-3.4 1.1m-0.1-17.8c1.1 0 2.1 0.2 3.2 0.7"></path>
                          <path d="m4 9.7c-0.2-1.8-0.3-3.7 0.5-5.5s2.2-2.6 3.9-3m11.6 8.5c0.2-1.9 0.3-3.7-0.5-5.5s-2.2-2.6-3.9-3"></path>
                          <path d="m12 21.2-2.4 0.4m2.4-0.4 2.4 0.4"></path>
                        </g>
                      </svg>
                    </div>
                    <div className="text-white font-medium text-sm">NeoForge</div>
                  </Link>
                  <Link href="/mods?g=categories%3Ababric" className="relative text-center p-4 pt-12 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-modrinth-darkest rounded-lg flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                      <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none">
                        <path d="M12.35 5.89001L12.34 5.90001C10.59 7.37001 5.67003 11.13 2.64003 13.76C2.09003 14.23 1.97003 15.38 2.44003 15.93C4.24003 17.97 6.24003 20.2 6.89003 20.97C7.52003 21.69 8.91003 22.39 10 21.49C11.8 20 16.78 16.01 19.62 13.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M19.59 13.66C19.34 13.33 18.02 11.53 19.05 10.25C19.52 9.63998 20.61 9.20998 21.3 9.98998C21.87 10.62 22.23 11.55 21.01 12.56C20.66 12.85 20.18 13.24 19.62 13.7C19.61 13.69 19.6 13.67 19.59 13.66Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M19.63 13.71L19.62 13.7C19.61 13.69 19.6 13.67 19.59 13.66C18.65 12.59 14.44 8.13999 12.34 5.89999C11.76 5.28999 11.33 4.83999 11.18 4.66999C10.91 4.36999 9.91004 3.64999 11.63 2.46999C12.98 1.54999 13.48 1.97999 13.88 2.37999L21.3 9.97999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M10.6352 14.7743C10.7992 14.517 10.8811 14.2194 10.8811 13.8978C10.8811 12 9.2582 12 8.06967 12C7.61886 12 7.25 12.3538 7.25 12.8041V17.1948C7.25 17.637 7.61886 17.9989 8.06967 17.9989C8.1552 17.9965 9.54283 18.0068 9.57789 17.9909C10.3894 17.9668 11.25 17.6531 11.25 15.9886C11.25 15.7232 11.1762 15.1925 10.6352 14.7743ZM9.61886 13.8978C9.61886 14.0506 9.53686 14.1953 9.40574 14.2918H9.39753C9.29097 14.3722 9.15164 14.4205 9.00411 14.4205H8.47951V13.3831C8.56539 13.3831 8.92616 13.3832 9.00411 13.3831C9.34015 13.3831 9.61886 13.6163 9.61886 13.8978ZM9.29918 16.7927H8.47951V15.7554C8.68401 15.7555 9.09478 15.7553 9.29918 15.7554C9.71537 15.7517 10.0548 16.1404 9.85655 16.4871C9.7664 16.6641 9.54507 16.7927 9.29918 16.7927Z" fill="currentColor" stroke="currentColor" strokeWidth="0.25"></path>
                      </svg>
                    </div>
                    <div className="text-white font-medium text-sm">Babric</div>
                  </Link>
                  <Link href="/mods?g=categories%3Arift" className="relative text-center p-4 pt-12 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-modrinth-darkest rounded-lg flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                      <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" xmlSpace="preserve">
                        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2.7 6.6v10.8l9.3 5.3 9.3-5.3V6.6L12 1.3zm0 0L12 12m9.3-5.4L12 12m0 10.7V12"></path>
                      </svg>
                    </div>
                    <div className="text-white font-medium text-sm">Rift</div>
                  </Link>
                </div>
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
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-modrinth-green rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1 text-gray-300">
                    <span>{stableLine}</span>
                    {snapshotLine ? <span className="text-gray-400 text-sm">{snapshotLine}</span> : null}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-modrinth-green rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                  <span className="text-gray-300">{t('home.autoFilter')}</span>
                </div>
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
            <div className="inline-block bg-yellow-100 dark:bg-yellow-500/20 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm font-semibold mb-4 border border-yellow-300/50 dark:border-transparent">
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
                <div className="flex items-center gap-3">
                
                  <span className="text-gray-300">{t('home.paperSpigot')}</span>
                </div>
                <div className="flex items-center gap-3">
                  
                  <span className="text-gray-300">{t('home.modernPlatforms')}</span>
                </div>
                <div className="flex items-center gap-3">
                 
                  <span className="text-gray-300">{t('home.pluginVersions')}</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-8">
              <div className="text-center mb-6">
                <h4 className="text-white font-semibold text-lg mb-2">{t('home.serverPlatforms')}</h4>
                <p className="text-gray-400 text-sm">{t('home.serverCores')}</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
                <Link href="/plugins?g=categories%3Abukkit" className="relative text-center p-4 pt-12 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-modrinth-darkest rounded-lg flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                    <svg className="w-6 h-6 text-yellow-500" viewBox="0 0 292 319" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12,109.5L12,155L34.5,224L57.5,224L57.5,271L81,294L160,294L160,172L259.087,172L265,155L265,109.5M12,109.5L12,64L34.5,64L34.5,41L81,17L195.5,17L241,41L241,64L265,64L265,109.5M12,109.5L81,109.5L81,132L195.5,132L195.5,109.5L265,109.5M264.087,204L264.087,244M207.5,272L207.5,312M250,272L250,312L280,312L280,272L250,272ZM192.5,204L192.5,244L222.5,244L222.5,204L192.5,204Z" strokeWidth="24"></path>
                    </svg>
                  </div>
                  <div className="text-white font-medium text-sm">Bukkit</div>
                </Link>
                <Link href="/plugins?g=categories%3Afolia" className="relative text-center p-4 pt-12 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-modrinth-darkest rounded-lg flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                    <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
                    </svg>
                  </div>
                  <div className="text-white font-medium text-sm">Folia</div>
                </Link>
                <Link href="/plugins?g=categories%3Apaper" className="relative text-center p-4 pt-12 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-modrinth-darkest rounded-lg flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                    <svg className="w-6 h-6 text-blue-500" xmlSpace="preserve" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="1.5" clipRule="evenodd" viewBox="0 0 24 24">
                      <path fill="none" d="M0 0h24v24H0z"></path>
                      <path fill="none" stroke="currentColor" strokeWidth="2" d="m12 18 6 2 3-17L2 14l6 2"></path>
                      <path stroke="currentColor" strokeWidth="2" d="m9 21-1-5 4 2-3 3Z"></path>
                      <path fill="currentColor" d="m12 18-4-2 10-9-6 11Z"></path>
                    </svg>
                  </div>
                  <div className="text-white font-medium text-sm">Paper</div>
                </Link>
                <Link href="/plugins?g=categories%3Apurpur" className="relative text-center p-4 pt-12 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-modrinth-darkest rounded-lg flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                    <svg className="w-6 h-6 text-purple-500" xmlSpace="preserve" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="1.5" clipRule="evenodd" viewBox="0 0 24 24">
                      <defs>
                        <path id="purpur" fill="none" stroke="currentColor" strokeWidth="1.68" d="m264 41.95 8-4v8l-8 4v-8Z"></path>
                      </defs>
                      <path fill="none" d="M0 0h24v24H0z"></path>
                      <path fill="none" stroke="currentColor" strokeWidth="1.77" d="m264 29.95-8 4 8 4.42 8-4.42-8-4Z" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"></path>
                      <path fill="none" stroke="currentColor" strokeWidth="1.77" d="m272 38.37-8 4.42-8-4.42" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"></path>
                      <path fill="none" stroke="currentColor" strokeWidth="1.77" d="m260 31.95 8 4.21V45" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"></path>
                      <path fill="none" stroke="currentColor" strokeWidth="1.77" d="M260 45v-8.84l8-4.21" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"></path>
                      <use href="#purpur" strokeWidth="1.68" transform="matrix(1.125 0 0 1.2569 -285 -40.78)"></use>
                      <use href="#purpur" strokeWidth="1.68" transform="matrix(-1.125 0 0 1.2569 309 -40.78)"></use>
                    </svg>
                  </div>
                  <div className="text-white font-medium text-sm">Purpur</div>
                </Link>
                <Link href="/plugins?g=categories%3Aspigot" className="relative text-center p-4 pt-12 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-modrinth-darkest rounded-lg flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                    <svg className="w-6 h-6 text-orange-500" viewBox="0 0 332 284" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="24">
                      <path d="M147.5,27l27,-15l27.5,15l66.5,0l0,33.5l-73,-0.912l0,45.5l26,-0.088l0,31.5l-12.5,0l0,15.5l16,21.5l35,0l0,-21.5l35.5,0l0,21.5l24.5,0l0,55.5l-24.5,0l0,17l-35.5,0l0,-27l-35,0l-55.5,14.5l-67.5,-14.5l-15,14.5l18,12.5l-3,24.5l-41.5,1.5l-48.5,-19.5l6,-19l24.5,-4.5l16,-41l79,-36l-7,-15.5l0,-31.5l23.5,0l0,-45.5l-73.5,0l0,-32.5l67,0Z"></path>
                    </svg>
                  </div>
                  <div className="text-white font-medium text-sm">Spigot</div>
                </Link>
                <Link href="/plugins?g=categories%3Asponge" className="relative text-center p-4 pt-12 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-modrinth-darkest rounded-lg flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                    <svg className="w-6 h-6 text-cyan-500" viewBox="0 0 268 313" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="24">
                      <path d="M84.299,35.5c-5.547,-13.776 -19.037,-23.5 -34.799,-23.5c-20.711,0 -37.5,16.789 -37.5,37.5c-0,20.711 16.789,37.5 37.5,37.5c20.711,0 37.5,-16.789 37.5,-37.5c0,-4.949 -0.959,-9.674 -2.701,-14Zm0,0l44.701,-8.5l28,65m0,0l-99,20l-18,47.5l15.5,37l-25,32.5l0,72l222.5,0l2.5,-72l-33.5,-117l-65,-20Zm-60,65l0,15m94,-13.5l0,13.5m-67.5,45l46,0l-12.5,50.5l-14.5,0l-19,-50.5Z"></path>
                    </svg>
                  </div>
                  <div className="text-white font-medium text-sm">Sponge</div>
                </Link>
              </div>
            </div>
          </div>

        <div className="relative overflow-hidden animate-fade-in-up animation-delay-2400">
          
          <div className="relative p-8 md:p-12">
         
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 leading-tight">
                <span className="bg-gradient-to-r from-white via-modrinth-green to-blue-400 bg-clip-text text-transparent">
                  {t('home.startAdventure')}
                </span>
              </h2>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                {t('home.startLead')} <span className="text-modrinth-green font-semibold">{t('home.startLeadEm')}</span>
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <Link href="/mods" className="relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 pt-12">
                <div className="absolute -top-8 left-6 w-16 h-16 bg-modrinth-darkest rounded-2xl flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                  <svg className="w-8 h-8 text-modrinth-green" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 3L4 14h7v7l9-11h-7V3z"/>
                  </svg>
                </div>
                <div>
                  <CategoryTitle title={t('home.catMods')} count={categoryTotals?.mod} tone="modrinth-green" />
                  <p className="text-sm text-gray-400">{t('home.catModsDesc')}</p>
                </div>
              </Link>

              <Link href="/plugins" className="relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 pt-12">
                <div className="absolute -top-8 left-6 w-16 h-16 bg-modrinth-darkest rounded-2xl flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <CategoryTitle title={t('home.catPlugins')} count={categoryTotals?.plugin} tone="blue" />
                  <p className="text-sm text-gray-400">{t('home.catPluginsDesc')}</p>
                </div>
              </Link>

              <Link href="/shaders" className="relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 pt-12">
                <div className="absolute -top-8 left-6 w-16 h-16 bg-modrinth-darkest rounded-2xl flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                  <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <CategoryTitle title={t('home.catShaders')} count={categoryTotals?.shader} tone="cyan" />
                  <p className="text-sm text-gray-400">{t('home.catShadersDesc')}</p>
                </div>
              </Link>

              <Link href="/resourcepacks" className="relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 pt-12">
                <div className="absolute -top-8 left-6 w-16 h-16 bg-modrinth-darkest rounded-2xl flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
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

              <Link href="/datapacks" className="relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 pt-12">
                <div className="absolute -top-8 left-6 w-16 h-16 bg-modrinth-darkest rounded-2xl flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
                  <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div>
                  <CategoryTitle title={t('home.catDp')} count={categoryTotals?.datapack} tone="orange" />
                  <p className="text-sm text-gray-400">{t('home.catDpDesc')}</p>
                </div>
              </Link>

              <Link href="/modpacks" className="relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-6 pt-12">
                <div className="absolute -top-8 left-6 w-16 h-16 bg-modrinth-darkest rounded-2xl flex items-center justify-center z-10 shadow-lg" style={{boxShadow: '2px 2px 12px rgba(0,0,0,0.16), inset 2px 2px 32px var(--shadow-color)'}}>
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
        </div>
      </div>
    </div>
  )
}
