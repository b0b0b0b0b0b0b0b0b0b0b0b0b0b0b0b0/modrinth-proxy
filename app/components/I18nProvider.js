'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DEFAULT_LOCALE, isEnabledLocale } from '@/lib/i18n/config'
import { getMessage, translate } from '@/lib/i18n/translate'
import { readSharedLocale, writeSharedLocale } from '@/lib/i18n/sharedLocale'

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
  m: () => undefined,
})

function writeLocaleCookie(locale) {
  writeSharedLocale(locale)
}

export function I18nProvider({ locale: initialLocale, children }) {
  const router = useRouter()
  const [locale, setLocaleState] = useState(
    isEnabledLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE,
  )

  useEffect(() => {
    document.documentElement.lang = locale
    writeLocaleCookie(locale)
  }, [locale])

  useEffect(() => {
    const adopt = () => {
      const shared = readSharedLocale()
      if (shared && shared !== locale && isEnabledLocale(shared)) {
        setLocaleState(shared)
        router.refresh()
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') adopt()
    }
    window.addEventListener('focus', adopt)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', adopt)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [locale, router])

  const setLocale = useCallback((next) => {
    if (!isEnabledLocale(next)) return
    writeLocaleCookie(next)
    setLocaleState(next)
    router.refresh()
  }, [router])

  const t = useCallback((key, vars) => translate(locale, key, vars), [locale])
  const m = useCallback((key) => getMessage(locale, key), [locale])

  const value = useMemo(() => ({ locale, setLocale, t, m }), [locale, setLocale, t, m])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

export function useT() {
  return useI18n().t
}

export function useMessage(key) {
  return useI18n().m(key)
}
