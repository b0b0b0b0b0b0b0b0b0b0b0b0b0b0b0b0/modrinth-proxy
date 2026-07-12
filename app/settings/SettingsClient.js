'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import StyledTooltip from '../components/StyledTooltip'
import Lottie from 'lottie-react'
import fixAnimation from '@/public/animations/fix.json'
import { PALETTES } from '../../lib/paletteManager'
import SettingsNav from './SettingsNav'
import SettingsMobileMenu from './SettingsMobileMenu'

const DEFAULT_LAYOUTS = {
  mods: 'rows',
  plugins: 'rows',
  datapacks: 'rows',
  shaders: 'grid',
  resourcepacks: 'grid',
  modpacks: 'rows',
  servers: 'rows',
  profiles: 'rows'
}

const LAYOUT_CATEGORIES = [
  { id: 'mods', name: 'Страница модов' },
  { id: 'plugins', name: 'Страница плагинов' },
  { id: 'datapacks', name: 'Страница датапаков' },
  { id: 'shaders', name: 'Страница шейдеров' },
  { id: 'resourcepacks', name: 'Страница ресурспаков' },
  { id: 'modpacks', name: 'Страница сборок' },
  { id: 'servers', name: 'Страница серверов' },
  { id: 'profiles', name: 'Профили пользователей' }
]

