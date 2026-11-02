'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { playPoof } from './softSounds'

const LIT_MS = 5000

export default function useCandle() {
  const [lit, setLit] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const light = useCallback((event) => {
    event?.preventDefault()
    event?.stopPropagation()
    playPoof()
    setLit(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setLit(false), LIT_MS)
  }, [])

  return [lit, light]
}
