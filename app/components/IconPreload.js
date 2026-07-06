'use client'

import { useEffect } from 'react'

export default function IconPreload({ iconUrl }) {
  useEffect(() => {
    if (!iconUrl) return

    const existingLink = document.querySelector(`link[rel="preload"][as="image"][href="${iconUrl}"]`)
    if (existingLink) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = iconUrl
    document.head.appendChild(link)

    return () => {
      const linkToRemove = document.querySelector(`link[rel="preload"][as="image"][href="${iconUrl}"]`)
      if (linkToRemove) {
        linkToRemove.remove()
      }
    }
  }, [iconUrl])

  return null
}
