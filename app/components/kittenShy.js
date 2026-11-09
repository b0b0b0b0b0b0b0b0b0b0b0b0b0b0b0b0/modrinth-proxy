'use client'

import { useEffect, useState } from 'react'

const EVENT = 'kitten-shy'
let current = null

export function setKittenShy(value) {
  const next = value || null
  if (current === next) return
  current = next
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }))
}

export function useKittenShy() {
  const [shy, setShy] = useState(null)
  useEffect(() => {
    setShy(current)
    const onChange = (event) => setShy(event.detail)
    window.addEventListener(EVENT, onChange)
    return () => window.removeEventListener(EVENT, onChange)
  }, [])
  return shy
}
