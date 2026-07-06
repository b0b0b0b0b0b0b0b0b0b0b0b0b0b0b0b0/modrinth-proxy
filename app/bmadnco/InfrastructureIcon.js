'use client'

import { useEffect, useState, useRef } from 'react'
import Lottie from 'lottie-react'

export default function InfrastructureIcon() {
  const lottieRef = useRef(null)
  const [animationData, setAnimationData] = useState(null)

  useEffect(() => {
    fetch('/animations/servers.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('Failed to load Lottie animation:', err))
  }, [])

  useEffect(() => {
    if (lottieRef.current && animationData) {
      lottieRef.current.setSpeed(1)
      lottieRef.current.play()
    }
  }, [animationData])

  if (!animationData) {
    return (
      <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    )
  }

  return (
    <div className="w-10 h-10">
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
