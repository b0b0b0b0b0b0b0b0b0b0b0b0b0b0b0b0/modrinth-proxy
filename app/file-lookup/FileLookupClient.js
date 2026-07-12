'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatFileSize } from '@/lib/modrinth'
import { getProjectTypePath, getProjectTypeDisplayName } from '@/lib/author'
import CopyButton from '../components/CopyButton'

function formatHashBuffer(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function HashRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
      <span className="w-20 shrink-0 pt-0.5 text-sm font-medium text-gray-400">{label}:</span>
      <div className="min-w-0 flex-1 break-all">
        <CopyButton text={value} tooltipLabel={`Скопировать ${label}`} inline />
      </div>
    </div>
  )
}

function Spinner({ label }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-400">
      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-modrinth-green border-t-transparent" />
      {label}
    </div>
  )
}

async function lookupByHash(sha512) {
  const response = await fetch(
    `/api/file-lookup?hash=${encodeURIComponent(sha512)}&algorithm=sha512`
  )

  if (response.status === 404) {
    return { error: 'Файл не найден в каталоге Modrinth.' }
  }

  if (!response.ok) {
    return { error: 'Не удалось выполнить поиск по Modrinth.' }
  }

  return { result: await response.json() }
}

function pickMatchedFile(files, hashes) {
  if (!Array.isArray(files) || files.length === 0) return null
  const sha512 = String(hashes?.sha512 || '').toLowerCase()
  const sha256 = String(hashes?.sha256 || '').toLowerCase()
  const sha1 = String(hashes?.sha1 || '').toLowerCase()

  return (
    files.find((file) => sha512 && String(file?.hashes?.sha512 || '').toLowerCase() === sha512) ||
    files.find((file) => sha256 && String(file?.hashes?.sha256 || '').toLowerCase() === sha256) ||
    files.find((file) => sha1 && String(file?.hashes?.sha1 || '').toLowerCase() === sha1) ||
    files.find((file) => file?.primary) ||
    files[0]
  )
}

