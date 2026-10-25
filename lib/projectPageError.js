import { notFound } from 'next/navigation'
import { isModrinthNotFound } from './modrinth'

export function notFoundOrThrow(error) {
  if (isModrinthNotFound(error)) notFound()
  throw error
}
