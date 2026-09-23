'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  appendOpenSourceParams,
  parseOpenSourceFilter,
  saveStoredOpenSource,
} from '@/lib/openSourceFilter'

function Chevron({ open }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" />
    </svg>
  )
}

function BanIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export default function LicenseFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(true)
  const state = parseOpenSourceFilter(searchParams)

  useEffect(() => {
    if (state !== 'none') saveStoredOpenSource(state)
  }, [state])

  const applyState = (next) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('l')
    params.delete('page')
    appendOpenSourceParams(params, next, pathname)
    saveStoredOpenSource(next)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-modrinth-dark">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <h3 className="m-0 flex-1 text-sm font-semibold text-gray-300">Лицензия</h3>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="px-3 pb-3">
          <div className="group flex items-center gap-1">
            <button
              type="button"
              onClick={() => applyState(state === 'selected' ? 'none' : 'selected')}
              className={`flex min-w-0 flex-1 items-center gap-2 truncate rounded-xl px-2 py-1.5 text-left text-sm font-semibold transition-all ${
                state === 'selected'
                  ? 'bg-modrinth-green/25 text-white hover:brightness-125'
                  : state === 'excluded'
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span className="min-w-0 flex-1 truncate">Открытый исходный код</span>
              {state === 'selected' && <CheckIcon />}
              {state === 'excluded' && <BanIcon />}
            </button>
            <button
              type="button"
              aria-label="Исключить"
              onClick={() => applyState(state === 'excluded' ? 'none' : 'excluded')}
              className={`rounded-xl px-2 py-1 text-gray-500 transition-all hover:bg-gray-800 hover:text-red-400 ${
                state === 'excluded' ? 'text-red-400' : ''
              }`}
            >
              <BanIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
