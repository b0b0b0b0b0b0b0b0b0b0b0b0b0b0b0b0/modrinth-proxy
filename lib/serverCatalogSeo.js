import { getServerCategoryName } from '@/lib/serverCategories'

export const SERVER_SEO_MAX_CATEGORIES = 2

const SITE_SUFFIX = 'ModrinthProxy'

const SERVER_SEO_PRIORITY = {
  pokemon: 100,
  anarchy: 95,
  'vanilla-like': 92,
  smp: 90,
  skyblock: 88,
  prison: 86,
  rpg: 85,
  bosses: 84,
  dungeons: 83,
  lifesteal: 82,
  bedwars: 81,
  kitpvp: 80,
  factions: 79,
  economy: 78,
  questing: 77,
  plots: 76,
  'custom-content': 75,
  op: 74,
  'offline-mode': 73,
  'pvp-pve': 70,
  'vanilla-modpack': 68,
  pvp: 55,
  pve: 55,
}

export const SERVER_CONTENT_TYPE_SEO = {
  vanilla: {
    titleAlone: 'Играть на ванильном сервере майнкрафт',
    titleJoin: 'ванильные',
    desc: 'ванильные сервера без модпаков и тяжёлых модов',
    pattern: 'play',
  },
  modpack: {
    titleAlone: 'Играть на сервере майнкрафт с модами',
    titleJoin: 'с модами',
    desc: 'серверы с модпаками и модовыми сборками',
    pattern: 'play',
  },
}

export const SERVER_CONTENT_TYPE_COMBO_SEO = {
  'vanilla-modpack': {
    titleAlone: 'Сервера майнкрафт с модами и без модов',
    titleJoin: 'с модами и без модов',
    desc: 'серверы с модпаками и ванильные серверы без модов',
    pattern: 'standalone',
  },
}

export const SERVER_CATEGORY_COMBO_SEO = {
  'pvp-pve': {
    titleAlone: 'PvP и PvE сервера майнкрафт',
    titleJoin: 'PvP и PvE',
    desc: 'серверы PvP и PvE — бои с игроками и против мобов',
    pattern: 'label',
  },
}

