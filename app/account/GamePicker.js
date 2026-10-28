'use client'

import { useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import StyledTooltip from '../components/StyledTooltip'
import { ChevronIcon } from '../components/DownloadModalPickers'
import { useT } from '../components/I18nProvider'

const TRIGGER_TEXT = 'min-w-0 truncate text-sm min-[480px]:text-base'

function OptionIcon({ option }) {
  if (!option?.icon) return null
  return (
    <span className="flex size-4 shrink-0 items-center justify-center [&>svg]:size-4" style={{ color: option.color }}>
      {option.icon}
    </span>
  )
}

export default function GamePicker({ label, help, value, options, allOptions, onChange, disabled, searchPlaceholder, emptyText }) {
  const t = useT()
  const reduceMotion = useReducedMotion()
  const anchorRef = useRef(null)
  const listRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)
  const hasMore = Boolean(allOptions && allOptions.length > options.length)
  const source = showAll && hasMore ? allOptions : options
  const current = [...options, ...(allOptions || [])].find((option) => !option.section && option.value === value) || options[0]
  const needle = query.trim().toLowerCase()
  const shown = needle ? source.filter((option) => option.value && option.label.toLowerCase().includes(needle)) : source

  useEffect(() => {
    if (hasMore && value && !options.some((option) => option.value === value)) setShowAll(true)
  }, [hasMore, value])

  useEffect(() => {
    if (!open) {
      setQuery('')
      return undefined
    }
    const frame = requestAnimationFrame(() => {
      listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
    })
    return () => cancelAnimationFrame(frame)
  }, [open, showAll])

  const pick = (next) => {
    setOpen(false)
    if (next !== value) onChange(next)
  }

  const focusList = (index) => {
    const items = [...(listRef.current?.querySelectorAll('button[role="option"]') || [])]
    if (items.length > 0) items[Math.max(0, Math.min(items.length - 1, index))].focus()
  }

  const moveFocus = (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const items = [...(listRef.current?.querySelectorAll('button[role="option"]') || [])]
    if (items.length === 0) return
    event.preventDefault()
    const index = items.indexOf(document.activeElement)
    if (index === -1) return focusList(0)
    focusList(event.key === 'ArrowDown' ? index + 1 : index - 1)
  }

  return (
    <div className="min-w-0">
      <span className="mb-1 block text-xs font-semibold text-gray-400">{label}</span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Anchor asChild>
          <div ref={anchorRef} className="glass-btn rounded-xl">
            {open && searchPlaceholder ? (
              <div className="relative flex items-center">
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && shown.some((option) => !option.section)) {
                      event.preventDefault()
                      pick(shown.find((option) => !option.section).value)
                    } else if (event.key === 'ArrowDown') {
                      event.preventDefault()
                      focusList(0)
                    } else if (event.key === 'Escape') {
                      setOpen(false)
                    }
                  }}
                  placeholder={searchPlaceholder}
                  aria-label={label}
                  className="h-9 w-full rounded-xl border-none bg-transparent py-2 pl-3 pr-9 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-500 focus:ring-4 focus:ring-modrinth-green/20 min-[480px]:text-base dark:text-white dark:placeholder:text-gray-400"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <ChevronIcon open />
                </div>
              </div>
            ) : (
              <Popover.Trigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  className="flex h-9 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:brightness-110"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <OptionIcon option={current} />
                    <span
                      className={`${TRIGGER_TEXT} ${
                        current?.value ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {current?.label}
                    </span>
                  </span>
                  <ChevronIcon open={open} />
                </button>
              </Popover.Trigger>
            )}
          </div>
        </Popover.Anchor>
        <AnimatePresence>
          {open ? (
            <Popover.Portal forceMount>
              <Popover.Content
                forceMount
                asChild
                side="bottom"
                align="start"
                sideOffset={4}
                collisionPadding={12}
                onKeyDown={moveFocus}
                onOpenAutoFocus={(event) => event.preventDefault()}
                onInteractOutside={(event) => {
                  if (anchorRef.current?.contains(event.target)) event.preventDefault()
                }}
              >
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  style={{ width: 'var(--radix-popover-trigger-width)', transformOrigin: 'var(--radix-popover-content-transform-origin)' }}
                  className="z-50 flex max-h-[min(260px,var(--radix-popover-content-available-height))] min-w-[180px] flex-col overflow-hidden rounded-xl glass-pop"
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-gray-200 px-3 py-2 dark:border-[#2e3035]">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</span>
                    {hasMore ? (
                      <StyledTooltip label={showAll ? t('dl.hideSnapshots') : t('dl.showSnapshots')}>
                        <button
                          type="button"
                          onClick={() => setShowAll((currentValue) => !currentValue)}
                          className="ml-auto text-xs font-semibold text-modrinth-green transition-colors hover:text-modrinth-green-light"
                        >
                          {showAll ? t('dl.releasesOnly') : t('dl.showAll')}
                        </button>
                      </StyledTooltip>
                    ) : null}
                  </div>
                  <div ref={listRef} role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 custom-scrollbar">
                    {shown.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-gray-600 dark:text-gray-500">{emptyText}</p>
                    ) : (
                      shown.map((option) => {
                        if (option.section) {
                          return (
                            <div
                              key={`section:${option.section}`}
                              className="mx-1 mt-1.5 border-t border-gray-200 px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:border-[#34363c] dark:text-gray-500"
                            >
                              {option.section}
                            </div>
                          )
                        }
                        const selected = option.value === current?.value
                        return (
                          <button
                            key={option.value || 'auto'}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => pick(option.value)}
                            className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium outline-none transition-all ${
                              selected
                                ? 'font-semibold text-modrinth-green hover:bg-gray-100 focus-visible:bg-gray-100 dark:hover:bg-[#34363c] dark:focus-visible:bg-[#34363c]'
                                : 'text-gray-700 hover:bg-gray-100 focus-visible:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#34363c] dark:focus-visible:bg-[#34363c]'
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <OptionIcon option={option} />
                              <span className="min-w-0 truncate">{option.label}</span>
                            </span>
                            {option.hint ? (
                              <span className={`shrink-0 text-[11px] ${'text-gray-600 dark:text-gray-500'}`}>
                                {option.hint}
                              </span>
                            ) : null}
                          </button>
                        )
                      })
                    )}
                  </div>
                </motion.div>
              </Popover.Content>
            </Popover.Portal>
          ) : null}
        </AnimatePresence>
      </Popover.Root>
      {help ? <p className="m-0 mt-1.5 text-xs leading-snug text-gray-500 dark:text-gray-400">{help}</p> : null}
    </div>
  )
}
