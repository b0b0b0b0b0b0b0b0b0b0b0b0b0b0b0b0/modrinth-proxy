'use client'

import { useT } from './I18nProvider'

export default function ReloadButton() {
  const t = useT()
  return (
    <button
      onClick={() => window.location.reload()}
      className="px-6 py-3 bg-modrinth-green hover:bg-green-600 text-black font-semibold rounded-lg transition-colors"
    >
      {t('ui.reload')}
    </button>
  )
}
