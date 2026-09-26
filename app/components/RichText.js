export default function RichText({
  text,
  strongClassName = 'font-semibold text-white',
}) {
  const parts = String(text ?? '').split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className={strongClassName}>
        {part}
      </strong>
    ) : (
      part
    ),
  )
}
