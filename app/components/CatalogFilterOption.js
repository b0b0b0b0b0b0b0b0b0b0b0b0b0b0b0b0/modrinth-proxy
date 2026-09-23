'use client'

function BanIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4">
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export default function CatalogFilterOption({ icon, label, selected = false, excluded = false, onInclude, onExclude }) {
  return (
    <div className="group flex items-center gap-1">
      <button
        type="button"
        onClick={onInclude}
        className={`flex min-w-0 flex-1 items-center gap-2 truncate rounded-xl px-2 py-1.5 text-left text-sm font-semibold transition-all ${
          selected
            ? 'bg-modrinth-green/25 text-white hover:brightness-125'
            : excluded
              ? 'bg-red-500/15 text-red-400'
              : 'bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
      >
        {icon ? <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span> : null}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {selected ? <CheckIcon /> : null}
        {excluded ? <span className="ml-auto text-red-400"><BanIcon /></span> : null}
      </button>
      <button
        type="button"
        aria-label="Исключить"
        onClick={onExclude}
        className={`rounded-xl px-2 py-1 text-gray-500 transition-all hover:bg-gray-800 hover:text-red-400 ${
          excluded ? 'text-red-400' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <BanIcon />
      </button>
    </div>
  )
}
