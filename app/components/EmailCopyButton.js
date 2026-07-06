'use client'

import { useState } from 'react'

export default function EmailCopyButton({ email }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-transparent via-transparent to-transparent hover:from-modrinth-green/10 hover:via-modrinth-green-light/10 hover:to-modrinth-green/10 rounded-lg transition-all duration-300 group"
      title="Скопировать email в буфер обмена"
    >
      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <span className="text-sm text-gray-300 font-mono select-text">{email}</span>
      {copied ? (
        <svg 
          className="w-4 h-4 text-modrinth-green flex-shrink-0 transition-all duration-300" 
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
          className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:text-gray-300 flex-shrink-0 transition-all duration-300" 
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
  )
}
