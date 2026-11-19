import { readIdList } from './idListFile'

export function isAdmin(user) {
  return Boolean(user?.id) && readIdList('admins.json').has(Number(user.id))
}
