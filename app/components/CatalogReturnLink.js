'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { isCatalogPath, saveCatalogReturn, armCatalogReturn } from '@/lib/catalogReturn'

export default function CatalogReturnLink({ href, catalogSlug, children, onClick, ...props }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleClick = (event) => {
    if (isCatalogPath(pathname) && searchParams.get('q')?.trim()) {
      const search = searchParams.toString()
      saveCatalogReturn(`${pathname}${search ? `?${search}` : ''}`, window.scrollY, catalogSlug)
      armCatalogReturn()
    }
    onClick?.(event)
  }

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  )
}
