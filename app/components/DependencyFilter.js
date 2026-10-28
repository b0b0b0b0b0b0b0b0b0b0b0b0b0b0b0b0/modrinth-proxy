'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { DEPENDENCY_TYPES, parseDependentOptions, replaceDependentParams } from '@/lib/dependentsFilter'
import { useT } from './I18nProvider'

const SEARCH_DELAY_MS = 350
const MIN_QUERY_LENGTH = 2
const SEARCH_CACHE_SIZE = 50
const searchCache = new Map()

function Chevron({ open, className = 'h-4 w-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={`${className} shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" />
    </svg>
  )
}

function XIcon({ className = 'h-4 w-4' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 0 1 1.414 0L10 8.586l4.293-4.293a1 1 0 1 1 1.414 1.414L11.414 10l4.293 4.293a1 1 0 0 1-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L8.586 10 4.293 5.707a1 1 0 0 1 0-1.414" clipRule="evenodd" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" className="h-3 w-3">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function ProjectIcon({ project, className }) {
  if (project?.icon_url) {
    return <img src={project.icon_url} alt="" className={`${className} shrink-0 object-cover`} />
  }
  return (
    <div className={`${className} shrink-0 flex items-center justify-center bg-gray-800 text-gray-500`}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-1/2 w-1/2">
        <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
      </svg>
    </div>
  )
}

function useOutsideClick(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return
    const handle = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onOutside()
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [ref, onOutside, active])
}

function ProjectSearch({ placeholder, excludeIds, onSelect }) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef(null)
  useOutsideClick(boxRef, () => setOpen(false), open)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setHits([])
      setLoading(false)
      return
    }
    const known = searchCache.get(trimmed)
    if (known) {
      setHits(known)
      setActive(0)
      setLoading(false)
      return
    }
    setLoading(true)
    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetch(`/api/dependencies/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error('search failed'))))
        .then((data) => {
          const found = data?.hits || []
          if (searchCache.size >= SEARCH_CACHE_SIZE) searchCache.delete(searchCache.keys().next().value)
          searchCache.set(trimmed, found)
          setHits(found)
          setActive(0)
          setLoading(false)
        })
        .catch((error) => {
          if (error?.name !== 'AbortError') setLoading(false)
        })
    }, SEARCH_DELAY_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const visible = hits.filter((hit) => !excludeIds.includes(hit.id))

  const choose = (hit) => {
    onSelect(hit)
    setQuery('')
    setHits([])
    setOpen(false)
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((index) => Math.min(index + 1, visible.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (visible[active]) choose(visible[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const showDropdown = open && query.trim().length >= MIN_QUERY_LENGTH && (loading || visible.length > 0 || hits.length === 0)

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          spellCheck={false}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="w-full px-3 py-2 pl-9 pr-8 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-modrinth-green transition-colors"
        />
        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" />
        </svg>
        {query && (
          <button
            type="button"
            aria-label={t('filter.dep.clearInput')}
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
          >
            <XIcon />
          </button>
        )}
      </div>
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-72 overflow-y-auto custom-scrollbar glass-pop rounded-xl p-1">
          {loading && visible.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">{t('filter.dep.searching')}</div>
          ) : visible.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">{t('filter.dep.nothing')}</div>
          ) : (
            visible.map((hit, index) => (
              <button
                key={hit.id}
                type="button"
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(hit)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                  index === active ? 'bg-gray-800 text-white' : 'text-gray-300'
                }`}
              >
                <ProjectIcon project={hit} className="h-6 w-6 rounded-md" />
                <span className="min-w-0 flex-1 truncate font-medium">{hit.title}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function typesLabel(t, types) {
  const set = new Set(types.length > 0 ? types : ['required'])
  if (set.size === DEPENDENCY_TYPES.length) return t('filter.dep.anyType')
  if (set.has('required') && set.has('optional')) return t('filter.dep.requiredOrOptional')
  if (set.has('required') && set.has('embedded')) return t('filter.dep.requiredOrEmbedded')
  if (set.has('optional') && set.has('embedded')) return t('filter.dep.optionalOrEmbedded')
  return t(`filter.dep.${[...set][0]}`)
}

