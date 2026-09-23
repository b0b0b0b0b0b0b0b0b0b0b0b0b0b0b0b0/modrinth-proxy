import { CATEGORIES } from '@/lib/categories'
import { 
  MOD_LOADERS,
  SHADER_LOADERS,
  MODPACK_LOADERS,
  DATAPACK_LOADERS,
  PLUGIN_LOADERS,
  PLUGIN_PLATFORMS,
  getLoaderDisplayName,
} from '@/lib/loaders'
import { RESOURCEPACK_CATEGORIES } from '@/lib/resourcepackCategories'
import { SHADER_FEATURES, SHADER_PERFORMANCE, SHADER_STYLES } from '@/lib/shaderCategories'
import { SERVER_CATEGORIES } from '@/lib/serverCategories'

const PLUGIN_CATEGORIES = CATEGORIES.filter(cat => 
  ['adventure', 'cursed', 'decoration', 'economy', 'equipment', 'food', 'game-mechanics', 'library', 'magic', 'management', 'minigame', 'mobs', 'optimization', 'social', 'storage', 'technology', 'transportation', 'utility', 'worldgen'].includes(cat.id)
)

const MOD_CATEGORIES = CATEGORIES.filter(cat =>
  ['adventure', 'cursed', 'decoration', 'economy', 'equipment', 'food', 'game-mechanics', 'library', 'magic', 'management', 'minigame', 'mobs', 'optimization', 'social', 'storage', 'technology', 'transportation', 'utility', 'worldgen'].includes(cat.id)
)

const MODPACK_CATEGORIES = CATEGORIES.filter(cat =>
  ['adventure', 'challenging', 'combat', 'kitchen-sink', 'magic', 'multiplayer', 'optimization', 'quests', 'technology', 'utility'].includes(cat.id)
)

const DATAPACK_CATEGORIES = CATEGORIES.filter(cat =>
  ['adventure', 'cursed', 'decoration', 'magic', 'optimization', 'storage', 'technology', 'transportation', 'utility', 'worldgen', 'vanilla'].includes(cat.id)
)

const SERVERS_CATEGORIES = SERVER_CATEGORIES

const RESOURCEPACK_RESOLUTIONS = [
  { id: '8x-', name: '8x или меньше' },
  { id: '16x', name: '16x' },
  { id: '32x', name: '32x' },
  { id: '48x', name: '48x' },
  { id: '64x', name: '64x' },
  { id: '128x', name: '128x' },
  { id: '256x', name: '256x' },
]

const EXTRA_CATEGORY_LABELS = [
  ...SHADER_STYLES,
  ...SHADER_FEATURES,
  ...SHADER_PERFORMANCE,
  ...RESOURCEPACK_CATEGORIES,
  ...RESOURCEPACK_RESOLUTIONS,
  ...SERVER_CATEGORIES,
]

export const FILTER_CONFIG = {
  plugins: {
    categoryPath: 'plugins',
    loaders: PLUGIN_LOADERS,
    platforms: PLUGIN_PLATFORMS,
    categories: PLUGIN_CATEGORIES,
    hasOpenSource: true,
  },
  mods: {
    categoryPath: 'mods',
    loaders: MOD_LOADERS,
    platforms: null,
    categories: MOD_CATEGORIES,
    hasOpenSource: true,
    hasEnvironment: true,
  },
  resourcepacks: {
    categoryPath: 'resourcepacks',
    loaders: null,
    platforms: null,
    categories: [...RESOURCEPACK_CATEGORIES, ...RESOURCEPACK_RESOLUTIONS],
    hasOpenSource: true,
  },
  shaders: {
    categoryPath: 'shaders',
    loaders: SHADER_LOADERS,
    platforms: null,
    categories: [...SHADER_STYLES, ...SHADER_FEATURES, ...SHADER_PERFORMANCE],
    hasOpenSource: true,
  },
  modpacks: {
    categoryPath: 'modpacks',
    loaders: MODPACK_LOADERS,
    platforms: null,
    categories: MODPACK_CATEGORIES,
    hasOpenSource: true,
    hasEnvironment: true,
  },
  datapacks: {
    categoryPath: 'datapacks',
    loaders: DATAPACK_LOADERS,
    platforms: null,
    categories: DATAPACK_CATEGORIES,
    hasOpenSource: true,
  },
  servers: {
    categoryPath: 'servers',
    loaders: null,
    platforms: null,
    categories: SERVERS_CATEGORIES,
    hasOpenSource: false,
  },
}

export function getFilterConfig(categoryType) {
  const normalized = categoryType ? categoryType.replace(/^discover\//, '') : ''
  return FILTER_CONFIG[normalized] || FILTER_CONFIG.plugins
}

export function getCategoryName(id, config) {
  const fromConfig = config?.categories?.find((cat) => cat.id === id)
  if (fromConfig) return fromConfig.name
  const fromAll = CATEGORIES.find((cat) => cat.id === id)
  if (fromAll) return fromAll.name
  const fromExtra = EXTRA_CATEGORY_LABELS.find((cat) => cat.id === id)
  return fromExtra?.name || id
}

export function getLoaderName(id, config) {
  const fromLoaders = config?.loaders?.find((l) => l.id === id)
  if (fromLoaders) return fromLoaders.name
  const fromPlatforms = config?.platforms?.find((p) => p.id === id)
  if (fromPlatforms) return fromPlatforms.name
  return getLoaderDisplayName(id)
}

export function getPlatformName(id, config) {
  const platform = config?.platforms?.find((p) => p.id === id)
  if (platform) return platform.name
  return getLoaderDisplayName(id)
}

export function getEnvironmentName(id) {
  const environments = {
    'client': 'Клиент',
    'server': 'Сервер',
  }
  return environments[id] || id
}
