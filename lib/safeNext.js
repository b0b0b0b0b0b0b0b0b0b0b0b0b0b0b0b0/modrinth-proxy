export function safeNext(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return null
  if (value.startsWith('//') || value.includes('\\')) return null
  return value
}
