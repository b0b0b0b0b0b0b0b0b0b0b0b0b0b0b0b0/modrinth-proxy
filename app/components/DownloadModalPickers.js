'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import StyledTooltip from './StyledTooltip'

const PICKER_DROPDOWN_MAX_HEIGHT = 260
const PICKER_LIST_MAX_HEIGHT = 220

function ChevronIcon({ open }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      className={`pointer-events-none size-5 shrink-0 text-gray-500 transition-transform duration-150 dark:text-gray-400 ${
        open ? 'rotate-90' : '-rotate-90'
      }`}
      aria-hidden
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function PickerDropdownPortal({ anchorRef, open, children, dropdownRef }) {
  const [layout, setLayout] = useState(null)
  const [portalTarget, setPortalTarget] = useState(null)
  const innerRef = useRef(null)

  const mergeDropdownRef = (node) => {
    innerRef.current = node
    if (dropdownRef) {
      if (typeof dropdownRef === 'function') dropdownRef(node)
      else dropdownRef.current = node
    }
  }

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  useEffect(() => {
    if (!open || !anchorRef.current) {
      setLayout(null)
      return undefined
    }

    const updatePosition = () => {
      if (!anchorRef.current) return

      const anchor = anchorRef.current.getBoundingClientRect()
      const padding = 12
      const gap = 4
      const viewportW = window.innerWidth
      const viewportH = window.innerHeight
      const dropdownHeight = innerRef.current?.offsetHeight || PICKER_DROPDOWN_MAX_HEIGHT

      const width = Math.min(
        Math.max(anchor.width, Math.min(220, viewportW - padding * 2)),
        viewportW - padding * 2,
      )

      let left = anchor.left
      if (left + width > viewportW - padding) {
        left = viewportW - padding - width
      }
      left = Math.max(padding, left)

      const spaceBelow = viewportH - anchor.bottom - gap - padding
      const spaceAbove = anchor.top - gap - padding
      const flip = spaceBelow < Math.min(dropdownHeight, 180) && spaceAbove > spaceBelow

      const availableHeight = flip ? spaceAbove : spaceBelow
      const maxHeight = Math.min(
        PICKER_DROPDOWN_MAX_HEIGHT,
        Math.max(140, availableHeight),
      )

      let top = flip ? anchor.top - gap - Math.min(dropdownHeight, maxHeight) : anchor.bottom + gap
      top = Math.max(padding, Math.min(top, viewportH - padding - 120))

      setLayout({ top, left, width, maxHeight, flip })
    }

    updatePosition()
    const raf = requestAnimationFrame(updatePosition)

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    const observer = innerRef.current ? new ResizeObserver(updatePosition) : null
    if (innerRef.current && observer) observer.observe(innerRef.current)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      observer?.disconnect()
    }
  }, [open, anchorRef])

  if (!open || !portalTarget || !layout) return null

  return createPortal(
    <div
      ref={mergeDropdownRef}
      style={{
        position: 'fixed',
        top: layout.top,
        left: layout.left,
        width: layout.width,
        maxHeight: layout.maxHeight,
        zIndex: 260,
      }}
      className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-[#2e3035] dark:bg-[#27292e]"
    >
      {children}
    </div>,
    portalTarget,
  )
}

export default function DownloadModalPickers({
  selectedMcVersion,
  selectedLoader,
  filteredMcVersions,
  loaders,
  versionSearch,
  onVersionSearchChange,
  showAllVersions,
  hasSnapshotVersions,
  onToggleShowAllVersions,
  favMcVersion,
  favLoader,
  onSelectMcVersion,
  onSelectLoader,
  onToggleFavoriteMcVersion,
  onToggleFavoriteLoader,
  getLoaderName,
  showLoaderPicker,
  openPicker,
  onOpenPickerChange,
  LottieStar,
  bookmarkAnimation,
  noBookmarkAnimation,
}) {
  const rootRef = useRef(null)
  const versionAnchorRef = useRef(null)
  const loaderAnchorRef = useRef(null)
  const versionDropdownRef = useRef(null)
  const loaderDropdownRef = useRef(null)

  const versionOpen = openPicker === 'version'
  const loaderOpen = openPicker === 'loader'

  useEffect(() => {
    if (!openPicker) return undefined

    const handlePointerDown = (event) => {
      const target = event.target
      if (
        rootRef.current?.contains(target) ||
        versionDropdownRef.current?.contains(target) ||
        loaderDropdownRef.current?.contains(target)
      ) {
        return
      }
      onOpenPickerChange(null)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [openPicker, onOpenPickerChange])

  const openVersionPicker = () => {
    onOpenPickerChange(versionOpen ? null : 'version')
  }

  const openLoaderPicker = () => {
    onOpenPickerChange(loaderOpen ? null : 'loader')
  }

  return (
    <div ref={rootRef} className="w-full">
      <div
        className={`grid w-full gap-2 ${showLoaderPicker ? 'grid-cols-1 min-[480px]:grid-cols-2' : 'grid-cols-1'}`}
      >
        <div ref={versionAnchorRef} className="relative min-w-0">
          <div className="rounded-xl bg-gray-100 dark:bg-[#34363c]">
            {versionOpen ? (
              <div className="relative flex items-center">
                <input
                  type="text"
                  autoFocus
                  placeholder="Выберите версию"
                  value={versionSearch}
                  onChange={(event) => onVersionSearchChange(event.target.value)}
                  className="h-9 w-full rounded-xl border-none bg-transparent py-2 pl-3 pr-9 text-sm font-medium text-gray-900 outline-none placeholder:text-gray-500 focus:ring-4 focus:ring-modrinth-green/20 min-[480px]:text-base dark:text-white dark:placeholder:text-gray-400"
                />
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                  <ChevronIcon open />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={openVersionPicker}
                className="flex h-9 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:brightness-105"
              >
                <span
                  className={`min-w-0 truncate text-sm font-medium min-[480px]:text-base ${
                    selectedMcVersion
                      ? 'font-semibold text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {selectedMcVersion || 'Выберите версию'}
                </span>
                <ChevronIcon open={false} />
              </button>
            )}
          </div>
        </div>

        {showLoaderPicker && (
          <div ref={loaderAnchorRef} className="relative min-w-0">
            <button
              type="button"
              onClick={openLoaderPicker}
              className={`flex h-9 w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left transition-all duration-200 hover:brightness-[115%] active:brightness-[115%] ${
                selectedLoader
                  ? 'bg-gray-200 text-gray-900 dark:bg-[#34363c] dark:text-white'
                  : 'bg-gray-100 text-gray-500 dark:bg-[#34363c] dark:text-gray-400'
              }`}
            >
              <span className="min-w-0 truncate text-sm font-semibold leading-tight min-[480px]:text-base">
                {selectedLoader ? getLoaderName(selectedLoader) : 'Выберите платформу'}
              </span>
              <ChevronIcon open={loaderOpen} />
            </button>
          </div>
        )}
      </div>

      <PickerDropdownPortal
        anchorRef={versionAnchorRef}
        open={versionOpen}
        dropdownRef={versionDropdownRef}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-gray-200 px-3 py-2 dark:border-[#2e3035]">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Версия
          </span>
          {hasSnapshotVersions && (
            <StyledTooltip
              label={showAllVersions ? 'Скрыть снапшоты' : 'Показать также снапшоты'}
            >
              <button
                type="button"
                onClick={onToggleShowAllVersions}
                className="ml-auto text-xs font-semibold text-modrinth-green transition-colors hover:text-modrinth-green-light"
              >
                {showAllVersions ? 'Только релизы' : 'Показать все'}
              </button>
            </StyledTooltip>
          )}
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 custom-scrollbar"
          style={{ maxHeight: PICKER_LIST_MAX_HEIGHT }}
        >
          {filteredMcVersions.map((version) => (
            <div key={version} className="group/row flex items-center gap-1">
              <LottieStar
                isFavorite={favMcVersion === version}
                animationData={favMcVersion === version ? noBookmarkAnimation : bookmarkAnimation}
                onClick={() => onToggleFavoriteMcVersion(version)}
                label={
                  favMcVersion === version ? (
                    'Убрать из избранного'
                  ) : (
                    <span className="flex flex-col items-center">
                      <span>Сделать избранной версией</span>
                      <span className="text-[10px] font-normal opacity-60 mt-0.5">
                        (будет выбираться автоматически)
                      </span>
                    </span>
                  )
                }
              />
              <button
                type="button"
                onClick={() => {
                  onSelectMcVersion(version)
                  onOpenPickerChange(null)
                  onVersionSearchChange('')
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
                  selectedMcVersion === version
                    ? 'bg-modrinth-green text-black'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#34363c]'
                }`}
              >
                {version}
              </button>
            </div>
          ))}
        </div>
      </PickerDropdownPortal>

      <PickerDropdownPortal
        anchorRef={loaderAnchorRef}
        open={loaderOpen}
        dropdownRef={loaderDropdownRef}
      >
        <div className="border-b border-gray-200 px-3 py-2 dark:border-[#2e3035]">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Платформа
          </span>
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 custom-scrollbar"
          style={{ maxHeight: PICKER_LIST_MAX_HEIGHT }}
        >
          {loaders.map((loader) => (
            <div key={loader} className="group/row flex items-center gap-1">
              <LottieStar
                isFavorite={favLoader === loader}
                animationData={favLoader === loader ? noBookmarkAnimation : bookmarkAnimation}
                onClick={() => onToggleFavoriteLoader(loader)}
                label={
                  favLoader === loader ? (
                    'Убрать из избранного'
                  ) : (
                    <span className="flex flex-col items-center">
                      <span>Сделать избранным загрузчиком</span>
                      <span className="text-[10px] font-normal opacity-60 mt-0.5">
                        (будет выбираться автоматически)
                      </span>
                    </span>
                  )
                }
              />
              <button
                type="button"
                onClick={() => {
                  onSelectLoader(loader)
                  onOpenPickerChange(null)
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${
                  selectedLoader === loader
                    ? 'bg-modrinth-green text-black'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#34363c]'
                }`}
              >
                {getLoaderName(loader)}
              </button>
            </div>
          ))}
        </div>
      </PickerDropdownPortal>
    </div>
  )
}
