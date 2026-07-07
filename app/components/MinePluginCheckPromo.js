import { MINEPLUGINCHECK_BOT_URL } from '@/lib/minePluginCheckBotUrl'

export function DownloadPromoConnector({ className = '' }) {
  return (
    <div className={`flex flex-col items-center text-modrinth-green ${className}`} aria-hidden>
      <div className="h-7 w-[2px] rounded-full bg-gradient-to-b from-modrinth-green via-modrinth-green/70 to-transparent" />
      <svg
        className="-mt-1 h-3 w-3 shrink-0 text-modrinth-green"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  )
}

export default function MinePluginCheckPromo({ contentType = 'mod' }) {
  const isPlugin = contentType === 'plugin'

  const pluginParagraph =
    'Иногда там могут скрываться хаки, которые могут взломать твой сервер. Проверь плагин в нашем боте на проверку плагинов Minecraft.'

  const modBody =
    'Проверь их сначала на наличие бекдоров в нашем боте на проверку модов прежде чем ставить на компьютер.'

  const fileKind = isPlugin ? 'плагина' : 'мода'

  const lead = (
    <>
      <span className="text-gray-900 dark:text-gray-100">Скачал? Не торопись ставить.</span>{' '}
      <span className="text-gray-800 dark:text-gray-200">
        Всегда проверяй файл {fileKind} на наличие бекдоров.
      </span>
    </>
  )

  return (
    <a
      href={MINEPLUGINCHECK_BOT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={
        isPlugin ? 'Перейти к боту проверки плагинов в Telegram.' : 'Перейти к боту проверки модов в Telegram.'
      }
      className="group flex w-full max-w-none flex-col gap-3 rounded-2xl border border-gray-600/80 bg-[var(--bg-tertiary)] p-4 text-left transition-colors duration-200 hover:border-modrinth-green/50 hover:bg-modrinth-green/[0.04] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 dark:border-gray-700"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        {isPlugin ? (
          <>
            <p className="text-sm font-bold leading-snug sm:text-[15px]">{lead}</p>
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:text-[13px]">
              {pluginParagraph}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold leading-snug sm:text-[15px]">{lead}</p>
            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:text-[13px]">{modBody}</p>
          </>
        )}
      </div>

      <span className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-600/60 bg-[var(--bg-primary)] px-3 py-2.5 text-xs font-semibold text-modrinth-green transition-colors group-hover:border-modrinth-green/40 sm:border-transparent sm:bg-modrinth-green/10 sm:py-2 sm:pr-4 dark:border-gray-600">
        <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-gray-600/50 bg-black/20" aria-hidden>
          <img src="/images/bot_logo.jpg" alt="" width={32} height={32} className="h-full w-full object-cover" />
        </span>
        <span className="leading-tight group-hover:text-modrinth-green-light">Перейти к боту в Telegram</span>
        <svg
          className="h-4 w-4 shrink-0 text-modrinth-green transition-transform duration-200 group-hover:translate-x-0.5 rtl:rotate-180"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12l4-4-4-4" />
        </svg>
      </span>
    </a>
  )
}
