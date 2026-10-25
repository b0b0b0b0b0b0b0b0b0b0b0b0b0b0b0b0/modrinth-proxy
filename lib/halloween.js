import { festiveOff } from './festive'

export const HALLOWEEN_FORCE = false

export function isHalloweenSeason(now = new Date()) {
  if (festiveOff()) return false
  if (HALLOWEEN_FORCE) return true
  const month = now.getMonth() + 1
  const day = now.getDate()
  return (month === 10 && day >= 20) || (month === 11 && day <= 3)
}

export const GHOSTS_CAUGHT_KEY = 'halloweenGhostsCaught'

export function readGhostScore() {
  try {
    const n = Number(localStorage.getItem(GHOSTS_CAUGHT_KEY))
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
  } catch {
    return 0
  }
}

export function writeGhostScore(n) {
  try {
    localStorage.setItem(GHOSTS_CAUGHT_KEY, String(Math.max(0, Math.floor(n))))
  } catch {}
}

const TURBO_KEY = 'halloween-turbo'
const turboListeners = new Set()

export function readGhostTurbo() {
  try {
    return localStorage.getItem(TURBO_KEY) === 'on'
  } catch {
    return false
  }
}

export function setGhostTurbo(on) {
  try {
    localStorage.setItem(TURBO_KEY, on ? 'on' : 'off')
  } catch {}
  turboListeners.forEach((listener) => listener(on))
}

export function onGhostTurboChange(listener) {
  turboListeners.add(listener)
  return () => turboListeners.delete(listener)
}
