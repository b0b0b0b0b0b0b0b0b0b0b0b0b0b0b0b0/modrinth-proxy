'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import ResourceCard from './ResourceCard'
import ResourceCardSkeleton from './ResourceCardSkeleton'
import { syncCatalogReturnOnCatalogPage } from '@/lib/catalogReturn'

const getSettingKey = (type, isProfile) => {
  if (isProfile) return 'profiles'
  const mapping = {
    'mod': 'mods',
    'plugin': 'plugins',
    'datapack': 'datapacks',
    'shader': 'shaders',
    'resourcepack': 'resourcepacks',
    'modpack': 'modpacks',
    'minecraft_java_server': 'servers',
    'server': 'servers',
    'servers': 'servers'
  }
  return mapping[type] || `${type}s`
}

export default function ResourceList({ resources, type = 'mod', isProfile = false }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [showSkeleton, setShowSkeleton] = useState(false)
  const prevParamsRef = useRef(searchParams.toString())
  const [layout, setLayout] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || showSkeleton) return
    const search = searchParams.toString()
    syncCatalogReturnOnCatalogPage(`${pathname}${search ? `?${search}` : ''}`)
  }, [mounted, pathname, searchParams, showSkeleton])

  useEffect(() => {
    const readLayout = () => {
      const saved = localStorage.getItem('project-list-layouts')
      let currentLayout = null
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const key = getSettingKey(type, isProfile)
          currentLayout = parsed[key]
        } catch (e) {}
      }
      if (!currentLayout) {
        const defaultGrid = type === 'resourcepack' || type === 'shader'
        currentLayout = defaultGrid ? 'grid' : 'rows'
      }
      setLayout(currentLayout)
    }

    if (mounted) {
      readLayout()
    }

    const handleStorageChange = () => {
      readLayout()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('layout-settings-changed', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('layout-settings-changed', handleStorageChange)
    }
  }, [type, isProfile, mounted])

  useEffect(() => {
    const currentParams = searchParams.toString()
    if (prevParamsRef.current !== currentParams) {
      setShowSkeleton(true)
      prevParamsRef.current = currentParams
      
      const timer = setTimeout(() => {
        setShowSkeleton(false)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const defaultGrid = type === 'resourcepack' || type === 'shader'
  const activeLayout = (mounted && layout) ? layout : (defaultGrid ? 'grid' : 'rows')
  const isGrid = activeLayout === 'grid'

  const listClass = isGrid ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : 'space-y-3'
  const skeletonCount = isGrid ? 6 : 10

  if (showSkeleton) {
    return (
      <div className={listClass}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ResourceCardSkeleton key={index} variant={isGrid ? 'resourcepack' : 'default'} />
        ))}
      </div>
    )
  }

  return (
    <div className={listClass}>
      {resources.map((resource) => (
        <ResourceCard 
          key={resource.project_id || resource.id || resource.slug}
          resource={resource} 
          type={!isProfile || type !== 'mod' ? type : (resource.project_type || type)}
          forceLayout={activeLayout}
        />
      ))}
    </div>
  )
}
