'use client'

import { useEffect, useRef } from 'react'

export default function Garland() {
  const containerRef = useRef(null)
  const originalItemsRef = useRef([])
  const clonedItemsRef = useRef([])
  const cachedItemWidthRef = useRef(0)
  const animationFrameIdRef = useRef(null)

  useEffect(() => {
    const garlandContainer = containerRef.current
    if (!garlandContainer) return

    const originalItems = Array.from(garlandContainer.children)
    if (!originalItems.length) return

    originalItemsRef.current = originalItems
    clonedItemsRef.current = []

    function calculateItemWidth() {
      if (cachedItemWidthRef.current > 0) return cachedItemWidthRef.current
      
      let totalWidth = 0
      let validMeasurements = 0
      
      for (let i = 0; i < originalItems.length; i++) {
        const item = originalItems[i]
        const width = item.offsetWidth || item.getBoundingClientRect().width
        if (width > 0) {
          totalWidth += width
          validMeasurements++
        }
      }
      
      if (validMeasurements > 0) {
        cachedItemWidthRef.current = totalWidth / validMeasurements
      } else {
        const containerWidth = garlandContainer.scrollWidth || garlandContainer.offsetWidth
        cachedItemWidthRef.current = containerWidth > 0 ? containerWidth / originalItems.length : 0
      }
      
      return cachedItemWidthRef.current
    }

    function updateGarland() {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
      }
      
      animationFrameIdRef.current = requestAnimationFrame(function () {
        const screenWidth = window.innerWidth
        const itemWidth = calculateItemWidth()
        
        if (itemWidth <= 0) {
          animationFrameIdRef.current = null
          return
        }
        
        let containerWidth = garlandContainer.scrollWidth || garlandContainer.offsetWidth
        
        while (containerWidth < screenWidth + itemWidth) {
          for (let i = 0; i < originalItems.length; i++) {
            const clone = originalItems[i].cloneNode(true)
            garlandContainer.appendChild(clone)
            clonedItemsRef.current.push(clone)
          }
          containerWidth = garlandContainer.scrollWidth || garlandContainer.offsetWidth
        }
        
        animationFrameIdRef.current = null
      })
    }

    function handleOrientationChange() {
      cachedItemWidthRef.current = 0
      setTimeout(updateGarland, 100)
    }

    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(updateGarland)
      resizeObserver.observe(document.documentElement)
      
      updateGarland()
      
      window.addEventListener('orientationchange', handleOrientationChange)
      
      return () => {
        resizeObserver.disconnect()
        window.removeEventListener('orientationchange', handleOrientationChange)
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current)
        }
      }
    } else {
      updateGarland()
      window.addEventListener('resize', updateGarland, { passive: true })
      window.addEventListener('orientationchange', handleOrientationChange)
      
      return () => {
        window.removeEventListener('resize', updateGarland)
        window.removeEventListener('orientationchange', handleOrientationChange)
        if (animationFrameIdRef.current) {
          cancelAnimationFrame(animationFrameIdRef.current)
        }
      }
    }
  }, [])

  return (
    <div className="garland-container" ref={containerRef}>
      <div className="garland-item garland-item--visible garland-item--animated garland-item--fade-in">
        <svg
          className="garland-svg garland-svg--pos-1"
          width="64"
          height="20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 5c21.703 3.116 34.075 4 56 4"
            stroke="currentColor"></path>
          <g
            opacity=".8"
            filter="url(#a)">
            <path
              className="garland-light--glow"
              d="M9.5 14c-1.313 0-2.102-1-2.89-2.75-.745-1.655-1.056-3.784.54-4.75.713-.432 1.044-.5 2.35-.5s1.637.068 2.35.5c1.596.966 1.285 3.095.54 4.75C11.602 13 10.813 14 9.5 14z"
              fill="currentColor"></path>
          </g>
          <path
            className="garland-light"
            d="M9.5 13c-1.313 0-2.102-1-2.89-2.75-.745-1.655-1.056-3.784.54-4.75.713-.432 1.044-.5 2.35-.5s1.637.068 2.35.5c1.596.966 1.285 3.095.54 4.75C11.602 12 10.813 13 9.5 13z"
            fill="currentColor"></path>
          <defs>
            <filter
              id="a"
              x="0"
              y="0"
              width="19"
              height="20"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB">
              <feFlood
                floodOpacity="0"
                result="BackgroundImageFix"></feFlood>
              <feBlend
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"></feBlend>
              <feGaussianBlur
                stdDeviation="3"
                result="effect1_foregroundBlur_116_127907"></feGaussianBlur>
            </filter>
          </defs></svg
        ><svg
          className="garland-svg garland-svg--pos-2"
          width="67"
          height="21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M66 3S31.925 7 10 7"
            stroke="currentColor"></path>
          <g
            opacity=".8"
            filter="url(#b)">
            <path
              className="garland-light--glow"
              d="M7.373 13.688c-1.114-.696-1.252-1.961-.993-3.863.245-1.798 1.109-3.768 2.974-3.742.835.011 1.151.13 2.258.821 1.108.692 1.352.925 1.729 1.67.841 1.665-.551 3.305-2.06 4.314-1.596 1.066-2.794 1.497-3.908.8z"
              fill="currentColor"></path>
          </g>
          <path
            className="garland-light"
            d="M7.903 12.84c-1.114-.695-1.252-1.961-.993-3.863.245-1.798 1.109-3.768 2.974-3.742.835.011 1.151.13 2.258.821 1.108.692 1.352.925 1.729 1.67.84 1.665-.551 3.305-2.06 4.314-1.596 1.066-2.794 1.497-3.908.8z"
            fill="currentColor"></path>
          <defs>
            <filter
              id="b"
              x=".268"
              y=".082"
              width="19.326"
              height="19.945"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB">
              <feFlood
                floodOpacity="0"
                result="BackgroundImageFix"></feFlood>
              <feBlend
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"></feBlend>
              <feGaussianBlur
                stdDeviation="3"
                result="effect1_foregroundBlur_116_127912"></feGaussianBlur>
            </filter>
          </defs></svg
        ><svg
          className="garland-svg garland-svg--pos-3"
          width="67"
          height="21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10 8s28.088 2.196 56 3.334"
            stroke="currentColor"></path>
          <g
            opacity=".8"
            filter="url(#c)">
            <path
              className="garland-light--glow"
              d="M13.466 14.144c-1.006.845-2.252.585-3.981-.249-1.634-.789-3.241-2.22-2.64-3.985.269-.79.479-1.055 1.479-1.894 1-.84 1.297-1 2.122-1.128 1.844-.285 2.973 1.546 3.466 3.292.521 1.847.56 3.12-.446 3.964z"
              fill="currentColor"></path>
          </g>
          <path
            className="garland-light"
            d="M12.823 13.378c-1.006.844-2.252.585-3.98-.25C7.207 12.34 5.6 10.91 6.201 9.145c.269-.79.479-1.055 1.48-1.894 1-.84 1.296-1 2.121-1.128 1.844-.285 2.974 1.546 3.466 3.292.522 1.847.56 3.12-.446 3.964z"
            fill="currentColor"></path>
          <defs>
            <filter
              id="c"
              x=".716"
              y=".859"
              width="19.556"
              height="19.805"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB">
              <feFlood
                floodOpacity="0"
                result="BackgroundImageFix"></feFlood>
              <feBlend
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"></feBlend>
              <feGaussianBlur
                stdDeviation="3"
                result="effect1_foregroundBlur_116_127917"></feGaussianBlur>
            </filter>
          </defs></svg
        ><svg
          className="garland-svg garland-svg--pos-4"
          width="66"
          height="20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M9 9.334c9.757.398 19.493.666 28 .666 10.49 0 19.512-.09 28-.313"
            stroke="currentColor"></path>
          <g
            opacity=".8"
            filter="url(#d)">
            <path
              className="garland-light--glow"
              d="M14.517 7.485c.677 1.126.225 2.316-.869 3.893-1.034 1.491-2.699 2.855-4.35 1.985-.737-.39-.966-.638-1.638-1.758-.673-1.119-.785-1.437-.782-2.272.006-1.866 1.992-2.695 3.794-2.908 1.906-.226 3.169-.066 3.845 1.06z"
              fill="currentColor"></path>
          </g>
          <path
            className="garland-light"
            d="M13.66 8c.676 1.126.225 2.316-.869 3.893-1.034 1.491-2.699 2.855-4.35 1.985-.737-.39-.966-.638-1.638-1.758-.673-1.119-.785-1.437-.782-2.272.006-1.866 1.991-2.695 3.793-2.908 1.906-.226 3.17-.066 3.846 1.06z"
            fill="currentColor"></path>
          <defs>
            <filter
              id="d"
              x=".878"
              y=".337"
              width="19.958"
              height="19.298"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB">
              <feFlood
                floodOpacity="0"
                result="BackgroundImageFix"></feFlood>
              <feBlend
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"></feBlend>
              <feGaussianBlur
                stdDeviation="3"
                result="effect1_foregroundBlur_116_127922"></feGaussianBlur>
            </filter>
          </defs></svg
        ><svg
          className="garland-svg garland-svg--pos-5"
          width="68"
          height="21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M67.5 7c-22.251 2.124-37.912 3.21-56 3.687"
            stroke="currentColor"></path>
          <g
            opacity=".8"
            filter="url(#e)">
            <path
              className="garland-light--glow"
              d="M7.538 7.484c1.007-.845 2.253-.585 3.982.249 1.634.788 3.241 2.219 2.64 3.985-.27.79-.48 1.055-1.48 1.894-1 .84-1.297 1-2.121 1.128-1.844.285-2.974-1.546-3.467-3.292-.52-1.848-.56-3.12.446-3.964z"
              fill="currentColor"></path>
          </g>
          <path
            className="garland-light"
            d="M8.181 8.25c1.006-.845 2.253-.585 3.981.249 1.635.788 3.242 2.219 2.64 3.985-.268.79-.478 1.055-1.479 1.894-1 .84-1.297 1-2.122 1.128-1.843.285-2.973-1.546-3.466-3.292-.52-1.847-.56-3.12.446-3.964z"
            fill="currentColor"></path>
          <defs>
            <filter
              id="e"
              x=".732"
              y=".965"
              width="19.556"
              height="19.805"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB">
              <feFlood
                floodOpacity="0"
                result="BackgroundImageFix"></feFlood>
              <feBlend
                in="SourceGraphic"
                in2="BackgroundImageFix"
                result="shape"></feBlend>
              <feGaussianBlur
                stdDeviation="3"
                result="effect1_foregroundBlur_116_127927"></feGaussianBlur>
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  )
}
