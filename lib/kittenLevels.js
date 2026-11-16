export const KITTEN_LEVELS = 200

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

export const KITTEN_WEAR = { blush: 5, logo: 10, yarn: 15, star: 19, crown: 20, tail: 22, hearts: 30, bell: 33, bow: 38, sparkles: 42, gold: 50, daisy: 60, glasses: 80, wings: 100, halo: 150, love: 175, aurora: 200 }

export const PIXEL_BADGE_STAGES = [1, ...Object.values(KITTEN_WEAR)].sort((a, b) => a - b)

export function resolvePixelBadge(choice, pets) {
  const level = kittenLevel(pets)
  if (level < 1 || choice === 0) return null
  if (choice == null) return level
  const stage = Number(choice)
  return PIXEL_BADGE_STAGES.includes(stage) && stage <= level ? stage : level
}

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