export const SERVER_CATEGORY_SEO = {
  'type-vanilla': {
    titleAlone: 'Ванильные сервера майнкрафт',
    titleJoin: 'ванильным геймплеем',
    desc: 'ванильные сервера майнкрафт без тяжёлых модов',
    pattern: 'standalone',
  },
  'type-modded': {
    titleAlone: 'Модовые сервера майнкрафт',
    titleJoin: 'модовой сборкой',
    desc: 'модовые сервера майнкрафт с кастомным контентом',
    pattern: 'standalone',
  },

  pokemon: {
    titleAlone: 'Серверы майнкрафт с покемонами',
    titleJoin: 'с покемонами',
    desc: 'серверы с покемонами и Cobblemon-подобным геймплеем',
    pattern: 'with',
  },
  bosses: {
    titleAlone: 'Серверы майнкрафт с боссами',
    titleJoin: 'боссами',
    desc: 'серверы с боссами и PvE-сражениями',
    pattern: 'with',
  },
  questing: {
    titleAlone: 'Серверы майнкрафт с квестами',
    titleJoin: 'квестами',
    desc: 'серверы с сюжетными и побочными квестами',
    pattern: 'with',
  },
  classes: {
    titleAlone: 'Серверы майнкрафт с классами',
    titleJoin: 'классами персонажей',
    desc: 'серверы с системой классов и прокачки',
    pattern: 'with',
  },
  teams: {
    titleAlone: 'Серверы майнкрафт с командами',
    titleJoin: 'командным геймплеем',
    desc: 'серверы с упором на игру в команде',
    pattern: 'with',
  },
  'personal-worlds': {
    titleAlone: 'Серверы майнкрафт с личными мирами',
    titleJoin: 'личными мирами',
    desc: 'серверы с приватными и личными мирами игроков',
    pattern: 'with',
  },
  media: {
    titleAlone: 'Серверы майнкрафт для медиа',
    titleJoin: 'медиа-контентом',
    desc: 'серверы для стримеров и съёмки контента',
    pattern: 'with',
  },
  op: {
    titleAlone: 'Сервера майнкрафт с мощными предметами',
    titleJoin: 'мощными предметами',
    desc: 'серверы с усиленным лутом и OP-предметами',
    pattern: 'with',
  },
  'custom-content': {
    titleAlone: 'Сервера майнкрафт с новым контентом',
    titleJoin: 'новым контентом',
    desc: 'серверы с уникальными модами и дополнениями',
    pattern: 'with',
  },
  dungeons: {
    titleAlone: 'Сервера майнкрафт с данжами',
    titleJoin: 'данжами',
    desc: 'серверы с подземельями и PvE-данжами',
    pattern: 'with',
  },
  plots: {
    titleAlone: 'Сервера майнкрафт с участками',
    titleJoin: 'участками',
    desc: 'серверы с plot-системой и зонами под стройку',
    pattern: 'with',
  },
  economy: {
    titleAlone: 'Сервера майнкрафт с экономикой',
    titleJoin: 'экономикой',
    desc: 'серверы с торговлей, валютой и аукционами',
    pattern: 'with',
  },
  pve: {
    titleAlone: 'Сервера майнкрафт с PvE (игрок против мобов)',
    titleJoin: 'PvE',
    desc: 'PvE — игрок против мобов, без упора на PvP',
    pattern: 'label',
  },
  pvp: {
    titleAlone: 'PvP сервера майнкрафт',
    titleJoin: 'PvP',
    desc: 'PvP сервера с боями между игроками',
    pattern: 'label',
  },

  anarchy: {
    titleAlone: 'Серверы майнкрафт с режимом анархия',
    titleJoin: 'с режимом анархия',
    desc: 'анархия-серверы без правил и защиты',
    pattern: 'mode',
  },
  'vanilla-like': {
    titleAlone: 'Ванильные сервера майнкрафт',
    titleJoin: 'ванильным стилем игры',
    desc: 'ванильные сервера, близкие к оригинальному майнкрафт',
    pattern: 'standalone',
  },
  oneblock: {
    titleAlone: 'OneBlock сервера майнкрафт',
    titleJoin: 'режимом OneBlock',
    desc: 'серверы с выживанием на одном блоке',
    pattern: 'mode',
  },
  racing: {
    titleAlone: 'Серверы майнкрафт с гонками',
    titleJoin: 'гонками',
    desc: 'серверы с гоночными трассами и соревнованиями',
    pattern: 'with',
  },
  towns: {
    titleAlone: 'Серверы майнкрафт с городами',
    titleJoin: 'городами и поселениями',
    desc: 'серверы с городами, нациями и строительством',
    pattern: 'with',
  },
  'battle-royale': {
    titleAlone: 'Battle Royale сервера майнкрафт',
    titleJoin: 'королевской битвой',
    desc: 'серверы в жанре battle royale',
    pattern: 'label',
  },
  microgames: {
    titleAlone: 'Серверы майнкрафт с микроиграми',
    titleJoin: 'микроиграми',
    desc: 'серверы с быстрыми мини-сценариями',
    pattern: 'with',
  },
  minigames: {
    titleAlone: 'Мини-игровые сервера майнкрафт',
    titleJoin: 'мини-играми',
    desc: 'серверы с аркадными мини-играми',
    pattern: 'label',
  },
  parkour: {
    titleAlone: 'Паркур сервера майнкрафт',
    titleJoin: 'паркуром',
    desc: 'серверы с паркур-картами и прыжками',
    pattern: 'label',
  },
  prison: {
    titleAlone: 'Prison сервера майнкрафт',
    titleJoin: 'режимом Prison',
    desc: 'тюремные сервера с прокачкой и шахтами',
    pattern: 'mode',
  },
  factions: {
    titleAlone: 'Factions сервера майнкрафт',
    titleJoin: 'фракциями',
    desc: 'серверы с кланами и захватом территорий',
    pattern: 'label',
  },
  bedwars: {
    titleAlone: 'Bed Wars сервера майнкрафт',
    titleJoin: 'Bed Wars',
    desc: 'серверы с режимом Bed Wars',
    pattern: 'label',
  },
  gens: {
    titleAlone: 'Gens сервера майнкрафт',
    titleJoin: 'режимом Gens',
    desc: 'серверы с генераторами и фермами Gens',
    pattern: 'mode',
  },
  kitpvp: {
    titleAlone: 'Kit PvP сервера майнкрафт',
    titleJoin: 'Kit PvP',
    desc: 'серверы с наборами Kit PvP',
    pattern: 'label',
  },
  lifesteal: {
    titleAlone: 'Lifesteal сервера майнкрафт',
    titleJoin: 'режимом Lifesteal',
    desc: 'серверы с кражей сердец Lifesteal',
    pattern: 'mode',
  },
  rpg: {
    titleAlone: 'RPG сервера майнкрафт',
    titleJoin: 'RPG-прокачкой',
    desc: 'ролевые сервера с квестами и уровнями',
    pattern: 'label',
  },
  skyblock: {
    titleAlone: 'Skyblock сервера майнкрафт',
    titleJoin: 'режимом Skyblock',
    desc: 'серверы с выживанием на острове в небе',
    pattern: 'mode',
  },

  'world-resets': {
    titleAlone: 'Серверы майнкрафт с вайпами',
    titleJoin: 'регулярными вайпами',
    desc: 'серверы с периодическим сбросом мира',
    pattern: 'with',
  },
  crossplay: {
    titleAlone: 'Кроссплатформенные сервера майнкрафт',
    titleJoin: 'кроссплеем Java и Bedrock',
    desc: 'серверы с кроссплатформенным входом',
    pattern: 'label',
  },
  'offline-mode': {
    titleAlone: 'Пиратские сервера майнкрафт',
    titleJoin: 'пираткой',
    desc: 'пиратские сервера без лицензии — для нелицензионного клиента',
    pattern: 'label',
  },
  whitelisted: {
    titleAlone: 'Приватные сервера майнкрафт',
    titleJoin: 'whitelist-доступом',
    desc: 'закрытые сервера по белому списку',
    pattern: 'with',
  },
  'survival-mode': {
    titleAlone: 'Серверы майнкрафт на выживание',
    titleJoin: 'классическим выживанием',
    desc: 'серверы в режиме Survival',
    pattern: 'with',
  },
  'adventure-mode': {
    titleAlone: 'Серверы майнкрафт с приключениями',
    titleJoin: 'режимом Adventure',
    desc: 'серверы с картами и сюжетом',
    pattern: 'mode',
  },
  network: {
    titleAlone: 'Сетевые сервера майнкрафт',
    titleJoin: 'сетью мини-серверов',
    desc: 'крупные сети серверов с хабом',
    pattern: 'label',
  },
  'keep-inventory': {
    titleAlone: 'Серверы майнкрафт с сохранением инвентаря',
    titleJoin: 'сохранением инвентаря',
    desc: 'серверы, где вещи не выпадают после смерти',
    pattern: 'with',
  },
  'creative-mode': {
    titleAlone: 'Творческие сервера майнкрафт',
    titleJoin: 'Creative-режимом',
    desc: 'серверы для строительства в Creative',
    pattern: 'mode',
  },
  'hardcore-mode': {
    titleAlone: 'Хардкор сервера майнкрафт',
    titleJoin: 'режимом Hardcore',
    desc: 'хардкорные сервера с одной жизнью',
    pattern: 'mode',
  },

  smp: {
    titleAlone: 'SMP сервера майнкрафт — выживание',
    titleJoin: 'SMP и выживанием',
    desc: 'SMP сервера для совместного выживания',
    pattern: 'label',
  },
  'recording-smp': {
    titleAlone: 'SMP сервера для съёмки майнкрафт',
    titleJoin: 'SMP со съёмкой',
    desc: 'выживание для ютуберов и стримеров',
    pattern: 'with',
  },
  mmo: {
    titleAlone: 'MMO сервера майнкрафт',
    titleJoin: 'MMO-геймплеем',
    desc: 'массовые мультиплеерные сервера',
    pattern: 'label',
  },
  roleplay: {
    titleAlone: 'Ролевые сервера майнкрафт',
    titleJoin: 'ролевым отыгрышем',
    desc: 'RP сервера с сюжетом и персонажами',
    pattern: 'label',
  },
  'creator-community': {
    titleAlone: 'Серверы майнкрафт для авторов',
    titleJoin: 'сообществом авторов',
    desc: 'серверы для создателей контента',
    pattern: 'with',
  },
  competitive: {
    titleAlone: 'Соревновательные сервера майнкрафт',
    titleJoin: 'соревновательным PvP',
    desc: 'серверы для киберспорта и рейтингов',
    pattern: 'label',
  },
  social: {
    titleAlone: 'Социальные сервера майнкрафт',
    titleJoin: 'социальным геймплеем',
    desc: 'серверы для общения и друзей',
    pattern: 'with',
  },
  technical: {
    titleAlone: 'Технические сервера майнкрафт',
    titleJoin: 'техническими модами',
    desc: 'серверы для redstone и автоматизации',
    pattern: 'label',
  },
}

