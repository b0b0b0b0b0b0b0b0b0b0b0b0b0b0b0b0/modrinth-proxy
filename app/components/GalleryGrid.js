'use client'

import { useCallback, useMemo, useState } from 'react'
import GalleryModal from './GalleryModal'
import RelativeTime from './RelativeTime'

function findNeighborIndex(gallery, fromIndex, direction) {
  if (!gallery.length) return fromIndex
  let newIndex = fromIndex
  let attempts = 0

  do {
    newIndex += direction
    if (newIndex < 0) newIndex = gallery.length - 1
    if (newIndex >= gallery.length) newIndex = 0
    attempts++
  } while (gallery[newIndex]?.isBlocked && attempts < gallery.length)

  return gallery[newIndex]?.isBlocked ? fromIndex : newIndex
}

function galleryFullUrl(item) {
  return item?.raw_url || item?.url || ''
}

export default function GalleryGrid({ gallery }) {
  const [selectedIndex, setSelectedIndex] = useState(null)

  const hasMultiple = useMemo(
    () => gallery.filter((img) => !img?.isBlocked).length > 1,
    [gallery],
  )

  const handlePrev = useCallback(() => {
    setSelectedIndex((current) => {
      if (current === null) return current
      return findNeighborIndex(gallery, current, -1)
    })
  }, [gallery])

  const handleNext = useCallback(() => {
    setSelectedIndex((current) => {
      if (current === null) return current
      return findNeighborIndex(gallery, current, 1)
    })
  }, [gallery])

  const handleClose = useCallback(() => {
    setSelectedIndex(null)
  }, [])

  const neighborUrls = useMemo(() => {
    if (selectedIndex === null || !hasMultiple) return []
    const prev = findNeighborIndex(gallery, selectedIndex, -1)
    const next = findNeighborIndex(gallery, selectedIndex, 1)
    return [galleryFullUrl(gallery[prev]), galleryFullUrl(gallery[next])].filter(Boolean)
  }, [gallery, selectedIndex, hasMultiple])

  if (gallery.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-modrinth-dark p-12 text-center">
        <svg
          className="mx-auto mb-4 h-16 w-16 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-xl text-gray-400">В галерее пока нет изображений</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {gallery.map((item, idx) => (
          <div
            key={idx}
            className="overflow-hidden rounded-lg border border-gray-800 bg-modrinth-dark transition-colors hover:border-gray-700"
          >
            {item.isBlocked ? (
              <div className="relative flex aspect-video w-full items-center justify-center border-b border-red-500/20 bg-gradient-to-br from-red-500/10 to-orange-500/10">
                <div className="px-4 py-8 text-center">
                  <svg
                    className="mx-auto mb-3 h-12 w-12 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6h2V7zm0 8h-2v2h2v-2z" />
                  </svg>
                  <p className="text-sm font-medium text-red-300">Изображение заблокировано</p>
                  <p className="mt-1 text-xs text-red-400">по требованию РКН</p>
                  {item.blockedHost && (
                    <p className="mt-2 text-xs text-gray-500">{item.blockedHost}</p>
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
                  className="h-auto w-full object-cover transition-opacity hover:opacity-90"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </button>
            )}
            <div className="p-4">
              {item.title && <h2 className="mb-2 text-lg font-bold text-white">{item.title}</h2>}
              {item.description && (
                <p className="mb-3 text-sm text-gray-400">{item.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <RelativeTime dateString={item.created} className="text-inherit" />
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
          hasPrev={hasMultiple}
          hasNext={hasMultiple}
          neighborUrls={neighborUrls}
        />
      )}
    </>
  )
}
