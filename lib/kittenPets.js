import { getDb } from './db'
import { KITTEN_GOALS } from './kittenLevels'

const MAX_PETS = 50000000
const MAX_STEP = 5
const PETS_PER_SECOND = 5
const BURST = 25
const IDLE_FORGET_MS = 10 * 60 * 1000

const allowances = (globalThis.__kittenAllowances ??= new Map())

function forgetIdle(now) {
  if (allowances.size < 1000) return
  for (const [userId, entry] of allowances) {
    if (now - entry.at > IDLE_FORGET_MS) allowances.delete(userId)
  }
}

function takeAllowance(userId, wanted) {
  const now = Date.now()
  forgetIdle(now)
  const entry = allowances.get(userId) ?? { tokens: BURST, at: now }
  entry.tokens = Math.min(BURST, entry.tokens + ((now - entry.at) / 1000) * PETS_PER_SECOND)
  entry.at = now
  const granted = Math.min(wanted, Math.floor(entry.tokens))
  entry.tokens -= granted
  allowances.set(userId, entry)
  return granted
}

const GRUMPY_KITTEN_USERS = new Set([1])

export function isGrumpyKitten(userId) {
  return GRUMPY_KITTEN_USERS.has(Number(userId))
}

export function readKittenPets(userId) {
  if (isGrumpyKitten(userId)) return 0
  const row = getDb().prepare('SELECT kitten_pets FROM users WHERE id = ?').get(userId)
  return Number(row?.kitten_pets) || 0
}

const RARITY_TTL_MS = 10 * 60 * 1000
const rarityCache = (globalThis.__kittenRarity ??= { at: 0, value: null })

function readRarityBase() {
  const now = Date.now()
  if (rarityCache.value?.byUser && now - rarityCache.at < RARITY_TTL_MS) return rarityCache.value
  const rows = getDb()
    .prepare('SELECT id, kitten_pets AS pets FROM users WHERE kitten_pets > 0')
    .all()
    .filter((row) => !isGrumpyKitten(row.id))
  const pets = rows.map((row) => Number(row.pets)).sort((a, b) => a - b)
  let below = 0
  const owners = KITTEN_GOALS.map((goal) => {
    while (below < pets.length && pets[below] < goal) below += 1
    return pets.length - below
  })
  rarityCache.value = { players: pets.length, owners, byUser: new Map(rows.map((row) => [Number(row.id), Number(row.pets)])) }
  rarityCache.at = now
  return rarityCache.value
}

export function readKittenRarity(userId, pets) {
  const base = readRarityBase()
  const cached = base.byUser.get(Number(userId)) || 0
  const fresh = isGrumpyKitten(userId) ? 0 : Math.max(0, Number(pets) || 0)
  return {
    players: base.players - (cached > 0 ? 1 : 0) + (fresh > 0 ? 1 : 0),
    owners: base.owners.map((count, index) => {
      const goal = KITTEN_GOALS[index]
      return count - (cached >= goal ? 1 : 0) + (fresh >= goal ? 1 : 0)
    }),
  }
}

export function addKittenPets(userId, step) {
  if (isGrumpyKitten(userId)) return 0
  const wanted = Math.max(0, Math.min(MAX_STEP, Math.floor(Number(step) || 0)))
  const amount = wanted ? takeAllowance(userId, wanted) : 0
  if (!amount) return readKittenPets(userId)
  getDb()
    .prepare('UPDATE users SET kitten_pets = MIN(?, kitten_pets + ?) WHERE id = ?')
    .run(MAX_PETS, amount, userId)
  return readKittenPets(userId)
}
