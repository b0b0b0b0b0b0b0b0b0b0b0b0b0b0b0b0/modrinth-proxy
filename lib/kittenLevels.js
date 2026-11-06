export const KITTEN_LEVELS = 30

function buildGoals(total) {
  const goals = []
  let sum = 0
  let last = 0
  for (let level = 1; level <= total; level += 1) {
    let gap = level === 1 ? 1 : Math.ceil(2.5 * Math.pow(level - 1, 1.45))
    if (gap >= 20) gap = Math.ceil(gap / 5) * 5
    if (gap >= 200) gap = Math.ceil(gap / 10) * 10
    if (gap <= last) gap = last + 5
    last = gap
    sum += gap
    goals.push(sum)
  }
  return goals
}

export const KITTEN_GOALS = buildGoals(KITTEN_LEVELS)

export function kittenLevel(pets) {
  const count = Math.max(0, Math.floor(Number(pets) || 0))
  let level = 0
  while (level < KITTEN_GOALS.length && count >= KITTEN_GOALS[level]) level += 1
  return level
}

export function kittenProgress(pets) {
  const count = Math.max(0, Math.floor(Number(pets) || 0))
  const level = kittenLevel(count)
  return {
    pets: count,
    level,
    levels: KITTEN_LEVELS,
    nextAt: level < KITTEN_LEVELS ? KITTEN_GOALS[level] : null,
  }
}
