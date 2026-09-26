'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import StyledTooltip from '@/app/components/StyledTooltip'
import { useI18n } from '@/app/components/I18nProvider'
import { intlLocale } from '@/lib/i18n/config'
import { buildCatalogPageUrl, getPaginationItems } from '@/lib/pagination'

const buttonBase =
  'inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-medium transition'

function NavLink({ href, label, children }) {
  return (
    <StyledTooltip label={label}>
      <Link
        href={href}
        aria-label={label}
        className={`${buttonBase} border-gray-700 bg-modrinth-dark text-gray-300 hover:border-modrinth-green hover:text-white`}
      >
        {children}
      </Link>
    </StyledTooltip>
  )
}

function EditableCurrentPage({ page, totalPages, pathname, searchParams, t }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(page))
  const inputRef = useRef(null)

  useEffect(() => {
    setValue(String(page))
  }, [page])

  useEffect(() => {
    if (!editing) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editing])

  const cancel = () => {
    setValue(String(page))
    setEditing(false)
  }

  const commit = () => {
    const parsed = parseInt(value, 10)
    if (!Number.isFinite(parsed)) {
      cancel()
      return
    }

    const target = Math.min(Math.max(1, parsed), totalPages)
    setEditing(false)
    setValue(String(target))

    if (target !== page) {
      router.push(buildCatalogPageUrl(pathname, searchParams, target))
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        enterKeyHint="go"
        value={value}
        onChange={(event) => setValue(event.target.value.replace(/\D/g, ''))}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            cancel()
          }
        }}
        onBlur={cancel}
        className={`${buttonBase} w-[4.5rem] border-modrinth-green bg-modrinth-dark text-center font-medium text-modrinth-green-light outline-none ring-2 ring-modrinth-green/40`}
        aria-label={t('catalog.pager.enterPage')}
      />
    )
  }

  return (
    <StyledTooltip label={t('catalog.pager.jump')}>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-current="page"
        className={`${buttonBase} cursor-text border-modrinth-green bg-modrinth-green/15 text-modrinth-green-light hover:bg-modrinth-green/25`}
      >
        {page}
      </button>
    </StyledTooltip>
  )
}

export default function CatalogPagination({
  page,
  totalPages,
  pathname,
  searchParams,
  className = '',
}) {
  const { t, locale } = useI18n()
  if (totalPages <= 1) return null

  const nf = intlLocale(locale)
  const items = getPaginationItems(page, totalPages, { siblings: 2, boundaries: 1 })
  const hrefForPage = (targetPage) => buildCatalogPageUrl(pathname, searchParams, targetPage)

  return (
    <nav
      aria-label={t('catalog.pager.nav')}
      className={`flex flex-col items-center gap-3 ${className}`.trim()}
    >
      <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {page > 1 && (
          <NavLink href={hrefForPage(page - 1)} label={t('catalog.pager.prev')}>
            <span className="hidden sm:inline">{t('catalog.pager.back')}</span>
            <span className="sm:hidden">‹</span>
          </NavLink>
        )}

        {items.map((item) =>
          item.type === 'ellipsis' ? (
            <span
              key={item.key}
              aria-hidden="true"
              className="inline-flex h-10 min-w-8 items-center justify-center px-1 text-gray-500"
            >
              …
            </span>
          ) : item.page === page ? (
            <EditableCurrentPage
              key={item.key}
              page={page}
              totalPages={totalPages}
              pathname={pathname}
              searchParams={searchParams}
              t={t}
            />
          ) : (
            <StyledTooltip key={item.key} label={t('catalog.pager.pageN', { n: item.page.toLocaleString(nf) })}>
              <Link
                href={hrefForPage(item.page)}
                className={`${buttonBase} border-gray-700 bg-modrinth-dark text-gray-300 hover:border-modrinth-green hover:text-white`}
              >
                {item.page}
              </Link>
            </StyledTooltip>
          )
        )}

        {page < totalPages && (
          <NavLink href={hrefForPage(page + 1)} label={t('catalog.pager.nextAria')}>
            <span className="hidden sm:inline">{t('catalog.pager.next')}</span>
            <span className="sm:hidden">›</span>
          </NavLink>
        )}
      </div>

      <p className="text-xs text-gray-500 sm:text-sm">
        {t('catalog.pager.pageOf', {
          page: page.toLocaleString(nf),
          total: totalPages.toLocaleString(nf),
        })}
      </p>
    </nav>
  )
}
