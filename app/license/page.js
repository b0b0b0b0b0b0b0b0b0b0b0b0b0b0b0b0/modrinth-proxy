import Link from 'next/link'
import LicenseDocument from '@/app/components/LicenseDocument'
import {
  SITE_LICENSE_COPYRIGHT,
  SITE_LICENSE_GNU_URL,
  SITE_LICENSE_GITHUB_URL,
  SITE_LICENSE_ID,
  SITE_LICENSE_NAME,
  SITE_LICENSE_SUMMARY,
} from '@/lib/siteLicense'

export const metadata = {
  title: 'Лицензия проекта | ModrinthProxy',
  description:
    'ModrinthProxy распространяется под GNU Affero General Public License v3.0 (AGPL-3.0). Исходный код открыт; производные версии тоже должны оставаться открытыми.',
  openGraph: {
    title: 'Лицензия ModrinthProxy — AGPL-3.0',
    description: 'Открытый исходный код ModrinthProxy под лицензией AGPL-3.0.',
  },
}

const SUMMARY_STYLES = {
  allow: 'border-modrinth-green/30 bg-modrinth-green/[0.08]',
  require: 'border-amber-500/30 bg-amber-500/[0.08]',
  network: 'border-sky-500/30 bg-sky-500/[0.08]',
}

const SUMMARY_TITLE_STYLES = {
  allow: 'text-modrinth-green-light',
  require: 'text-amber-300',
  network: 'text-sky-300',
}

export default function LicensePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <header className="mb-10 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-modrinth-green/80">
          Открытый исходный код
        </p>
        <h1 className="mb-4 text-3xl font-extrabold text-white md:text-4xl">{SITE_LICENSE_NAME}</h1>
        <p className="mx-auto max-w-2xl text-gray-400 md:text-lg">
          Проект ModrinthProxy распространяется под лицензией{' '}
          <span className="font-mono text-modrinth-green">{SITE_LICENSE_ID}</span>. Copyright ©{' '}
          {SITE_LICENSE_COPYRIGHT}.
        </p>
      </header>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        {SITE_LICENSE_SUMMARY.map((block) => (
          <div
            key={block.title}
            className={`rounded-xl border p-5 ${SUMMARY_STYLES[block.tone]}`}
          >
            <h2 className={`mb-3 text-lg font-bold ${SUMMARY_TITLE_STYLES[block.tone]}`}>
              {block.title}
            </h2>
            <ul className="space-y-2 text-sm leading-relaxed text-gray-300">
              {block.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mb-8 flex flex-wrap justify-center gap-3">
        <a
          href={SITE_LICENSE_GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-4 py-2.5 text-sm font-medium text-white transition hover:border-modrinth-green/40 hover:text-modrinth-green-light"
        >
          Файл LICENSE на GitHub
        </a>
        <a
          href={SITE_LICENSE_GNU_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/80 px-4 py-2.5 text-sm font-medium text-white transition hover:border-modrinth-green/40 hover:text-modrinth-green-light"
        >
          Официальный текст (GNU)
        </a>
      </section>

      <LicenseDocument />

      <p className="mt-8 text-center text-sm text-gray-500">
        <Link href="/" className="text-modrinth-green transition hover:text-modrinth-green-light">
          ← На главную
        </Link>
      </p>
    </div>
  )
}
