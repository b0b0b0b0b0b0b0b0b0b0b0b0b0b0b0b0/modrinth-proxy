'use client'

import { useState } from 'react'
import StyledTooltip from './StyledTooltip'

export default function CopyButton({ text, tooltipLabel = 'Скопировать ID в буфер обмена', inline = false }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <StyledTooltip label={copied ? 'Скопировано' : tooltipLabel}>
    <button
      type="button"
      onClick={handleCopy}
      className={
        inline
          ? 'inline-flex items-center gap-1 font-mono font-medium text-gray-900 dark:text-white select-text w-fit transition-colors hover:text-modrinth-green'
          : 'inline-flex items-center gap-2 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-sm font-mono select-text w-fit transition-all duration-200 ease-in-out hover:opacity-90'
      }
      style={inline ? undefined : { borderRadius: '10px' }}
    >
      <span>{text}</span>
      {copied ? (
        <svg 
          className="w-4 h-4 text-modrinth-green flex-shrink-0" 
          fill="none" 
          stroke="currentColor" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          viewBox="0 0 24 24"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <svg 
          className="w-4 h-4 text-gray-400 flex-shrink-0" 
          fill="none" 
          stroke="currentColor" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          viewBox="0 0 24 24"
        >
          <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        </svg>
      )}
    </button>
    </StyledTooltip>
  )
}
