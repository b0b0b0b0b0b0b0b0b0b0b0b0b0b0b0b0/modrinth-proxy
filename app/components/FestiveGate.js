'use client'

import { Fragment, useEffect, useState } from 'react'
import { festiveOff, onFestiveChange } from '@/lib/festive'

export default function FestiveGate({ children }) {
  const [off, setOff] = useState(false)
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    setOff(festiveOff())
    return onFestiveChange((next) => {
      setOff(next)
      if (!next) setGeneration((current) => current + 1)
    })
  }, [])

  if (off) return null
  return <Fragment key={generation}>{children}</Fragment>
}
