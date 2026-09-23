import DisclosureLinkMismatchBanner from '@/app/components/DisclosureLinkMismatchBanner'

export default function SearchLayoutCorrectionNote({ correction }) {
  return (
    <>
      <DisclosureLinkMismatchBanner />
      {correction?.from && correction?.to ? (
        <p className="text-sm text-modrinth-green">
          Показаны результаты для «{correction.to}» — похоже, была включена неверная раскладка клавиатуры
          {correction.from !== correction.to && (
            <span className="text-gray-500"> (вместо «{correction.from}»)</span>
          )}
        </p>
      ) : null}
    </>
  )
}
