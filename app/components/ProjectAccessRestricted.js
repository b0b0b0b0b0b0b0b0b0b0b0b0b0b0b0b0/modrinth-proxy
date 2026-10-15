'use client'

import RestrictedNotice from './RestrictedNotice'
import { useT } from './I18nProvider'

export default function ProjectAccessRestricted({ href, label, backKey = 'project.backToMods' }) {
  const t = useT()
  return (
    <RestrictedNotice
      title={t('restricted.title')}
      kid={t('restricted.kid')}
      details={[t('restricted.p1'), t('restricted.p2')]}
      href={href}
      backLabel={label || t(backKey)}
    />
  )
}
