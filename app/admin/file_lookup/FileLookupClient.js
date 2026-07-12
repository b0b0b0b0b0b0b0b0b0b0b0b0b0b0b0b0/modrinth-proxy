'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatFileSize } from '@/lib/modrinth'
import { getProjectTypePath, getProjectTypeDisplayName } from '@/lib/author'
import CopyButton from '../../components/CopyButton'

function formatHashBuffer(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function HashRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <span className="w-16 shrink-0 text-sm text-gray-500">{label}</span>
      <div className="min-w-0 flex-1 break-all">
        <CopyButton text={value} tooltipLabel={`Скопировать ${label}`} inline />
      </div>
    </div>
  )
}

function Spinner({ label }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-modrinth-green border-t-transparent" />
      {label}
    </div>
  )
}

async function fetchLookup(hash, algorithm) {
  const response = await fetch(
    `/api/file-lookup?hash=${encodeURIComponent(hash)}&algorithm=${algorithm}`
  )

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10)
    return {
      error: `Слишком много запросов. Подожди ${retryAfter} сек. и попробуй снова.`,
    }
  }

  if (response.status === 404) {
    return { error: 'Файл не найден в каталоге Modrinth.' }
  }

  if (!response.ok) {
    return { error: 'Не удалось выполнить поиск по Modrinth.' }
  }

  return { result: await response.json() }
}

const LOOKUP_COOLDOWN_MS = 2500

async function lookupByHash(sha512) {
  return fetchLookup(sha512, 'sha512')
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
  const lastLookupAtRef = useRef(0)
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

  const waitForLookupSlot = async () => {
    const elapsed = Date.now() - lastLookupAtRef.current
    const wait = LOOKUP_COOLDOWN_MS - elapsed
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait))
    }
    lastLookupAtRef.current = Date.now()
  }

  const runLookup = async (sha512) => {
    setLoadingLookup(true)
    setLookupError('')
    setLookupResult(null)

    try {
      await waitForLookupSlot()
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
        await waitForLookupSlot()
        const algorithm = normalized.length === 64 ? 'sha256' : 'sha1'
        const { result, error } = await fetchLookup(normalized, algorithm)

        if (error) {
          setLookupError(error)
          return
        }

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

  const hasResults = loadingHash || loadingLookup || fileHashes || lookupResult || lookupError

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />

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
          'flex w-full flex-col items-center justify-center rounded-2xl border px-6 py-10 text-center transition-colors duration-200',
          dragActive
            ? 'border-modrinth-green/50 bg-modrinth-green/[0.04]'
            : 'border-gray-700 bg-[var(--bg-tertiary)] hover:border-modrinth-green/40 dark:border-gray-800',
        ].join(' ')}
      >
        <svg
          className="mb-3 h-8 w-8 text-gray-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
        <span className="text-sm text-gray-300">Перетащи файл или нажми для выбора</span>
      </button>

      {selectedFile ? (
        <p className="text-sm text-gray-500">
          {selectedFile.name} · {formatFileSize(selectedFile.size)}
        </p>
      ) : null}

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
          className="min-w-0 flex-1 rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 font-mono text-sm text-white outline-none focus:border-modrinth-green dark:border-gray-800"
        />
        <button
          type="submit"
          disabled={loadingLookup || !hashInput.trim()}
          className="rounded-xl bg-modrinth-green px-5 py-2.5 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Найти
        </button>
      </form>
      {hashInputError ? <p className="text-sm text-amber-400">{hashInputError}</p> : null}

      {hasResults ? (
        <div className="space-y-6 rounded-2xl border border-gray-700 bg-[var(--bg-tertiary)] p-5 dark:border-gray-800 md:p-6">
          {loadingHash ? <Spinner label="Считаем хеши…" /> : null}
          {loadingLookup ? <Spinner label="Ищем на Modrinth…" /> : null}

          {lookupResult ? (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {lookupResult.project.icon_url ? (
                  <Image
                    src={lookupResult.project.icon_url}
                    alt=""
                    width={48}
                    height={48}
                    className="rounded-lg"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-800 text-gray-500">
                    ?
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {projectPath ? (
                    <Link
                      href={projectPath}
                      className="font-bold text-white transition-colors hover:text-modrinth-green"
                    >
                      {lookupResult.project.title}
                    </Link>
                  ) : (
                    <div className="font-bold text-white">{lookupResult.project.title}</div>
                  )}
                  <p className="mt-0.5 text-sm text-gray-500">
                    {getProjectTypeDisplayName(lookupResult.project.project_type)}
                  </p>
                  <div className="mt-2">
                    {versionPath ? (
                      <Link
                        href={versionPath}
                        className="text-sm text-modrinth-green hover:underline"
                      >
                        {lookupResult.version.version_number}
                      </Link>
                    ) : (
                      <span className="text-sm text-modrinth-green">
                        {lookupResult.version.version_number}
                      </span>
                    )}
                    {lookupResult.version.name ? (
                      <p className="mt-1 text-sm text-gray-500">{lookupResult.version.name}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              {(lookupResult.version.loaders?.length > 0 ||
                lookupResult.version.game_versions?.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {lookupResult.version.loaders?.map((loader) => (
                    <span
                      key={loader}
                      className="rounded-lg bg-gray-800 px-2.5 py-0.5 text-xs text-gray-400"
                    >
                      {loader}
                    </span>
                  ))}
                  {lookupResult.version.game_versions?.map((version) => (
                    <span
                      key={version}
                      className="rounded-lg bg-gray-800 px-2.5 py-0.5 text-xs text-gray-400"
                    >
                      {version}
                    </span>
                  ))}
                </div>
              )}

              {matchedFile ? (
                <div className="space-y-1 border-t border-gray-800 pt-4">
                  <p className="text-sm text-gray-500">{matchedFile.filename}</p>
                  <p className="text-sm text-gray-600">
                    {matchedFile.size ? formatFileSize(matchedFile.size) : null}
                    {matchedFile.size && lookupResult.version.version_type ? ' · ' : null}
                    {lookupResult.version.version_type ? (
                      <span className="capitalize">{lookupResult.version.version_type}</span>
                    ) : null}
                  </p>
                  {matchedFile.url ? (
                    <a
                      href={matchedFile.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm text-modrinth-green hover:underline"
                    >
                      Скачать с CDN Modrinth
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {fileHashes ? (
            <div className="space-y-3 border-t border-gray-800 pt-4">
              <p className="text-sm font-medium text-gray-400">Хеши</p>
              <HashRow label="SHA512" value={fileHashes.sha512} />
              <HashRow label="SHA256" value={fileHashes.sha256} />
              <HashRow label="SHA1" value={fileHashes.sha1} />
            </div>
          ) : null}

          {lookupError && !loadingLookup ? (
            <p className="text-sm text-amber-400">{lookupError}</p>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs text-gray-600">
        Файл не загружается на сервер — хеши считаются в браузере.
      </p>
    </div>
  )
}
