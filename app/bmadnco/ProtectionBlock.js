'use client'

import { useEffect, useState } from 'react'
import MitelisButton from '@/app/components/MitelisButton'
import { useT } from '@/app/components/I18nProvider'
import RichText from '@/app/components/RichText'

export default function ProtectionBlock() {
  const t = useT()
  const [animationData, setAnimationData] = useState(null)

  useEffect(() => {
    fetch('/animations/fire.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('Failed to load Lottie animation:', err))
  }, [])

  return (
    <section
      className="relative overflow-hidden rounded-2xl p-8 md:p-10 fire-flames"
      style={{
        background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.8) 0%, rgba(153, 27, 27, 0.9) 25%, rgba(185, 28, 28, 0.85) 50%, rgba(220, 38, 38, 0.9) 75%, rgba(239, 68, 68, 0.8) 100%)',
        backgroundSize: '200% 200%',
        animation: 'fire-flicker 3s ease-in-out infinite',
        boxShadow:
          'inset 0 1px 3px rgb(255 255 255 / 0.15), inset 0 16px 28px -18px rgb(255 255 255 / 0.18), inset 0 -22px 36px -24px rgb(0 0 0 / 0.35), 0 0 24px rgba(239, 68, 68, 0.35), 0 0 60px rgba(251, 146, 60, 0.2), 0 0 100px rgba(234, 179, 8, 0.1)',
      }}
    >
      <div
        className="absolute inset-0 opacity-30 z-0"
        style={{
          background: 'radial-gradient(ellipse at bottom, rgba(251, 146, 60, 0.4) 0%, rgba(234, 179, 8, 0.3) 30%, transparent 70%)',
          animation: 'fire-glow 2s ease-in-out infinite',
        }}
      ></div>
      <div className="relative z-10 flex flex-col items-center gap-8 text-center md:flex-row md:text-left">
        <div className="shield-pulse relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-orange-500/30 backdrop-blur-sm md:h-28 md:w-28">
          <svg className="h-12 w-12 text-orange-100 drop-shadow-[0_0_12px_rgba(253,186,116,0.8)] md:h-14 md:w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="mb-4 flex flex-wrap items-center justify-center gap-3 text-3xl font-bold text-white drop-shadow-lg md:justify-start md:text-4xl">
            {t('about.ddos')}
            <span className="rounded-full bg-orange-500/30 px-3 py-1 text-sm font-semibold text-orange-100 backdrop-blur-sm">mitelis.net</span>
          </h2>
          <p className="mb-6 text-lg leading-relaxed text-orange-50 drop-shadow-md">
            <RichText text={t('about.ddosLead')} strongClassName="font-semibold text-orange-100" />
          </p>
          <div className="flex justify-center md:justify-start">
            <MitelisButton animationData={animationData} />
          </div>
        </div>
      </div>
    </section>
  )
}
