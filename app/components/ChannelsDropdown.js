'use client'

import { useState, useRef, useEffect } from 'react'

const CHANNEL_OPTIONS = [
  { id: 'all', label: 'Все каналы', textClass: 'text-white', activeRing: '' },
  {
    id: 'release',
    label: 'Релиз',
    textClass: 'text-version-release-fg',
    activeRing: 'ring-1 ring-version-release-fg/40',
  },
  {
    id: 'beta',
    label: 'Бета',
    textClass: 'text-version-beta-fg',
    activeRing: 'ring-1 ring-version-beta-fg/40',
  },
  {
    id: 'alpha',
    label: 'Альфа',
    textClass: 'text-red-400',
    activeRing: 'ring-1 ring-red-400/40',
  },
]

export default function ChannelsDropdown({
  selectedChannel,
  onChannelChange,
  channelTypesPresent,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const normalizedPresent = channelTypesPresent

  const channels =
    normalizedPresent instanceof Set
      ? CHANNEL_OPTIONS.filter(
          (c) => c.id === 'all' || normalizedPresent.has(c.id),
        )
      : CHANNEL_OPTIONS

  const selectedMeta =
    CHANNEL_OPTIONS.find((c) => c.id === selectedChannel) || CHANNEL_OPTIONS[0]

  const getLabel = () => {
    if (selectedChannel === 'all') return 'Каналы'
    return selectedMeta.label
  }

  const triggerSpanClass =
    selectedChannel !== 'all' && selectedMeta.textClass !== 'text-white'
      ? selectedMeta.textClass
      : 'text-white'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white text-sm border border-gray-700 hover:border-modrinth-green transition"
        style={{ borderRadius: '0.75rem' }}
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 3H2l8 9.46V19l4 2v-8.54z" />
        </svg>
        <span className={triggerSpanClass}>{getLabel()}</span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-gray-700 shadow-2xl z-50 overflow-hidden animate-fade-in"
          style={{ borderRadius: '0.75rem' }}
        >
          <div className="p-2">
            <div className="flex flex-col gap-1">
              {channels.map((channel) => {
                const isSel = selectedChannel === channel.id
                return (
                  <button
                    key={channel.id}
                    onClick={() => {
                      onChannelChange(channel.id)
                      setIsOpen(false)
                    }}
                    className={`flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-700 transition text-left rounded-xl ${
                      channel.textClass
                    } ${isSel && channel.activeRing ? channel.activeRing : ''}`}
                  >
                    <span>{channel.label}</span>
                    {isSel && (
                      <svg
                        className={`w-5 h-5 shrink-0 ${channel.textClass}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
