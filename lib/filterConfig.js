import { CATEGORIES } from '@/lib/categories'
import { 
  MOD_LOADERS,
  SHADER_LOADERS,
  MODPACK_LOADERS,
  DATAPACK_LOADERS,
  PLUGIN_LOADERS,
  PLUGIN_PLATFORMS
} from '@/lib/loaders'
import { RESOURCEPACK_CATEGORIES } from '@/lib/resourcepackCategories'
import { SHADER_STYLES } from '@/lib/shaderCategories'
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
  ['adventure', 'cursed', 'decoration', 'magic', 'optimization', 'storage', 'technology', 'transportation', 'utility', 'worldgen'].includes(cat.id)
)

const SERVERS_CATEGORIES = SERVER_CATEGORIES

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
    categories: RESOURCEPACK_CATEGORIES,
    hasOpenSource: false,
  },
  shaders: {
    categoryPath: 'shaders',
    loaders: SHADER_LOADERS,
    platforms: null,
    categories: SHADER_STYLES,
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
  if (!config || !config.categories) return id
  const category = config.categories.find(cat => cat.id === id)
  return category ? category.name : id
}

export function getLoaderName(id, config) {
  if (!config || !config.loaders) return id
  const loader = config.loaders.find(l => l.id === id)
  return loader ? loader.name : id
}

export function getPlatformName(id, config) {
  if (!config || !config.platforms) return id
  const platform = config.platforms.find(p => p.id === id)
  return platform ? platform.name : id
}

export function getEnvironmentName(id) {
  const environments = {
    'client': 'Клиент',
    'server': 'Сервер',
  }
  return environments[id] || id
}
