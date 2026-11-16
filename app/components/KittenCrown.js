export default function KittenCrown({ shine = false }) {
  return (
    <g transform="rotate(-14 12 2.5)" strokeWidth="0.7" strokeLinejoin="round" stroke="#d97706">
      <path d="M8.7 3.5 8.2-0.5l2.1 1.8L12-1.6l1.7 2.9 2.1-1.8-.5 4Z" fill="#fbbf24" />
      <rect x="8.6" y="2.6" width="6.8" height="1.4" rx="0.5" fill="#f59e0b" />
      <circle cx="12" cy="3.3" r="0.45" stroke="none" fill="#f43f5e" className={shine ? 'fk-gem' : undefined} />
      <circle cx="12" cy="-1.7" r="0.55" fill="#fde68a" />
    </g>
  )
}
