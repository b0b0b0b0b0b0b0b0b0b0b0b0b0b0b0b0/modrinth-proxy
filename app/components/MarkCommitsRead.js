'use client'

import { useEffect } from 'react'
import { NEWS_LAST_SHA_KEY, NEWS_UNREAD_KEY } from '@/lib/newsUnread'

export default function MarkCommitsRead({ latestSha }) {
  useEffect(() => {
    if (!latestSha) return
    localStorage.setItem(NEWS_LAST_SHA_KEY, latestSha)
    localStorage.setItem(NEWS_UNREAD_KEY, '0')
    window.dispatchEvent(new CustomEvent('commitsRead'))
  }, [latestSha])

  return null
}
