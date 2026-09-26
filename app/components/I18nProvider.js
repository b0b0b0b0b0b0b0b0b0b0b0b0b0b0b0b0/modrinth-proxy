'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { LOCALE_COOKIE, DEFAULT_LOCALE, isEnabledLocale } from '@/lib/i18n/config'
import { getMessage, translate } from '@/lib/i18n/translate'

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
  m: () => undefined,
})

function writeLocaleCookie(locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`
}

export function I18nProvider({ locale: initialLocale, children }) {
  const [locale, setLocaleState] = useState(
    isEnabledLocale(initialLocale) ? initialLocale : DEFAULT_LOCALE,
  )

  useEffect(() => {
    document.documentElement.lang = locale
    writeLocaleCookie(locale)
  }, [locale])

  const setLocale = useCallback((next) => {
    if (!isEnabledLocale(next)) return
    setLocaleState(next)
  }, [])

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
