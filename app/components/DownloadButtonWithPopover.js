'use client'

import * as Popover from '@radix-ui/react-popover'
import { useState, useRef } from 'react'
import { useT } from './I18nProvider'
import { DownloadIcon, PirateIcon } from './icons'

export default function DownloadButtonWithPopover({ 
  buttonText,
  officialUrl, 
  pirateUrl
}) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (window.innerWidth >= 768) {
      setOpen(true)
    }
  }

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      timeoutRef.current = setTimeout(() => {
        setOpen(false)
      }, 200)
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => {
            if (window.innerWidth < 768) {
              setOpen(!open)
            }
          }}
          className="download-link w-full hover:scale-100 focus:outline-none outline-none"
        >
          <div className="flex items-center justify-center gap-3">
            <DownloadIcon />
            {buttonText}
          </div>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="rounded-xl px-3 py-1.5 shadow-lg shadow-black/50 border border-gray-700 z-50"
          style={{ backgroundColor: 'var(--bg-gradient-start)' }}
          side="top"
          sideOffset={-10}
          align="end"
          alignOffset={-10}
          onOpenAutoFocus={(e) => e.preventDefault()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex items-center gap-3 text-white">
            <a
              href={officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-modrinth-green hover:underline text-sm focus:outline-none outline-none"
            >
              {t('app.official')}
            </a>
            <span className="text-gray-500">|</span>
            <a
              href={pirateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-modrinth-green hover:underline text-sm relative group flex items-center gap-1.5 focus:outline-none outline-none"
            >
              <PirateIcon className="w-4 h-4" />
              {t('app.pirate')}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-gray-700"
                   style={{ backgroundColor: 'var(--bg-gradient-start)' }}>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
                     style={{ borderTopColor: 'var(--bg-gradient-start)' }}></div>
                {t('app.offlinePlay')}
              </div>
            </a>
          </div>
          <Popover.Arrow className="fill-[var(--bg-gradient-start)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
