import Image from 'next/image'
import { MINEPLUGINCHECK_BOT_URL } from '@/lib/minePluginCheckBotUrl'
import RichText from '@/app/components/RichText'
import { getRequestT } from '@/lib/i18n/server'

export async function generateMetadata() {
  const { t } = getRequestT()
  return {
    title: t('bot.metaTitle'),
    description: t('bot.metaDesc'),
    openGraph: {
      title: t('bot.ogTitle'),
      description: t('bot.ogDesc'),
    },
  }
}

export default function ProtectBotLandingPage() {
  const { t } = getRequestT()
  return (
    <div className="min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 animate-fade-in pt-4 text-center">
          <h1 className="mb-6 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-6xl">
            {t('bot.h1')}
          </h1>
          <p className="mx-auto max-w-2xl text-gray-400 md:text-lg leading-relaxed">
            <RichText text={t('bot.intro')} />
          </p>
        </div>

        <div className="animate-fade-in-up space-y-8">
          <section className="rounded-2xl border border-modrinth-green/35 bg-gradient-to-br from-modrinth-green/[0.12] via-gray-900/90 to-transparent p-8 shadow-xl md:p-10">
            <h2 className="mb-6 text-xl font-bold text-white md:text-2xl">{t('bot.service')}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-modrinth-green/25 bg-black/25 p-5">
                <h3 className="mb-2 font-semibold text-modrinth-green-light">{t('bot.free')}</h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  {t('bot.freeD')}
                </p>
              </div>
              <div className="rounded-xl border border-modrinth-green/25 bg-black/25 p-5">
                <h3 className="mb-2 font-semibold text-modrinth-green-light">{t('bot.noStore')}</h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  {t('bot.noStoreD')}
                </p>
              </div>
              <div className="rounded-xl border border-modrinth-green/25 bg-black/25 p-5">
                <h3 className="mb-2 font-semibold text-modrinth-green-light">{t('bot.report')}</h3>
                <p className="text-sm leading-relaxed text-gray-400">
                  <RichText text={t('bot.reportD')} strongClassName="text-gray-300" />
                </p>
              </div>
            </div>
            <p className="mt-6 border-t border-modrinth-green/20 pt-6 text-xs leading-relaxed text-gray-500">
              {t('bot.deepNote')}
            </p>
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-sky-500/25 bg-gradient-to-br from-sky-500/15 via-gray-900/80 to-blue-950/40 p-8 shadow-2xl md:p-12">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl"></div>
            <div className="relative">
              <h2 className="mb-6 flex flex-wrap items-center gap-4 text-2xl font-bold text-white md:text-3xl">
                <div className="rounded-xl border border-sky-400/40 bg-sky-500/20 p-3">
                  <svg className="h-10 w-10 text-sky-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                {t('bot.jar')}
              </h2>
              <div className="space-y-5 text-gray-200 md:text-[17px] md:leading-relaxed">
                <p>
                  <RichText text={t('bot.jarP1')} />
                </p>
                <p>
                  <RichText text={t('bot.jarP2')} />
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/20 via-gray-900/85 to-transparent p-8 shadow-xl md:p-10">
            <h2 className="mb-4 text-xl font-bold text-white md:text-2xl">{t('bot.chat')}</h2>
            <p className="mb-4 text-gray-300 leading-relaxed">
              <RichText text={t('bot.chatP1')} />
            </p>
            <p className="mb-4 text-gray-300 leading-relaxed">
              {t('bot.chatP2')}
            </p>
            <p className="mb-6 text-sm text-gray-500">
              {t('bot.chatP3')}
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-700 bg-[#0d0f14] p-4">
              <pre className="font-mono text-[10px] leading-snug text-gray-400 whitespace-pre md:text-[11px]" tabIndex={0}>
              {t('bot.sample')}
              </pre>
            </div>
            <p className="mt-4 text-xs text-gray-600">
              {t('bot.sampleNote')}
            </p>
          </section>

          <section className="relative overflow-hidden rounded-2xl border border-indigo-600/35 bg-gradient-to-br from-indigo-950/50 via-gray-900/80 to-purple-950/35 p-8 shadow-2xl md:p-10">
            <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-indigo-500/15 blur-3xl"></div>
            <div className="relative">
              <h2 className="mb-2 text-2xl font-bold text-white md:text-3xl">{t('bot.deep')}</h2>
              <p className="mb-6 text-gray-400">
                {t('bot.deepLead')}
              </p>
              <div className="space-y-5 text-gray-300">
                <div>
                  <h3 className="mb-2 font-semibold text-indigo-200">{t('bot.nn')}</h3>
                  <p>
                    <RichText text={t('bot.nnD')} />
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-indigo-200">{t('bot.how')}</h3>
                  <ul className="ml-4 list-disc space-y-2 marker:text-indigo-400">
                    <li>{t('bot.how1')}</li>
                    <li>{t('bot.how2')}</li>
                    <li>{t('bot.how3')}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-indigo-200">{t('bot.goes')}</h3>
                  <ul className="ml-4 list-disc space-y-2 marker:text-indigo-400">
                    <li>{t('bot.goes1')}</li>
                    <li>{t('bot.goes2')}</li>
                  </ul>
                </div>
                <p className="rounded-lg border border-indigo-500/25 bg-indigo-950/40 p-4 text-sm">
                  <RichText text={t('bot.settings')} />
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-modrinth-green/25 bg-gradient-to-br from-modrinth-green/10 via-gray-900/90 to-gray-950/90 p-8 shadow-2xl md:p-10">
            <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-white md:text-3xl">
              <svg className="h-8 w-8 text-modrinth-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('bot.policy')}
            </h2>
            <p className="mb-6 text-lg text-gray-200">
              {t('bot.policyLead')}
            </p>
            <ul className="space-y-4 text-gray-300">
              <li className="flex gap-3">
                <span className="text-modrinth-green">•</span>
                <span>{t('bot.p1')}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-modrinth-green">•</span>
                <span>
                  <RichText text={t('bot.p2')} />
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-modrinth-green">•</span>
                <span>{t('bot.p3')}</span>
              </li>
              <li className="flex gap-3">
                <span className="text-modrinth-green">•</span>
                <span>
                  {t('bot.p4')}
                </span>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-purple-700/35 bg-gradient-to-br from-purple-950/40 via-gray-900/75 to-blue-950/25 p-8 md:p-10">
            <h2 className="mb-4 text-xl font-bold text-white md:text-2xl">{t('bot.confused')}</h2>
            <p className="mb-4 text-gray-300">
              {t('bot.confused1')}
            </p>
            <p className="mb-4 text-gray-300">
              <RichText text={t('bot.confused2')} />
            </p>
          </section>

          <section className="flex flex-col items-center justify-center px-4 py-10 md:py-14">
            <a
              href={MINEPLUGINCHECK_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('bot.tgAria')}
              className="group inline-flex items-center gap-4 rounded-2xl border border-modrinth-green/45 bg-modrinth-green px-8 py-5 text-[17px] font-bold tracking-tight text-white shadow-xl shadow-black/35 transition hover:border-modrinth-green-light/80 hover:bg-modrinth-green-light hover:text-gray-950 hover:shadow-modrinth-green/20 active:scale-[0.99] md:px-12 md:py-6 md:text-lg"
            >
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-2 ring-white/35 md:h-14 md:w-14">
                <Image
                  src="/images/bot_logo.jpg"
                  alt=""
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              </span>
              {t('bot.tg')}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                aria-hidden
                className="h-6 w-6 shrink-0 opacity-90 transition-opacity group-hover:opacity-100 md:h-7 md:w-7"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>
          </section>

          <section className="rounded-2xl border border-gray-600/60 bg-gray-900/40 p-6 md:p-8">
            <h2 className="mb-3 text-lg font-bold text-gray-300 md:text-xl">{t('bot.rp')}</h2>
            <p className="text-[15px] leading-relaxed text-gray-500 md:text-base">
              {t('bot.rpD')}
            </p>
          </section>

          <section
            className="rounded-2xl border border-gray-700/80 bg-[var(--bg-tertiary)]/90 p-8 md:p-10"
            aria-labelledby="protect-bot-seo-heading"
          >
            <h2 id="protect-bot-seo-heading" className="mb-6 text-xl font-bold text-gray-900 dark:text-white md:text-2xl">
              {t('bot.why')}
            </h2>
            <div className="space-y-4 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300 md:text-base">
              <p>{t('bot.why1')}</p>
              <p>
                <RichText text={t('bot.why2')} strongClassName="text-gray-900 dark:text-white" />
              </p>
              <p>
                <RichText text={t('bot.why3')} strongClassName="text-gray-900 dark:text-white" />
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
