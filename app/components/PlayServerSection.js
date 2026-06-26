'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

import { SERVER_REGIONS } from '@/lib/serverCategories'
import StyledTooltip from './StyledTooltip'

const mapRegion = (region) => {
  if (!region) return ''
  const reg = SERVER_REGIONS.find(r => r.id.toLowerCase() === region.toLowerCase())
  if (reg) return reg.name
  
  const fallbackMapping = {
    'us_west': 'Западное побережье США',
    'us_east': 'Восточное побережье США',
    'eu': 'Европа',
    'ru': 'Россия'
  }
  return fallbackMapping[region.toLowerCase()] || region.toUpperCase()
}

export default function PlayServerSection({ resource, playersOnline, region, address }) {
  const [copied, setCopied] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [portalTarget, setPortalTarget] = useState(null)
  const [countdown, setCountdown] = useState(3)
  const [progress, setProgress] = useState(1)

  useEffect(() => {
    setPortalTarget(document.body)
  }, [])

  const handleCopy = async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy IP:', err)
    }
  }

  const handlePlay = () => {
    const slug = resource.slug || resource.id
    window.open(`modrinth://server/${slug}`, '_self')
    setModalOpen(true)
  }

  useEffect(() => {
    if (!modalOpen) return

    setCountdown(3)
    setProgress(1)

    const startTime = Date.now()
    const duration = 3000

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, duration - elapsed)
      
      setProgress(remaining / duration)
      setCountdown(Math.ceil(remaining / 1000))

      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 16)

    document.body.style.overflow = 'hidden'

    return () => {
      clearInterval(interval)
      document.body.style.overflow = ''
    }
  }, [modalOpen])

  const circumference = 2 * Math.PI * 45

  return (
    <div className="flex flex-col gap-2.5 w-full lg:w-[280px] items-center">
      <StyledTooltip label="Играть через Modrinth App">
        <button
          type="button"
          onClick={handlePlay}
          className="modrinth-button-font w-fit px-5 h-10 bg-modrinth-green hover:bg-modrinth-green-light text-black rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 active:scale-[0.98] shadow-lg shadow-modrinth-green/10 text-base whitespace-nowrap"
        >
          <svg className="w-6 h-6 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 3 14 9-14 9z" />
          </svg>
          <span>Играть</span>
        </button>
      </StyledTooltip>

      {address && (
        <div className="flex flex-col gap-1.5 w-full items-center">
          <div className="flex items-center gap-3 w-full my-0.5">
            <div className="flex-1 h-[1px] bg-gray-700/40"></div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">или</span>
            <div className="flex-1 h-[1px] bg-gray-700/40"></div>
          </div>
          <StyledTooltip label={copied ? 'Скопировано' : 'Скопировать адрес'}>
            <button
              type="button"
              onClick={handleCopy}
              className="group flex w-full min-w-0 items-center justify-center gap-2 py-1 text-center outline-none"
            >
              <span
                className={`min-w-0 truncate font-mono text-sm leading-snug transition-colors duration-150 ${
                  copied
                    ? 'text-modrinth-green'
                    : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                }`}
              >
                {address}
              </span>
              {copied ? (
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-modrinth-green"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-gray-500 opacity-50 transition-opacity duration-150 group-hover:opacity-80"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                </svg>
              )}
            </button>
          </StyledTooltip>
        </div>
      )}

      {modalOpen && portalTarget && createPortal(
        <div 
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-modrinth-dark border border-gray-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl flex flex-col items-center gap-6"
          >
            <div className="flex flex-col gap-6 w-full">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="stroke-gray-800"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    strokeWidth="6"
                  />
                  <circle
                    className="stroke-modrinth-green"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-3xl font-bold text-white z-10">{countdown}</span>
              </div>

              <h2 className="m-0 text-xl md:text-2xl font-bold text-white text-center">
                Открытие Modrinth App
              </h2>

              <div className="flex flex-col items-center gap-4 bg-gray-900/50 border border-gray-800/80 rounded-2xl p-4 w-full">
                <div className="flex items-center gap-3 rounded-xl bg-gray-900/80 border border-gray-800/40 p-3 w-full">
                  {resource.icon_url && (
                    <img 
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0" 
                      src={resource.icon_url} 
                      alt="" 
                    />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-white truncate text-sm leading-tight">
                      {resource.title}
                    </span>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      {playersOnline != null && (
                        <span className="text-green-400 font-bold flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                          </span>
                          {playersOnline} онлайн
                        </span>
                      )}
                      {region && (
                        <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full font-medium">
                          {mapRegion(region)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col text-left gap-3 w-full">
                  <span className="font-semibold text-white text-xs uppercase tracking-wider text-gray-500">
                    Зачем использовать Modrinth App
                  </span>
                  <div className="flex flex-col gap-2">
                    <div className="flex text-sm gap-2 items-center text-gray-300">
                      <div className="w-5 h-5 border border-solid rounded-full flex items-center justify-center border-modrinth-green/30 bg-modrinth-green/10 text-modrinth-green flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                      <span>Запуск игры прямо на сервер</span>
                    </div>
                    <div className="flex text-sm gap-2 items-center text-gray-300">
                      <div className="w-5 h-5 border border-solid rounded-full flex items-center justify-center border-modrinth-green/30 bg-modrinth-green/10 text-modrinth-green flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                      <span>Автоматическая установка модов/сборок</span>
                    </div>
                    <div className="flex text-sm gap-2 items-center text-gray-300">
                      <div className="w-5 h-5 border border-solid rounded-full flex items-center justify-center border-modrinth-green/30 bg-modrinth-green/10 text-modrinth-green flex-shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                      <span>Обновление файлов при изменениях</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold h-10 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                Закрыть
              </button>
              <a
                href="/app"
                target="_blank"
                className="flex-1 bg-modrinth-green hover:bg-modrinth-green-light text-black font-bold h-10 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Скачать App
              </a>
            </div>
          </div>
        </div>,
        portalTarget,
      )}
    </div>
  )
}