export default function FileLookupClient() {
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileHashes, setFileHashes] = useState(null)
  const [lookupResult, setLookupResult] = useState(null)
  const [lookupError, setLookupError] = useState('')
  const [loadingHash, setLoadingHash] = useState(false)
  const [loadingLookup, setLoadingLookup] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [hashInput, setHashInput] = useState('')
  const [hashInputError, setHashInputError] = useState('')

  const resetResults = () => {
    setFileHashes(null)
    setLookupResult(null)
    setLookupError('')
    setHashInputError('')
  }

  const runLookup = async (sha512) => {
    setLoadingLookup(true)
    setLookupError('')
    setLookupResult(null)

    try {
      const { result, error } = await lookupByHash(sha512)
      if (error) {
        setLookupError(error)
        return
      }
      setLookupResult(result)
    } catch {
      setLookupError('Не удалось выполнить поиск по Modrinth.')
    } finally {
      setLoadingLookup(false)
    }
  }

  const processFile = async (file) => {
    setSelectedFile(file)
    resetResults()
    setLoadingHash(true)
    setLoadingLookup(true)

    try {
      const buffer = await file.arrayBuffer()
      const [sha512, sha256, sha1] = await Promise.all([
        crypto.subtle.digest('SHA-512', buffer).then(formatHashBuffer),
        crypto.subtle.digest('SHA-256', buffer).then(formatHashBuffer),
        crypto.subtle.digest('SHA-1', buffer).then(formatHashBuffer),
      ])

      setFileHashes({ sha512, sha256, sha1 })
      setLoadingHash(false)
      await runLookup(sha512)
    } catch {
      setLookupError('Не удалось посчитать хеши файла.')
      setLoadingHash(false)
      setLoadingLookup(false)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (file) processFile(file)
    event.target.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleHashLookup = async (event) => {
    event.preventDefault()
    const normalized = hashInput.trim().toLowerCase()
    resetResults()
    setSelectedFile(null)

    if (!/^[a-f0-9]+$/.test(normalized)) {
      setHashInputError('Введите корректный hex-хеш.')
      return
    }

    if (normalized.length === 128) {
      setFileHashes({ sha512: normalized, sha256: null, sha1: null })
      await runLookup(normalized)
      return
    }

    if (normalized.length === 64 || normalized.length === 40) {
      setLoadingLookup(true)
      try {
        const algorithm = normalized.length === 64 ? 'sha256' : 'sha1'
        const response = await fetch(
          `/api/file-lookup?hash=${encodeURIComponent(normalized)}&algorithm=${algorithm}`
        )

        if (response.status === 404) {
          setLookupError('Файл не найден в каталоге Modrinth.')
          return
        }

        if (!response.ok) {
          setLookupError('Не удалось выполнить поиск по Modrinth.')
          return
        }

        const result = await response.json()
        const matched = pickMatchedFile(result.version?.files, {
          sha512: algorithm === 'sha512' ? normalized : null,
          sha256: algorithm === 'sha256' ? normalized : null,
          sha1: algorithm === 'sha1' ? normalized : null,
        })
        setFileHashes({
          sha512: matched?.hashes?.sha512 || null,
          sha256: matched?.hashes?.sha256 || null,
          sha1: matched?.hashes?.sha1 || null,
        })
        setLookupResult(result)
      } catch {
        setLookupError('Не удалось выполнить поиск по Modrinth.')
      } finally {
        setLoadingLookup(false)
      }
      return
    }

    setHashInputError('Поддерживаются SHA512 (128), SHA256 (64) или SHA1 (40) символов.')
  }

  const projectPath = lookupResult?.project
    ? `/${getProjectTypePath(lookupResult.project.project_type)}/${lookupResult.project.slug}`
    : null

  const versionPath =
    projectPath && lookupResult?.version?.version_number
      ? `${projectPath}/version/${encodeURIComponent(lookupResult.version.version_number)}`
      : null

  const matchedFile = pickMatchedFile(lookupResult?.version?.files, fileHashes)

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Выберите файл</h2>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={[
            'flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-300',
            dragActive
              ? 'border-modrinth-green bg-modrinth-green/[0.08]'
              : 'border-gray-700 bg-gray-900/40 hover:border-modrinth-green/60 hover:bg-gray-900/60',
          ].join(' ')}
        >
          <svg
            className="mb-3 h-10 w-10 text-modrinth-green"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
            />
          </svg>
          <span className="font-medium text-white">Перетащите файл или нажмите для выбора</span>
        </button>

        {selectedFile ? (
          <p className="text-sm text-gray-400">
            <span className="font-medium text-gray-300">{selectedFile.name}</span>
            {' '}({formatFileSize(selectedFile.size)})
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Или вставьте хеш</h2>
        <form onSubmit={handleHashLookup} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={hashInput}
            onChange={(event) => {
              setHashInput(event.target.value)
              setHashInputError('')
            }}
            placeholder="SHA512, SHA256 или SHA1"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-xl border border-gray-800 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none transition-colors focus:border-modrinth-green/50"
          />
          <button
            type="submit"
            disabled={loadingLookup || !hashInput.trim()}
            className="rounded-xl bg-modrinth-green px-5 py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Найти
          </button>
        </form>
        {hashInputError ? <p className="text-sm text-amber-300">{hashInputError}</p> : null}
      </section>

      {(loadingHash || loadingLookup || fileHashes || lookupResult || lookupError) && (
        <section className="space-y-6 rounded-2xl border border-gray-800 bg-gray-900/50 p-6 md:p-8">
          {loadingHash ? <Spinner label="Считаем хеши…" /> : null}
          {loadingLookup ? <Spinner label="Ищем файл на Modrinth…" /> : null}

          {fileHashes ? (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-white">Хеши файла</h2>
              <div className="space-y-3 rounded-xl border border-gray-800 bg-black/20 p-4">
                <HashRow label="SHA512" value={fileHashes.sha512} />
                <HashRow label="SHA256" value={fileHashes.sha256} />
                <HashRow label="SHA1" value={fileHashes.sha1} />
              </div>
            </div>
          ) : null}

          {lookupResult ? (
            <div className="space-y-5">
              <div className="space-y-3">
                <h2 className="text-base font-semibold text-white">Проект Modrinth</h2>
                <div className="flex items-start gap-4">
                  {lookupResult.project.icon_url ? (
                    <Image
                      src={lookupResult.project.icon_url}
                      alt=""
                      width={48}
                      height={48}
                      className="rounded-xl"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-800 text-gray-500">
                      ?
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {projectPath ? (
                      <Link
                        href={projectPath}
                        className="text-lg font-bold text-white transition-colors hover:text-modrinth-green"
                      >
                        {lookupResult.project.title}
                      </Link>
                    ) : (
                      <div className="text-lg font-bold text-white">
                        {lookupResult.project.title}
                      </div>
                    )}
                    <div className="mt-1 text-sm text-gray-400">
                      {getProjectTypeDisplayName(lookupResult.project.project_type)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-base font-semibold text-white">Версия Modrinth</h2>
                {versionPath ? (
                  <Link
                    href={versionPath}
                    className="text-modrinth-green transition-opacity hover:opacity-80"
                  >
                    Версия {lookupResult.version.version_number}
                  </Link>
                ) : (
                  <span className="text-modrinth-green">
                    Версия {lookupResult.version.version_number}
                  </span>
                )}
                {lookupResult.version.name ? (
                  <p className="text-sm text-gray-400">{lookupResult.version.name}</p>
                ) : null}
              </div>

              {(lookupResult.version.loaders?.length > 0 ||
                lookupResult.version.game_versions?.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {lookupResult.version.loaders?.map((loader) => (
                    <span
                      key={loader}
                      className="rounded-full bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300"
                    >
                      {loader}
                    </span>
                  ))}
                  {lookupResult.version.game_versions?.map((version) => (
                    <span
                      key={version}
                      className="rounded-full bg-modrinth-green/10 px-3 py-1 text-xs font-medium text-modrinth-green"
                    >
                      {version}
                    </span>
                  ))}
                </div>
              )}

              {matchedFile ? (
                <div className="space-y-2 rounded-xl border border-gray-800 bg-black/20 p-4">
                  <div className="text-sm font-medium text-gray-400">Файл на Modrinth</div>
                  <div className="break-all font-mono text-sm text-white">{matchedFile.filename}</div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                    {matchedFile.size ? <span>{formatFileSize(matchedFile.size)}</span> : null}
                    {lookupResult.version.version_type ? (
                      <span className="capitalize">{lookupResult.version.version_type}</span>
                    ) : null}
                  </div>
                  {matchedFile.url ? (
                    <a
                      href={matchedFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-sm font-medium text-modrinth-green hover:underline"
                    >
                      Скачать с CDN Modrinth
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {lookupError && !loadingLookup ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.08] px-4 py-3 text-sm text-amber-100/90">
              {lookupError}
            </div>
          ) : null}
        </section>
      )}

      <p className="text-center text-xs leading-relaxed text-gray-500">
        Файл не загружается на сервер — хеши считаются в браузере. На Modrinth уходит только хеш.
      </p>
    </div>
  )
}
