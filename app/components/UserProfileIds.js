'use client'

import { useEffect, useState } from 'react'
import CopyButton from './CopyButton'
import CopyLabeledButton from './CopyLabeledButton'

export default function UserProfileIds({ userId }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!userId) return
    setUrl(`${window.location.origin}/user/${userId}`)
  }, [userId])

  if (!userId) return null

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-1">
        <span className="font-semibold text-[var(--text-gray)]">ID пользователя:</span>
        <CopyButton text={userId} inline />
      </div>
      {url ? (
        <div>
          <CopyLabeledButton
            text={url}
            label="Скопировать вечную ссылку"
            tooltipLabel="Скопировать ссылку по ID пользователя в буфер обмена"
          />
        </div>
      ) : null}
    </div>
  )
}
