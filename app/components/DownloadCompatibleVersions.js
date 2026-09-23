'use client'

import RelativeTime from './RelativeTime'
import { DownloadIconButton, VersionChannelBadge } from './DownloadModalParts'
import { formatFileSize } from '@/lib/modrinth'
import { versionChannelCardClass } from '@/lib/versionChannelStyles'
import StyledTooltip from './StyledTooltip'

function ChannelHelpIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.75"
      className="size-4"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
      />
    </svg>
  )
}

function VersionCardContent({ version, primaryFile, showFilename = false }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex min-w-0 items-center gap-2">
        <span className="block min-w-0 truncate font-semibold text-gray-900 dark:text-white">
          {version.version_number}
        </span>
        <VersionChannelBadge versionType={version.version_type || 'release'} />
      </div>
      {showFilename && primaryFile?.filename && (
        <span className="min-w-0 truncate text-sm font-medium text-gray-700 dark:text-gray-300">
          {primaryFile.filename}
        </span>
      )}
      <div className="flex min-w-0 items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
        {version.date_published && <RelativeTime dateString={version.date_published} />}
        {version.date_published && primaryFile?.size && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-500 opacity-30" />
        )}
        {primaryFile?.size && <span className="shrink-0">{formatFileSize(primaryFile.size)}</span>}
      </div>
    </div>
  )
}

export default function DownloadCompatibleVersions({
  versions,
  selectedVersionId,
  onSelectVersionId,
}) {
  if (!versions?.length) return null

  const isChannelPicker = versions.length > 1

  return (
    <div
      className="flex flex-col gap-2.5 animate-fade-in-up"
      role={isChannelPicker ? 'radiogroup' : undefined}
      aria-label={isChannelPicker ? 'Совместимые версии' : undefined}
    >
      {isChannelPicker && (
        <h3 className="relative top-0.5 m-0 flex items-center gap-1.5 text-base font-semibold text-gray-900 dark:text-white">
          Совместимые версии
          <StyledTooltip
            side="right"
            contentClassName="!text-left !max-w-[18rem]"
            label={
              <span className="flex flex-col gap-1.5">
                <span>Под одну версию Minecraft и платформу иногда лежит несколько сборок.</span>
                <span>Release — стабильная. Если она есть, бери её.</span>
                <span>Beta — почти готово, но могут быть баги. Для теста.</span>
                <span>Alpha — сырая. Только если понимаешь, что ставишь.</span>
                <span>Выбранная строка идёт в «скачать всё в .zip» и «по отдельности». Круглая кнопка качает только этот файл.</span>
              </span>
            }
          >
            <button
              type="button"
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modrinth-green/50 dark:text-gray-500 dark:hover:text-gray-300"
              aria-label="Какую версию выбрать"
            >
              <ChannelHelpIcon />
            </button>
          </StyledTooltip>
        </h3>
      )}

      <div className="flex flex-col gap-2.5">
        {versions.map((version) => {
          const checked = version.id === selectedVersionId
          const primaryFile = version.files?.find((file) => file.primary) || version.files?.[0]

          const cardClass = versionChannelCardClass(version.version_type, checked)

          const cardShellClass =
            'grid items-center gap-3 rounded-2xl border border-solid px-3 py-3 transition-[border-color,background-color,box-shadow] grid-cols-[minmax(0,1fr)_2.25rem]'

          if (!isChannelPicker) {
            return (
              <div
                key={version.id}
                className={`${cardShellClass} text-gray-900 dark:text-white ${cardClass}`}
              >
                <VersionCardContent version={version} primaryFile={primaryFile} showFilename />
                <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                  {primaryFile?.url && (
                    <DownloadIconButton
                      href={primaryFile.url}
                      download={primaryFile.filename}
                      label={`Скачать ${primaryFile.filename}`}
                      className="!text-gray-500 dark:!text-gray-400"
                    />
                  )}
                </div>
              </div>
            )
          }

          return (
            <div
              key={version.id}
              role="radio"
              aria-checked={checked}
              tabIndex={0}
              onClick={() => onSelectVersionId(version.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectVersionId(version.id)
                }
              }}
              className={`${cardShellClass} cursor-default ${cardClass}`}
            >
              <VersionCardContent
                version={version}
                primaryFile={primaryFile}
                showFilename={Boolean(primaryFile?.filename)}
              />

              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center"
                onClick={(event) => event.stopPropagation()}
              >
                {primaryFile?.url && (
                  <DownloadIconButton
                    href={primaryFile.url}
                    download={primaryFile.filename}
                    label={`Скачать ${primaryFile.filename}`}
                    className="!text-gray-500 dark:!text-gray-400"
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