function fallbackCategoryEntry(id) {
  const label = getServerCategoryName(id) || id
  const lower = label.toLowerCase()
  return {
    titleAlone: `Сервера майнкрафт — ${label}`,
    titleJoin: lower,
    desc: `серверы с тегом «${label}»`,
    pattern: 'label',
  }
}

function fallbackContentTypeEntry(id) {
  return {
    titleAlone: `Сервера майнкрафт — ${id}`,
    titleJoin: id,
    desc: `серверы с типом контента «${id}»`,
    pattern: 'label',
  }
}

function getCategoryEntry(id) {
  return SERVER_CATEGORY_SEO[id] ?? fallbackCategoryEntry(id)
}

function getContentTypeEntry(id) {
  return SERVER_CONTENT_TYPE_SEO[id] ?? fallbackContentTypeEntry(id)
}

function getFacetEntry(facet) {
  if (facet.type === 'combo') {
    return (
      SERVER_CONTENT_TYPE_COMBO_SEO[facet.id] ??
      SERVER_CATEGORY_COMBO_SEO[facet.id] ??
      fallbackContentTypeEntry(facet.id)
    )
  }
  if (facet.type === 'sct') {
    return getContentTypeEntry(facet.id)
  }
  return getCategoryEntry(facet.id)
}

