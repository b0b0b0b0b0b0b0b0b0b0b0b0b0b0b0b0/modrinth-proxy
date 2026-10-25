'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useT } from './components/I18nProvider'

const AUTO_RETRY_MS = 4000
const COURIER_TIMEOUT_MS = 12000
const ATTEMPT_COOLDOWN_MS = 60_000
const ATTEMPTS_KEY = 'errorPageAttempts'
const PROJECT_ROUTE_RE = /^\/(?:mod|plugin|datapack|resourcepack|shader|modpack|project)\/([^/?#]+)/

function projectSlugFrom(pathname) {
  const match = PROJECT_ROUTE_RE.exec(pathname || '')
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return null
  }
}

function takeAttempt(kind, pathname) {
  try {
    const attempts = JSON.parse(sessionStorage.getItem(ATTEMPTS_KEY) || '{}')
    const key = `${kind}:${pathname}`
    if (Date.now() - (Number(attempts[key]) || 0) < ATTEMPT_COOLDOWN_MS) return false
    attempts[key] = Date.now()
    sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts))
    return true
  } catch {
    return kind === 'courier'
  }
}

async function fetchJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(COURIER_TIMEOUT_MS) })
  return response.ok ? response.json() : null
}

async function deliverProject(slug) {
  const base = `https://api.modrinth.com/v2/project/${encodeURIComponent(slug)}`
  const project = await fetchJson(base)
  if (!project?.id) return false
  const versions = await fetchJson(`${base}/version`).catch(() => null)
  const response = await fetch('/api/courier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, project, versions }),
  })
  return response.ok
}

function reloadPage() {
  window.location.reload()
}

export default function Error() {
  const t = useT()
  const pathname = usePathname()
  const [reloading, setReloading] = useState(false)
  const [courier, setCourier] = useState(() => (projectSlugFrom(pathname) ? 'working' : 'off'))
  const started = useRef(false)

  const retry = () => {
    setReloading(true)
    reloadPage()
  }

  useEffect(() => {
    if (started.current) return
    started.current = true
    let timer = 0
    let alive = true

    const fallBack = () => {
      if (!alive) return
      setCourier('off')
      if (takeAttempt('auto', pathname)) timer = setTimeout(retry, AUTO_RETRY_MS)
    }

    const slug = projectSlugFrom(pathname)
    if (!slug || !takeAttempt('courier', pathname)) {
      fallBack()
    } else {
      deliverProject(slug)
        .then((ok) => {
          if (!alive) return
          if (ok) retry()
          else fallBack()
        })
        .catch(fallBack)
    }

    return () => {
      alive = false
      clearTimeout(timer)
    }
  }, [])

  const working = courier === 'working'

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-md text-center">
        <svg viewBox="0 0 120 90" className="mx-auto h-28 w-36" aria-hidden>
          <ellipse cx="60" cy="78" rx="34" ry="5" fill="currentColor" className="text-gray-800" />
          <path d="M28 70c0-18 14-30 32-30s32 12 32 30z" fill="#f3b6cf" />
          <path d="M38 46 33 28l14 11M82 46l5-18-14 11" fill="#f3b6cf" />
          {working ? (
            <>
              <circle cx="49" cy="58" r="3" fill="#7a3b55" />
              <circle cx="71" cy="58" r="3" fill="#7a3b55" />
            </>
          ) : (
            <path d="M45 58q4 3 8 0M67 58q4 3 8 0" stroke="#7a3b55" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}
          <circle cx="60" cy="63" r="1.8" fill="#7a3b55" />
          {working ? null : (
            <>
              <text x="92" y="30" fontSize="12" fontWeight="700" fill="currentColor" className="animate-pulse text-modrinth-green">z</text>
              <text x="101" y="19" fontSize="9" fontWeight="700" fill="currentColor" className="animate-pulse text-modrinth-green">z</text>
            </>
          )}
        </svg>

        <h2 className="mt-6 text-2xl font-bold text-white">{t(working ? 'errorPage.courierTitle' : 'errorPage.title')}</h2>
        <p className="mx-auto mt-3 text-base leading-relaxed text-gray-400" aria-live="polite">
          {t(working ? 'errorPage.courierLead' : 'errorPage.lead')}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={retry}
            disabled={reloading || working}
            className="inline-flex items-center gap-1.5 rounded-lg bg-modrinth-green px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <svg className={`h-4 w-4 ${reloading || working ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
              <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
            </svg>
            {t('errorPage.retry')}
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg border border-gray-800 px-4 py-2 text-sm text-gray-400 transition-colors hover:border-modrinth-green/50 hover:text-white"
          >
            {t('errorPage.home')}
          </Link>
        </div>
      </div>
    </div>
  )
}
