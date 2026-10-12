'use client'

import { useCallback, useEffect, useRef } from 'react'
import { solvePow } from '@/lib/pow'

function solveInWorker(salt, bits) {
  return new Promise((resolve) => {
    let worker = null
    let url = null
    const finish = (value) => {
      worker?.terminate()
      if (url) URL.revokeObjectURL(url)
      resolve(value)
    }
    const fallback = () => setTimeout(() => finish(solvePow(salt, bits)), 0)
    try {
      const source = `onmessage=function(e){postMessage((${solvePow.toString()})(e.data.salt,e.data.bits))}`
      url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }))
      worker = new Worker(url)
      worker.onmessage = (event) => finish(event.data)
      worker.onerror = fallback
      worker.postMessage({ salt, bits })
    } catch {
      fallback()
    }
  })
}

async function requestProof(mode) {
  const response = await fetch(`/api/auth/captcha?mode=${mode}`, { cache: 'no-store' })
  if (!response.ok) throw new Error(String(response.status))
  const challenge = await response.json()
  const counter = await solveInWorker(challenge.salt, challenge.bits)
  if (counter < 0) throw new Error('unsolved')
  return { token: challenge.token, counter }
}

export function useCaptcha(mode) {
  const proofRef = useRef(null)

  const prepare = useCallback(() => {
    const proof = requestProof(mode)
    proof.catch(() => {})
    proofRef.current = proof
    return proof
  }, [mode])

  useEffect(() => {
    prepare()
    return () => {
      proofRef.current = null
    }
  }, [prepare])

  const takeProof = useCallback(async () => {
    const pending = proofRef.current || prepare()
    proofRef.current = null
    try {
      return await pending
    } catch {
      return requestProof(mode)
    }
  }, [mode, prepare])

  return { takeProof, prepare }
}
