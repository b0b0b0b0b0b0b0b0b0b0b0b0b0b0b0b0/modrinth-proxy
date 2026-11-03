import { timingSafeEqual } from 'crypto'

export function isInternalRequest(request) {
  if (request.headers.get('x-real-ip')) return false
  const expected = Buffer.from(String(process.env.SSO_INTERNAL_KEY || ''))
  const actual = Buffer.from(request.headers.get('x-internal-key') || '')
  return expected.length >= 32 && expected.length === actual.length && timingSafeEqual(expected, actual)
}
