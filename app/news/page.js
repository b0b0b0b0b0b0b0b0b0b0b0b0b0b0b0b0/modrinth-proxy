import Link from 'next/link'
import MarkCommitsRead from '../components/MarkCommitsRead'
import NewsUnder16Button from '../components/NewsUnder16Button'
import { ChangelogTimelineRow } from '../components/ChangelogVersionEntries'
import nextDynamic from 'next/dynamic'

const CommitMessage = nextDynamic(() => import('../components/CommitMessage'), {
  ssr: false,
  loading: () => (
    <div className="prose prose-invert prose-sm max-w-none mb-3 break-words opacity-50">
      Загрузка сообщения…
    </div>
  )
})

async function getCommits() {
  try {
    const res = await fetch(
      'https://api.github.com/repos/b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0/modrinth-proxy/commits',
      {
        next: { revalidate: 1800 },
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        }
      }
    )

    if (!res.ok) {
      throw new Error('Failed to fetch commits')
    }

    const commits = await res.json()
    return commits.slice(0, 20)
  } catch (error) {
    console.error('Error fetching commits:', error)
    return []
  }
}

function getPluralForm(number, one, few, many) {
  const absNumber = Math.abs(number)
  const lastDigit = absNumber % 10
  const lastTwoDigits = absNumber % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return many
  }
  if (lastDigit === 1) {
    return one
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few
  }
  return many
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date

  if (diffMs < 0) {
    return 'только что'
  }

  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffMins < 1) {
    return 'только что'
  } else if (diffMins < 60) {
    return `${diffMins} ${getPluralForm(diffMins, 'минуту', 'минуты', 'минут')} назад`
  } else if (diffHours < 24) {
    return `${diffHours} ${getPluralForm(diffHours, 'час', 'часа', 'часов')} назад`
  } else if (diffDays < 31) {
    return `${diffDays} ${getPluralForm(diffDays, 'день', 'дня', 'дней')} назад`
  } else if (diffMonths < 12) {
    return `${diffMonths} ${getPluralForm(diffMonths, 'месяц', 'месяца', 'месяцев')} назад`
  } else {
    return `${diffYears} ${getPluralForm(diffYears, 'год', 'года', 'лет')} назад`
  }
}

function getShortSha(sha) {
  return sha.substring(0, 7)
}

const DISCLAIMER_VARIANTS = [
  'Если вам нет 16 лет — не читайте чейнджлоги: там бывает мат, нервные срывы и записи после долгого дебага, когда разработчик уже не фильтрует речь.',
  'В чейнджлогах возможен мат. Если вам меньше 16 — закройте страницу: мы не сглаживаем то, как иногда пишут уставшие люди после очередного «простого» фикса.',
  'Мат в чейнджлогах — не редкость. Лицам младше 16 лет это читать не стоит: после тяжёлых багов текст бывает честнее, чем комфортно.',
  'Если вам нет 16 лет, лучше пройдите мимо. В чейнджлогах встречается мат — особенно там, где разработчик провёл ночь в бою с production.',
  'Чейнджлоги для аудитории 16+: в тексте бывает мат, сарказм и следы морального истощения. Младше — не открывайте.',
  'Нет 16 — не читайте. В чейнджлогах возможен мат и та самая дичь, которую обычно оставляют за кадром корпоративных релизов.',
  'Если вам меньше 16 лет — не заходите. Мат в чейнджлогах случается: тяжёлые фиксы иногда заканчиваются не только коммитом, но и крепким словом.',
  'Возраст 16+. В чейнджлогах бывает мат — не из злобы, а потому что иные баги по-другому не чинятся. Младше шестнадцати — мимо.',
  'Если вам нет 16 — закройте вкладку. Чейнджлоги пишут без цензуры: мат, ругань и честность после войны с багами — всё это здесь возможно.',
  'Мат возможен в каждом втором чейнджлоге. Если вам меньше 16 лет — не читайте: мы не притворяемся, что разработка всегда вежливая.',
  'Лицам до 16 лет не рекомендуется. В чейнджлогах встречается мат — как эхо ночной сборки, кофеина и сломанного dedicated server.',
  'Если вам нет 16 лет — не читайте вслух. В чейнджлогах бывает мат, токсичность и коммиты, рождённые в три ночи после войны с CSS.',
  'Мат в чейнджлоге — да. 16 лет — минимум. Младше не открывайте: отдельные фиксы заслужили не только релиз, но и крепкую формулировку.',
  'Если вам меньше 16 — проходите мимо. Чейнджлоги без фильтра: возможен мат, когда разработчик отвечает на баг вслух и это попадает в текст.',
  '16+ только. В чейнджлогах проскакивает мат — после восьмого «это же простой фикс» особенно. Нет 16 — лучше не смотрите.',
  'Нет 16 лет — не читайте чейнджлоги. Там бывает мат и грубая лексика: production жесток, и мы это не прячем.',
  'Если вам нет 16 — не заходите. Мат в чейнджлогах возможен всегда, когда код пишут под стрессом, кофеином и усталостью.',
  'Мат и нервы — часть честного чейнджлога. Если вам меньше 16 лет — закройте страницу: это не контент для детской аудитории.',
  'В чейнджлогах бывает мат. Вам должно быть 16+. Иначе лучше не читать — некоторые баги ломают психику, и в тексте это тоже видно.',
  'Если вам нет 16 лет — мимо. Мат в записях возможен: ругань обычно значит, что фикс был тяжёлый, а разработчик — ещё тяжелее.',
  '16 лет — порог. В чейнджлогах встречается мат, срывы и философия после дедлайна. Младше — не открывайте.',
  'Если вам меньше 16 — не читайте. Мат в чейнджлогах не исключение, а честный след битвы с багами, которую мы не стали вычищать редактором.',
]

