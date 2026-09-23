import { appendDisclosureExclusionParams } from '@/lib/disclosureExclusions'
import {
  appendOpenSourceParams,
  isServersPath,
  loadStoredOpenSource,
  parseOpenSourceFilter,
} from '@/lib/openSourceFilter'

export function withCatalogDiscoveryQuery(href, searchParams) {
  const path = String(href || '').split('?')[0]
  if (!/(?:^|\/)(mods|resourcepacks|datapacks|shaders|modpacks|plugins|servers)\/?$/.test(path)) {
    return path
  }
  const params = new URLSearchParams()
  appendDisclosureExclusionParams(params, searchParams)
  if (!isServersPath(path)) {
    const fromUrl = parseOpenSourceFilter(searchParams)
    appendOpenSourceParams(params, fromUrl === 'none' ? loadStoredOpenSource() : fromUrl, path)
  }
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}
