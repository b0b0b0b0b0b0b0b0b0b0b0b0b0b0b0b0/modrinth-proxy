import { cookies, headers } from 'next/headers'
import { LOCALE_COOKIE } from './config'
import { resolveLocale } from './resolveLocale'
import { getMessage, translate } from './translate'

export async function getRequestLocale() {
  return resolveLocale(
    (await cookies()).get(LOCALE_COOKIE)?.value,
    (await headers()).get('accept-language'),
  )
}

export async function getRequestT() {
  const locale = await getRequestLocale()
  return {
    locale,
    t: (key, vars) => translate(locale, key, vars),
    m: (key) => getMessage(locale, key),
  }
}
