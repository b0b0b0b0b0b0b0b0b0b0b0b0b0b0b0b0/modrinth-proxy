'use client'

import { useState } from 'react'
import GalleryModal from './GalleryModal'

export default function GalleryGrid({ gallery }) {
  const [selectedIndex, setSelectedIndex] = useState(null)

  const handlePrev = () => {
    let newIndex = selectedIndex - 1
    
    if (newIndex < 0) {
      newIndex = gallery.length - 1
    }
    
    let attempts = 0
    while (gallery[newIndex]?.isBlocked && attempts < gallery.length) {
      newIndex--
      if (newIndex < 0) {
        newIndex = gallery.length - 1
      }
      attempts++
    }
    
    if (!gallery[newIndex]?.isBlocked) {
      setSelectedIndex(newIndex)
    }
  }

  const handleNext = () => {
    let newIndex = selectedIndex + 1
    
    if (newIndex >= gallery.length) {
      newIndex = 0
    }
    
    let attempts = 0
    while (gallery[newIndex]?.isBlocked && attempts < gallery.length) {
      newIndex++
      if (newIndex >= gallery.length) {
        newIndex = 0
      }
      attempts++
    }
    
    if (!gallery[newIndex]?.isBlocked) {
      setSelectedIndex(newIndex)
    }
  }

  const handleClose = () => {
    setSelectedIndex(null)
  }

  const hasMultipleImages = () => {
    const unblocked = gallery.filter(img => !img?.isBlocked)
    return unblocked.length > 1
  }

  if (gallery.length === 0) {
    return (
      <div className="bg-modrinth-dark border border-gray-800 rounded-lg p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-xl text-gray-400">В галерее пока нет изображений</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gallery.map((item, idx) => (
          <div key={idx} className="bg-modrinth-dark border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
            {item.isBlocked ? (
              <div className="relative w-full aspect-video bg-gradient-to-br from-red-500/10 to-orange-500/10 border-b border-red-500/20 flex items-center justify-center">
                <div className="text-center px-4 py-8">
                  <svg className="w-12 h-12 mx-auto mb-3 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6h2V7zm0 8h-2v2h2v-2z"/>
                  </svg>
                  <p className="text-sm text-red-300 font-medium">Изображение заблокировано</p>
                  <p className="text-xs text-red-400 mt-1">по требованию РКН</p>
                  {item.blockedHost && (
                    <p className="text-xs text-gray-500 mt-2">{item.blockedHost}</p>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSelectedIndex(idx)}
                className="block w-full cursor-pointer"
              >
                <img
                  src={item.url}
                  alt={item.title || 'Gallery image'}
                  className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </button>
            )}
            <div className="p-4">
              {item.title && (
                <h2 className="text-lg font-bold text-white mb-2">{item.title}</h2>
              )}
              {item.description && (
                <p className="text-sm text-gray-400 mb-3">{item.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(item.created)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedIndex !== null && !gallery[selectedIndex]?.isBlocked && (
        <GalleryModal
          image={gallery[selectedIndex]}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={hasMultipleImages()}
          hasNext={hasMultipleImages()}
        />
      )}
    </>
  )
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
