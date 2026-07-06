'use client'

import { useRef } from 'react'

export default function TiltCard({ children, className, shadowColor = 'rgba(239, 68, 68, 0.2)' }) {
  const cardRef = useRef(null)

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const rotateX = (y - centerY) / 10
    const rotateY = (centerX - x) / 10
    
    cardRef.current.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out'
    cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    cardRef.current.style.boxShadow = `0 20px 25px -5px ${shadowColor}, 0 8px 10px -6px ${shadowColor}`
  }

  const handleMouseLeave = () => {
    if (!cardRef.current) return
    cardRef.current.style.transition = 'transform 0.5s ease-out, box-shadow 0.5s ease-out'
    cardRef.current.style.transform = ''
    cardRef.current.style.boxShadow = ''
  }

  return (
    <div
      ref={cardRef}
      className={className}
      style={{ transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}
