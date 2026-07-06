'use client'
import { useEffect, useState } from 'react'

export default function CurrentDomain() {
  const [domain, setDomain] = useState('modrinth.black')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDomain(window.location.hostname)
    }
  }, [])

  return (
    <span className="font-medium select-none">{domain}</span>
  )
}
