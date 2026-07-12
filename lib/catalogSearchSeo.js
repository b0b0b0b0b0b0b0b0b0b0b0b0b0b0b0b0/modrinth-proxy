import { searchMods } from './modrinth'

const SITE_SUFFIX = 'ModrinthProxy'
const SITE_ORIGIN = 'https://modrinth.black'

export const CATALOG_SEO = {
  mods: {
    facet: [['project_type:mod']],
    label: 'Моды',
    prepositional: 'модах',
    noun: { one: 'мод', few: 'мода', many: 'модов' },
    titleDefault: 'Моды для Minecraft — скачать бесплатно',
    descDefault:
      'Скачать моды для Minecraft на русском языке. Fabric, Forge, NeoForge, Quilt. Тысячи модификаций для любой версии Minecraft.',
    tech: 'Fabric, Forge, NeoForge, Quilt',
  },
  plugins: {
    facet: [['project_type:plugin']],
    label: 'Плагины',
    prepositional: 'плагинах',
    noun: { one: 'плагин', few: 'плагина', many: 'плагинов' },
    titleDefault: 'Плагины для Minecraft — скачать бесплатно',
    descDefault:
      'Скачать плагины для Minecraft серверов. Bukkit, Spigot, Paper, Purpur, Folia. Тысячи плагинов для любой версии Minecraft.',
    tech: 'Bukkit, Spigot, Paper, Purpur, Folia',
  },
  shaders: {
    facet: [['project_type:shader']],
    label: 'Шейдеры',
    prepositional: 'шейдерах',
    noun: { one: 'шейдер', few: 'шейдера', many: 'шейдеров' },
    titleDefault: 'Шейдеры для Minecraft — скачать бесплатно',
    descDefault:
      'Скачать шейдеры для Minecraft. Iris, OptiFine, Canvas. Реалистичная графика, тени и отражения для любой версии Minecraft.',
    tech: 'Iris, OptiFine, Canvas',
  },
  resourcepacks: {
    facet: [['project_type:resourcepack']],
    label: 'Ресурспаки',
    prepositional: 'ресурспаках',
    noun: { one: 'ресурспак', few: 'ресурспака', many: 'ресурспаков' },
    titleDefault: 'Ресурспаки для Minecraft — скачать бесплатно',
    descDefault:
      'Скачать ресурспаки для Minecraft. Текстуры, модели, звуки. Реалистичные, мультяшные и HD-паки для любой версии.',
    tech: 'текстуры, модели, звуки',
  },
  datapacks: {
    facet: [['project_type:datapack']],
    label: 'Датапаки',
    prepositional: 'датапаках',
    noun: { one: 'датапак', few: 'датапака', many: 'датапаков' },
    titleDefault: 'Датапаки для Minecraft — скачать бесплатно',
    descDefault:
      'Скачать датапаки для Minecraft. Новые механики, миры и приключения. Тысячи датапаков для любой версии Minecraft.',
    tech: 'новые механики, миры, приключения',
  },
  modpacks: {
    facet: [['project_type:modpack']],
    label: 'Модпаки',
    prepositional: 'модпаках',
    noun: { one: 'модпак', few: 'модпака', many: 'модпаков' },
    titleDefault: 'Модпаки для Minecraft — скачать бесплатно',
    descDefault:
      'Скачать модпаки для Minecraft. Готовые сборки с модами для Fabric, Forge, NeoForge и Quilt.',
    tech: 'Fabric, Forge, NeoForge, Quilt',
  },
}

function pluralizeRu(count, one, few, many) {
  const n = Math.abs(count) % 100
  const n1 = n % 10
  if (n > 10 && n < 20) return many
  if (n1 > 1 && n1 < 5) return few
  if (n1 === 1) return one
  return many
}

function formatCountLabel(count, noun) {
  return `${count.toLocaleString('ru-RU')} ${pluralizeRu(count, noun.one, noun.few, noun.many)}`
}

function pickQuery(searchParams) {
  return typeof searchParams?.q === 'string' ? searchParams.q.trim() : ''
}

