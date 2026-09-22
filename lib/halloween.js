export const HALLOWEEN_FORCE = false

export function isHalloweenSeason(now = new Date()) {
  if (HALLOWEEN_FORCE) return true
  const month = now.getMonth() + 1
  const day = now.getDate()
  return (month === 10 && day >= 20) || (month === 11 && day <= 3)
}
