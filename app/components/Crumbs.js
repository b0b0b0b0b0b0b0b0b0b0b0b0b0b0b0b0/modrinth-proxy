import Link from 'next/link'

export default function Crumbs({ label, items }) {
  return (
    <nav aria-label={label}>
      <ol className="m-0 flex list-none flex-row flex-wrap items-center gap-x-1.5 gap-y-1 p-0 text-sm">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
            {index > 0 ? (
              <span aria-hidden className="text-gray-600">
                /
              </span>
            ) : null}
            {item.href ? (
              <Link href={item.href} className="text-gray-500 transition-colors hover:text-modrinth-green">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-white" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
