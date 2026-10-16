'use client'

import { useEffect, useRef, useState } from 'react'
import { isNewYearSeason } from '@/lib/newYear'
import { driftPath } from './NewYearEffects'
import { claimWalk, onSnowballCall, releaseWalk, snowballAllowed, Walker } from './KittenSnowball'

export default function FooterSnow() {
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  const [width, setWidth] = useState(0)
  const [walk, setWalk] = useState(null)

  useEffect(() => {
    if (isNewYearSeason()) setOn(true)
  }, [])

  useEffect(() => {
    if (!on || !ref.current) return undefined
    const el = ref.current
    const measure = () => setWidth(Math.round(el.clientWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [on])

  useEffect(() => {
    if (!on || !snowballAllowed()) return undefined
    return onSnowballCall(() => {
      if (!claimWalk()) return
      setWalk({ dir: Math.random() < 0.5 ? 1 : -1 })
    })
  }, [on])

  const finish = () => {
    setWalk(null)
    releaseWalk()
  }

  if (!on) return null

  return (
    <div ref={ref} className="pointer-events-none relative z-[5] h-0 overflow-x-clip">
      {width > 0 ? (
        <svg className="footer-drift" viewBox={`0 0 ${width} 16`} preserveAspectRatio="none" aria-hidden>
          <path d={driftPath(width, 1)} />
        </svg>
      ) : null}
      {walk && width > 0 ? <Walker width={width} dir={walk.dir} onDone={finish} className="bottom-[-2px]" /> : null}
    </div>
  )
}
