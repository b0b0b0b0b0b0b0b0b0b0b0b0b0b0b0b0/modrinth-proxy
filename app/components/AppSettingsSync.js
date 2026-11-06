'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { applyPalette } from '../../lib/paletteManager'
import { writeSharedPalette, writeSharedTheme } from '../../lib/sharedLook'

export default function AppSettingsSync() {
  const { theme } = useTheme()

  useEffect(() => {
    if (theme) writeSharedTheme(theme)
  }, [theme])

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