function pickDisclaimer() {
  return DISCLAIMER_VARIANTS[Math.floor(Math.random() * DISCLAIMER_VARIANTS.length)]
}

export const metadata = {
  title: 'Новости и обновления | ModrinthProxy',
  description: 'Последние обновления и изменения ModrinthProxy',
}

export const dynamic = 'force-dynamic'

export default async function NewsPage() {
  const commits = await getCommits()
  const disclaimer = pickDisclaimer()

  return (
    <div className="min-h-screen bg-modrinth-darker py-8 px-4 md:py-10">
      {commits.length > 0 && <MarkCommitsRead latestSha={commits[0].sha} />}
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl uppercase">
            Чё нового?
          </h1>
          <h2 className="mt-2 mb-2 text-xs font-medium uppercase tracking-[0.2em] text-modrinth-green">
            Место, где мы рассказываем как мы боримся с багами
          </h2>
          <div className="mt-4 h-px w-full max-w-[4.5rem] bg-modrinth-green/80" aria-hidden />
          <div className="mt-4 flex flex-wrap items-stretch gap-3">
            <div className="flex shrink-0 items-center justify-center self-stretch rounded-md border border-gray-700 bg-gray-800/50 px-5 py-3 text-2xl font-black uppercase tracking-wide text-gray-200">
              16+
            </div>
            <div className="flex min-w-0 flex-1 max-w-3xl flex-col rounded-md border border-gray-700/90 bg-gradient-to-br from-gray-800/70 via-gray-800/50 to-gray-900/60 px-4 py-3.5 md:px-5 md:py-4">
              <p className="text-base leading-[1.75] text-gray-300 md:text-lg md:leading-[1.8]">
                <span className="font-semibold tracking-wide text-modrinth-green/90">Ахутунг.</span>{' '}
                <span className="text-gray-400/95">{disclaimer}</span>
              </p>
              <NewsUnder16Button />
            </div>
          </div>
        </header>

        {commits.length > 0 ? (
          <div className="bg-modrinth-dark border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 md:p-6">
              <ul className="m-0 list-none p-0">
                {commits.map((commit, index) => {
                  const isLast = index === commits.length - 1

                  return (
                    <ChangelogTimelineRow
                      key={commit.sha}
                      channel="release"
                      isLast={isLast}
                      header={
                        <span className="text-sm text-gray-500">
                          {formatDate(commit.commit.author.date)}
                        </span>
                      }
                    >
                      <CommitMessage message={commit.commit.message} />
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          {commit.author?.avatar_url ? (
                            <img
                              src={commit.author.avatar_url}
                              alt={commit.commit.author.name}
                              className="h-6 w-6 rounded-full shadow-md ring-1 ring-white/10"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-modrinth-green to-modrinth-green-light text-xs font-bold text-white shadow-md">
                              {commit.commit.author.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="max-w-[12rem] truncate md:max-w-none">
                            {commit.commit.author.name}
                          </span>
                        </div>
                        <a
                          href={commit.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 font-mono text-modrinth-green transition-colors hover:text-modrinth-green-light"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          {getShortSha(commit.sha)}
                        </a>
                      </div>
                    </ChangelogTimelineRow>
                  )
                })}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white mb-2">Нет обновлений</h2>
            <p className="text-gray-500">Не удалось загрузить новости. Попробуйте позже.</p>
          </div>
        )}

        <div className="mt-12 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-modrinth-green/30 to-modrinth-green-light/30 blur-2xl"></div>
            <Link
              href="https://github.com/b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0/modrinth-proxy"
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex items-center gap-3 bg-gradient-to-r from-modrinth-green to-modrinth-green-light hover:from-modrinth-green/90 hover:to-modrinth-green-light/90 text-black px-8 py-4 rounded-xl font-bold text-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span>Смотреть на GitHub</span>
            </Link>
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="text-gray-400 hover:text-modrinth-green transition-colors duration-300 inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Вернуться на главную</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
