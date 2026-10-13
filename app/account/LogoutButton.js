'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '../components/I18nProvider'
import { clearFavoritesCache } from '@/lib/favoritesCache'

export default function LogoutButton() {
  const t = useT()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const logout = async () => {
    setBusy(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      clearFavoritesCache()
      router.refresh()
    } catch {
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="rounded-lg border border-gray-800 px-3 py-1.5 text-sm font-semibold text-gray-400 transition-colors hover:border-modrinth-green/50 hover:text-white disabled:opacity-60"
    >
      {t('account.logout')}
    </button>
  )
}
