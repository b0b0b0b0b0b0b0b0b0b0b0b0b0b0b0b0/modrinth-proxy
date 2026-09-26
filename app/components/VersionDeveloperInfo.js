'use client'

import { useMemo, useState } from 'react'
import CopyButton from './CopyButton'
import StyledTooltip from './StyledTooltip'
import { useT } from './I18nProvider'

const GRADLE_KEYWORDS = new Set([
  'repositories',
  'exclusiveContent',
  'forRepository',
  'maven',
  'name',
  'url',
  'filter',
  'includeGroup',
  'dependencies',
  'implementation',
  'modImplementation',
])

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function highlightGradle(code) {
  const tokenPattern =
    /(\/\/[^\n]*|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|\b[A-Za-z_][\w.]*\b|[{}()[\];=]|\s+|.)/g

  return code.replace(tokenPattern, (token) => {
    if (!token) return ''
    if (token.startsWith('//')) {
      return `<span class="gradle-comment">${escapeHtml(token)}</span>`
    }
    if (
      (token.startsWith('"') && token.endsWith('"')) ||
      (token.startsWith("'") && token.endsWith("'"))
    ) {
      return `<span class="gradle-string">${escapeHtml(token)}</span>`
    }
    if (GRADLE_KEYWORDS.has(token)) {
      return `<span class="gradle-keyword">${escapeHtml(token)}</span>`
    }
    if (/^[{}()[\];=]$/.test(token)) {
      return `<span class="gradle-punct">${escapeHtml(token)}</span>`
    }
    return escapeHtml(token)
  })
}

function CopyCodeButton({ text, t }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
    }
  }

  return (
    <StyledTooltip label={copied ? t('copy.copied') : t('version.devCopyCode')}>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center justify-center rounded-[10px] bg-gray-200 p-1.5 text-gray-700 transition hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        {copied ? (
          <svg className="h-4 w-4 text-modrinth-green" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          </svg>
        )}
      </button>
    </StyledTooltip>
  )
}

export default function VersionDeveloperInfo({ projectId, versionId }) {
  const t = useT()
  const [open, setOpen] = useState(false)

  const mavenCoords = projectId && versionId ? `maven.modrinth:${projectId}:${versionId}` : ''
  const buildGradle = useMemo(() => {
    if (!mavenCoords) return ''
    return `repositories {
    exclusiveContent {
        forRepository {
            maven {
                name = "Modrinth"
                url = "https://api.modrinth.com/maven"
            }
        }
${t('version.devCommentForge')}
        filter {
            includeGroup "maven.modrinth"
        }
    }
}

${t('version.devCommentGradle')}
dependencies {
    implementation "${mavenCoords}"
}

${t('version.devCommentLoom')}
dependencies {
    modImplementation "${mavenCoords}"
}`
  }, [mavenCoords, t])

  const highlightedGradle = useMemo(
    () => (buildGradle ? highlightGradle(buildGradle) : ''),
    [buildGradle]
  )

  if (!projectId || !versionId) return null

  return (
    <div className="bg-modrinth-dark border border-gray-800 rounded-2xl mb-6 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`group m-0 flex w-full min-w-0 appearance-none items-center gap-3 p-4 text-left transition-colors hover:bg-[var(--bg-hover)] ${
          open ? 'rounded-b-none' : ''
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`size-5 text-white transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m19 9-7 7-7-7"
          />
        </svg>
        <h3 className="m-0 flex items-center gap-2 text-base font-semibold text-white">
          {t('version.devTitle')}
        </h3>
      </button>

      {open && (
        <div className="flex flex-col border-t border-gray-800 p-4">
          <p className="mb-3 mt-0 leading-normal text-sm text-gray-300">
            {t('version.devP1a')}{' '}
            <a
              href="https://gradle.org/"
              className="text-modrinth-green hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Gradle
            </a>
            {t('version.devP1b')}{' '}
            <a
              href="https://support.modrinth.com/en/articles/8801191-modrinth-maven"
              className="text-modrinth-green hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('version.devHere')}
            </a>
            .
          </p>
          <p className="mb-4 mt-0 leading-normal text-sm text-gray-300">
            {t('version.devP2')}
          </p>

          <h4 className="mb-2 mt-0 font-medium text-white">{t('version.devCoords')}</h4>
          <CopyButton text={mavenCoords} tooltipLabel={t('copy.id')} />

          <h4 className="mb-2 mt-4 font-medium text-white">{t('version.devVersionId')}</h4>
          <CopyButton text={versionId} tooltipLabel={t('copy.id')} />

          <h4 className="mb-2 mt-4 font-medium text-white">{t('version.devGradle')}</h4>
          <div className="relative">
            <div className="absolute right-2 top-2 z-10">
              <CopyCodeButton text={buildGradle} t={t} />
            </div>
            <pre
              className="gradle-code m-0 overflow-x-auto rounded-xl border border-gray-800 bg-[var(--bg-tertiary)] p-3 pr-12 text-sm font-mono leading-relaxed whitespace-pre"
              dangerouslySetInnerHTML={{ __html: highlightedGradle }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
