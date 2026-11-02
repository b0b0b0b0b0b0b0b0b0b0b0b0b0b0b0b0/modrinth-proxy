import { festiveOff } from './festive'

export const MINECRAFT_BIRTHDAY_FORCE = false
export const MINECRAFT_RELEASE_YEAR = 2011
export const DIAMOND_MILESTONE = 15

const RELEASE_MONTH = 11
const RELEASE_DAY = 18

export function minecraftBirthdayPhase(now = new Date()) {
  if (MINECRAFT_BIRTHDAY_FORCE) return 'day'
  if (now.getMonth() + 1 !== RELEASE_MONTH) return null
  const day = now.getDate()
  if (day === RELEASE_DAY - 1) return 'eve'
  if (day === RELEASE_DAY) return 'day'
  if (day === RELEASE_DAY + 1) return 'after'
  return null
}

export function isMinecraftBirthdaySeason(now = new Date()) {
  if (festiveOff()) return false
  return minecraftBirthdayPhase(now) !== null
}

export function minecraftAge(now = new Date()) {
  return now.getFullYear() - MINECRAFT_RELEASE_YEAR
}
