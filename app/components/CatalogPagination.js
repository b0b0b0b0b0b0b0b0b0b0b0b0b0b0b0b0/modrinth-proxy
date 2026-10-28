'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { forwardRef, useEffect, useRef, useState } from 'react'
import StyledTooltip from '@/app/components/StyledTooltip'
import { useI18n } from '@/app/components/I18nProvider'
import { intlLocale } from '@/lib/i18n/config'
import { buildCatalogPageUrl, getPaginationItems } from '@/lib/pagination'

const buttonBase =
  'glass-btn inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-semibold'

const PageLink = forwardRef(function PageLink({ target, go, label, children, ...rest }, ref) {
  const className = `${buttonBase} text-gray-300 hover:text-white`
  if (go.href) {
    return (
      <Link ref={ref} {...rest} href={go.href(target)} aria-label={label} className={className}>
        {children}
      </Link>
    )
  }
  return (
    <button
      ref={ref}
      {...rest}
      type="button"
      onClick={(event) => {
        rest.onClick?.(event)
        go.select(target)
      }}
      aria-label={label}
      className={className}
    >
      {children}
    </button>
  )
})

function NavLink({ target, go, label, children }) {
  return (
    <StyledTooltip label={label}>
      <PageLink target={target} go={go} label={label}>
        {children}
      </PageLink>
    </StyledTooltip>
  )
}

function EditableCurrentPage({ page, totalPages, go, t }) {
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

    if (target !== page) go.select(target)
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
        className={`${buttonBase} glass-btn--active w-[4.5rem] text-center text-modrinth-green-light outline-none`}
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
        className={`${buttonBase} glass-btn--active cursor-text text-modrinth-green-light`}
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
  onPageChange,
  className = '',
}) {
  const { t, locale } = useI18n()
  const router = useRouter()
  if (totalPages <= 1) return null

  const nf = intlLocale(locale)
  const items = getPaginationItems(page, totalPages, { siblings: 2, boundaries: 1 })
  const go = onPageChange
    ? { select: onPageChange }
    : {
        href: (targetPage) => buildCatalogPageUrl(pathname, searchParams, targetPage),
        select: (targetPage) => router.push(buildCatalogPageUrl(pathname, searchParams, targetPage)),
      }

  return (
    <nav
      aria-label={t('catalog.pager.nav')}
      className={`flex flex-col items-center gap-3 ${className}`.trim()}
    >
      <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {page > 1 && (
          <NavLink target={page - 1} go={go} label={t('catalog.pager.prev')}>
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
              go={go}
              t={t}
            />
          ) : (
            <StyledTooltip key={item.key} label={t('catalog.pager.pageN', { n: item.page.toLocaleString(nf) })}>
              <PageLink target={item.page} go={go}>
                {item.page}
              </PageLink>
            </StyledTooltip>
          )
        )}

        {page < totalPages && (
          <NavLink target={page + 1} go={go} label={t('catalog.pager.nextAria')}>
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
