export const NEW_YEAR_FORCE = false

export function isNewYearSeason(now = new Date()) {
  if (NEW_YEAR_FORCE) return true
  const month = now.getMonth() + 1
  const day = now.getDate()
  return (month === 12 && day >= 1) || (month === 1 && day <= 15)
}
