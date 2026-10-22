export const HALLOWEEN_FORCE = false

export function isHalloweenSeason(now = new Date()) {
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