export function collectServerSeoFacets(scIds, sctIds) {
  const sc = [...new Set(scIds.filter(Boolean))]
  const sct = [...new Set(sctIds.filter(Boolean))]
  const facets = []

  const hasVanilla = sct.includes('vanilla')
  const hasModpack = sct.includes('modpack')

  if (hasVanilla && hasModpack) {
    facets.push({ type: 'combo', id: 'vanilla-modpack' })
    sct
      .filter((id) => id !== 'vanilla' && id !== 'modpack')
      .forEach((id) => facets.push({ type: 'sct', id }))
  } else {
    sct.forEach((id) => facets.push({ type: 'sct', id }))
  }

  let remainingSc = sc
  if (sc.includes('pvp') && sc.includes('pve')) {
    facets.push({ type: 'combo', id: 'pvp-pve' })
    remainingSc = sc.filter((id) => id !== 'pvp' && id !== 'pve')
  }

  remainingSc.forEach((id) => facets.push({ type: 'sc', id }))

  return facets
}

function getFacetPriority(facet) {
  return SERVER_SEO_PRIORITY[facet.id] ?? 50
}

function sortFacetsBySeoPriority(facets) {
  return [...facets].sort((a, b) => getFacetPriority(b) - getFacetPriority(a))
}

function pluralizeRu(count, one, few, many) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod100 >= 11 && mod100 <= 19) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

