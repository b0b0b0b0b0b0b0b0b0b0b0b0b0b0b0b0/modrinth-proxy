'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import CurrentDomain from './CurrentDomain'

export default function Logo() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const prevPathnameRef = useRef(pathname)
  const prevSearchParamsRef = useRef(searchParams.toString())
  const timeoutRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      let target = e.target
      let shouldStartLoading = false
      
      while (target && target !== document.body) {
        if (target.tagName === 'A') {
          const href = target.getAttribute('href') || target.href
          if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            try {
              if (href.startsWith('/') || href.startsWith(window.location.origin)) {
                const url = new URL(href.startsWith('/') ? href : new URL(href).pathname, window.location.origin)
                const currentUrl = window.location
                if (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) {
                  shouldStartLoading = true
                  break
                }
              } else if (href.startsWith('http')) {
                const url = new URL(href)
                if (url.origin === window.location.origin) {
                  const currentUrl = window.location
                  if (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) {
                    shouldStartLoading = true
                    break
                  }
                }
              }
            } catch (err) {
              if (href.startsWith('/')) {
                const currentPath = window.location.pathname + window.location.search
                if (href.split('?')[0] !== currentPath.split('?')[0]) {
                  shouldStartLoading = true
                  break
                }
              }
            }
          }
        }
        
        if (target.tagName === 'FORM') {
          shouldStartLoading = true
          break
        }
        
        target = target.parentElement
      }
      
      if (shouldStartLoading) {
        setIsLoading(true)
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          setIsLoading(false)
        }, 2000)
      }
    }

    document.addEventListener('click', handleClick, true)
    
    return () => {
      document.removeEventListener('click', handleClick, true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const currentPath = pathname
    const currentSearch = searchParams.toString()
    
    if (prevPathnameRef.current !== currentPath || prevSearchParamsRef.current !== currentSearch) {
      prevPathnameRef.current = currentPath
      prevSearchParamsRef.current = currentSearch
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false)
      }, 500)
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [pathname, searchParams])

  return (
    <Link href="/" className="flex items-center gap-2 md:gap-3 group flex-shrink-0 relative">
      <span
        role="img"
        aria-label="Logo"
        className={`w-8 h-8 md:w-9 md:h-9 transition-all duration-300 select-none pointer-events-none logo-icon inline-block ${
          isLoading 
            ? 'animate-spin scale-110' 
            : 'group-hover:scale-110'
        }`}
        style={{
          animationDuration: isLoading ? '0.8s' : undefined
        }}
        referrerPolicy="no-referrer"
      />
      <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-modrinth-green to-modrinth-green-light bg-clip-text text-transparent hidden sm:block group-hover:from-modrinth-green-light group-hover:to-modrinth-green transition-all select-none">ModrinthProxy</span>
      <div className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-[2px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 pointer-events-none z-50 select-none">
        <div className="relative select-none">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-b-6 border-l-transparent border-r-transparent border-b-gray-800 select-none"></div>
          <div className="bg-gray-800 text-white px-4 py-1.5 rounded-full text-xs whitespace-nowrap shadow-xl border border-gray-700 select-none">
            <div className="flex items-center gap-1.5 select-none">
              <svg className="w-3.5 h-3.5 text-modrinth-green animate-spin-slow" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                <path d="m368.886 456h16.11v16h-16.11z" transform="matrix(.117 -.993 .993 .117 -127.916 784.156)"></path>
                <path d="m456 127.004h16v16.11h-16z" transform="matrix(.117 -.993 .993 .117 275.653 580.101)"></path>
                <path d="m127.004 40h16.11v16h-16.11z" transform="matrix(.117 -.993 .993 .117 71.61 176.527)"></path>
                <path d="m40 368.886h16v16.11h-16z" transform="matrix(.117 -.993 .993 .117 -331.968 380.571)"></path>
                <path d="m400 256q0-5.428-.4-10.759a160.1 160.1 0 0 1 80.4 138.759h16c0-69.54-40.542-129.784-99.229-158.352a144.117 144.117 0 0 0 -47.034-78.87 151.914 151.914 0 0 1 71.465-8.7l17.863 2.1 1.87-15.891-17.864-2.1a167.755 167.755 0 0 0 -88.188 13.4 143.151 143.151 0 0 0 -78.883-23.587q-5.428 0-10.759.4a160.1 160.1 0 0 1 138.759-80.4v-16c-69.54 0-129.784 40.542-158.352 99.229a144.119 144.119 0 0 0 -78.869 47.033 151.924 151.924 0 0 1 -8.7-71.464l2.1-17.863-15.891-1.87-2.1 17.864a167.757 167.757 0 0 0 13.4 88.187 143.149 143.149 0 0 0 -23.588 78.884q0 5.429.4 10.759a160.1 160.1 0 0 1 -80.4-138.759h-16c0 69.54 40.542 129.784 99.229 158.352a144.112 144.112 0 0 0 47.035 78.87 151.891 151.891 0 0 1 -71.466 8.7l-17.863-2.1-1.87 15.891 17.864 2.1a169.844 169.844 0 0 0 19.846 1.166 167.369 167.369 0 0 0 68.344-14.567 143.154 143.154 0 0 0 78.881 23.588q5.429 0 10.759-.4a160.1 160.1 0 0 1 -138.759 80.4v16c69.54 0 129.784-40.542 158.352-99.229a144.119 144.119 0 0 0 78.869-47.033 151.924 151.924 0 0 1 8.7 71.464l-2.1 17.863 15.891 1.87 2.1-17.864a167.757 167.757 0 0 0 -13.4-88.187 143.149 143.149 0 0 0 23.588-78.884zm-16 0a127.2 127.2 0 0 1 -16.175 62.219 167.747 167.747 0 0 0 -21.715-29.1 96.047 96.047 0 0 0 1.195-62.779 158.613 158.613 0 0 1 35.246 10.4 128.387 128.387 0 0 1 1.449 19.26zm-191.956 48h46.875l-13.541 16.25q-2.929 3.514-6.041 6.818a80.543 80.543 0 0 1 -27.293-23.068zm-16.044-48a79.807 79.807 0 0 1 2.735-20.714c.918.8 1.833 1.6 2.772 2.384l26.664 22.22a47.816 47.816 0 0 0 12.09 28.11h-28.261c-3.166 0-6.308-.1-9.429-.285a79.534 79.534 0 0 1 -6.571-31.715zm143.956-48h-46.875l13.541-16.25q2.929-3.514 6.041-6.818a80.543 80.543 0 0 1 27.293 23.068zm-31.956 48a32 32 0 1 1 -32-32 32.036 32.036 0 0 1 32 32zm-13.67-74.493-22.22 26.664a47.816 47.816 0 0 0 -28.11 12.09v-28.261c0-3.166.1-6.308.285-9.43a79.823 79.823 0 0 1 52.429-3.835c-.799.918-1.602 1.833-2.384 2.772zm-66.33 57.412-16.25-13.541q-3.514-2.929-6.818-6.041a80.543 80.543 0 0 1 23.068-27.293zm29.67 91.574 22.22-26.664a47.816 47.816 0 0 0 28.11-12.09v28.261c0 3.166-.1 6.308-.285 9.43a79.825 79.825 0 0 1 -52.422 3.837c.798-.917 1.596-1.836 2.377-2.774zm66.33-57.412 16.25 13.541q3.514 2.929 6.818 6.041a80.543 80.543 0 0 1 -23.068 27.293zm26.493 1.249-26.664-22.22a47.816 47.816 0 0 0 -12.09-28.11h28.261c3.166 0 6.308.1 9.429.285a79.817 79.817 0 0 1 3.836 52.429c-.918-.799-1.833-1.602-2.772-2.384zm47.719-56.424a174.6 174.6 0 0 0 -38.467-8.792 96.713 96.713 0 0 0 -34.945-35.753 151.537 151.537 0 0 1 28.556-19.27 128.476 128.476 0 0 1 44.856 63.815zm-122.212-89.906a127.2 127.2 0 0 1 62.219 16.175 167.785 167.785 0 0 0 -29.1 21.715 96.047 96.047 0 0 0 -62.779-1.195 158.613 158.613 0 0 1 10.4-35.246 128.387 128.387 0 0 1 19.26-1.449zm-38.094 5.788a174.6 174.6 0 0 0 -8.792 38.467 96.7 96.7 0 0 0 -35.753 34.945 151.537 151.537 0 0 1 -19.27-28.556 128.469 128.469 0 0 1 63.815-44.856zm-89.906 122.212a127.2 127.2 0 0 1 16.175-62.219 167.747 167.747 0 0 0 21.715 29.1 96.047 96.047 0 0 0 -1.195 62.779 158.613 158.613 0 0 1 -35.246-10.4 128.387 128.387 0 0 1 -1.449-19.26zm5.788 38.094a174.6 174.6 0 0 0 38.467 8.792 96.723 96.723 0 0 0 34.945 35.754 151.524 151.524 0 0 1 -28.555 19.269 128.467 128.467 0 0 1 -44.857-63.815zm122.212 89.906a127.2 127.2 0 0 1 -62.231-16.182 167.775 167.775 0 0 0 29.1-21.712 96.047 96.047 0 0 0 62.79 1.2 158.613 158.613 0 0 1 -10.4 35.246 128.387 128.387 0 0 1 -19.259 1.448zm38.094-5.788a174.6 174.6 0 0 0 8.792-38.467 96.7 96.7 0 0 0 35.753-34.945 151.537 151.537 0 0 1 19.27 28.556 128.469 128.469 0 0 1 -63.815 44.856z"></path>
                <path d="m400 16h16v16h-16z"></path>
                <path d="m16 96h16v16h-16z"></path>
                <path d="m96 480h16v16h-16z"></path>
                <path d="m480 400h16v16h-16z"></path>
                <path d="m363.126 116.346 9.748-12.688a189.972 189.972 0 0 0 -75.143-35.109l-3.462 15.621a174.091 174.091 0 0 1 68.857 32.176z"></path>
                <path d="m401.4 156.792a176.011 176.011 0 0 1 29.12 76.241l15.866-2.066a192.088 192.088 0 0 0 -31.786-83.205z"></path>
                <path d="m116.346 148.874-12.688-9.748a189.972 189.972 0 0 0 -35.109 75.143l15.621 3.462a174.091 174.091 0 0 1 32.176-68.857z"></path>
                <path d="m233.033 81.484-2.066-15.866a192.088 192.088 0 0 0 -83.205 31.782l9.03 13.208a176.011 176.011 0 0 1 76.241-29.124z"></path>
                <path d="m148.874 395.654-9.748 12.688a189.972 189.972 0 0 0 75.143 35.109l3.462-15.621a174.091 174.091 0 0 1 -68.857-32.176z"></path>
                <path d="m110.6 355.208a176.011 176.011 0 0 1 -29.12-76.241l-15.866 2.066a192.088 192.088 0 0 0 31.778 83.2z"></path>
                <path d="m395.654 363.126 12.688 9.748a189.972 189.972 0 0 0 35.109-75.143l-15.621-3.462a174.091 174.091 0 0 1 -32.176 68.857z"></path>
                <path d="m278.967 430.516 2.066 15.866a192.088 192.088 0 0 0 83.2-31.778l-9.03-13.208a176.011 176.011 0 0 1 -76.236 29.12z"></path>
                <path d="m64 480h16v16h-16z"></path>
                <path d="m480 432h16v16h-16z"></path>
                <path d="m432 16h16v16h-16z"></path>
                <path d="m16 64h16v16h-16z"></path>
              </svg>
              <CurrentDomain />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
