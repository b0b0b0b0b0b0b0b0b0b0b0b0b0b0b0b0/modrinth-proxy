'use client'

import RelativeTime from './RelativeTime'
import { DownloadIconButton, VersionChannelBadge } from './DownloadModalParts'
import { formatFileSize } from '@/lib/modrinth'

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
        <h3 className="relative top-0.5 m-0 text-base font-semibold text-gray-900 dark:text-white">
          Совместимые версии
        </h3>
      )}

      <div className="flex flex-col gap-2.5">
        {versions.map((version) => {
          const checked = version.id === selectedVersionId
          const primaryFile = version.files?.find((file) => file.primary) || version.files?.[0]

          const cardClass = checked
            ? 'border-modrinth-green bg-modrinth-green/[0.08] dark:bg-modrinth-green/[0.12]'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 dark:border-[#2e3035] dark:hover:border-[#3a3d44] dark:hover:bg-[#1e2024]/90'

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
              className={`${cardShellClass} cursor-pointer ${cardClass}`}
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
                {checked && primaryFile?.url && (
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
