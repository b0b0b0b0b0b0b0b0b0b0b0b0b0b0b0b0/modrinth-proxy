import { getDb } from './db'

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
