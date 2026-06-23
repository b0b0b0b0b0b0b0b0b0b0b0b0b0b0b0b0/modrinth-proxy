'use client'

import { useEffect } from 'react'

const RELOAD_KEY = 'next-chunk-reload'
const SW_CLEAR_KEY = 'next-chunk-sw-clear'

function isChunkLoadFailure(reason) {
  if (!reason) return false

  const name = reason?.name || ''
  const message = String(reason?.message || reason || '')

  return (
    name === 'ChunkLoadError' ||
    message.includes('ChunkLoadError') ||
    message.includes('Loading chunk') ||
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('ERR_HTTP2_PROTOCOL_ERROR') ||
    message.includes('Importing a module script failed')
  )
}

async function clearPwaCaches() {
  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }

  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  }
}

async function recoverFromChunkFailure() {
  if (typeof window === 'undefined') return

  if (!sessionStorage.getItem(RELOAD_KEY)) {
    sessionStorage.setItem(RELOAD_KEY, '1')
    window.location.reload()
    return
  }

  if (!sessionStorage.getItem(SW_CLEAR_KEY)) {
    sessionStorage.setItem(SW_CLEAR_KEY, '1')
    try {
      await clearPwaCaches()
    } catch {
      // ignore cache cleanup errors and still reload
    }
    window.location.reload()
  }
}

export default function ChunkLoadRecovery() {
  useEffect(() => {
    const onError = (event) => {
      if (!isChunkLoadFailure(event?.error || event?.message)) return
      event.preventDefault?.()
      void recoverFromChunkFailure()
    }

    const onUnhandledRejection = (event) => {
      if (!isChunkLoadFailure(event?.reason)) return
      event.preventDefault?.()
      void recoverFromChunkFailure()
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}
