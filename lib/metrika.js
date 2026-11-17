export const METRIKA_ID = 105182235

const PRIVATE_PREFIXES = ['/login', '/register', '/account', '/admin', '/st']

export function isMetrikaPrivatePath(pathname) {
  const path = String(pathname || '').split(/[?#]/)[0].toLowerCase()
  return PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}
