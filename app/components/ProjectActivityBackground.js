'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  ACTIVITY_DAYS,
  ACTIVITY_PAD_BOTTOM,
  buildActivityAreaPath,
  buildActivityPoints,
  buildDailyVersionCounts,
  catmullRomPath,
} from '@/lib/projectActivity'

function useSiteAccentColor() {
  const [accent, setAccent] = useState('#ec7fab')

  useEffect(() => {
    const read = () => {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-green')
        .trim()
      if (value) setAccent(value)
    }
    read()
    window.addEventListener('color-palette-changed', read)
    return () => window.removeEventListener('color-palette-changed', read)
  }, [])

  return accent
}

function useProjectActivityEnabled() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const read = () => localStorage.getItem('hide-project-activity-graph') !== 'true'
    setEnabled(read())

    const onChange = () => setEnabled(read())
    window.addEventListener('feature-settings-changed', onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener('feature-settings-changed', onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  return enabled
}

export default function ProjectActivityBackground({ versions = [] }) {
  const enabled = useProjectActivityEnabled()
  const accent = useSiteAccentColor()
  const gradientId = useId().replace(/:/g, '')
  const wrapperRef = useRef(null)
  const [svgWidth, setSvgWidth] = useState(0)
  const [svgHeight, setSvgHeight] = useState(0)
  const [animated, setAnimated] = useState(false)

  const { counts, hasAnyData } = useMemo(
    () => buildDailyVersionCounts(versions, ACTIVITY_DAYS),
    [versions],
  )

  const baseline = svgHeight - ACTIVITY_PAD_BOTTOM

  const points = useMemo(
    () => buildActivityPoints(counts, svgWidth, svgHeight, hasAnyData),
    [counts, svgWidth, svgHeight, hasAnyData],
  )

  const linePath = useMemo(() => catmullRomPath(points), [points])
  const areaPath = useMemo(
    () => buildActivityAreaPath(linePath, points, svgHeight),
    [linePath, points, svgHeight],
  )

  useEffect(() => {
    if (!enabled) return undefined

    const el = wrapperRef.current
    if (!el) return undefined

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setSvgWidth(width)
      setSvgHeight(height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled])

  useEffect(() => {
    if (svgWidth <= 0 || svgHeight <= 0) return undefined
    const frame = window.requestAnimationFrame(() => setAnimated(true))
    return () => window.cancelAnimationFrame(frame)
  }, [svgWidth, svgHeight])

  const ready = svgWidth > 0 && svgHeight > 0

  if (!enabled) return null

  return (
    <div
      ref={wrapperRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {ready && (
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          xmlns="http://www.w3.org/2000/svg"
          className="block"
          style={{ width: svgWidth, height: svgHeight }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>
          {hasAnyData && (
            <>
              <path
                d={areaPath}
                fill={`url(#${gradientId})`}
                style={{
                  opacity: animated ? 1 : 0,
                  transition: 'opacity 0.8s ease-out 0.6s',
                }}
              />
              <path
                d={linePath}
                fill="none"
                stroke={accent}
                strokeOpacity="0.2"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength="1"
                style={{
                  strokeDasharray: '1',
                  strokeDashoffset: animated ? '0' : '1',
                  transition: 'stroke-dashoffset 1.2s ease-out',
                }}
              />
            </>
          )}
        </svg>
      )}
    </div>
  )
}
