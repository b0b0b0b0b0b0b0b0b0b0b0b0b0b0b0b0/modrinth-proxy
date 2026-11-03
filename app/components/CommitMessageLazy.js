'use client'

import dynamic from 'next/dynamic'

function CommitMessageLoading() {
  return (
    <div className="prose prose-invert prose-sm max-w-none mb-3 wrap-break-word opacity-50">
      …
    </div>
  )
}

const CommitMessageLazy = dynamic(() => import('./CommitMessage'), {
  ssr: false,
  loading: () => <CommitMessageLoading />,
})

export default CommitMessageLazy