export default function SettingsClient() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [activePalette, setActivePalette] = useState('pink')
  const [toggles, setToggles] = useState({
    'advanced-rendering': true,
    'search-sidebar-right': false,
    'project-sidebar-left': false,
    'show-disclaimer-badge': true,
    'hide-project-activity-graph': false,
  })
  
  const [layouts, setLayouts] = useState(DEFAULT_LAYOUTS)

  const lottieRef = useRef(null)

  const handleMouseEnter = () => {
    if (lottieRef.current) {
      lottieRef.current.play()
    }
  }

  const handleMouseLeave = () => {
    if (lottieRef.current) {
      lottieRef.current.stop()
    }
  }

  useEffect(() => {
    const loadSettings = () => {
      const newToggles = {
        'advanced-rendering': localStorage.getItem('advanced-rendering') !== 'false',
        'search-sidebar-right': localStorage.getItem('search-sidebar-right') === 'true',
        'project-sidebar-left': localStorage.getItem('project-sidebar-left') === 'true',
        'show-disclaimer-badge': localStorage.getItem('show-disclaimer-badge') !== 'false',
        'hide-project-activity-graph': localStorage.getItem('hide-project-activity-graph') === 'true',
      }
      setToggles(newToggles)

      const savedLayouts = localStorage.getItem('project-list-layouts')
      if (savedLayouts) {
        try {
          setLayouts({ ...DEFAULT_LAYOUTS, ...JSON.parse(savedLayouts) })
        } catch (e) {}
      }
      const savedPalette = localStorage.getItem('color-palette') || 'pink'
      setActivePalette(savedPalette)
    }

    loadSettings()
    setMounted(true)
  }, [])

  const handleToggle = (key) => {
    const newValue = !toggles[key]
    setToggles(prev => ({ ...prev, [key]: newValue }))
    localStorage.setItem(key, newValue ? 'true' : 'false')

    const html = document.documentElement
    if (key === 'advanced-rendering') {
      if (newValue) html.classList.remove('no-advanced-rendering')
      else html.classList.add('no-advanced-rendering')
    } else if (key === 'search-sidebar-right') {
      if (newValue) html.classList.add('search-sidebar-right')
      else html.classList.remove('search-sidebar-right')
    } else if (key === 'project-sidebar-left') {
      if (newValue) html.classList.add('project-sidebar-left')
      else html.classList.remove('project-sidebar-left')
    } else if (key === 'show-disclaimer-badge') {
      if (newValue) html.classList.remove('hide-disclaimer-badge')
      else html.classList.add('hide-disclaimer-badge')
    } else if (key === 'hide-project-activity-graph') {
      window.dispatchEvent(new Event('feature-settings-changed'))
    }
  }

  const handleLayoutChange = (catId, mode) => {
    const newLayouts = { ...layouts, [catId]: mode }
    setLayouts(newLayouts)
    localStorage.setItem('project-list-layouts', JSON.stringify(newLayouts))

    window.dispatchEvent(new Event('layout-settings-changed'))
  }

  const handlePaletteChange = (paletteId) => {
    setActivePalette(paletteId)
    localStorage.setItem('color-palette', paletteId)
    window.dispatchEvent(new CustomEvent('color-palette-changed', { detail: paletteId }))
  }

  const handleResetAll = () => {
    setIsResetting(true)
    localStorage.clear()
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-modrinth-dark border border-gray-800 rounded-2xl"></div>
        <div className="h-96 bg-modrinth-dark border border-gray-800 rounded-2xl"></div>
      </div>
    )
  }

  return (
    <>
      <SettingsMobileMenu />
      <div className="flex flex-col lg:flex-row gap-6">
      <SettingsNav />
      <div className="flex-1 min-w-0 space-y-6">
      <section id="settings-color-theme" className="universal-card settings-section" aria-labelledby="color-theme-heading">
        <h2 id="color-theme-heading" className="text-xl font-bold text-white mb-1">Цветовая тема</h2>
        <p className="text-gray-400 mb-6 text-xs md:text-sm">Выберите предпочтительную цветовую тему для ModrinthProxy на этом устройстве.</p>
        
        <div className="theme-options">
          <button
            onClick={() => setTheme('system')}
            className={`preview-radio ${theme === 'system' ? 'selected' : ''}`}
            aria-label="Системная (Авто) тема"
          >
            <div className="preview system-mode">
              <div className="example-card">
                <div className="example-icon" />
                <div className="example-text-1" />
                <div className="example-text-2" />
              </div>
            </div>
            <div className="label">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="radio shrink-0">
                {theme === 'system' ? (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="5" fill="currentColor" />
                  </>
                ) : (
                  <circle cx="12" cy="12" r="10" />
                )}
              </svg>
              Системная (Авто)
            </div>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`preview-radio ${theme === 'light' ? 'selected' : ''}`}
            aria-label="Светлая тема"
          >
            <div className="preview light-mode">
              <div className="example-card">
                <div className="example-icon" />
                <div className="example-text-1" />
                <div className="example-text-2" />
              </div>
            </div>
            <div className="label">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="radio shrink-0">
                {theme === 'light' ? (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="5" fill="currentColor" />
                  </>
                ) : (
                  <circle cx="12" cy="12" r="10" />
                )}
              </svg>
              Светлая
            </div>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`preview-radio ${theme === 'dark' ? 'selected' : ''}`}
            aria-label="Тёмная тема"
          >
            <div className="preview dark-mode">
              <div className="example-card">
                <div className="example-icon" />
                <div className="example-text-1" />
                <div className="example-text-2" />
              </div>
            </div>
            <div className="label">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="radio shrink-0">
                {theme === 'dark' ? (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="5" fill="currentColor" />
                  </>
                ) : (
                  <circle cx="12" cy="12" r="10" />
                )}
              </svg>
              Тёмная
            </div>
          </button>
        </div>
      </section>

      <section id="settings-color-palette" className="universal-card settings-section" aria-labelledby="color-palette-heading">
        <h2 id="color-palette-heading" className="text-xl font-bold text-white mb-1">Акцентный цвет</h2>
        <p className="text-gray-400 mb-6 text-xs md:text-sm">
          Цветовая часть айдентики — кнопки, ссылки, подсветка. Не весь образ сайта, только палитра.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {Object.values(PALETTES).map((palette, index) => {
            const isSelected = activePalette === palette.id
            return (
              <button
                key={palette.id}
                onClick={() => handlePaletteChange(palette.id)}
                className={`preview-radio ${isSelected ? 'selected' : ''} w-[calc(50%-8px)] sm:w-[180px] lg:w-[190px]`}
                style={{
                  borderColor: isSelected ? palette.variables['--color-green'] : undefined,
                  boxShadow: isSelected ? `0 0 12px rgba(${palette.variables['--color-green-rgb']}, 0.12)` : undefined
                }}
              >
                <div className="preview">
                  <div 
                    className="example-card flex flex-col gap-1.5 p-2 rounded-lg border transition-all duration-300"
                    style={{
                      width: '7rem',
                      height: '4.5rem',
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: isSelected ? palette.variables['--color-green'] : 'var(--border-color)'
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: palette.variables['--color-green'] }} 
                      />
                      <div className="w-10 h-1 bg-gray-500/30 rounded-sm shrink-0" />
                    </div>
                    <div className="flex-1 rounded border border-gray-700/20 bg-gray-800/10 p-1 flex flex-col justify-between">
                      <div className="w-12 h-1 bg-gray-500/20 rounded-sm" />
                      <div 
                        className="w-full h-2.5 rounded-sm" 
                        style={{ 
                          background: `linear-gradient(135deg, ${palette.variables['--color-green']}, ${palette.variables['--color-green-light']})` 
                        }} 
                      />
                    </div>
                  </div>
                </div>
                <div className="label">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    className="radio shrink-0"
                    style={{ color: isSelected ? palette.variables['--color-green'] : undefined }}
                  >
                    {isSelected ? (
                      <>
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="5" fill="currentColor" />
                      </>
                    ) : (
                      <circle cx="12" cy="12" r="10" />
                    )}
                  </svg>
                  <span className="truncate">{palette.name}</span>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section id="settings-features" className="universal-card settings-section" aria-labelledby="toggle-features-heading">
        <h2 id="toggle-features-heading" className="text-xl font-bold text-white mb-1">Настройка функций</h2>
        <p className="text-gray-400 mb-6 text-xs md:text-sm">Включение или отключение определенных функций на этом устройстве.</p>
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-row flex-wrap items-center justify-between gap-4">
            <label htmlFor="advanced-rendering" className="flex-1 cursor-pointer select-none">
              <span className="block font-semibold text-white text-sm md:text-base">Визуальные эффекты</span>
              <span className="text-gray-400 text-xs md:text-sm">Включает размытие меню и фоновые изображения на страницах проектов. Отключите для ускорения работы сайта на слабых устройствах.</span>
            </label>
            <StyledTooltip label={toggles['advanced-rendering'] ? 'Включено' : 'Выключено'}>
              <button
                id="advanced-rendering"
                type="button"
                role="switch"
                aria-checked={toggles['advanced-rendering']}
                onClick={() => handleToggle('advanced-rendering')}
                className={`group inline-flex shrink-0 items-center rounded-full m-0 p-[2px] transition-all duration-200 cursor-pointer h-6 !w-[48px] border-2 border-transparent ${toggles['advanced-rendering'] ? 'switch-active-bg' : 'bg-[#b8bfc9] dark:bg-[#404959]'}`}
              >
                <span className={`rounded-full transition-all duration-200 w-4 h-4 ${
                  toggles['advanced-rendering'] 
                    ? 'translate-x-[24px] bg-modrinth-green group-hover:w-[18px] group-hover:h-[18px] group-hover:m-[-1px] group-active:w-[14px] group-active:h-[14px] group-active:m-[1px]' 
                    : 'translate-x-0 bg-white dark:bg-[#a1a1aa] group-hover:w-[18px] group-hover:h-[18px] group-hover:m-[-1px] group-active:w-[14px] group-active:h-[14px] group-active:m-[1px]'
                }`} />
              </button>
            </StyledTooltip>
          </div>


          <div className="flex flex-row flex-wrap items-center justify-between gap-4">
            <label htmlFor="search-layout-toggle" className="flex-1 cursor-pointer select-none">
              <span className="block font-semibold text-white text-sm md:text-base">Панель фильтров поиска справа</span>
              <span className="text-gray-400 text-xs md:text-sm">Отображать боковую панель фильтров справа от результатов поиска.</span>
            </label>
            <StyledTooltip label={toggles['search-sidebar-right'] ? 'Включено' : 'Выключено'}>
              <button
                id="search-layout-toggle"
                type="button"
                role="switch"
                aria-checked={toggles['search-sidebar-right']}
                onClick={() => handleToggle('search-sidebar-right')}
                className={`group inline-flex shrink-0 items-center rounded-full m-0 p-[2px] transition-all duration-200 cursor-pointer h-6 !w-[48px] border-2 border-transparent ${toggles['search-sidebar-right'] ? 'switch-active-bg' : 'bg-[#b8bfc9] dark:bg-[#404959]'}`}
              >
                <span className={`rounded-full transition-all duration-200 w-4 h-4 ${
                  toggles['search-sidebar-right'] 
                    ? 'translate-x-[24px] bg-modrinth-green group-hover:w-[18px] group-hover:h-[18px] group-hover:m-[-1px] group-active:w-[14px] group-active:h-[14px] group-active:m-[1px]' 
                    : 'translate-x-0 bg-white dark:bg-[#a1a1aa] group-hover:w-[18px] group-hover:h-[18px] group-hover:m-[-1px] group-active:w-[14px] group-active:h-[14px] group-active:m-[1px]'
                }`} />
              </button>
            </StyledTooltip>
          </div>

          <div className="flex flex-row flex-wrap items-center justify-between gap-4">
            <label htmlFor="project-layout-toggle" className="flex-1 cursor-pointer select-none">
              <span className="block font-semibold text-white text-sm md:text-base">Боковая панель контента слева</span>
              <span className="text-gray-400 text-xs md:text-sm">Отображать боковую панель слева от основного описания проекта.</span>
            </label>
            <StyledTooltip label={toggles['project-sidebar-left'] ? 'Включено' : 'Выключено'}>
              <button
                id="project-layout-toggle"
                type="button"
                role="switch"
                aria-checked={toggles['project-sidebar-left']}
                onClick={() => handleToggle('project-sidebar-left')}
                className={`group inline-flex shrink-0 items-center rounded-full m-0 p-[2px] transition-all duration-200 cursor-pointer h-6 !w-[48px] border-2 border-transparent ${toggles['project-sidebar-left'] ? 'switch-active-bg' : 'bg-[#b8bfc9] dark:bg-[#404959]'}`}
              >
                <span className={`rounded-full transition-all duration-200 w-4 h-4 ${
                  toggles['project-sidebar-left'] 
                    ? 'translate-x-[24px] bg-modrinth-green group-hover:w-[18px] group-hover:h-[18px] group-hover:m-[-1px] group-active:w-[14px] group-active:h-[14px] group-active:m-[1px]' 
                    : 'translate-x-0 bg-white dark:bg-[#a1a1aa] group-hover:w-[18px] group-hover:h-[18px] group-hover:m-[-1px] group-active:w-[14px] group-active:h-[14px] group-active:m-[1px]'
                }`} />
              </button>
            </StyledTooltip>
          </div>

          <div className="flex flex-row flex-wrap items-center justify-between gap-4">
            <label htmlFor="show-disclaimer-badge-toggle" className="flex-1 cursor-pointer select-none">
              <span className="block font-semibold text-white text-sm md:text-base">Дисклеймер неофициального сайта</span>
              <span className="text-gray-400 text-xs md:text-sm">Отображать плашку «Unofficial site, not affiliated with modrinth.com» вверху страниц. <span className="block mt-1 text-amber-500/80 font-medium">(Включено по умолчанию по запросу Modrinth)</span></span>
            </label>
            <StyledTooltip label={toggles['show-disclaimer-badge'] ? 'Включено' : 'Выключено'}>
              <button
                id="show-disclaimer-badge-toggle"
                type="button"
                role="switch"
                aria-checked={toggles['show-disclaimer-badge']}
                onClick={() => handleToggle('show-disclaimer-badge')}
                className={`group inline-flex shrink-0 items-center rounded-full m-0 p-[2px] transition-all duration-200 cursor-pointer h-6 !w-[48px] border-2 border-transparent ${toggles['show-disclaimer-badge'] ? 'switch-active-bg' : 'bg-[#b8bfc9] dark:bg-[#404959]'}`}
              >
                <span className={`rounded-full transition-all duration-200 w-4 h-4 ${
                  toggles['show-disclaimer-badge'] 
                    ? 'translate-x-[24px] bg-modrinth-green group-hover:w-[18px] group-hover:h-[18px] group-hover:m-[-1px] group-active:w-[14px] group-active:h-[14px] group-active:m-[1px]' 
                    : 'translate-x-0 bg-white dark:bg-[#a1a1aa] group-hover:w-[18px] group-hover:h-[18px] group-hover:m-[-1px] group-active:w-[14px] group-active:h-[14px] group-active:m-[1px]'
                }`} />
              </button>
            </StyledTooltip>
          </div>

          <div className="flex flex-row flex-wrap items-center justify-between gap-4">
            <label htmlFor="hide-project-activity-graph-toggle" className="flex-1 cursor-pointer select-none">
              <span className="block font-semibold text-white text-sm md:text-base">Выключить график активности на странице проектов</span>
              <span className="text-gray-400 text-xs md:text-sm">Скрывает фоновый график релизов в шапке страниц модов, плагинов и других проектов.</span>
            </label>
            <StyledTooltip label={toggles['hide-project-activity-graph'] ? 'Выключено' : 'Включено'}>
              <button
                id="hide-project-activity-graph-toggle"
                type="button"
                role="switch"
                aria-checked={toggles['hide-project-activity-graph']}
                onClick={() => handleToggle('hide-project-activity-graph')}
                className={`group inline-flex shrink-0 items-center rounded-full m-0 p-[2px] transition-all duration-200 cursor-pointer h-6 !w-[48px] border-2 border-transparent ${toggles['hide-project-activity-graph'] ? 'switch-active-bg' : 'bg-[#b8bfc9] dark:bg-[#404959]'}`}
              >
                <span className={`rounded-full transition-all duration-200 w-4 h-4 ${
                  toggles['hide-project-activity-graph']
                    ? 'translate-x-[24px] bg-modrinth-green group-hover:w-[18px] group-hover:h-[18px] group-hover:m-[-1px] group-active:w-[14px] group-active:h-[14px] group-active:m-[1px]'
                    : 'translate-x-0 bg-white dark:bg-[#a1a1aa] group-hover:w-[18px] group-hover:h-[18px] group-hover:m-[-1px] group-active:w-[14px] group-active:h-[14px] group-active:m-[1px]'
                }`} />
              </button>
            </StyledTooltip>
          </div>
        </div>
      </section>

      <section id="settings-project-layouts" className="universal-card settings-section" aria-labelledby="project-layouts-heading">
        <h2 id="project-layouts-heading" className="text-xl font-bold text-white mb-1">Отображение списков проектов</h2>
        <p className="text-gray-400 mb-6 text-xs md:text-sm">Выберите предпочтительный вид отображения списков проектов для каждой страницы на этом устройстве.</p>
        
        <div className="project-lists">
          {LAYOUT_CATEGORIES.map((cat) => {
            const currentMode = layouts[cat.id] || 'rows'
            return (
              <div key={cat.id} className="flex flex-col gap-2">
                <div className="text-sm font-semibold text-white">{cat.name}</div>
                <div className="project-list-layouts">
                  <button
                    onClick={() => handleLayoutChange(cat.id, 'rows')}
                    className={`preview-radio ${currentMode === 'rows' ? 'selected' : ''}`}
                    aria-label={`Вид списка для ${cat.name}`}
                  >
                    <div className="preview">
                      <div className="layout-list-mode">
                        <div className="example-card" />
                        <div className="example-card" />
                        <div className="example-card" />
                        <div className="example-card" />
                      </div>
                    </div>
                    <div className="label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="radio shrink-0">
                        {currentMode === 'rows' ? (
                          <>
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="5" fill="currentColor" />
                          </>
                        ) : (
                          <circle cx="12" cy="12" r="10" />
                        )}
                      </svg>
                      Список
                    </div>
                  </button>

                  <button
                    onClick={() => handleLayoutChange(cat.id, 'grid')}
                    className={`preview-radio ${currentMode === 'grid' ? 'selected' : ''}`}
                    aria-label={`Вид сетки для ${cat.name}`}
                  >
                    <div className="preview">
                      <div className="layout-gallery-mode">
                        <div className="example-card" />
                        <div className="example-card" />
                        <div className="example-card" />
                        <div className="example-card" />
                      </div>
                    </div>
                    <div className="label">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="radio shrink-0">
                        {currentMode === 'grid' ? (
                          <>
                            <circle cx="12" cy="12" r="10" />
                            <circle cx="12" cy="12" r="5" fill="currentColor" />
                          </>
                        ) : (
                          <circle cx="12" cy="12" r="10" />
                        )}
                      </svg>
                      Сетка
                    </div>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="universal-card text-center flex flex-col items-center justify-center p-6 gap-3" aria-labelledby="reset-heading">
        <h2 id="reset-heading" className="text-lg font-bold text-white mb-0">Что-то пошло не так?</h2>
        <p className="text-gray-400 text-xs md:text-sm max-w-md m-0">Если интерфейс отображается некорректно или вы просто хотите вернуть настройки по умолчанию.</p>
        
        <button
          onClick={handleResetAll}
          disabled={isResetting}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="px-5 py-2.5 bg-gradient-to-r from-modrinth-green/15 to-modrinth-green-light/15 hover:from-modrinth-green/25 hover:to-modrinth-green-light/25 dark:from-modrinth-green/20 dark:to-modrinth-green-light/20 dark:hover:from-modrinth-green/30 dark:hover:to-modrinth-green-light/30 text-modrinth-green hover:brightness-110 font-bold rounded-xl text-sm transition-all duration-500 ease-in-out flex items-center gap-2.5 hover:shadow-[0_0_15px_rgba(var(--color-green-rgb),0.35)] dark:hover:shadow-[0_0_15px_rgba(var(--color-green-rgb),0.25)] active:scale-[0.97] cursor-pointer disabled:opacity-50 select-none"
        >
          {isResetting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-modrinth-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Сбрасываем...</span>
            </>
          ) : (
            <>
              <div className="w-5 h-5 flex-shrink-0">
                <Lottie
                  lottieRef={lottieRef}
                  animationData={fixAnimation}
                  loop={true}
                  autoplay={false}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <span>Сбросить настройки</span>
            </>
          )}
        </button>
      </section>
      </div>
    </div>
    </>
  )
}
