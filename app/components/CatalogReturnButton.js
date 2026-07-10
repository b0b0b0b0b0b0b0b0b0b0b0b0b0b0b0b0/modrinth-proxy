'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import StyledTooltip from './StyledTooltip'
import {
  catalogReturnMatchesContent,
  clearCatalogReturn,
  consumeCatalogReturnArm,
  getCatalogReturnQuery,
  readCatalogReturn,
} from '@/lib/catalogReturn'

export default function CatalogReturnButton({ contentType, slug }) {
  const [back, setBack] = useState(null)

  useEffect(() => {
    const armed = consumeCatalogReturnArm()
    const saved = readCatalogReturn()
    const query = saved?.href ? getCatalogReturnQuery(saved.href) : ''
    const valid =
      saved?.href &&
      saved.slug === slug &&
      query &&
      catalogReturnMatchesContent(saved.href, contentType)

    if (valid) {
      setBack({ href: saved.href, query })
      return
    }

    if (armed || saved) {
      clearCatalogReturn()
    }
  }, [contentType, slug])

  if (!back) return null

  const tooltip = `Вернуться к результатам поиска «${back.query}»`

  return (
    <>
      <StyledTooltip label={tooltip}>
        <Link
          href={back.href}
          aria-label={tooltip}
          className="group inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-modrinth-green/30 bg-modrinth-green/[0.08] px-2.5 py-0.5 text-sm font-semibold text-modrinth-green outline-none transition-all duration-200 hover:border-modrinth-green/50 hover:bg-modrinth-green/[0.14] hover:shadow-[0_0_14px_rgba(var(--color-green-rgb),0.18)] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-modrinth-green/40 dark:bg-modrinth-green/[0.12] dark:hover:bg-modrinth-green/[0.18]"
        >
          <svg
            className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7 7-7-7 7-7" />
          </svg>
          К поиску
        </Link>
      </StyledTooltip>
      <span className="text-gray-600">/</span>
    </>
  )
}
