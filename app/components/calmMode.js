'use client'

import { SHARED_CALM_COOKIE, readShared } from '@/lib/sharedLook'

export function calmMode() {
  return readShared(SHARED_CALM_COOKIE) === 'on'
}
