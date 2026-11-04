import sharp from 'sharp'

const UUID_RE = /^[0-9a-f]{32}$/
const TEXTURE_RE = /^https?:\/\/textures\.minecraft\.net\/texture\/([0-9a-f]{32,80})$/
const STEVE_TEXTURE = '1a4af718455d4aab528e7a61f86fa25e6a369d1768dcb13f7df319a713eb810b'
const FETCH_TIMEOUT_MS = 6000
const SKIN_MAX_BYTES = 128 * 1024
const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const CACHE_MAX = 500
const SIZE = 128
const FACE = 64
const ISO = Math.sqrt(3) / 2

const FACES = {
  top: { base: [8, 0], hat: [40, 0] },
  front: { base: [8, 8], hat: [40, 8] },
  side: { base: [16, 8], hat: [48, 8] },
}

const headCache = globalThis.__mcHeadCache || (globalThis.__mcHeadCache = new Map())
const inflight = globalThis.__mcHeadInflight || (globalThis.__mcHeadInflight = new Map())

export function normalizeHeadId(value) {
  const id = String(value || '').toLowerCase().replace(/\.png$/, '').replace(/-/g, '')
  return UUID_RE.test(id) ? id : null
}

export function cachedHead(uuid) {
  const hit = headCache.get(uuid)
  if (!hit) return null
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    headCache.delete(uuid)
    return null
  }
  return hit.png
}

function remember(uuid, png) {
  if (headCache.size >= CACHE_MAX) headCache.delete(headCache.keys().next().value)
  headCache.set(uuid, { at: Date.now(), png })
}

async function skinTextureUrl(uuid) {
  const response = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  if (response.status === 204 || response.status === 404) return `https://textures.minecraft.net/texture/${STEVE_TEXTURE}`
  if (!response.ok) return null
  const body = await response.json().catch(() => null)
  const raw = Array.isArray(body?.properties) ? body.properties.find((item) => item?.name === 'textures')?.value : null
  let textures = null
  try {
    textures = raw ? JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) : null
  } catch {}
  const match = TEXTURE_RE.exec(textures?.textures?.SKIN?.url || '')
  return `https://textures.minecraft.net/texture/${match ? match[1] : STEVE_TEXTURE}`
}

async function downloadSkin(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), cache: 'no-store' })
  if (!response.ok) return null
  if (Number(response.headers.get('content-length') || 0) > SKIN_MAX_BYTES) return null
  const buffer = Buffer.from(await response.arrayBuffer())
  return buffer.length <= SKIN_MAX_BYTES ? buffer : null
}

function tile(skin, scale, [x, y]) {
  return sharp(skin)
    .extract({ left: x * scale, top: y * scale, width: 8 * scale, height: 8 * scale })
    .resize(FACE, FACE, { kernel: 'nearest' })
    .png()
    .toBuffer()
}

async function faceImage(skin, scale, legacy, { base, hat }) {
  const [bottom, top] = await Promise.all([tile(skin, scale, base), tile(skin, scale, hat)])
  if (legacy) {
    const { channels } = await sharp(top).stats()
    if (channels[3]?.min === 255) return bottom
  }
  return sharp(bottom).composite([{ input: top }]).png().toBuffer()
}

function faceSvg(png, matrix, shade) {
  const href = `data:image/png;base64,${png.toString('base64')}`
  return `<g transform="matrix(${matrix.join(' ')})">
    <image width="${FACE}" height="${FACE}" href="${href}" xlink:href="${href}" preserveAspectRatio="none" image-rendering="optimizeSpeed"/>
    ${shade ? `<rect width="${FACE}" height="${FACE}" fill="#000" fill-opacity="${shade}"/>` : ''}
  </g>`
}

async function renderHead(skin) {
  const meta = await sharp(skin).metadata()
  const scale = Math.floor((meta.width || 0) / 64)
  if (scale < 1 || meta.width !== 64 * scale || (meta.height !== 64 * scale && meta.height !== 32 * scale)) return null
  const legacy = meta.height === 32 * scale

  const [top, front, side] = await Promise.all([
    faceImage(skin, scale, legacy, FACES.top),
    faceImage(skin, scale, legacy, FACES.front),
    faceImage(skin, scale, legacy, FACES.side),
  ])

  const offset = (SIZE - 2 * ISO * FACE) / 2
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <g transform="translate(${offset} 0)">
    ${faceSvg(top, [ISO, 0.5, -ISO, 0.5, ISO * FACE, 0], 0)}
    ${faceSvg(front, [ISO, 0.5, 0, 1, 0, FACE / 2], 0.12)}
    ${faceSvg(side, [ISO, -0.5, 0, 1, ISO * FACE, FACE], 0.28)}
  </g>
</svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function buildHead(uuid) {
  try {
    const url = await skinTextureUrl(uuid)
    const skin = url ? await downloadSkin(url) : null
    const png = skin ? await renderHead(skin) : null
    if (png) remember(uuid, png)
    return png
  } catch {
    return null
  }
}

export function minecraftHead(uuid) {
  const cached = cachedHead(uuid)
  if (cached) return Promise.resolve(cached)
  if (!inflight.has(uuid)) {
    inflight.set(uuid, buildHead(uuid).finally(() => inflight.delete(uuid)))
  }
  return inflight.get(uuid)
}
