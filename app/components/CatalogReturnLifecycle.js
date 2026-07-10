'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { clearCatalogReturn, isCatalogPath, isProjectDetailPath } from '@/lib/catalogReturn'

export default function CatalogReturnLifecycle() {
  const pathname = usePathname()

  useEffect(() => {
    if (isProjectDetailPath(pathname) || isCatalogPath(pathname)) return
    clearCatalogReturn()
  }, [pathname])

  return null
}
