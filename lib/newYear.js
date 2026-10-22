export const NEW_YEAR_FORCE = false
export const SNOWBALL_DELAY_MS = 15000

export function isNewYearSeason(now = new Date()) {
  if (NEW_YEAR_FORCE) return true
  const month = now.getMonth() + 1
  const day = now.getDate()
  return (month === 12 && day >= 1) || (month === 1 && day <= 15)
}

export const TREE_KEY = 'newYearTree'

export function readTree() {
  try {
    const value = JSON.parse(localStorage.getItem(TREE_KEY) || 'null')
    const total = Number.isFinite(value?.total) && value.total > 0 ? Math.floor(value.total) : 0
    const hung = Array.isArray(value?.hung) ? value.hung.filter((kind) => Number.isInteger(kind) && kind >= 0) : []
    return { total, hung }
  } catch {
    return { total: 0, hung: [] }
  }
}

export function writeTree(tree) {
  try {
    localStorage.setItem(TREE_KEY, JSON.stringify({ total: tree.total, hung: tree.hung }))
  } catch {}
}

const TURBO_KEY = 'newyear-turbo'
const turboListeners = new Set()

export function readSnowTurbo() {
  try {
    return localStorage.getItem(TURBO_KEY) === 'on'
  } catch {
    return false
  }
}

export function setSnowTurbo(on) {
  try {
    localStorage.setItem(TURBO_KEY, on ? 'on' : 'off')
  } catch {}
  turboListeners.forEach((listener) => listener(on))
}

export function onSnowTurboChange(listener) {
  turboListeners.add(listener)
  return () => turboListeners.delete(listener)
}
