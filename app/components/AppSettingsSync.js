'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { PALETTES, applyPalette } from '../../lib/paletteManager'
import {
  SHARED_PALETTE_COOKIE,
  SHARED_SOUNDS_COOKIE,
  SHARED_THEME_COOKIE,
  readShared,
  writeSharedPalette,
  writeSharedSounds,
  writeSharedTheme,
} from '../../lib/sharedLook'
import { setSoundsMuted, soundsMuted } from './softSounds'

export default function AppSettingsSync() {
  const { theme, setTheme } = useTheme()
  const themeRef = useRef(theme)
  themeRef.current = theme

  useEffect(() => {
    if (theme) writeSharedTheme(theme)
  }, [theme])

  useEffect(() => {
    writeSharedSounds(soundsMuted())
    const adopt = () => {
      const sharedTheme = readShared(SHARED_THEME_COOKIE)
      if (['dark', 'light', 'system'].includes(sharedTheme) && sharedTheme !== themeRef.current) setTheme(sharedTheme)
      const sharedPalette = readShared(SHARED_PALETTE_COOKIE)
      const ownPalette = localStorage.getItem('color-palette') || 'pink'
      if (sharedPalette && PALETTES[sharedPalette] && sharedPalette !== ownPalette) {
        localStorage.setItem('color-palette', sharedPalette)
        window.dispatchEvent(new CustomEvent('color-palette-changed', { detail: sharedPalette }))
      }
      const sharedSounds = readShared(SHARED_SOUNDS_COOKIE)
      if ((sharedSounds === 'on' || sharedSounds === 'off') && (sharedSounds === 'off') !== soundsMuted()) {
        setSoundsMuted(sharedSounds === 'off')
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') adopt()
    }
    window.addEventListener('focus', adopt)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', adopt)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [setTheme])

  useEffect(() => {
    const palette = localStorage.getItem('color-palette') || 'pink'
    applyPalette(palette)
    writeSharedPalette(palette)

    const handlePaletteChange = (e) => {
      applyPalette(e.detail)
      writeSharedPalette(e.detail)
    }

    window.addEventListener('color-palette-changed', handlePaletteChange)

    const { hostname } = window.location

    const handleClick = ({ target }) => {
      const a = target.closest('a[href]')
      if (!a || a.target) return

      try {
        const linkHost = new URL(a.href).hostname
        const ownSite = linkHost === 'modrinth.black' || linkHost.endsWith('.modrinth.black')
        if (linkHost !== hostname && !ownSite) {
          a.target = '_blank'
          a.rel = 'noopener noreferrer'
        }
      } catch {}
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      window.removeEventListener('color-palette-changed', handlePaletteChange)
      document.removeEventListener('click', handleClick, true)
    }
  }, [])

  return null
}
