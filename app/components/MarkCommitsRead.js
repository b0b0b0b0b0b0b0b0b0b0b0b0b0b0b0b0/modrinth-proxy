'use client'

import { useEffect } from 'react'

export default function MarkCommitsRead({ latestSha }) {
  useEffect(() => {
    if (latestSha) {
      localStorage.setItem('lastSeenCommitSha', latestSha)
      window.dispatchEvent(new CustomEvent('commitsRead'))
    }
  }, [latestSha])

  return null
}
