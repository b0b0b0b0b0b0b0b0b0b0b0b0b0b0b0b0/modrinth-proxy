'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '../components/I18nProvider'
import { signInWithTelegram } from '@/lib/telegramPopup'

export default function TelegramLinkButton({ botId, className }) {
  const t = useT()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const link = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    const outcome = await signInWithTelegram(botId, null)
    setBusy(false)
    if (outcome.result === 'linked' || outcome.result === 'session') {
      router.refresh()
      return
    }
    if (outcome.result === 'cancelled') return
    setError(t(outcome.error === 'taken' ? 'account.telegramTaken' : 'account.errTelegram'))
  }

  return (
    <>
      <button type="button" onClick={link} disabled={busy} className={className}>
        {t('account.telegramLink')}
      </button>
      {error ? (
        <span className="text-xs text-amber-400" role="alert">
          {error}
        </span>
      ) : null}
    </>
  )
}