function getFacetDisplayName(facet) {
  if (facet.type === 'combo') {
    if (facet.id === 'pvp-pve') return 'PvP и PvE'
    if (facet.id === 'vanilla-modpack') return 'моды и ванила'
    return getFacetEntry(facet).titleJoin
  }

  if (facet.type === 'sct') {
    const entry = getContentTypeEntry(facet.id)
    if (facet.id === 'vanilla') return 'ванила'
    if (facet.id === 'modpack') return 'моды'
    return entry.titleJoin.replace(/^с\s+/i, '')
  }

  const label = getServerCategoryName(facet.id)
  if (!label) return facet.id
  return label.charAt(0).toLowerCase() + label.slice(1)
}

function combineTwoFacets(seoFacets) {
  const first = getFacetEntry(seoFacets[0])
  const second = getFacetEntry(seoFacets[1])

  if (first.pattern === 'play') {
    const tail = second.titleJoin.replace(/^с\s+/i, '')
    return `${first.titleAlone} с ${tail}`
  }

  if (first.pattern === 'standalone') {
    const tail = second.titleJoin.replace(/^с\s+/i, '')
    return `${first.titleAlone} с ${tail}`
  }

  if (first.pattern === 'label' && second.pattern === 'label') {
    return `${first.titleJoin} и ${second.titleJoin} сервера майнкрафт`
  }

  if (first.pattern === 'with' && second.pattern === 'label') {
    const withPart = first.titleJoin.replace(/^с\s+/i, '')
    return `Сервера майнкрафт с ${withPart} и ${second.titleJoin}`
  }

  if (first.pattern === 'label' && second.pattern === 'with') {
    const withPart = second.titleJoin.replace(/^с\s+/i, '')
    return `Сервера майнкрафт с ${withPart} и ${first.titleJoin}`
  }

  const part1 = first.titleJoin.replace(/^с\s+/i, '')
  const part2 = second.titleJoin.replace(/^с\s+/i, '')

  if (first.pattern === 'with' && second.pattern === 'with') {
    const useAnd = part1.includes(' ') || part2.includes(' ')
    return useAnd
      ? `Сервера майнкрафт с ${part1} и ${part2}`
      : `Сервера майнкрафт с ${part1} ${part2}`
  }

  const join1 = first.titleJoin.startsWith('с ') ? first.titleJoin : `с ${first.titleJoin}`
  return `Сервера майнкрафт ${join1} ${part2}`.replace(/\s+/g, ' ').trim()
}

function applyVersionToHeading(heading, version) {
  const v = version?.trim()
  if (!v) return heading
  return `${heading} на версии ${v}`
}

function buildHeadingFromFacets(facets, totalFilterCount) {
  const sorted = sortFacetsBySeoPriority(facets)

  if (sorted.length === 0) {
    return 'Серверы майнкрафт'
  }

  if (totalFilterCount > 2) {
    const name1 = getFacetDisplayName(sorted[0])
    const name2 = getFacetDisplayName(sorted[1])
    const extra = totalFilterCount - 2
    const extraLabel = pluralizeRu(extra, 'тег', 'тега', 'тегов')
    return `Сервера майнкрафт: ${name1}, ${name2} и ещё ${extra} ${extraLabel}`
  }

  if (sorted.length === 1) {
    return getFacetEntry(sorted[0]).titleAlone
  }

  return combineTwoFacets(sorted.slice(0, 2))
}

