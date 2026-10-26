import { headers } from 'next/headers'
import { ArrowRight, EyeOff, Feather, MousePointerClick, Pin, Power, ShieldCheck, Target, UserRound, Zap } from 'lucide-react'
import { getRequestT } from '@/lib/i18n/server'
import { EXTENSION_STORES, detectBrowser } from '@/lib/browserDetect'
import { BROWSER_LABELS, ChromeIcon, FirefoxIcon } from '../components/BrowserIcons'
import ExtensionKitten from './ExtensionKitten'

export async function generateMetadata() {
  const { t } = getRequestT()
  return {
    title: t('ext.metaTitle'),
    description: t('ext.metaDesc'),
  }
}

function InstallButton({ family, label, highlighted, idSuffix, className = '' }) {
  const Logo = family === 'firefox' ? FirefoxIcon : ChromeIcon
  return (
    <a
      href={EXTENSION_STORES[family]}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-3 rounded-2xl px-5 py-3.5 text-base font-bold transition-all duration-300 hover:scale-[0.97] ${
        highlighted
          ? 'bg-modrinth-green text-black shadow-lg shadow-modrinth-green/25 hover:bg-modrinth-green-light'
          : 'border border-modrinth-green/40 bg-modrinth-green/10 text-gray-900 hover:border-modrinth-green/70 hover:bg-modrinth-green/20 dark:text-white'
      } ${className}`}
    >
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/90 p-0.5">
        <Logo className="h-6 w-6" id={`ff${idSuffix}`} />
      </span>
      <span className="min-w-0">{label}</span>
    </a>
  )
}

function StoreCard({ family, store, note, button, current, yours, idSuffix }) {
  const Logo = family === 'firefox' ? FirefoxIcon : ChromeIcon
  return (
    <div
      className={`relative flex flex-col rounded-3xl border p-5 transition-colors sm:p-7 ${
        current
          ? 'border-modrinth-green/60 bg-gradient-to-br from-modrinth-green/15 via-modrinth-dark to-modrinth-dark shadow-xl shadow-modrinth-green/10'
          : 'border-modrinth-border bg-modrinth-dark'
      }`}
    >
      {current ? (
        <span className="absolute right-4 top-4 rounded-full bg-modrinth-green px-2.5 py-1 text-xs font-bold text-black">{yours}</span>
      ) : null}
      <div className="mb-4 flex items-center gap-4 pr-20">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/90 p-1.5 shadow-md">
          <Logo className="h-11 w-11" id={`ffcard${idSuffix}`} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">{store}</h3>
      </div>
      <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base">{note}</p>
      <InstallButton family={family} label={button} highlighted={current} idSuffix={`store${idSuffix}`} className="w-full" />
    </div>
  )
}

const FEATURES = [
  ['redirect', Zap],
  ['keep', Target],
  ['account', UserRound],
  ['toggle', Power],
  ['privacy', EyeOff],
  ['light', Feather],
]

const STEPS = [
  ['s1', MousePointerClick],
  ['s2', Pin],
  ['s3', Zap],
]

const FAQ = ['1', '2', '3', '4', '5', '6']

export default function ExtensionPage() {
  const { t } = getRequestT()
  const requestHeaders = headers()
  const browser = detectBrowser(requestHeaders.get('user-agent'), requestHeaders.get('sec-ch-ua'))
  const chromiumLabel = browser.family === 'chromium' ? BROWSER_LABELS[browser.name] || BROWSER_LABELS.chrome : null
  const chromeButton = chromiumLabel ? t('ext.install.chromiumBtn', { browser: chromiumLabel }) : t('ext.install.chromeBtn')
  const firefoxButton = t('ext.install.firefoxBtn')
  const order = browser.family === 'chromium' ? ['chromium', 'firefox'] : ['firefox', 'chromium']
  const buttonLabel = (family) => (family === 'firefox' ? firefoxButton : chromeButton)

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:pt-10">
        <section className="relative mb-16 text-center sm:mb-24">
          <div className="pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-modrinth-green/10 blur-3xl sm:h-96 sm:w-[36rem]" />

          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-modrinth-green/30 bg-modrinth-green/10 px-3 py-1.5 text-sm font-semibold text-modrinth-green">
            <FirefoxIcon className="h-4 w-4" id="ffbadge" />
            {t('ext.badge')}
          </span>

          <h1 className="mb-5 text-4xl font-black leading-tight text-gray-900 dark:text-white sm:text-6xl md:text-7xl">
            {t('ext.h1')}
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400 sm:text-xl">
            {t('ext.lead')}
          </p>

          <div className="relative mx-auto mb-10 max-w-xl">
            <ExtensionKitten />
            <div className="relative rounded-2xl border border-modrinth-border bg-modrinth-dark p-3 text-left shadow-2xl sm:p-4">
              <div className="mb-3 flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 truncate rounded-xl bg-black/20 px-3 py-2 font-mono text-xs text-gray-500 line-through decoration-gray-500/60 sm:text-sm">
                  {t('ext.demoFrom')}
                </div>
                <ArrowRight className="mx-auto h-5 w-5 flex-shrink-0 rotate-90 animate-pulse text-modrinth-green sm:mx-0 sm:rotate-0" aria-hidden />
                <div className="min-w-0 flex-1 truncate rounded-xl bg-modrinth-green/15 px-3 py-2 font-mono text-xs font-semibold text-modrinth-green ring-1 ring-modrinth-green/40 sm:text-sm">
                  {t('ext.demoTo')}
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            {order.map((family) => (
              <InstallButton
                key={family}
                family={family}
                label={buttonLabel(family)}
                highlighted={browser.family === family}
                idSuffix={`hero${family}`}
              />
            ))}
          </div>
          <p className="mx-auto mt-4 max-w-xl text-sm text-gray-600 dark:text-gray-400">
            {browser.family
              ? t('ext.detected', { browser: browser.family === 'firefox' ? BROWSER_LABELS.firefox : chromiumLabel })
              : t('ext.unsupported')}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
            {[t('ext.tagFree'), t('ext.tagPrivate'), t('ext.tagMit')].map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-modrinth-border px-3 py-1 text-gray-600 dark:text-gray-300">
                <ShieldCheck className="h-3.5 w-3.5 text-modrinth-green" aria-hidden />
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className="mb-16 sm:mb-24">
          <h2 className="mb-3 text-center text-3xl font-black text-gray-900 dark:text-white sm:text-4xl">{t('ext.features.title')}</h2>
          <div className="mx-auto mb-10 h-1 w-16 rounded-full bg-modrinth-green/60" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(([key, Icon]) => (
              <div
                key={key}
                className="group rounded-2xl border border-modrinth-border bg-modrinth-dark p-5 transition-all duration-300 hover:-translate-y-1 hover:border-modrinth-green/40 sm:p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-modrinth-green/15 text-modrinth-green transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{t(`ext.features.${key}T`)}</h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{t(`ext.features.${key}D`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="install" className="mb-16 scroll-mt-24 sm:mb-24">
          <h2 className="mb-3 text-center text-3xl font-black text-gray-900 dark:text-white sm:text-4xl">{t('ext.install.title')}</h2>
          <p className="mb-10 text-center text-gray-600 dark:text-gray-400">{t('ext.install.lead')}</p>
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            {order.map((family) => (
              <StoreCard
                key={family}
                family={family}
                idSuffix={family}
                store={t(family === 'firefox' ? 'ext.install.firefoxStore' : 'ext.install.chromeStore')}
                note={t(family === 'firefox' ? 'ext.install.firefoxNote' : 'ext.install.chromeNote')}
                button={buttonLabel(family)}
                current={browser.family === family}
                yours={t('ext.install.yours')}
              />
            ))}
          </div>
        </section>

        <section className="mb-16 sm:mb-24">
          <h2 className="mb-3 text-center text-3xl font-black text-gray-900 dark:text-white sm:text-4xl">{t('ext.steps.title')}</h2>
          <p className="mb-10 text-center text-gray-600 dark:text-gray-400">{t('ext.steps.lead')}</p>
          <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
            {STEPS.map(([key, Icon], index) => (
              <li key={key} className="relative rounded-2xl border border-modrinth-border bg-modrinth-dark p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-modrinth-green text-lg font-black text-black">{index + 1}</span>
                  <Icon className="h-5 w-5 text-modrinth-green" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{t(`ext.steps.${key}t`)}</h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{t(`ext.steps.${key}d`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto mb-16 max-w-3xl sm:mb-24">
          <h2 className="mb-8 text-center text-3xl font-black text-gray-900 dark:text-white sm:text-4xl">{t('ext.faq.title')}</h2>
          <div className="space-y-3">
            {FAQ.map((n) => (
              <details key={n} className="group rounded-2xl border border-modrinth-border bg-modrinth-dark px-5 open:border-modrinth-green/40">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-gray-900 dark:text-white [&::-webkit-details-marker]:hidden">
                  {t(`ext.faq.q${n}`)}
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-modrinth-green/15 text-modrinth-green transition-transform duration-300 group-open:rotate-45">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeWidth={2.4} d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base">{t(`ext.faq.a${n}`)}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-modrinth-green/30 bg-gradient-to-br from-modrinth-green/15 via-modrinth-dark to-modrinth-dark p-6 text-center sm:p-12">
          <h2 className="mb-3 text-3xl font-black text-gray-900 dark:text-white sm:text-4xl">{t('ext.cta')}</h2>
          <p className="mx-auto mb-8 max-w-xl text-gray-600 dark:text-gray-400">{t('ext.ctaLead')}</p>
          <div className="mx-auto flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            {order.map((family) => (
              <InstallButton
                key={family}
                family={family}
                label={buttonLabel(family)}
                highlighted={browser.family === family}
                idSuffix={`cta${family}`}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
