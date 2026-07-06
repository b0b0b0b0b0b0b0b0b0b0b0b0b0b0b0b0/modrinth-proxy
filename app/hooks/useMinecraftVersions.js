'use client'

import { useState, useEffect, useRef } from 'react'

let globalVersions = null
let globalLoading = false
let globalPromise = null

export function useMinecraftVersions() {
  const [versions, setVersions] = useState(() => {
    if (typeof window !== 'undefined' && window.__MC_VERSIONS__) {
      globalVersions = window.__MC_VERSIONS__
      return window.__MC_VERSIONS__
    }
    return globalVersions || { release: [], full: [] }
  })
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined' && window.__MC_VERSIONS__) {
      return false
    }
    return !globalVersions
  })
  const mountedRef = useRef(false)

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    if (typeof window !== 'undefined' && window.__MC_VERSIONS__) {
      globalVersions = window.__MC_VERSIONS__
      setVersions(window.__MC_VERSIONS__)
      setLoading(false)
      return
    }

    if (globalVersions) {
      setVersions(globalVersions)
      setLoading(false)
      return
    }

    if (globalPromise) {
      globalPromise.then(data => {
        setVersions(data)
        setLoading(false)
      })
      return
    }

    if (globalLoading) {
      const checkInterval = setInterval(() => {
        if (globalVersions) {
          setVersions(globalVersions)
          setLoading(false)
          clearInterval(checkInterval)
        }
      }, 50)
      return () => clearInterval(checkInterval)
    }

    globalLoading = true
    globalPromise = fetch('/api/mc-versions')
      .then(res => res.json())
      .then(data => {
        globalVersions = data
        globalLoading = false
        globalPromise = null
        if (typeof window !== 'undefined') {
          window.__MC_VERSIONS__ = data
        }
        return data
      })
      .catch(err => {
        console.error('Failed to load Minecraft versions:', err)
        globalLoading = false
        globalPromise = null
        return { release: [], full: [] }
      })

    globalPromise.then(data => {
      setVersions(data)
      setLoading(false)
    })
  }, [])

  return { ...versions, loading }
}
