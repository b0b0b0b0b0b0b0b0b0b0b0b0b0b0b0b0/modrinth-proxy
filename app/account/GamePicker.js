'use client'

import { useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

function Chevron({ open }) {
  return (
    <svg
      className={`pointer-events-none size-4 shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export default function GamePicker({ label, value, options, onChange, disabled, searchPlaceholder, emptyText }) {
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const listRef = useRef(null)
  const current = options.find((option) => option.value === value) || options[0]
  const needle = query.trim().toLowerCase()
  const shown = needle ? options.filter((option) => option.value && option.label.toLowerCase().includes(needle)) : options

  useEffect(() => {
    if (!open) {
      setQuery('')
      return undefined
    }
    const frame = requestAnimationFrame(() => {
      listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

  const pick = (next) => {
    setOpen(false)
    if (next !== value) onChange(next)
  }

  const moveFocus = (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const items = [...(listRef.current?.querySelectorAll('button') || [])]
    if (items.length === 0) return
    event.preventDefault()
    const index = items.indexOf(document.activeElement)
    const next = event.key === 'ArrowDown' ? Math.min(items.length - 1, index + 1) : Math.max(0, index - 1)
    items[index === -1 ? 0 : next].focus()
  }

  return (
    <div className="min-w-0">
      <span className="mb-1 block text-xs font-semibold text-gray-400">{label}</span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={`flex h-10 w-full items-center justify-between gap-2 rounded-xl border px-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              open
                ? 'border-modrinth-green/60 bg-gray-100 dark:bg-[#34363c]'
                : 'border-transparent bg-gray-100 hover:brightness-105 dark:bg-[#34363c] dark:hover:brightness-110'
            }`}
          >
            <span className={`min-w-0 truncate ${current?.value ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-500 dark:text-gray-400'}`}>
              {current?.label}
            </span>
            <Chevron open={open} />
          </button>
        </Popover.Trigger>
        <AnimatePresence>
          {open ? (
            <Popover.Portal forceMount>
              <Popover.Content
                forceMount
                asChild
                side="bottom"
                align="start"
                sideOffset={6}
                collisionPadding={12}
                onKeyDown={moveFocus}
              >
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}
                  style={{ width: 'var(--radix-popover-trigger-width)', transformOrigin: 'var(--radix-popover-content-transform-origin)' }}
                  className="z-50 flex max-h-[min(300px,var(--radix-popover-content-available-height))] min-w-[180px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-[#2e3035] dark:bg-[#27292e]"
                >
                  {searchPlaceholder ? (
                    <div className="border-b border-gray-200 p-1.5 dark:border-[#2e3035]">
                      <input
                        type="text"
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && shown.length > 0) {
                            event.preventDefault()
                            pick(shown[0].value)
                          }
                        }}
                        placeholder={searchPlaceholder}
                        className="h-8 w-full rounded-lg bg-gray-100 px-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-modrinth-green/30 dark:bg-[#34363c] dark:text-white dark:placeholder:text-gray-400"
                      />
                    </div>
                  ) : null}
                  <div ref={listRef} role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 custom-scrollbar">
                    {shown.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-gray-600 dark:text-gray-500">{emptyText}</p>
                    ) : (
                      shown.map((option) => {
                        const selected = option.value === current?.value
                        return (
                          <button
                            key={option.value || 'auto'}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => pick(option.value)}
                            className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium outline-none transition-colors ${
                              selected
                                ? 'bg-modrinth-green text-black'
                                : 'text-gray-700 hover:bg-gray-100 focus-visible:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#34363c] dark:focus-visible:bg-[#34363c]'
                            }`}
                          >
                            <span className="min-w-0 truncate">{option.label}</span>
                            {option.hint ? (
                              <span className={`shrink-0 text-[11px] ${selected ? 'text-black/60' : 'text-gray-600 dark:text-gray-500'}`}>
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
    </div>
  )
}
