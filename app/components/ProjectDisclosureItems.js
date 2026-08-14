import MarkdownContent from './MarkdownContent'
import { DisclosureIcon, ExternalLinkIcon } from './ProjectDisclosureIcons'
import { getDisclosureDetails, getDisclosureTitle } from '@/lib/projectDisclosures'

function DisclosureNote({ text }) {
  if (!text?.trim()) return null
  return (
    <MarkdownContent
      className="text-sm text-[var(--text-gray)] prose prose-invert prose-sm max-w-none [&_p]:m-0 [&_a]:text-modrinth-green [&_a]:hover:underline"
      content={text}
    />
  )
}

function DisclosureRow({ type, title, children, accentClassName = '' }) {
  const iconClassName = accentClassName
    ? 'w-6 h-6 shrink-0 mt-px text-current'
    : 'w-6 h-6 shrink-0 mt-px text-modrinth-green'

  return (
    <div className={`flex gap-2 items-start ${accentClassName || 'text-[var(--text-primary)]'}`.trim()}>
      <DisclosureIcon type={type} className={iconClassName} />
      <div className="min-w-0 flex flex-col gap-1">
        {title ? <span>{title}</span> : null}
        {children}
      </div>
    </div>
  )
}

function DerivativeSources({ sources }) {
  return (
    <div className="flex flex-col gap-2">
      {sources.map((source, index) => (
        <div key={`${source.link || source.label}-${index}`} className="flex flex-col gap-1">
          {source.link ? (
            <a
              href={source.link}
              target="_blank"
              rel="noopener nofollow ugc"
              className="text-sm text-blue-400 min-w-0 break-words hover:underline inline-flex items-start gap-1"
            >
              <span>{source.label || source.link}</span>
              <ExternalLinkIcon />
            </a>
          ) : source.label ? (
            <span className="text-sm">{source.label}</span>
          ) : null}
          {source.note ? <DisclosureNote text={source.note} /> : null}
        </div>
      ))}
    </div>
  )
}

export default function ProjectDisclosureItems({ disclosures = [] }) {
  if (!disclosures.length) return null

  return disclosures.map((disclosure) => {
    const title = getDisclosureTitle(disclosure)
    const details = getDisclosureDetails(disclosure)
    const accentClassName = disclosure.type === 'epilepsy_triggers' ? 'text-orange-400' : ''

    if (disclosure.type === 'derivative_work') {
      return (
        <DisclosureRow
          key={disclosure.type}
          type={disclosure.type}
          title={title}
          accentClassName={accentClassName}
        >
          <DerivativeSources sources={details} />
        </DisclosureRow>
      )
    }

    return (
      <DisclosureRow
        key={disclosure.type}
        type={disclosure.type}
        title={title}
        accentClassName={accentClassName}
      >
        {details.map((detail, index) => (
          <DisclosureNote key={`${disclosure.type}-${index}`} text={detail} />
        ))}
      </DisclosureRow>
    )
  })
}
