'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function MobileNav({ onFilterClick }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  const isActive = (path) => {
    if (path === '/') return pathname === '/'
    if (path === '/mods') return pathname.startsWith('/mods') || pathname.startsWith('/discover/mods') || pathname.startsWith('/mod/')
    if (path === '/plugins') return pathname.startsWith('/plugins') || pathname.startsWith('/discover/plugins') || pathname.startsWith('/plugin/')
    if (path === '/servers') return pathname.startsWith('/servers') || pathname.startsWith('/discover/servers') || pathname.startsWith('/server/')
    if (path === '/shaders') return pathname.startsWith('/shaders') || pathname.startsWith('/discover/shaders') || pathname.startsWith('/shader/')
    if (path === '/resourcepacks') return pathname.startsWith('/resourcepacks') || pathname.startsWith('/discover/resourcepacks') || pathname.startsWith('/resourcepack/')
    if (path === '/datapacks') return pathname.startsWith('/datapacks') || pathname.startsWith('/discover/datapacks') || pathname.startsWith('/datapack/')
    if (path === '/modpacks') return pathname.startsWith('/modpacks') || pathname.startsWith('/discover/modpacks') || pathname.startsWith('/modpack/')
    if (path === '/app') return pathname.startsWith('/app') || pathname.startsWith('/launcher')
    return false
  }

  const navItems = [
    { 
      href: '/mods', 
      label: 'Моды', 
      icon: <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16"></path><path d="M3.29 7 12 12l8.71-5M12 22V12"></path></svg>,
      color: 'from-modrinth-green to-modrinth-green-light' 
    },
    { 
      href: '/resourcepacks', 
      label: 'Ресурспаки', 
      icon: <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3"></path><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7M14.5 17.5 4.5 15"></path></svg>,
      color: 'from-purple-500 to-pink-500' 
    },
    { 
      href: '/datapacks', 
      label: 'Датапаки', 
      icon: <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"></path></svg>,
      color: 'from-orange-500 to-amber-500' 
    },
    { 
      href: '/shaders', 
      label: 'Шейдеры', 
      icon: <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><circle cx="6" cy="15" r="4"></circle><circle cx="18" cy="15" r="4"></circle><path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2M2.5 13 5 7c.7-1.3 1.4-2 3-2M21.5 13 19 7c-.7-1.3-1.5-2-3-2"></path></svg>,
      color: 'from-cyan-500 to-blue-500' 
    },
    { 
      href: '/modpacks', 
      label: 'Модпаки', 
      icon: <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22v-9M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.66 1.66 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z"></path><path d="M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13"></path><path d="M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36l12.18 6.86a1.64 1.64 0 0 0 1.63 0z"></path></svg>,
      color: 'from-red-500 to-rose-500' 
    },
    { 
      href: '/plugins', 
      label: 'Плагины', 
      icon: <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"></path></svg>,
      color: 'from-blue-500 to-cyan-500' 
    },
    { 
      href: '/servers', 
      label: 'Серверы', 
      icon: <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" x2="2" y1="12" y2="12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /><line x1="6" x2="6.01" y1="16" y2="16" /><line x1="10" x2="10.01" y1="16" y2="16" /></svg>,
      color: 'from-indigo-500 to-violet-500' 
    },
    { 
      href: '/app', 
      label: 'Modrinth App', 
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
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
      </svg>,
      color: 'from-indigo-500 to-purple-500' 
    },
  ]

  const showFilterButton =
    pathname.startsWith('/mods') ||
    pathname.startsWith('/plugins') ||
    pathname.startsWith('/servers') ||
    pathname.startsWith('/shaders') ||
    pathname.startsWith('/resourcepacks') ||
    pathname.startsWith('/datapacks') ||
    pathname.startsWith('/modpacks') ||
    pathname.startsWith('/discover/mods') ||
    pathname.startsWith('/discover/plugins') ||
    pathname.startsWith('/discover/servers') ||
    pathname.startsWith('/discover/shaders') ||
    pathname.startsWith('/discover/resourcepacks') ||
    pathname.startsWith('/discover/datapacks') ||
    pathname.startsWith('/discover/modpacks')

  const showSettingsNavButton = pathname === '/settings'

  const handleFilterClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toggleMobileFilter'))
    }
  }

  const handleSettingsNavClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('toggleSettingsNav'))
    }
  }

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-modrinth-darker backdrop-blur-xl shadow-[0_-4px_20px_rgba(236,127,171,0.15)] rounded-t-[24px]">
          <Link
            href="/"
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
              pathname === '/' 
                ? 'bg-gradient-to-r from-modrinth-green to-modrinth-green-light text-black shadow-lg shadow-[rgba(236,127,171,0.3)] scale-105' 
                : 'bg-modrinth-dark hover:bg-modrinth-darker text-gray-300 hover:text-modrinth-green'
            }`}
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9,22 9,12 15,12 15,22"></polyline>
            </svg>
            <span>Главная</span>
          </Link>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
              isOpen 
                ? 'bg-gradient-to-r from-modrinth-green to-modrinth-green-light text-black shadow-lg shadow-[rgba(236,127,171,0.3)] scale-105' 
                : 'bg-modrinth-dark hover:bg-modrinth-darker text-gray-300 hover:text-modrinth-green'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>Меню</span>
          </button>
          
          {showFilterButton && (
            <button
              onClick={handleFilterClick}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-modrinth-dark hover:bg-modrinth-darker text-gray-300 hover:text-modrinth-green rounded-xl text-xs font-semibold transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Фильтр</span>
            </button>
          )}

          {showSettingsNavButton && (
            <button
              onClick={handleSettingsNavClick}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-modrinth-dark hover:bg-modrinth-darker text-gray-300 hover:text-modrinth-green rounded-xl text-xs font-semibold transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h16" />
              </svg>
              <span>Разделы</span>
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
          
          <div 
            className="absolute bottom-0 left-0 right-0 bg-modrinth-darker rounded-t-[32px] shadow-[0_-8px_40px_rgba(236,127,171,0.25)] pb-safe animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-4 pb-3">
              <div className="w-16 h-1.5 bg-gradient-to-r from-transparent via-modrinth-green to-transparent rounded-full"></div>
            </div>
            
            <div className="px-4 pb-20">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-modrinth-green/30 to-transparent"></div>
                <h3 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-modrinth-green to-modrinth-green-light px-3">Навигация</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-modrinth-green/30 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mobile-nav-grid">
                {navItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`group relative flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl transition-all duration-300 transform ${
                        active
                          ? 'bg-gradient-to-br ' + item.color + ' shadow-lg shadow-[rgba(236,127,171,0.3)] scale-105'
                          : 'bg-modrinth-dark hover:bg-modrinth-darker hover:scale-105'
                      }`}
                    >
                      <div className={`transition-all duration-300 ${active ? 'text-white scale-110' : 'text-gray-400 group-hover:text-modrinth-green group-hover:scale-110'}`}>
                        {item.icon}
                      </div>
                      <span className={`text-sm font-semibold text-center transition-colors duration-300 ${
                        active ? 'text-white' : 'text-gray-300 group-hover:text-modrinth-green'
                      }`}>
                        {item.label}
                      </span>
                      {active && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-modrinth-green rounded-full shadow-lg shadow-[rgba(236,127,171,0.5)] animate-pulse"></div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
