'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function escapeHtml(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default function CommitMessage({ message }) {
  if (!message) {
    return null
  }

  const escapedMessage = escapeHtml(message)

  return (
    <div className="prose prose-invert prose-sm max-w-none mb-3 wrap-break-word">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {escapedMessage}
      </ReactMarkdown>
    </div>
  )
}
