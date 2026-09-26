import { cookies, headers } from 'next/headers'
import { LOCALE_COOKIE } from './config'
import { resolveLocale } from './resolveLocale'
import { getMessage, translate } from './translate'

export function getRequestLocale() {
  return resolveLocale(
    cookies().get(LOCALE_COOKIE)?.value,
    headers().get('accept-language'),
  )
}

export function getRequestT() {
  const locale = getRequestLocale()
  return {
    locale,
    t: (key, vars) => translate(locale, key, vars),
    m: (key) => getMessage(locale, key),
  }
}
