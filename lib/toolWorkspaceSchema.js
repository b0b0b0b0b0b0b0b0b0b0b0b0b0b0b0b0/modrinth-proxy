export const WORKSPACE_MAX_BYTES = 1024 * 1024
export const WORKSPACE_MAX_SERVERS = 50
export const WORKSPACE_MAX_PLUGINS = 400
export const WORKSPACE_MAX_ANALYSES = 100

const MAX_DEPTH = 6
const MAX_STRING = 2000
const MAX_ARRAY = 300
const MAX_KEYS = 80
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const KEY_RE = /^[A-Za-z][A-Za-z0-9_]{0,47}$/
const SERVER_ID_RE = /^srv_[a-z0-9]{1,16}_[a-z0-9]{1,16}$/
const TOKEN_RE = /^[A-Za-z0-9_.-]{1,48}$/
const CONTROL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u2028\u2029\u202A-\u202E\u2066-\u2069]/g
const PLUGIN_TYPES = new Set(['modrinth', 'spigot'])
const ASSET_HOST_RE = /^((www|cdn|api)\.)?(modrinth\.(com|black)|spigotmc\.org)$/i

const FLAG_SHAPE = {
  fileName: 'name',
  environment: 'token',
  software: 'token',
  memory: 'memory',
  calculateOverhead: 'bool',
  flagPreset: 'token',
  noGui: 'bool',
  utf8Encoding: 'bool',
  ignoreJavaVersion: 'bool',
  useVariables: 'bool',
  autoRestart: 'bool',
  windowsPause: 'bool',
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

function cleanString(value, max = MAX_STRING) {
  if (typeof value !== 'string') return undefined
  const cleaned = value.replace(CONTROL_RE, '').slice(0, max)
  return cleaned
}

function cleanName(value, max = 64) {
  const cleaned = cleanString(value, max)
  if (cleaned === undefined) return undefined
  const trimmed = cleaned.replace(/[\r\n\t]+/g, ' ').trim()
  return trimmed || undefined
}

function cleanToken(value) {
  return typeof value === 'string' && TOKEN_RE.test(value) ? value : undefined
}

function cleanDate(value) {
  if (typeof value !== 'string' || value.length > 40) return undefined
  const time = Date.parse(value)
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined
}

function cleanUrl(value, { allowRelative = false } = {}) {
  if (typeof value !== 'string' || value.length > 600) return undefined
  if (allowRelative && /^(?!\/\/)\/?[A-Za-z0-9/_.\-?=&%~]+$/.test(value)) return value
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return undefined
    if (!ASSET_HOST_RE.test(url.hostname)) return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

function cleanAnalysisLink(value) {
  if (typeof value !== 'string' || value.length > 300) return undefined
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return undefined
    return url.toString()
  } catch {
    return undefined
  }
}

function cleanJson(value, depth, keyHint) {
  if (value === null) return null
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'string') {
    if (keyHint && /url$/i.test(keyHint)) return cleanUrl(value, { allowRelative: keyHint === 'url' })
    return cleanString(value)
  }
  if (depth >= MAX_DEPTH) return undefined
  if (Array.isArray(value)) {
    const out = []
    for (const item of value.slice(0, MAX_ARRAY)) {
      const cleaned = cleanJson(item, depth + 1)
      if (cleaned !== undefined) out.push(cleaned)
    }
    return out
  }
  if (!isPlainObject(value)) return undefined
  const out = {}
  let count = 0
  for (const key of Object.keys(value)) {
    if (count >= MAX_KEYS) break
    if (FORBIDDEN_KEYS.has(key) || !KEY_RE.test(key)) continue
    const cleaned = cleanJson(value[key], depth + 1, key)
    if (cleaned === undefined) continue
    Object.defineProperty(out, key, { value: cleaned, enumerable: true, writable: true, configurable: true })
    count += 1
  }
  return out
}

function cleanPlugin(value) {
  if (!isPlainObject(value) || !PLUGIN_TYPES.has(value.type)) return undefined
  const id = typeof value.id === 'number' ? (Number.isSafeInteger(value.id) ? value.id : undefined) : cleanToken(value.id)
  if (id === undefined) return undefined
  const out = cleanJson(value, 0)
  if (!out) return undefined
  out.type = value.type
  out.id = id
  if (value.url !== undefined && out.url === undefined) return undefined
  return out
}

