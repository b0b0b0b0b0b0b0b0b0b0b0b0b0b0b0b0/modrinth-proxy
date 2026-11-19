import { getDb } from './db'
import { setDiscordLinkedRole } from './discordBot'

const GATEWAY = 'wss://gateway.discord.gg/?v=10&encoding=json'
const TOKEN_RE = /^[A-Za-z0-9._-]{50,}$/
const FATAL_CLOSE = new Set([4004, 4010, 4011, 4012, 4013, 4014])
const DISALLOWED_INTENTS = 4014
const GUILD_MEMBERS = 1 << 1
const FRESH_JOIN_MS = 15 * 60 * 1000
const FRESH_CLOSE = new Set([4007, 4009])
const RETRY_MIN_MS = 5 * 1000
const RETRY_MAX_MS = 5 * 60 * 1000
const HEARTBEAT_DEFAULT_MS = 41250
const HEARTBEAT_MIN_MS = 5 * 1000
const HEARTBEAT_MAX_MS = 2 * 60 * 1000
const STATUS = '🐾 modrinth.black'

function state() {
  globalThis.__discordGateway ||= {
    socket: null,
    heartbeat: null,
    retryTimer: null,
    seq: null,
    sessionId: null,
    resumeUrl: null,
    acked: true,
    retryMs: RETRY_MIN_MS,
    stopped: false,
    intents: GUILD_MEMBERS,
  }
  return globalThis.__discordGateway
}

function send(payload) {
  const socket = state().socket
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload))
}

function presence() {
  return { since: null, afk: false, status: 'online', activities: [{ type: 4, name: 'Custom Status', state: STATUS }] }
}

function identify() {
  send({
    op: 2,
    d: {
      token: process.env.DISCORD_BOT_TOKEN,
      intents: state().intents,
      properties: { os: 'linux', browser: 'modrinth.black', device: 'modrinth.black' },
      presence: presence(),
    },
  })
}

function resume() {
  const gateway = state()
  send({ op: 6, d: { token: process.env.DISCORD_BOT_TOKEN, session_id: gateway.sessionId, seq: gateway.seq } })
}

function stopHeartbeat() {
  const gateway = state()
  clearTimeout(gateway.heartbeat)
  clearInterval(gateway.heartbeat)
  gateway.heartbeat = null
}

function startHeartbeat(requestedMs) {
  const gateway = state()
  const requested = Number(requestedMs)
  const intervalMs = requested >= HEARTBEAT_MIN_MS && requested <= HEARTBEAT_MAX_MS ? requested : HEARTBEAT_DEFAULT_MS
  stopHeartbeat()
  gateway.acked = true
  const beat = () => {
    if (!gateway.acked) {
      gateway.socket?.close(4900)
      return
    }
    gateway.acked = false
    send({ op: 1, d: gateway.seq })
  }
  gateway.heartbeat = setTimeout(() => {
    beat()
    gateway.heartbeat = setInterval(beat, intervalMs)
    gateway.heartbeat.unref?.()
  }, Math.floor(intervalMs * Math.random()))
  gateway.heartbeat.unref?.()
}

function forgetSession() {
  const gateway = state()
  gateway.sessionId = null
  gateway.resumeUrl = null
  gateway.seq = null
}

function scheduleReconnect() {
  const gateway = state()
  if (gateway.stopped || gateway.retryTimer) return
  const delay = gateway.retryMs
  gateway.retryMs = Math.min(RETRY_MAX_MS, gateway.retryMs * 2)
  gateway.retryTimer = setTimeout(() => {
    gateway.retryTimer = null
    connect()
  }, delay)
  gateway.retryTimer.unref?.()
}

function onMessage(event) {
  const gateway = state()
  let packet
  try {
    packet = JSON.parse(typeof event.data === 'string' ? event.data : Buffer.from(event.data).toString('utf8'))
  } catch {
    return
  }
  if (packet.s != null) gateway.seq = packet.s
  switch (packet.op) {
    case 10:
      startHeartbeat(packet.d?.heartbeat_interval)
      if (gateway.sessionId && gateway.seq != null) resume()
      else identify()
      break
    case 11:
      gateway.acked = true
      break
    case 1:
      send({ op: 1, d: gateway.seq })
      break
    case 7:
      gateway.socket?.close(4900)
      break
    case 9:
      if (!packet.d) forgetSession()
      gateway.socket?.close(4900)
      break
    case 0:
      if (packet.t === 'READY') {
        gateway.sessionId = packet.d?.session_id || null
        gateway.resumeUrl = packet.d?.resume_gateway_url || null
        gateway.retryMs = RETRY_MIN_MS
      } else if (packet.t === 'RESUMED') {
        gateway.retryMs = RETRY_MIN_MS
      } else if (packet.t === 'GUILD_MEMBER_ADD' || packet.t === 'GUILD_MEMBER_UPDATE') {
        restoreLinkedRole(packet.t, packet.d).catch(() => {})
      }
      break
  }
}

async function restoreLinkedRole(type, member) {
  const id = member?.user?.id
  const roleId = process.env.DISCORD_LINKED_ROLE_ID || ''
  if (!id || member.user.bot || member.guild_id !== process.env.DISCORD_GUILD_ID || !/^\d{1,20}$/.test(id)) return
  if (member.pending || (Array.isArray(member.roles) && member.roles.includes(roleId))) return
  if (type === 'GUILD_MEMBER_UPDATE' && Date.now() - (Date.parse(member.joined_at || '') || 0) > FRESH_JOIN_MS) return
  if (!getDb().prepare('SELECT 1 FROM users WHERE discord_id = ?').get(id)) return
  await setDiscordLinkedRole(id, true)
}

function connect() {
  const gateway = state()
  if (gateway.stopped || gateway.socket) return
  const base = gateway.sessionId && gateway.resumeUrl ? gateway.resumeUrl : 'wss://gateway.discord.gg'
  const url = base === 'wss://gateway.discord.gg' ? GATEWAY : `${base.replace(/\/+$/, '')}/?v=10&encoding=json`
  let socket
  try {
    socket = new WebSocket(url)
  } catch {
    scheduleReconnect()
    return
  }
  gateway.socket = socket
  socket.addEventListener('message', onMessage)
  socket.addEventListener('error', () => {})
  socket.addEventListener('close', (event) => {
    if (gateway.socket === socket) gateway.socket = null
    stopHeartbeat()
    if (event.code === DISALLOWED_INTENTS && gateway.intents !== 0) {
      gateway.intents = 0
      forgetSession()
      console.warn('[discord] Server Members Intent is off in the Developer Portal, connecting without member events')
      scheduleReconnect()
      return
    }
    if (FATAL_CLOSE.has(event.code)) {
      gateway.stopped = true
      console.error(`[discord] gateway closed for good: ${event.code}`)
      return
    }
    if (FRESH_CLOSE.has(event.code)) forgetSession()
    scheduleReconnect()
  })
}

export function startDiscordGateway() {
  if (!TOKEN_RE.test(process.env.DISCORD_BOT_TOKEN || '') || typeof WebSocket !== 'function') return
  const gateway = state()
  if (gateway.socket || gateway.retryTimer) return
  gateway.stopped = false
  connect()
}
