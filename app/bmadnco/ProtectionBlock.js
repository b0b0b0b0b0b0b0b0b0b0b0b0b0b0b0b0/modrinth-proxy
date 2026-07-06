'use client'

import { useEffect, useState } from 'react'
import MitelisButton from '@/app/components/MitelisButton'

export default function ProtectionBlock() {
  const [animationData, setAnimationData] = useState(null)

  useEffect(() => {
    fetch('/animations/fire.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('Failed to load Lottie animation:', err))
  }, [])

  return (
    <div 
      className="mt-12 rounded-xl p-6 relative overflow-hidden fire-flames"
      style={{
        background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.8) 0%, rgba(153, 27, 27, 0.9) 25%, rgba(185, 28, 28, 0.85) 50%, rgba(220, 38, 38, 0.9) 75%, rgba(239, 68, 68, 0.8) 100%)',
        backgroundSize: '200% 200%',
        animation: 'fire-flicker 3s ease-in-out infinite',
        boxShadow: '0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(251, 146, 60, 0.2), 0 0 60px rgba(234, 179, 8, 0.1)',
      }}
    >
      <div 
        className="absolute inset-0 opacity-30 z-0"
        style={{
          background: 'radial-gradient(ellipse at bottom, rgba(251, 146, 60, 0.4) 0%, rgba(234, 179, 8, 0.3) 30%, transparent 70%)',
          animation: 'fire-glow 2s ease-in-out infinite',
        }}
      ></div>
      <div className="relative z-10 flex items-start gap-4">
        <div className="p-3 bg-orange-500/30 rounded-full flex-shrink-0 backdrop-blur-sm">
          <svg className="w-6 h-6 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-lg text-white mb-3 flex items-center gap-2 drop-shadow-lg">
            Защита от атак
            <span className="text-xs px-2 py-1 bg-orange-500/30 text-orange-100 rounded-full backdrop-blur-sm">mitelis.net</span>
          </h3>
          <p className="text-orange-50 leading-relaxed mb-4 drop-shadow-md">
            Наш сайт защищён от DDoS-атак и других видов кибератак с помощью сервиса <span className="font-semibold text-orange-100">mitelis.net</span>. 
            Благодаря этому сервису мы можем гарантировать доступность сервиса и быструю загрузку страниц для всех пользователей.
          </p>
          <div className="mt-4">
            <MitelisButton animationData={animationData} />
          </div>
        </div>
      </div>
    </div>
  )
}
