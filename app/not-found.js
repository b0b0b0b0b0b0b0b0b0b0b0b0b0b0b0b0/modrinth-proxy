import Link from 'next/link'
import { getRequestT } from '@/lib/i18n/server'
import NotFoundScene from './NotFoundScene'

export async function generateMetadata() {
  const { t } = getRequestT()
  return {
    title: t('notfound.metaTitle'),
    description: t('notfound.metaDesc'),
  }
}

const SECTIONS = [
  { href: '/mods', key: 'nav.mods' },
  { href: '/plugins', key: 'nav.plugins' },
  { href: '/resourcepacks', key: 'nav.resourcepacks' },
  { href: '/shaders', key: 'nav.shaders' },
  { href: '/modpacks', key: 'nav.modpacks' },
  { href: '/datapacks', key: 'nav.datapacks' },
]

export default function NotFound() {
  const { t } = getRequestT()
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-xl text-center">
        <NotFoundScene
          label={`404 — ${t('notfound.title')}`}
          soundLabels={{ on: t('notfound.soundOn'), off: t('notfound.soundOff') }}
        />

        <h2 className="mt-10 text-2xl font-bold text-white md:text-3xl">{t('notfound.title')}</h2>
        <p className="mx-auto mt-3 max-w-md text-base text-gray-400">{t('notfound.lead')}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-modrinth-green/40 px-3 py-1.5 text-sm font-semibold text-modrinth-green transition-colors hover:bg-modrinth-green/10"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
              <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />
            </svg>
            {t('notfound.home')}
          </Link>
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-lg border border-gray-800 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:border-modrinth-green/50 hover:text-white"
            >
              {t(section.key)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
