'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
export default function Navigation() {
  const pathname = usePathname()
  const [indicator, setIndicator] = useState({ left: 0, width: 0, height: 0, opacity: 0, color: 'modrinth-green' })
  const prevPathnameRef = useRef(null)
  const navRef = useRef(null)
  const scrollRef = useRef(null)
  const linksRef = useRef({})
  const [hasAnimated, setHasAnimated] = useState(false)

  const getColorForPath = (path) => {
    if (path.startsWith('/discover/mods') || path.startsWith('/mods') || path.startsWith('/mod/')) return 'modrinth-green'
    if (path.startsWith('/discover/resourcepacks') || path.startsWith('/resourcepacks') || path.startsWith('/resourcepack/')) return 'purple'
    if (path.startsWith('/discover/datapacks') || path.startsWith('/datapacks') || path.startsWith('/datapack/')) return 'orange'
    if (path.startsWith('/discover/shaders') || path.startsWith('/shaders') || path.startsWith('/shader/')) return 'cyan'
    if (path.startsWith('/discover/modpacks') || path.startsWith('/modpacks') || path.startsWith('/modpack/')) return 'red'
    if (path.startsWith('/discover/plugins') || path.startsWith('/plugins') || path.startsWith('/plugin/')) return 'blue'
    if (path.startsWith('/discover/servers') || path.startsWith('/servers') || path.startsWith('/server/')) return 'server'
    if (path.startsWith('/app') || path.startsWith('/launcher')) return 'emerald'
    return 'modrinth-green'
  }

  const isActive = (path) => {
    if (path === '/') return pathname === '/'
    if (path === '/app') return pathname.startsWith('/app') || pathname.startsWith('/launcher')
    if (path === '/discover/mods') {
      return pathname.startsWith('/discover/mods') || pathname.startsWith('/mods') || pathname.startsWith('/mod/')
    }
    if (path === '/discover/resourcepacks') {
      return pathname.startsWith('/discover/resourcepacks') || pathname.startsWith('/resourcepacks') || pathname.startsWith('/resourcepack/')
    }
    if (path === '/discover/datapacks') {
      return pathname.startsWith('/discover/datapacks') || pathname.startsWith('/datapacks') || pathname.startsWith('/datapack/')
    }
    if (path === '/discover/shaders') {
      return pathname.startsWith('/discover/shaders') || pathname.startsWith('/shaders') || pathname.startsWith('/shader/')
    }
    if (path === '/discover/modpacks') {
      return pathname.startsWith('/discover/modpacks') || pathname.startsWith('/modpacks') || pathname.startsWith('/modpack/')
    }
    if (path === '/discover/plugins') {
      return pathname.startsWith('/discover/plugins') || pathname.startsWith('/plugins') || pathname.startsWith('/plugin/')
    }
    if (path === '/discover/servers') {
      return pathname.startsWith('/discover/servers') || pathname.startsWith('/servers') || pathname.startsWith('/server/')
    }
    return pathname.startsWith(path)
  }

  useEffect(() => {
    const updateIndicator = () => {
      requestAnimationFrame(() => {
        const activeKey = Object.keys(linksRef.current).find(key => isActive(key))
        if (activeKey && linksRef.current[activeKey]) {
          const element = linksRef.current[activeKey]
          const navElement = navRef.current
          if (element && navElement) {
            if (prevPathnameRef.current !== null && prevPathnameRef.current !== pathname) {
              setHasAnimated(true)
            }
            
            setIndicator({
              left: element.offsetLeft,
              width: element.offsetWidth,
              height: element.offsetHeight,
              opacity: 1,
              color: getColorForPath(pathname)
            })

            const scrollElement = scrollRef.current
            if (scrollElement && scrollElement.classList.contains('nav-links-scroll--can-scroll')) {
              const linkLeft = element.offsetLeft
              const linkRight = linkLeft + element.offsetWidth
              const viewLeft = scrollElement.scrollLeft
              const viewRight = viewLeft + scrollElement.clientWidth
              if (linkLeft < viewLeft || linkRight > viewRight) {
                const targetLeft = linkRight > viewRight
                  ? linkRight - scrollElement.clientWidth
                  : linkLeft
                scrollElement.scrollTo({
                  left: Math.max(0, targetLeft),
                  behavior: hasAnimated ? 'smooth' : 'auto',
                })
              }
            }
            
            prevPathnameRef.current = pathname
          }
        } else {
          setIndicator(prev => ({ ...prev, opacity: 0 }))
        }
      })
    }

    updateIndicator()
    
    const timeoutId = setTimeout(() => {
      updateIndicator()
    }, 100)
    
    const handleResize = () => {
      updateIndicator()
    }

    const scrollElement = scrollRef.current
    const handleScroll = () => {
      updateIndicator()
    }
    
    window.addEventListener('resize', handleResize)
    scrollElement?.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
      scrollElement?.removeEventListener('scroll', handleScroll)
    }
  }, [pathname])

  useEffect(() => {
    const scrollEl = scrollRef.current
    const navEl = navRef.current
    if (!scrollEl || !navEl) return

    const syncScrollability = () => {
      const overflowPx = navEl.scrollWidth - scrollEl.clientWidth
      const overflows = overflowPx > 12
      scrollEl.classList.toggle('nav-links-scroll--can-scroll', overflows)
      if (!overflows && scrollEl.scrollLeft !== 0) {
        scrollEl.scrollLeft = 0
      }
    }

    const lockScrollWhenIdle = () => {
      if (!scrollEl.classList.contains('nav-links-scroll--can-scroll')) {
        scrollEl.scrollLeft = 0
      }
    }

    syncScrollability()

    const resizeObserver = new ResizeObserver(syncScrollability)
    resizeObserver.observe(scrollEl)
    resizeObserver.observe(navEl)
    window.addEventListener('resize', syncScrollability)
    scrollEl.addEventListener('scroll', lockScrollWhenIdle, { passive: true })

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', syncScrollability)
      scrollEl.removeEventListener('scroll', lockScrollWhenIdle)
    }
  }, [pathname])

  const getGradientClass = (color) => {
    const gradients = {
      'modrinth-green': 'from-modrinth-green/20 to-modrinth-green-light/20',
      'purple': 'from-purple-500/10 to-pink-500/10',
      'orange': 'from-orange-500/10 to-amber-500/10',
      'cyan': 'from-cyan-500/10 to-blue-500/10',
      'red': 'from-red-500/10 to-rose-500/10',
      'blue': 'from-blue-500/10 to-cyan-500/10',
      'yellow': 'from-yellow-500/10 to-amber-500/10',
      'emerald': 'from-emerald-500/10 to-teal-500/10',
      server: 'from-indigo-500/10 to-violet-500/10',
    }
    return gradients[color] || gradients['modrinth-green']
  }

  return (
    <div
      ref={scrollRef}
      className="nav-links-scroll hidden min-w-0 flex-1 lg:block"
    >
      <div ref={navRef} className="relative flex w-max flex-nowrap items-center gap-0.5 md:gap-1">
        <div 
          className={`nav-indicator absolute rounded-lg bg-gradient-to-r pointer-events-none ${getGradientClass(indicator.color)} ${hasAnimated ? 'transition-all duration-700 ease-out' : ''}`}
          style={{
            left: `${indicator.left}px`,
            width: `${indicator.width}px`,
            height: `${indicator.height}px`,
            opacity: indicator.opacity,
            transform: 'translateZ(0)',
            top: '0',
            zIndex: 0
          }}
        />
      
      <Link 
        ref={el => linksRef.current['/discover/mods'] = el}
        href="/discover/mods" 
        className="group relative px-2.5 md:px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap z-10 hover:bg-[rgba(var(--color-green-rgb),0.08)] dark:hover:bg-[rgba(var(--color-green-rgb),0.1)]">
        <span className={`text-xs md:text-sm font-semibold transition-colors flex items-center gap-1.5 ${isActive('/discover/mods') || isActive('/mods') ? 'text-modrinth-green' : 'text-gray-700 dark:text-gray-300 group-hover:text-[color:var(--color-green-hover)] dark:group-hover:text-modrinth-green-light'}`}>
          <svg className="hidden sm:inline w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16"></path>
            <path d="M3.29 7 12 12l8.71-5M12 22V12"></path>
          </svg>
          <span>Моды</span>
        </span>
      </Link>
      
      <Link 
        ref={el => linksRef.current['/discover/resourcepacks'] = el}
        href="/discover/resourcepacks" 
        className="group relative px-2.5 md:px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap z-10 hover:bg-purple-500/10 dark:hover:bg-purple-500/10">
        <span className={`text-xs md:text-sm font-semibold transition-colors flex items-center gap-1.5 ${isActive('/discover/resourcepacks') || isActive('/resourcepacks') ? 'text-purple-600 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400'}`}>
          <svg className="hidden sm:inline w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3"></path>
            <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7M14.5 17.5 4.5 15"></path>
          </svg>
          <span>Ресурспаки</span>
        </span>
      </Link>
      
      <Link 
        ref={el => linksRef.current['/discover/datapacks'] = el}
        href="/discover/datapacks" 
        className="group relative px-2.5 md:px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap z-10 hover:bg-orange-500/10 dark:hover:bg-orange-500/10">
        <span className={`text-xs md:text-sm font-semibold transition-colors flex items-center gap-1.5 ${isActive('/discover/datapacks') || isActive('/datapacks') ? 'text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400'}`}>
          <svg className="hidden sm:inline w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"></path>
          </svg>
          <span>Датапаки</span>
        </span>
      </Link>
      
      <Link 
        ref={el => linksRef.current['/discover/shaders'] = el}
        href="/discover/shaders" 
        className="group relative px-2.5 md:px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap z-10 hover:bg-cyan-500/10 dark:hover:bg-cyan-500/10">
        <span className={`text-xs md:text-sm font-semibold transition-colors flex items-center gap-1.5 ${isActive('/discover/shaders') || isActive('/shaders') ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400'}`}>
          <svg className="hidden sm:inline w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="6" cy="15" r="4"></circle>
            <circle cx="18" cy="15" r="4"></circle>
            <path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2M2.5 13 5 7c.7-1.3 1.4-2 3-2M21.5 13 19 7c-.7-1.3-1.5-2-3-2"></path>
          </svg>
          <span>Шейдеры</span>
        </span>
      </Link>
      
      <Link 
        ref={el => linksRef.current['/discover/modpacks'] = el}
        href="/discover/modpacks" 
        className="group relative px-2.5 md:px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap z-10 hover:bg-red-500/10 dark:hover:bg-red-500/10">
        <span className={`text-xs md:text-sm font-semibold transition-colors flex items-center gap-1.5 ${isActive('/discover/modpacks') || isActive('/modpacks') ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400'}`}>
          <svg className="hidden sm:inline w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 22v-9M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.66 1.66 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z"></path>
            <path d="M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13"></path>
            <path d="M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36l12.18 6.86a1.64 1.64 0 0 0 1.63 0z"></path>
          </svg>
          <span>Модпаки</span>
        </span>
      </Link>
      
      <Link 
        ref={el => linksRef.current['/discover/plugins'] = el}
        href="/discover/plugins" 
        className="group relative px-2.5 md:px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap z-10 hover:bg-blue-500/10 dark:hover:bg-blue-500/10">
        <span className={`text-xs md:text-sm font-semibold transition-colors flex items-center gap-1.5 ${isActive('/discover/plugins') || isActive('/plugins') ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
          <svg className="hidden sm:inline w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"></path>
          </svg>
          <span>Плагины</span>
        </span>
      </Link>
      
      <Link 
        ref={el => linksRef.current['/discover/servers'] = el}
        href="/discover/servers" 
        className="group relative px-2.5 md:px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap z-10 hover:bg-indigo-500/10 dark:hover:bg-indigo-950/30">
        <span className={`text-xs md:text-sm font-semibold transition-colors flex items-center gap-1.5 ${isActive('/discover/servers') || isActive('/servers') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
          <svg className="hidden sm:inline w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="22" x2="2" y1="12" y2="12" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            <line x1="6" x2="6.01" y1="16" y2="16" />
            <line x1="10" x2="10.01" y1="16" y2="16" />
          </svg>
          <span>Серверы</span>
        </span>
      </Link>

      <Link 
        ref={el => linksRef.current['/app'] = el}
        href="/app" 
        className="group relative z-10 rounded-lg px-2.5 py-2 transition-all duration-300 whitespace-nowrap hover:bg-emerald-500/10 dark:hover:bg-emerald-950/30 md:px-4">
        <span className={`text-xs md:text-sm font-semibold transition-colors flex items-center gap-1.5 ${isActive('/app') ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400'}`}>
          <svg className="hidden sm:inline w-4 h-4" fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
            <g>
              <g>
                <path d="M477.858,8.533H34.142C15.317,8.533,0,23.851,0,42.675v281.591c0,4.71,3.823,8.533,8.533,8.533h494.933
                  c4.71,0,8.533-3.823,8.533-8.533V42.675C512,23.851,496.683,8.533,477.858,8.533z M494.933,315.733H17.067V42.675
                  c0-9.421,7.663-17.075,17.075-17.075h443.716c9.412,0,17.075,7.654,17.075,17.075V315.733z"></path>
              </g>
            </g>
            <g>
              <g>
                <path d="M503.467,315.733H8.533c-4.71,0-8.533,3.823-8.533,8.533v42.658c0,18.825,15.317,34.142,34.142,34.142h443.716
                  c18.825,0,34.142-15.317,34.142-34.142v-42.658C512,319.556,508.177,315.733,503.467,315.733z M494.933,366.925
                  c0,9.421-7.663,17.075-17.075,17.075H34.142c-9.412,0-17.075-7.654-17.075-17.075V332.8h477.867V366.925z"></path>
              </g>
            </g>
            <g>
              <g>
                <path d="M281.6,349.867h-51.2c-4.71,0-8.533,3.823-8.533,8.533s3.823,8.533,8.533,8.533h51.2c4.71,0,8.533-3.823,8.533-8.533
                  S286.31,349.867,281.6,349.867z"></path>
              </g>
            </g>
            <g>
              <g>
                <path d="M469.333,42.667H42.667c-4.71,0-8.533,3.823-8.533,8.533v273.067c0,4.71,3.823,8.533,8.533,8.533h426.667
                  c4.71,0,8.533-3.823,8.533-8.533V51.2C477.867,46.49,474.044,42.667,469.333,42.667z M460.8,315.733H51.2v-256h409.6V315.733z"></path>
              </g>
            </g>
            <g>
              <g>
                <path d="M366.933,452.267H145.067c-14.114,0-25.6,11.486-25.6,25.6s11.486,25.6,25.6,25.6h221.867c14.114,0,25.6-11.486,25.6-25.6
                  S381.047,452.267,366.933,452.267z M366.933,486.4H145.067c-4.71,0-8.533-3.831-8.533-8.533s3.823-8.533,8.533-8.533h221.867
                  c4.71,0,8.533,3.831,8.533,8.533S371.644,486.4,366.933,486.4z"></path>
              </g>
            </g>
            <g>
              <g>
                <path d="M349.867,452.267c-28.314,0-42.667-20.096-42.667-59.733c0-4.71-3.823-8.533-8.533-8.533h-85.333
                  c-4.71,0-8.533,3.823-8.533,8.533c0,39.637-14.353,59.733-42.667,59.733c-4.71,0-8.533,3.823-8.533,8.533
                  c0,4.71,3.823,8.533,8.533,8.533h187.733c4.71,0,8.533-3.823,8.533-8.533C358.4,456.09,354.577,452.267,349.867,452.267z
                   M203.699,452.267c10.505-11.639,16.691-28.971,17.937-51.2h68.736c1.237,22.229,7.424,39.561,17.937,51.2H203.699z"></path>
              </g>
            </g>
            <g>
              <g>
                <path d="M407.757,259.959l-20.599-20.599l11.46-11.46c2.125-2.125,2.978-5.214,2.244-8.124c-0.734-2.91-2.944-5.214-5.82-6.084
                  l-85.333-25.6c-3.012-0.905-6.263-0.077-8.482,2.142c-2.227,2.219-3.046,5.478-2.142,8.482l25.6,85.333
                  c0.862,2.884,3.174,5.094,6.084,5.828c2.901,0.717,5.999-0.12,8.124-2.244l12.066-12.075l20.599,20.608
                  c1.596,1.604,3.772,2.5,6.033,2.5s4.437-0.896,6.033-2.5l24.132-24.141C411.093,268.689,411.093,263.296,407.757,259.959z
                   M377.591,278.067l-18.756-18.765c-2.176-2.176-5.026-3.26-7.876-3.26c-2.859,0-5.709,1.092-7.876,3.251l-6.161,6.161
                  l-16.939-56.465l56.465,16.939l-6.605,6.605c-1.818,1.826-2.816,4.25-2.816,6.827c0,2.586,1.007,5.026,2.833,6.835l19.797,19.797
                  L377.591,278.067z"></path>
              </g>
            </g>
            <g>
              <g>
                <path d="M358.4,76.8H119.467c-4.71,0-8.533,3.823-8.533,8.533V128c0,4.71,3.823,8.533,8.533,8.533H358.4
                  c4.71,0,8.533-3.823,8.533-8.533V85.333C366.933,80.623,363.11,76.8,358.4,76.8z M349.867,119.467H128v-25.6h221.867V119.467z"></path>
              </g>
            </g>
            <g>
              <g>
                <path d="M221.867,170.667H153.6c-4.71,0-8.533,3.823-8.533,8.533v34.133c0,4.71,3.823,8.533,8.533,8.533h68.267
                  c4.71,0,8.533-3.823,8.533-8.533V179.2C230.4,174.49,226.577,170.667,221.867,170.667z M213.333,204.8h-51.2v-17.067h51.2V204.8z"></path>
              </g>
            </g>
            <g>
              <g>
                <path d="M358.4,76.8H119.467c-4.71,0-8.533,3.823-8.533,8.533v162.133c0,4.71,3.823,8.533,8.533,8.533h203.145
                  c2.705,0,5.239-1.271,6.844-3.439c1.613-2.167,2.108-4.966,1.331-7.552l-10.803-36.019l35.968,10.795
                  c2.586,0.777,5.385,0.282,7.543-1.331c2.167-1.604,3.439-4.147,3.439-6.844V85.333C366.933,80.623,363.11,76.8,358.4,76.8z
                   M349.867,200.141L309.7,188.092c-3.012-0.905-6.263-0.077-8.482,2.142c-2.227,2.227-3.046,5.478-2.142,8.491l12.066,40.209H128
                  V93.867h221.867V200.141z"></path>
              </g>
            </g>
          </svg>
          <span>Modrinth App</span>
        </span>
      </Link>
      </div>
    </div>
  )
}
