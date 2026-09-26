import { intlLocale } from './config'

export function pluralCount(locale, n, one, few, many) {
  if (locale !== 'ru') return n === 1 ? one : many
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

export function labeled(t, key, fallback) {
  const value = t(key)
  if (!value || value === key) return fallback ?? ''
  return value
}

export function categoryLabel(t, id, fallback) {
  return labeled(t, `cat.${id}`, fallback || id)
}

export function serverRegionLabel(t, id, fallback) {
  if (!id) return fallback || ''
  return labeled(t, `server.region.${String(id).toLowerCase()}`, fallback || id)
}

export function languageDisplayName(locale, code) {
  if (!code) return ''
  const id = String(code).replace('_', '-')
  try {
    const name = new Intl.DisplayNames([intlLocale(locale), locale], { type: 'language' }).of(id)
    if (name && name !== id) return name
  } catch {}
  try {
    const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(id)
    if (name && name !== id) return name
  } catch {}
  return id
}

const TYPE_NAV = {
  mod: 'nav.mods',
  plugin: 'nav.plugins',
  modpack: 'nav.modpacks',
  resourcepack: 'nav.resourcepacks',
  shader: 'nav.shaders',
  datapack: 'nav.datapacks',
  minecraft_java_server: 'nav.servers',
}

export function projectTypeLabel(t, type, fallback) {
  const key = TYPE_NAV[type]
  return key ? t(key) : fallback || type
}
