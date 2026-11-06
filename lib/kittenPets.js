import { getDb } from './db'

const MAX_PETS = 50000000
const MAX_STEP = 5

export function readKittenPets(userId) {
  const row = getDb().prepare('SELECT kitten_pets FROM users WHERE id = ?').get(userId)
  return Number(row?.kitten_pets) || 0
}

export function addKittenPets(userId, step) {
  const amount = Math.max(0, Math.min(MAX_STEP, Math.floor(Number(step) || 0)))
  if (!amount) return readKittenPets(userId)
  getDb()
    .prepare('UPDATE users SET kitten_pets = MIN(?, kitten_pets + ?) WHERE id = ?')
    .run(MAX_PETS, amount, userId)
  return readKittenPets(userId)
}
