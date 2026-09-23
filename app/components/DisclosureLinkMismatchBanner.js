'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  appendDisclosureExclusionParams,
  loadStoredDisclosureExclusions,
  parseDisclosureExclusions,
  sameDisclosureExclusionIds,
} from '@/lib/disclosureExclusions'

const FOREVER_KEY = 'catalog-disclosure-mismatch-banner-hidden'
const SESSION_KEY = 'catalog-disclosure-mismatch-banner-session-hidden'

function isBannerSuppressed() {
  try {
    return localStorage.getItem(FOREVER_KEY) === '1' || sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export default function DisclosureLinkMismatchBanner() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [stored, setStored] = useState([])
  const [ready, setReady] = useState(false)
  const [hidden, setHidden] = useState(true)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    const read = () => setStored(loadStoredDisclosureExclusions())
    read()
    setHidden(isBannerSuppressed())
    setReady(true)
    window.addEventListener('catalog-disclosure-exclusions-changed', read)
    window.addEventListener('storage', read)
    return () => {
      window.removeEventListener('catalog-disclosure-exclusions-changed', read)
      window.removeEventListener('storage', read)
    }
  }, [])

  const urlIds = parseDisclosureExclusions(searchParams)
  if (!ready || hidden || stored.length === 0 || sameDisclosureExclusionIds(urlIds, stored)) {
    return null
  }

  const applySaved = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('a')
    params.delete('page')
    appendDisclosureExclusionParams(params, stored)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const dismiss = () => {
    try {
      if (dontShowAgain) localStorage.setItem(FOREVER_KEY, '1')
      else sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* ignore */
    }
    setHidden(true)
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-solid border-blue-500/50 bg-blue-500/10 p-4 text-white">
      <div className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-2 sm:grid-cols-[1.5rem_minmax(0,1fr)_auto]">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-6 w-6 flex-none text-blue-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <div className="min-w-0 text-lg font-semibold leading-6">
          Фильтры этой ссылки отличаются от сохранённых расширенных исключений
        </div>
        <button
          type="button"
          onClick={applySaved}
          className="col-span-2 mt-1 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-blue-500 px-2.5 text-base font-semibold text-white hover:brightness-110 sm:col-span-1 sm:mt-0 sm:ml-auto sm:w-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-5 w-5">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Применить сохранённые
        </button>
      </div>
      <div className="flex flex-col gap-3 pl-8 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
        <button
          type="button"
          role="checkbox"
          aria-checked={dontShowAgain}
          aria-label="Не показывать снова"
          onClick={() => setDontShowAgain((value) => !value)}
          className="flex items-center gap-3 bg-transparent p-0 text-left text-sm font-medium text-gray-200"
        >
          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            dontShowAgain
              ? 'border-modrinth-green bg-modrinth-green text-black'
              : 'border-gray-600 bg-gray-800'
          }`}>
            {dontShowAgain && (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
          Не показывать снова
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-gray-600 bg-gray-800/80 px-3 text-sm font-semibold text-gray-200 hover:bg-gray-700"
        >
          Убрать
        </button>
      </div>
    </div>
  )
}