function cleanFlags(value) {
  const out = {}
  if (!isPlainObject(value)) return out
  for (const [key, kind] of Object.entries(FLAG_SHAPE)) {
    const raw = value[key]
    let cleaned
    if (kind === 'bool') cleaned = typeof raw === 'boolean' ? raw : undefined
    else if (kind === 'token') cleaned = cleanToken(raw)
    else if (kind === 'name') cleaned = cleanName(raw, 128)
    else if (kind === 'memory') cleaned = typeof raw === 'number' && Number.isFinite(raw) && raw >= 0.5 && raw <= 1024 ? Math.round(raw * 2) / 2 : undefined
    if (cleaned !== undefined) out[key] = cleaned
  }
  const basenames = cleanBasenames(value.scriptBasenames)
  if (basenames) out.scriptBasenames = basenames
  return out
}

function cleanBasenames(value) {
  if (!isPlainObject(value)) return undefined
  const out = {}
  for (const [key, raw] of Object.entries(value).slice(0, 8)) {
    if (!/^\.?[a-z0-9]{1,8}$/i.test(key)) continue
    const name = cleanName(raw, 64)
    if (name && !/[\\/:*?"<>|]/.test(name)) out[key] = name
  }
  return Object.keys(out).length ? out : undefined
}

function cleanAnalysis(value) {
  if (!isPlainObject(value)) return undefined
  const id = cleanToken(value.id)
  const link = cleanAnalysisLink(value.link)
  if (!id || !link) return undefined
  return {
    id,
    link,
    kind: cleanToken(value.kind) ?? 'unknown',
    savedAt: cleanDate(value.savedAt) ?? new Date(0).toISOString(),
  }
}

function cleanServer(id, value) {
  if (!SERVER_ID_RE.test(id) || !isPlainObject(value)) return undefined
  const name = cleanName(value.name, 48)
  if (!name) return undefined
  const plugins = isPlainObject(value.plugins) ? value.plugins : {}
  const list = Array.isArray(plugins.list) ? plugins.list.slice(0, WORKSPACE_MAX_PLUGINS) : []
  return {
    id,
    name,
    createdAt: cleanDate(value.createdAt) ?? new Date(0).toISOString(),
    flags: cleanFlags(value.flags),
    plugins: {
      software: cleanToken(plugins.software) ?? 'paper',
      gameVersion: cleanToken(plugins.gameVersion) ?? null,
      list: list.map(cleanPlugin).filter(Boolean),
    },
    analyses: (Array.isArray(value.analyses) ? value.analyses.slice(0, WORKSPACE_MAX_ANALYSES) : [])
      .map(cleanAnalysis)
      .filter(Boolean),
  }
}

export function sanitizeWorkspace(input) {
  if (!isPlainObject(input) || !isPlainObject(input.servers)) return null
  const servers = {}
  let count = 0
  for (const id of Object.keys(input.servers)) {
    if (count >= WORKSPACE_MAX_SERVERS) break
    if (FORBIDDEN_KEYS.has(id)) continue
    const server = cleanServer(id, input.servers[id])
    if (!server) continue
    Object.defineProperty(servers, id, { value: server, enumerable: true, writable: true, configurable: true })
    count += 1
  }
  if (!count) return null
  const ids = Object.keys(servers)
  const order = Array.isArray(input.serverOrder)
    ? input.serverOrder.filter((id, index, list) => typeof id === 'string' && Object.hasOwn(servers, id) && list.indexOf(id) === index)
    : []
  const active = typeof input.activeServerId === 'string' && Object.hasOwn(servers, input.activeServerId) ? input.activeServerId : ids[0]
  return {
    version: 1,
    activeServerId: active,
    pluginsFilter: cleanToken(input.pluginsFilter) ?? 'all',
    scriptBasenames: cleanBasenames(input.scriptBasenames) ?? {},
    serverOrder: [...order, ...ids.filter((id) => !order.includes(id))],
    servers,
  }
}

export function serializeWorkspace(input) {
  const clean = sanitizeWorkspace(input)
  if (!clean) return null
  const json = JSON.stringify(clean)
  if (new TextEncoder().encode(json).length > WORKSPACE_MAX_BYTES) return null
  return { clean, json }
}

export function summarizeWorkspace(workspace) {
  if (!workspace?.servers) return { servers: [], plugins: 0, analyses: 0 }
  const order = workspace.serverOrder?.length ? workspace.serverOrder : Object.keys(workspace.servers)
  const servers = order
    .filter((id) => typeof id === 'string' && Object.hasOwn(workspace.servers, id))
    .map((id) => workspace.servers[id])
    .filter(Boolean)
    .map((server) => ({
      id: server.id,
      name: server.name,
      software: server.flags?.software ?? null,
      memory: server.flags?.memory ?? null,
      plugins: server.plugins?.list?.length ?? 0,
      analyses: server.analyses?.length ?? 0,
    }))
  return {
    servers,
    plugins: servers.reduce((sum, server) => sum + server.plugins, 0),
    analyses: servers.reduce((sum, server) => sum + server.analyses, 0),
  }
}
