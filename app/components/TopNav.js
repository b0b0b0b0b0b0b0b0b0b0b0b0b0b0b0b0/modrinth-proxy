'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NewsCounter from './NewsCounter'
import { useT } from './I18nProvider'

export default function TopNav() {
  const t = useT()
  const pathname = usePathname()
  const isSettings = pathname === '/settings'
  const isNews = pathname.startsWith('/news')
  const panelId = useId()
  const timersRef = useRef([])
  const EXTERNAL_LINKS = [
    {
      href: 'https://client.modrinth.black',
      tooltip: t('nav.clientServerTip'),
      children: t('nav.clientServer'),
    },
    {
      href: 'https://rp.modrinth.black',
      tooltip: t('nav.rpRepackTip'),
      children: t('nav.rpRepack'),
    },
    {
      href: 'https://jar.modrinth.black',
      tooltip: t('nav.pluginTranslateTip'),
      children: t('nav.pluginTranslate'),
    },
    {
      href: 'https://dm.modrinth.black',
      tooltip: t('nav.deluxeMenuTip'),
      children: t('nav.deluxeMenu'),
    },
    {
      href: 'https://ping.modrinth.black',
      tooltip: t('nav.pingServersTip'),
      children: t('nav.pingServers'),
    },
  ]

  const RAIL_MS = 520
  const ROT_MS = 300
  const PANEL_MS = 420

  const [railExtended, setRailExtended] = useState(false)
  const [chevronDown, setChevronDown] = useState(false)
  const [panelExpanded, setPanelExpanded] = useState(false)
  const [busy, setBusy] = useState(false)

  const schedule = useCallback((fn, ms) => {
    const id = window.setTimeout(fn, ms)
    timersRef.current.push(id)
  }, [])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const prefersReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const runOpen = useCallback(() => {
    clearTimers()
    if (prefersReducedMotion()) {
      setRailExtended(true)
      setChevronDown(true)
      setPanelExpanded(true)
      return
    }
    setBusy(true)
    setRailExtended(false)
    setChevronDown(false)
    setPanelExpanded(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setRailExtended(true))
    })
    schedule(() => {
      setChevronDown(true)
      schedule(() => {
        setPanelExpanded(true)
        schedule(() => setBusy(false), PANEL_MS)
      }, ROT_MS)
    }, RAIL_MS)
  }, [clearTimers, prefersReducedMotion, schedule])

  const runClose = useCallback(() => {
    clearTimers()
    if (prefersReducedMotion()) {
      setPanelExpanded(false)
      setChevronDown(false)
      setRailExtended(false)
      return
    }
    setBusy(true)
    setPanelExpanded(false)
    schedule(() => {
      setChevronDown(false)
      schedule(() => {
        setRailExtended(false)
        setBusy(false)
      }, ROT_MS)
    }, PANEL_MS)
  }, [clearTimers, prefersReducedMotion, schedule])

  const toggle = useCallback(() => {
    if (busy) return
    if (panelExpanded) runClose()
    else runOpen()
  }, [busy, panelExpanded, runClose, runOpen])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => {
      if (mq.matches) {
        clearTimers()
        setRailExtended(false)
        setChevronDown(false)
        setPanelExpanded(false)
        setBusy(false)
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [clearTimers])

  const iconLinkClass = (active) =>
    `top-nav-link top-nav-link--icon p-2 rounded-xl transition-colors flex items-center justify-center${active ? ' top-nav-link--active' : ''}`

  return (
    <nav className="top-nav">
      <div className="top-nav-content top-nav-content--stack">
        <div className="top-nav-mobile-stack md:hidden">
          <div className="top-nav-mobile-toolbar">
            <button
              type="button"
              className="top-nav-mobile-trigger-v2"
              aria-expanded={panelExpanded}
              aria-busy={busy}
              aria-controls={panelId}
              aria-label={
                panelExpanded
                  ? t('nav.servicesHide')
                  : t('nav.servicesShow')
              }
              onClick={toggle}
            >
              <span className="top-nav-mobile-title-area">
                <span className="top-nav-dot" aria-hidden />
                <span className="truncate">ModrinthProxy</span>
              </span>
              <span className="top-nav-mobile-strip" aria-hidden>
                <span
                  className={`top-nav-mobile-rail ${railExtended ? 'top-nav-mobile-rail--extended' : ''}`}
                />
                <span
                  className={`top-nav-mobile-chevrider ${railExtended ? 'top-nav-mobile-chevrider--end' : ''}`}
                >
                  <span
                    className={`top-nav-mobile-chevrider-inner ${chevronDown ? 'top-nav-mobile-chevrider-inner--down' : ''}`}
                  >
                    <svg
                      className="h-5 w-5 text-[var(--color-green)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </span>
                </span>
              </span>
            </button>
            <Link
              href="/settings"
              className={iconLinkClass(isSettings)}
              data-tooltip={t('nav.settings')}
              aria-label={t('nav.settings')}
              aria-current={isSettings ? 'page' : undefined}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Link>
            <Link
              href="/news"
              className={`${iconLinkClass(isNews)} relative`}
              data-tooltip={t('nav.news')}
              aria-label={t('nav.news')}
              aria-current={isNews ? 'page' : undefined}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" />
              </svg>
              <NewsCounter />
            </Link>
          </div>

          <div
            id={panelId}
            className={`top-nav-mobile-panel ${panelExpanded ? 'top-nav-mobile-panel--open' : 'top-nav-mobile-panel--collapsed'}`}
            style={{ gridTemplateRows: panelExpanded ? '1fr' : '0fr' }}
            aria-hidden={!panelExpanded}
          >
            <div className="top-nav-mobile-panel-inner">
              <div className="top-nav-mobile-links">
                {EXTERNAL_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="top-nav-link top-nav-link--mobile-sheet"
                    data-tooltip={link.tooltip}
                    tabIndex={panelExpanded ? undefined : -1}
                  >
                    {link.children}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="top-nav-links top-nav-links--desktop">
          <span
            className="top-nav-link top-nav-link-here"
            data-tooltip={t('nav.here')}
          >
            <span className="top-nav-dot" aria-hidden />
            ModrinthProxy
          </span>
          {EXTERNAL_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="top-nav-link"
              data-tooltip={link.tooltip}
            >
              {link.children}
            </a>
          ))}
        </div>

        <div className="hidden md:flex flex-row items-center gap-2 flex-shrink-0">
          <Link
            href="/settings"
            className={iconLinkClass(isSettings)}
            data-tooltip={t('nav.settings')}
            aria-label={t('nav.settings')}
            aria-current={isSettings ? 'page' : undefined}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Link>
          <Link
            href="/news"
            className={`${iconLinkClass(isNews)} relative`}
            data-tooltip={t('nav.news')}
            aria-label={t('nav.news')}
            aria-current={isNews ? 'page' : undefined}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
              <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z" />
            </svg>
            <NewsCounter />
          </Link>
        </div>
      </div>
    </nav>
  )
}
