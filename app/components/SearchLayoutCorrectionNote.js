export default function SearchLayoutCorrectionNote({ correction }) {
  if (!correction?.from || !correction?.to) return null

  return (
    <p className="text-sm text-modrinth-green">
      Показаны результаты для «{correction.to}» — похоже, была включена неверная раскладка клавиатуры
      {correction.from !== correction.to && (
        <span className="text-gray-500"> (вместо «{correction.from}»)</span>
      )}
    </p>
  )
}