function DependencyTypePicker({ types, onCommit }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(types)
  const boxRef = useRef(null)
  const typesKey = types.join(',')

  useEffect(() => {
    setDraft(typesKey ? typesKey.split(',') : [])
  }, [typesKey])

  const close = () => {
    setOpen(false)
    const next = draft.length > 0 ? DEPENDENCY_TYPES.filter((type) => draft.includes(type)) : ['required']
    setDraft(next)
    if (next.join(',') !== (typesKey || 'required')) onCommit(next)
  }
  useOutsideClick(boxRef, close, open)

  const toggle = (type) => {
    setDraft((current) => (current.includes(type) ? current.filter((item) => item !== type) : [...current, type]))
  }

  return (
    <div ref={boxRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-0.5 text-sm text-gray-400 hover:text-white transition-colors"
      >
        {typesLabel(t, draft)}
        <Chevron open={open} />
      </button>
      {open && (
        <div role="listbox" aria-multiselectable="true" className="absolute left-0 top-full mt-1 z-30 min-w-[220px] glass-pop rounded-xl p-1">
          {DEPENDENCY_TYPES.map((type) => {
            const checked = draft.includes(type)
            return (
              <button
                key={type}
                type="button"
                role="option"
                aria-selected={checked}
                onClick={() => toggle(type)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-gray-300 hover:text-white transition-colors group"
              >
                <span className="flex-1">{t(`filter.dep.${type}`)}</span>
                <span className={`glass-check flex h-4 w-4 items-center justify-center rounded border ${checked ? 'border-modrinth-green bg-modrinth-green text-black' : 'border-gray-600'}`}>
                  {checked && <CheckIcon />}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function useProjectInfo(ids) {
  const [projects, setProjects] = useState({})
  const idsKey = ids.join(',')

  useEffect(() => {
    const missing = (idsKey ? idsKey.split(',') : []).filter((id) => !projects[id])
    if (missing.length === 0) return
    let cancelled = false
    Promise.all(
      missing.map((id) =>
        fetch(`/api/dependencies/project?id=${encodeURIComponent(id)}`)
          .then((response) => (response.ok ? response.json() : null))
          .catch(() => null)
          .then((info) => [id, info || { id, title: id }]),
      ),
    ).then((entries) => {
      if (!cancelled) setProjects((current) => ({ ...current, ...Object.fromEntries(entries) }))
    })
    return () => {
      cancelled = true
    }
  }, [idsKey])

  return { projects, remember: (hit) => setProjects((current) => ({ ...current, [hit.id]: hit })) }
}

export default function DependencyFilter() {
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(true)
  const multi = pathname.endsWith('modpacks')
  const options = parseDependentOptions(searchParams)
  const { projects, remember } = useProjectInfo(options.map((option) => option.id))

  const apply = (next) => {
    const qs = replaceDependentParams(searchParams, next).toString().replace(/%3A/gi, ':').replace(/%2C/gi, ',')
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const add = (hit) => {
    remember(hit)
    apply(multi ? [...options, { id: hit.id, types: [] }] : [{ id: hit.id, types: ['required'] }])
  }
  const remove = (id) => apply(options.filter((option) => option.id !== id))
  const setTypes = (id, types) => apply(options.map((option) => (option.id === id ? { ...option, types } : option)))

  const selected = options[0]
  const selectedProject = selected ? projects[selected.id] : null

  return (
    <div className="rounded-xl card-glass bg-modrinth-dark">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <h3 className="m-0 flex-1 text-sm font-semibold text-gray-300">
          {t(multi ? 'filter.dep.includedTitle' : 'filter.dep.title')}
        </h3>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-3">
          {multi ? (
            <>
              {options.length === 0 && (
                <ProjectSearch placeholder={t('filter.dep.searchContent')} excludeIds={[]} onSelect={add} />
              )}
              {options.length > 0 && (
                <div className="flex flex-col gap-1">
                  {options.map(({ id }) => {
                    const project = projects[id]
                    return (
                      <div key={id} className="group flex min-w-0 items-center gap-2 rounded-xl px-1 py-1">
                        <ProjectIcon project={project} className="h-6 w-6 rounded-md" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{project?.title ?? id}</span>
                        <button
                          type="button"
                          aria-label={t('filter.dep.remove', { name: project?.title ?? id })}
                          title={t('filter.dep.remove', { name: project?.title ?? id })}
                          onClick={() => remove(id)}
                          className="rounded-lg p-1.5 text-gray-500 transition-all hover:bg-gray-800 hover:text-white [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <XIcon />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : selected ? (
            <div className="flex items-center gap-2 rounded-xl bg-gray-800/60 p-2.5">
              <ProjectIcon project={selectedProject} className="h-12 w-12 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-bold text-white">{selectedProject?.title ?? selected.id}</div>
                <DependencyTypePicker types={selected.types} onCommit={(types) => setTypes(selected.id, types)} />
              </div>
              <button
                type="button"
                aria-label={t('filter.dep.clear')}
                title={t('filter.dep.clear')}
                onClick={() => remove(selected.id)}
                className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-700 hover:text-white active:scale-[0.97]"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <ProjectSearch placeholder={t('filter.dep.searchProject')} excludeIds={[]} onSelect={add} />
          )}
        </div>
      )}
    </div>
  )
}
