'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import StyledTooltip from '@/app/components/StyledTooltip'
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

function EditableCurrentPage({ page, totalPages, pathname, searchParams }) {
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
        aria-label="Введите номер страницы"
      />
    )
  }

  return (
    <StyledTooltip label="Нажмите, чтобы перейти на страницу">
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
  if (totalPages <= 1) return null

  const items = getPaginationItems(page, totalPages, { siblings: 2, boundaries: 1 })
  const hrefForPage = (targetPage) => buildCatalogPageUrl(pathname, searchParams, targetPage)

  return (
    <nav
      aria-label="Пагинация каталога"
      className={`flex flex-col items-center gap-3 ${className}`.trim()}
    >
      <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {page > 1 && (
          <NavLink href={hrefForPage(page - 1)} label="Предыдущая страница">
            <span className="hidden sm:inline">Назад</span>
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
            />
          ) : (
            <StyledTooltip key={item.key} label={`Страница ${item.page.toLocaleString('ru-RU')}`}>
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
          <NavLink href={hrefForPage(page + 1)} label="Следующая страница">
            <span className="hidden sm:inline">Вперёд</span>
            <span className="sm:hidden">›</span>
          </NavLink>
        )}
      </div>

      <p className="text-xs text-gray-500 sm:text-sm">
        Страница {page.toLocaleString('ru-RU')} из {totalPages.toLocaleString('ru-RU')}
      </p>
    </nav>
  )
}
