export function safeNext(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return null
  if (value.startsWith('//') || value.includes('\\')) return null
  if (/[\u0000- \u007f]/.test(value)) return null
  return value
}
