'use client'

import { useCallback, useEffect, useRef } from 'react'

const TOP_OFFSET = 16
const BOTTOM_OFFSET = 20

export default function StickyScrollSidebar({ children, className = '' }) {
  const rootRef = useRef(null)

  const updateLayout = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    if (window.innerWidth < 1024) {
      root.style.top = ''
      return
    }
    const room = window.innerHeight - TOP_OFFSET - BOTTOM_OFFSET
    const top = root.offsetHeight <= room ? TOP_OFFSET : window.innerHeight - root.offsetHeight - BOTTOM_OFFSET
    root.style.top = `${top}px`
  }, [])

  useEffect(() => {
    updateLayout()
    const root = rootRef.current
    if (!root) return

    const observer = new ResizeObserver(updateLayout)
    observer.observe(root)
    window.addEventListener('resize', updateLayout)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateLayout)
    }
  }, [updateLayout, children])

  return (
    <div ref={rootRef} className="relative w-full min-w-0 lg:sticky lg:top-4 lg:self-start">
      <div className={`sidebar-scroll ${className}`.trim()}>{children}</div>
    </div>
  )
}
