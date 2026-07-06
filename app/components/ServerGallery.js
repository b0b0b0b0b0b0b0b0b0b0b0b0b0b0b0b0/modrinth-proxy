'use client'

import { useState, useEffect, useRef } from 'react'

export default function ServerGallery({ gallery = [] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const timerRef = useRef(null)

  const images = (gallery || []).filter(img => img && (img.url || img.raw_url) && !img.isBlocked)

  useEffect(() => {
    if (images.length <= 1) return

    timerRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % images.length)
    }, 6000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeIndex, images.length])

  if (images.length === 0) return null

  const handlePrev = (e) => {
    e.stopPropagation()
    setActiveIndex(prev => (prev - 1 + images.length) % images.length)
  }

  const handleNext = (e) => {
    e.stopPropagation()
    setActiveIndex(prev => (prev + 1) % images.length)
  }

  const activeImage = images[activeIndex]
  const imageSrc = activeImage.url || activeImage.raw_url
  const hasMultiple = images.length > 1

  const displayName = activeImage.name && activeImage.name !== '__mc_server_banner__' ? activeImage.name : ''
  const displayDesc = activeImage.description || ''

  return (
    <div className="mb-6 flex flex-col gap-3">
      <h2 className="text-xl font-bold text-white m-0">Как выглядит наш сервер</h2>
      
      <div 
        onClick={() => setModalOpen(true)}
        className="relative group aspect-[21/9] md:aspect-[24/10] w-full rounded-2xl overflow-hidden bg-gray-950 border border-gray-800/80 shadow-2xl flex items-center justify-center cursor-zoom-in transition-all duration-300 hover:border-modrinth-green/30"
      >
        {images.map((img, idx) => {
          const src = img.url || img.raw_url
          const isActive = idx === activeIndex
          const name = img.name && img.name !== '__mc_server_banner__' ? img.name : ''
          const desc = img.description || ''
          return (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img 
                src={src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 scale-110 pointer-events-none"
                referrerPolicy="no-referrer"
              />
              <img 
                src={src}
                alt={name || 'Изображение сервера'}
                className="relative w-full h-full object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />
              
              {(name || desc) && (
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
              )}
              {(name || desc) && (
                <div className="absolute bottom-4 left-4 right-16 text-white z-10 flex flex-col gap-0.5 pointer-events-none">
                  {name && <span className="text-sm md:text-base font-bold truncate">{name}</span>}
                  {desc && <span className="text-xs text-gray-300 line-clamp-1">{desc}</span>}
                </div>
              )}
            </div>
          )
        })}

        {hasMultiple && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 cursor-pointer active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}

        {hasMultiple && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 right-4 z-20 flex gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-2.5 py-1.5"
          >
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-350 cursor-pointer ${
                  idx === activeIndex 
                    ? 'bg-modrinth-green w-4' 
                    : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto py-1.5 px-0.5 custom-scrollbar">
          {images.map((img, idx) => {
            const src = img.url || img.raw_url
            const isActive = idx === activeIndex
            return (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`relative w-20 h-12 md:w-24 md:h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all duration-300 active:scale-95 cursor-pointer ${
                  isActive 
                    ? 'border-modrinth-green scale-105 shadow-md shadow-modrinth-green/10' 
                    : 'border-gray-800 hover:border-gray-700 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <div 
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 cursor-zoom-out"
        >
          <button 
            onClick={() => setModalOpen(false)}
            className="absolute top-6 right-6 text-white/75 hover:text-white transition-colors cursor-pointer w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
          
          {hasMultiple && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}

          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[85vh] flex flex-col gap-3 pointer-events-auto cursor-default"
          >
            <img
              src={imageSrc}
              alt={displayName || 'Изображение галереи'}
              className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-2xl border border-white/5"
              referrerPolicy="no-referrer"
            />
            {(displayName || displayDesc) && (
              <div className="text-center text-white px-4">
                {displayName && <h3 className="text-lg font-bold m-0">{displayName}</h3>}
                {displayDesc && <p className="text-sm text-gray-400 m-0 mt-1">{displayDesc}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