function pickVersion(searchParams) {
  return typeof searchParams?.v === 'string' ? searchParams.v.trim() : ''
}

function pickPage(searchParams) {
  return Math.max(1, parseInt(String(searchParams?.page || '1'), 10) || 1)
}

function buildPageSuffix(page) {
  return page > 1 ? ` — стр. ${page}` : ''
}

function buildSearchPhraseTitle(config, query, version) {
  const phrase = query?.trim()
  if (!phrase) return config.titleDefault
  if (version) {
    return `${config.label} Minecraft — Поиск по фразе «${phrase}», ${version}`
  }
  return `${config.label} Minecraft — Поиск по фразе «${phrase}»`
}

function buildCatalogTitle(config, { query, version, page }) {
  if (query) {
    return `${buildSearchPhraseTitle(config, query, version)}${buildPageSuffix(page)} | ${SITE_SUFFIX}`
  }

  if (version) {
    return `${config.label} для Minecraft ${version}${buildPageSuffix(page)} | ${SITE_SUFFIX}`
  }

  return `${config.titleDefault}${buildPageSuffix(page)} | ${SITE_SUFFIX}`
}

function buildCatalogDescription(config, { query, version, totalHits }) {
  if (query) {
    const kind = config.label.toLowerCase()
    let text = ''
    if (typeof totalHits === 'number' && totalHits > 0) {
      text = `В каталоге ${formatCountLabel(totalHits, config.noun)} по запросу ${query}. `
    } else {
      text = `Каталог ${kind} для Minecraft по запросу ${query}. `
    }
    text += `Скачать бесплатно — ${config.tech}.`
    if (version) {
      text += ` Версия ${version}.`
    }
    return text
  }

  if (version) {
    return `${config.label} для Minecraft ${version}. ${config.descDefault}`
  }

  return config.descDefault
}

function appendSearchParams(params, searchParams) {
  const query = pickQuery(searchParams)
  const version = pickVersion(searchParams)
  const page = pickPage(searchParams)

  if (query) params.set('q', query)
  if (version) params.set('v', version)
  if (page > 1) params.set('page', String(page))

  const sort = searchParams?.sort
  if (sort && sort !== 'relevance') params.set('sort', sort)

  return params
}

export function buildCatalogCanonicalUrl(basePath, searchParams) {
  const params = appendSearchParams(new URLSearchParams(), searchParams)
  const qs = params.toString()
  const path = basePath.startsWith('/') ? basePath : `/${basePath}`
  return `${SITE_ORIGIN}${path}${qs ? `?${qs}` : ''}`
}

async function fetchSearchTotalHits(config, query, version) {
  const facets = [...config.facet]
  if (version) {
    facets.push([`versions:${version}`])
  }

  const data = await searchMods({
    query,
    facets,
    limit: 1,
    offset: 0,
    nextRevalidate: 3600,
  })

  return typeof data?.total_hits === 'number' ? data.total_hits : null
}

export async function buildCatalogSearchMetadata(catalogKey, searchParams = {}, { basePath } = {}) {
  const config = CATALOG_SEO[catalogKey]
  if (!config) {
    throw new Error(`Unknown catalog SEO key: ${catalogKey}`)
  }

  const query = pickQuery(searchParams)
  const version = pickVersion(searchParams)
  const page = pickPage(searchParams)
  const title = buildCatalogTitle(config, { query, version, page })
  let description = buildCatalogDescription(config, { query, version, totalHits: null })

  if (query) {
    try {
      const totalHits = await fetchSearchTotalHits(config, query, version)
      description = buildCatalogDescription(config, { query, version, totalHits })
    } catch {
    }
  }

  const canonical = basePath ? buildCatalogCanonicalUrl(basePath, searchParams) : undefined

  return {
    title,
    description,
    robots: 'all',
    openGraph: {
      siteName: 'modrinth.black',
      type: 'website',
      title,
      description,
      ...(canonical ? { url: canonical } : {}),
    },
    ...(canonical ? { alternates: { canonical } } : {}),
  }
}
