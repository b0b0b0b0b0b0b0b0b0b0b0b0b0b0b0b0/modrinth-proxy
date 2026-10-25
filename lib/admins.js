const DEFAULT_ADMIN_IDS = [1, 2]

function adminIds() {
  const fromEnv = (process.env.ADMIN_USER_IDS || '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0)
  return new Set(fromEnv.length ? fromEnv : DEFAULT_ADMIN_IDS)
}

export function isAdmin(user) {
  return Boolean(user?.id) && adminIds().has(Number(user.id))
}
