'use client'

import StyledTooltip from './StyledTooltip'
import { useT } from './I18nProvider'

export default function MobileDownloadButton({ accent = null, resourceTitle, muted = false }) {
  const t = useT()
  const titleTrimmed =
    typeof resourceTitle === 'string' ? resourceTitle.trim() : ''
  const downloadTooltip = titleTrimmed
    ? t('project.downloadNamed', { title: titleTrimmed })
    : t('version.download')
  const handleClick = () => {
    window.dispatchEvent(new Event('open-download-modal'))
  }

  if (muted) {
    return (
      <StyledTooltip label={downloadTooltip}>
        <button
          type="button"
          onClick={handleClick}
          className="ny-snow-cap lg:hidden px-4 py-3 rounded-full font-semibold text-sm border border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 transition-colors hover:bg-gray-300 dark:hover:bg-gray-700 flex items-center gap-2 max-[340px]:px-3"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="max-[340px]:hidden">{t('version.download')}</span>
        </button>
      </StyledTooltip>
    )
  }

  if (accent) {
    return (
      <StyledTooltip label={downloadTooltip}>
        <button
          type="button"
          onClick={handleClick}
          className="ny-snow-cap lg:hidden px-4 py-3 rounded-full font-bold text-sm shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:brightness-110 flex items-center gap-2 max-[340px]:px-3"
          style={{ backgroundColor: accent.accentHex, color: accent.activeFgHex }}
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="max-[340px]:hidden">{t('version.download')}</span>
        </button>
      </StyledTooltip>
    )
  }

  return (
    <StyledTooltip label={downloadTooltip}>
      <button
        type="button"
        onClick={handleClick}
        className="ny-snow-cap lg:hidden bg-gradient-to-r from-modrinth-green to-modrinth-green-light text-black px-4 py-3 rounded-full font-bold text-sm hover:from-modrinth-green-light hover:to-modrinth-green transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2 max-[340px]:px-3"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="max-[340px]:hidden">{t('version.download')}</span>
      </button>
    </StyledTooltip>
  )
}
