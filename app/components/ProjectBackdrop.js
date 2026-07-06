export default function ProjectBackdrop({ src }) {
  if (typeof src !== 'string') return null
  const url = src.trim()
  if (!url || !/^https?:\/\//i.test(url)) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[var(--bg-primary)]"
      data-project-backdrop
      aria-hidden
    >
      <img
        src={url}
        alt=""
        width={900}
        height={506}
        decoding="async"
        className="absolute left-1/2 top-[-14%] h-[clamp(520px,68vmin,920px)] w-[220%] min-w-[920px] max-w-[2600px] origin-top -translate-x-1/2 object-cover blur-3xl scale-x-[1.1] scale-y-[1.28] opacity-[0.26] saturate-[1.08] motion-reduce:blur-xl motion-reduce:scale-y-110 motion-reduce:opacity-[0.12]"
        referrerPolicy="no-referrer"
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(
            180deg,
            var(--bg-primary) 0%,
            rgba(var(--bg-primary-rgb), 0.42) 32%,
            rgba(var(--bg-primary-rgb), 0.75) 65%,
            var(--bg-primary) 100%
          )`,
        }}
      />
    </div>
  )
}
