'use client'

import { formatFileSize } from '@/lib/modrinth'
import {
  getSupplementaryVersionFiles,
  isBundledResourcePackFile,
  isDatapackDownloadContext,
  versionHasBundledResourcePack,
} from '@/lib/downloadBundledFiles'
import {
  DatapackResourcePackBanner,
  DownloadIconButton,
  ResourcePackBadge,
} from './DownloadModalParts'
import StyledTooltip from './StyledTooltip'

function BundledFileRow({ file }) {
  const isResourcePack = isBundledResourcePackFile(file)

  return (
    <div className="z-10 grid h-11 grid-cols-[minmax(0,1fr)_min-content] items-center gap-1 text-gray-900 dark:text-gray-200">
      <span className="flex min-w-0 items-center gap-2">
        <span className="min-w-0 truncate text-base font-medium text-gray-900 dark:text-white">
          {file.filename}
        </span>
        {isResourcePack && <ResourcePackBadge />}
        {file.size && !isResourcePack && (
          <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
            {formatFileSize(file.size)}
          </span>
        )}
      </span>
      {file.url && (
        <DownloadIconButton
          href={file.url}
          download={file.filename}
          label={`Скачать ${file.filename}`}
          className="!text-gray-500 dark:!text-gray-400"
        />
      )}
    </div>
  )
}

export default function DownloadVersionBundledFiles({ files, contentType, loader }) {
  if (!isDatapackDownloadContext(contentType, loader)) return null

  const supplementaryFiles = getSupplementaryVersionFiles(files)
  if (supplementaryFiles.length === 0) return null

  const showResourcePackNotice = versionHasBundledResourcePack(files)

  return (
    <div className="animate-fade-in-up flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 flex items-center gap-1.5 text-base font-semibold text-gray-900 dark:text-white">
          Зависимости
          <StyledTooltip label="Дополнительные файлы, которые нужны для работы выбранной версии">
            <span
              tabIndex={0}
              className="inline-flex size-4 shrink-0 cursor-help items-center justify-center text-gray-500 dark:text-gray-400"
              aria-label="О зависимостях"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
            </span>
          </StyledTooltip>
        </h3>
      </div>

      {showResourcePackNotice && <DatapackResourcePackBanner />}

      <div className="rounded-2xl bg-gray-100 p-2 pl-4 pr-3 dark:bg-[#1e2024]">
        <div className="flex min-w-0 flex-col">
          {supplementaryFiles.map((file) => (
            <BundledFileRow key={file.id || file.filename} file={file} />
          ))}
        </div>
      </div>
    </div>
  )
}
