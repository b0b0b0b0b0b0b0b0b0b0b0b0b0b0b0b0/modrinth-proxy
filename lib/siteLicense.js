import fs from 'node:fs'
import path from 'node:path'
import { cache } from 'react'
import { GITHUB_REPO_URL } from '@/lib/commits'

export const SITE_LICENSE_ID = 'AGPL-3.0'
export const SITE_LICENSE_NAME = 'GNU Affero General Public License v3.0'
export const SITE_LICENSE_COPYRIGHT = '2025–2026 БоБоБо'

export const SITE_LICENSE_GITHUB_URL = `${GITHUB_REPO_URL}/blob/master/LICENSE`
export const SITE_LICENSE_GNU_URL = 'https://www.gnu.org/licenses/agpl-3.0.html'

export const SITE_LICENSE_SUMMARY = [
  {
    title: 'Можно',
    tone: 'allow',
    items: [
      'Форкать репозиторий и менять код под себя',
      'Поднимать свой сайт на базе проекта',
      'Распространять изменения',
    ],
  },
  {
    title: 'Нужно',
    tone: 'require',
    items: [
      'Держать исходники производной версии открытыми и публичными',
      'Сохранять copyright и текст лицензии',
      'Распространять производные работы на условиях AGPL',
    ],
  },
  {
    title: 'Про сайты',
    tone: 'network',
    items: [
      'Если кто-то крутит изменённую версию как сервис, он обязан дать пользователям доступ к исходникам',
      'Закрытый форк «взял код — спрятал» под AGPL не прокатит',
    ],
  },
]

export const readSiteLicenseText = cache(() => {
  const filePath = path.join(process.cwd(), 'LICENSE')
  return fs.readFileSync(filePath, 'utf8')
})
