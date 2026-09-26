'use client'

import { useEffect, useState } from 'react'
import CopyButton from './CopyButton'
import CopyLabeledButton from './CopyLabeledButton'
import { useT } from './I18nProvider'

export default function UserProfileIds({ userId }) {
  const t = useT()
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!userId) return
    setUrl(`${window.location.origin}/user/${userId}`)
  }, [userId])

  if (!userId) return null

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-1">
        <span className="font-semibold text-[var(--text-gray)]">{t('copy.userId')}</span>
        <CopyButton text={userId} inline />
      </div>
      {url ? (
        <div>
          <CopyLabeledButton
            text={url}
            label={t('copy.permalink')}
            tooltipLabel={t('copy.permalinkTip')}
          />
        </div>
      ) : null}
    </div>
  )
}