function buildDescriptionFromFacets(facets, context) {
  const { query, version, sst, totalFilterCount = 0 } = context
  const sorted = sortFacetsBySeoPriority(facets)

  let text = ''

  const versionTrimmed = version?.trim()

  if (sorted.length === 0 && versionTrimmed) {
    text = `Сервера майнкрафт на версии ${versionTrimmed}. Выбирай проект, копируй IP и заходи играть.`
  } else if (sorted.length === 0) {
    text =
      'Каталог серверов майнкрафт для Java Edition: IP, онлайн и описание в каждой карточке — чтобы быстро найти сервер и начать играть.'
  } else if (totalFilterCount > 2) {
    const labels = sorted.slice(0, 4).map(getFacetDisplayName).join(', ')
    text = `Сервера майнкрафт: ${labels} и другие теги. Смотри онлайн, версию и IP в списке — выбери и заходи играть.`
  } else if (sorted.length === 1) {
    const name = getFacetDisplayName(sorted[0])
    text = `Сервера майнкрафт — ${name}. IP и онлайн в карточке: выбери сервер и заходи играть.`
  } else {
    const name1 = getFacetDisplayName(sorted[0])
    const name2 = getFacetDisplayName(sorted[1])
    text = `Сервера майнкрафт: ${name1} и ${name2}. Смотри IP, онлайн и версию в списке — выбери сервер и играй.`
  }

  if (sst === 'online') {
    text += ' В подборке в основном серверы, которые сейчас в сети.'
  } else if (sst === 'offline') {
    text += ' Есть и серверы вне сети — глянь статус перед входом.'
  }

  if (versionTrimmed) {
    text += ` Для Minecraft Java ${versionTrimmed}.`
  }

  if (query?.trim()) {
    text += ` По запросу ${query.trim()}.`
  }

  return text
}

export function parseServerCatalogCategories(searchParams) {
  const scParams = Array.isArray(searchParams?.sc)
    ? searchParams.sc
    : searchParams?.sc
      ? [searchParams.sc]
      : []

  const fParams = Array.isArray(searchParams?.f)
    ? searchParams.f
    : searchParams?.f
      ? [searchParams.f]
      : []

  const categories = [...scParams]

  fParams.forEach((param) => {
    try {
      const decoded = decodeURIComponent(param)
      if (decoded.includes('categories:')) {
        const value = decoded.replace('categories:', '')
        if (value && !categories.includes(value)) categories.push(value)
      }
    } catch {}
  })

  return [...new Set(categories.filter(Boolean))]
}

export function parseServerCatalogContentTypes(searchParams) {
  const sctParams = Array.isArray(searchParams?.sct)
    ? searchParams.sct
    : searchParams?.sct
      ? [searchParams.sct]
      : []

  return [...new Set(sctParams.filter(Boolean))]
}

export function buildServerCatalogSeo({ searchParams = {} }) {
  const categories = parseServerCatalogCategories(searchParams)
  const contentTypes = parseServerCatalogContentTypes(searchParams)
  const allFacets = collectServerSeoFacets(categories, contentTypes)

  const page = Math.max(1, parseInt(String(searchParams?.page || '1'), 10) || 1)
  const query = typeof searchParams?.q === 'string' ? searchParams.q : ''
  const version =
    typeof searchParams?.sgv === 'string'
      ? searchParams.sgv
      : typeof searchParams?.v === 'string'
        ? searchParams.v
        : ''
  const sst =
    searchParams?.sst === 'offline' ? 'offline' : searchParams?.sst === 'online' ? 'online' : 'online'

  const scComboDedup =
    (categories.includes('pvp') && categories.includes('pve') ? 1 : 0) +
    (contentTypes.includes('vanilla') && contentTypes.includes('modpack') ? 1 : 0)

  const totalFilterCount = categories.length + contentTypes.length - scComboDedup

  let heading = buildHeadingFromFacets(allFacets, totalFilterCount)

  if (query?.trim()) {
    heading = version
      ? `${query.trim()} — серверы майнкрафт ${version}`
      : `${query.trim()} — серверы майнкрафт`
  } else if (version) {
    heading = applyVersionToHeading(heading, version)
  }

  const description = buildDescriptionFromFacets(allFacets, {
    query,
    version,
    sst,
    totalFilterCount,
  })

  const pagePart = page > 1 ? ` (стр. ${page})` : ''
  const title = `${heading}${pagePart} | ${SITE_SUFFIX}`

  return {
    title,
    description,
    heading,
    seoFacets: sortFacetsBySeoPriority(allFacets).slice(0, SERVER_SEO_MAX_CATEGORIES),
    seoCategoryIds: categories.slice(0, SERVER_SEO_MAX_CATEGORIES),
    totalCategoryCount: categories.length,
    totalFilterCount,
  }
}
