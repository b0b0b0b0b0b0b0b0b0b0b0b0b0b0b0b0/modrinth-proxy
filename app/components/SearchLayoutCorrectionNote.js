import DisclosureLinkMismatchBanner from '@/app/components/DisclosureLinkMismatchBanner'
import { getRequestT } from '@/lib/i18n/server'

export default function SearchLayoutCorrectionNote({ correction }) {
  const { t } = getRequestT()
  return (
    <>
      <DisclosureLinkMismatchBanner />
      {correction?.from && correction?.to ? (
        <p className="text-sm text-modrinth-green">
          {t('catalog.layoutShown', { to: correction.to })}
          {correction.from !== correction.to && (
            <span className="text-gray-500">{t('catalog.layoutInstead', { from: correction.from })}</span>
          )}
        </p>
      ) : null}
    </>
  )
}
