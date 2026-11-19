import { readIdList } from './idListFile'

const DEFAULT_ADMIN_IDS = [1, 2]

export function isAdmin(user) {
  return Boolean(user?.id) && readIdList('admins.json', DEFAULT_ADMIN_IDS).has(Number(user.id))
}
