import { intlLocale } from './config'
import { pluralize } from './pluralize'

export function pluralCount(locale, n, one, few, many) {
  return pluralize(n, locale, one, few, many)
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
