'use client'

import dynamic from 'next/dynamic'

const AuthorProjectTabsLazy = dynamic(() => import('./AuthorProjectTabs'), {
  ssr: false,
  loading: () => <div className="mb-6 h-12 bg-modrinth-dark card-glass rounded-full animate-pulse"></div>,
})

export default AuthorProjectTabsLazy
